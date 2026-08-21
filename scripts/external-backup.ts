import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { spawn } from "node:child_process";

type BackupMode = "check" | "run";

type BackupConfig = {
  databaseUrl: string;
  projectRef: string;
  storageRemote: string;
  encryptedRemote: string;
  notifyEmail?: string;
  resendApiKey?: string;
  fromEmail?: string;
  enablePrune: boolean;
  retentionDays: number;
};

type CommandResult = {
  stdout: string;
  stderr: string;
};

const mode: BackupMode = process.argv.includes("--check") ? "check" : "run";
const dateStamp = new Intl.DateTimeFormat("en-CA", {
  timeZone: process.env.BACKUP_TIMEZONE || "Asia/Riyadh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function loadConfig(): BackupConfig {
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || "30");
  if (!Number.isInteger(retentionDays) || retentionDays < 7) {
    throw new Error("BACKUP_RETENTION_DAYS must be an integer of at least 7 days");
  }

  return {
    databaseUrl: required("BACKUP_DATABASE_URL"),
    projectRef: required("BACKUP_PROJECT_REF"),
    storageRemote: required("BACKUP_SUPABASE_STORAGE_REMOTE").replace(/\/$/, ""),
    encryptedRemote: required("BACKUP_ENCRYPTED_REMOTE").replace(/\/$/, ""),
    notifyEmail: process.env.BACKUP_NOTIFY_EMAIL?.trim(),
    resendApiKey: process.env.RESEND_API_KEY?.trim(),
    fromEmail: process.env.BACKUP_FROM_EMAIL?.trim(),
    enablePrune: process.env.BACKUP_ENABLE_PRUNE === "true",
    retentionDays,
  };
}

async function runCommand(command: string, args: string[], options?: { redact?: string[] }): Promise<CommandResult> {
  const redactions = options?.redact ?? [];
  const printableArgs = args.map((arg) => (redactions.includes(arg) ? "[REDACTED]" : arg));
  process.stdout.write(`> ${command} ${printableArgs.join(" ")}\n`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve({ stdout, stderr });
      reject(new Error(`${command} exited with code ${code}: ${stderr.trim() || stdout.trim()}`));
    });
  });
}

