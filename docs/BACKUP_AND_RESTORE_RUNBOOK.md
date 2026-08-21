# Backup & Restore Runbook

## Recovery targets

- Target RPO: no more than 24 hours for standard records; use Supabase Point-in-Time Recovery where the subscription and business risk require a shorter window.
- Target RTO: four hours for core appointments, patients, and payments, subject to the contracted infrastructure plan.

## What must be backed up

1. Supabase Postgres database, including schema, policies, functions, and audit records.
2. Private Storage objects, especially patient receipts and clinical media.
3. Vercel and Supabase environment-variable names and rotation owners. Secret values must remain in an approved password vault, not in the backup document.
4. Release commit, migration version, and mobile application version.

## Critical warning

Database backups do not automatically constitute a backup of Supabase Storage objects. Private patient files require a separate encrypted, access-controlled copy and a tested restore process.

## Procedure

- Confirm the managed database backup/PITR status from the Supabase dashboard.
- Export private Storage objects to an encrypted backup destination using a service identity with read-only backup permissions.
- Encrypt backups in transit and at rest and restrict restore authority to two named administrators.
- Record every backup and restore operation in the security log.
- Restore a sample database and representative private files monthly in an isolated environment.
- Verify record counts, checksums, RLS policies, private bucket status, and application login before declaring the drill successful.
- Never overwrite production during a drill.

## Automated external backup worker

The repository contains a production-oriented worker at `scripts/external-backup.ts`. It creates the three logical database exports recommended by Supabase (roles, schema, and data), produces SHA-256 checksums, copies all Storage buckets, and sends everything through an `rclone crypt` destination. The remote provider therefore receives encrypted object names and encrypted content rather than patient data in plaintext.

The worker must run on an isolated Linux host, not inside the browser, patient application, or a Vercel request. The host needs:

- Node.js and this repository.
- Supabase CLI and its required Docker runtime.
- `rclone` configured with a read-only Supabase Storage source and an encrypted destination layered over an external S3 bucket.
- An encrypted local volume mounted at `BACKUP_WORK_DIR`.
- Secrets stored in `/etc/panthera-backup.env` with mode `0600`, owned by the dedicated `panthera-backup` user.

### Configure the external S3 destination

1. Create a bucket in a separate provider account and enable provider-side encryption, versioning, MFA, and immutable retention/Object Lock where available.
2. Create a destination identity that can write and list only this backup bucket. It must not administer the provider account.
3. Create an `rclone` S3 remote such as `panthera-backup-s3`.
4. Run `rclone config` and create a `crypt` remote named `panthera-backup-crypt` whose underlying path is `panthera-backup-s3:panthera-clinic`. Store the generated crypt password in the approved password vault. It is required for restoration.
5. In Supabase Storage settings, enable S3 access and generate a dedicated access-key pair. Create the `supabase-storage` remote using the project S3 endpoint. Do not reuse these credentials in the web or mobile applications.

Never commit `/etc/rclone/panthera-backup.conf`, `.env`, database URLs, S3 keys, encryption passwords, or downloaded patient files.

### Install and validate

1. Copy `ops/backup/.env.example` to `/etc/panthera-backup.env`, replace placeholders, set permissions to `0600`, and keep pruning disabled.
2. Place the restricted rclone configuration at `/etc/rclone/panthera-backup.conf` with permissions `0600`.
3. Validate both connections without copying patient data:

   ```bash
   npm run backup:check
   ```

4. Run the first backup manually and confirm that database files, `manifest.json`, and every Storage bucket exist under that day's encrypted snapshot:

   ```bash
   npm run backup:external
   ```

5. Install `ops/backup/panthera-backup.service` and `ops/backup/panthera-backup.timer` under `/etc/systemd/system/`, then enable the timer:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now panthera-backup.timer
   ```

The timer runs daily at 02:15 Asia/Riyadh with a small randomized delay. The service is restricted to a dedicated non-login account and an explicit writable working directory.

### Retention safety

Automated deletion is disabled by default. After a successful isolated restore drill, set `BACKUP_ENABLE_PRUNE=true` to remove dated database and Storage snapshots older than `BACKUP_RETENTION_DAYS`. Provider Object Lock remains the final protection against accidental or malicious deletion.

### Daily verification

- The encrypted destination must contain `database/YYYY-MM-DD/manifest.json`, three SQL exports, and `storage/YYYY-MM-DD/<bucket>` snapshots.
- Compare each downloaded database file with its SHA-256 value in the encrypted manifest during a restore drill.
- Treat a missing email as a monitoring failure; verify the systemd service result and destination object counts directly.
- Notification emails intentionally contain counts and status only, never patient names, phone numbers, medical details, or file paths.

### Restore drill

1. Create an isolated Supabase test project and a temporary encrypted workstation.
2. Download one dated database snapshot and its manifest through the `crypt` remote.
3. Verify SHA-256 checksums before opening any SQL export.
4. Restore roles, schema, and data following the official Supabase restore order.
5. Create the Storage buckets, copy the matching dated object snapshot to the test project, and verify object counts.
6. Test staff MFA, patient isolation, RLS, appointments, invoices, payment reconciliation, and representative private files.
7. Destroy the isolated environment securely and record the drill result in the security log.

## After an actual restore

Rotate affected credentials, verify all migrations, confirm audit continuity, test patient isolation and employee permissions, reconcile payments, and document the recovery timeline.
