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

## After an actual restore

Rotate affected credentials, verify all migrations, confirm audit continuity, test patient isolation and employee permissions, reconcile payments, and document the recovery timeline.