async function sha256(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

function sanitize(message: string, config: BackupConfig): string {
  return [config.databaseUrl, config.resendApiKey]
    .filter((value): value is string => Boolean(value))
    .reduce((safeMessage, secret) => safeMessage.split(secret).join("[REDACTED]"), message);
}

async function sendNotification(config: BackupConfig, status: "success" | "failure", details: string) {
  if (!config.notifyEmail || !config.resendApiKey || !config.fromEmail) return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.fromEmail,
      to: [config.notifyEmail],
      subject: `Panthera backup ${status}: ${dateStamp}`,
      text: [
        `External backup status: ${status}`,
        `Project: ${config.projectRef}`,
        `Date: ${dateStamp}`,
        details,
        "This notification intentionally contains no patient data.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    throw new Error(`Backup notification failed with HTTP ${response.status}`);
  }
}

async function checkDependencies(config: BackupConfig) {
  await runCommand("supabase", ["--version"]);
  await runCommand("rclone", ["version"]);
  await runCommand("rclone", ["lsd", config.storageRemote]);
  await runCommand("rclone", ["lsd", config.encryptedRemote]);
}

async function dumpDatabase(config: BackupConfig, workDir: string) {
  const files = {
    roles: join(workDir, "roles.sql"),
    schema: join(workDir, "schema.sql"),
    data: join(workDir, "data.sql"),
  };
  const common = ["db", "dump", "--db-url", config.databaseUrl];
  const redact = [config.databaseUrl];

  await runCommand("supabase", [...common, "-f", files.roles, "--role-only"], { redact });
  await runCommand("supabase", [...common, "-f", files.schema], { redact });
  await runCommand(
    "supabase",
    [
      ...common,
      "-f",
      files.data,
      "--use-copy",
      "--data-only",
      "-x",
      "storage.buckets_vectors",
      "-x",
      "storage.vector_indexes",
    ],
    { redact },
  );

  return files;
}

async function uploadDatabase(config: BackupConfig, files: Record<string, string>, workDir: string) {
  const manifest: Record<string, { bytes: number; sha256: string }> = {};
  for (const filePath of Object.values(files)) {
    const fileStats = await stat(filePath);
    manifest[basename(filePath)] = { bytes: fileStats.size, sha256: await sha256(filePath) };
  }
  const manifestPath = join(workDir, "manifest.json");
  await writeFile(
    manifestPath,
    JSON.stringify({ projectRef: config.projectRef, date: dateStamp, files: manifest }, null, 2),
    { mode: 0o600 },
  );

  const destination = `${config.encryptedRemote}/database/${dateStamp}`;
  for (const filePath of [...Object.values(files), manifestPath]) {
    await runCommand("rclone", ["copyto", filePath, `${destination}/${basename(filePath)}`, "--checksum"]);
  }
  return manifest;
}

async function backupStorage(config: BackupConfig) {
  const { stdout } = await runCommand("rclone", ["lsf", config.storageRemote, "--dirs-only"]);
  const buckets = stdout
    .split(/\r?\n/)
    .map((value) => value.replace(/\/$/, "").trim())
    .filter(Boolean);

  for (const bucket of buckets) {
    await runCommand("rclone", [
      "copy",
      `${config.storageRemote}/${bucket}`,
      `${config.encryptedRemote}/storage/${dateStamp}/${bucket}`,
      "--checksum",
      "--metadata",
      "--transfers",
      "4",
      "--checkers",
      "8",
    ]);
  }
  return buckets;
}

async function pruneExpiredBackups(config: BackupConfig) {
  if (!config.enablePrune) return [];
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - config.retentionDays);
  const removed: string[] = [];

  for (const category of ["database", "storage"]) {
    const { stdout } = await runCommand("rclone", ["lsf", `${config.encryptedRemote}/${category}`, "--dirs-only"]);
    for (const directory of stdout.split(/\r?\n/).map((value) => value.replace(/\/$/, "").trim())) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(directory)) continue;
      const backupDate = new Date(`${directory}T00:00:00Z`);
      if (backupDate >= cutoff) continue;
      await runCommand("rclone", ["purge", `${config.encryptedRemote}/${category}/${directory}`]);
      removed.push(`${category}/${directory}`);
    }
  }
  return removed;
}

async function main() {
  const config = loadConfig();
  await checkDependencies(config);
  if (mode === "check") {
    process.stdout.write("Backup configuration and both storage connections are valid.\n");
    return;
  }

  const workRoot = process.env.BACKUP_WORK_DIR || tmpdir();
  await mkdir(workRoot, { recursive: true, mode: 0o700 });
  const lockDir = join(workRoot, "panthera-backup.lock");
  try {
    await mkdir(lockDir, { mode: 0o700 });
  } catch {
    throw new Error(`A backup is already running or the lock is stale: ${lockDir}`);
  }
  const workDir = await mkdtemp(join(workRoot, "panthera-backup-"));
  try {
    const databaseFiles = await dumpDatabase(config, workDir);
    const manifest = await uploadDatabase(config, databaseFiles, workDir);
    const buckets = await backupStorage(config);
    const removed = await pruneExpiredBackups(config);
    const details = `Database files: ${Object.keys(manifest).length}; storage buckets: ${buckets.length}; expired snapshots removed: ${removed.length}.`;
    await sendNotification(config, "success", details);
    process.stdout.write(`${details}\n`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
    await rm(lockDir, { recursive: true, force: true });
  }
}

main().catch(async (error: unknown) => {
  const rawMessage = error instanceof Error ? error.message : String(error);
  let message = rawMessage;
  try {
    message = sanitize(rawMessage, loadConfig());
  } catch {
    // Configuration validation failed before secrets were fully available.
  }
  process.stderr.write(`External backup failed: ${message}\n`);
  try {
    await sendNotification(loadConfig(), "failure", message);
  } catch (notificationError) {
    process.stderr.write(`Failure notification could not be sent: ${String(notificationError)}\n`);
  }
  process.exitCode = 1;
});
