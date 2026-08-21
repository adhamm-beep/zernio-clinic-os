# Panthera Security & Privacy Runbook

## Scope

This runbook applies to patient, clinical, billing, employee, and audit data processed by Panthera Clinic OS. Patient information is confidential and must only be accessed for a documented work purpose.

## Mandatory controls

- Every employee account must use a unique email, a strong password, and MFA. Shared accounts are prohibited.
- Access is granted by job role and reviewed monthly by the clinic owner or security administrator.
- Departing or suspended employees must be disabled immediately and all active sessions revoked.
- Production secrets belong only in Supabase/Vercel secret stores. Never place service-role, payment, email, or cron secrets in browser variables, source control, screenshots, tickets, or chat.
- Patient exports, screenshots, receipts, and medical attachments must use approved encrypted storage. Local device copies must be deleted after the work purpose ends.
- Audit and security logs are append-only. Administrators review critical events daily and the complete access report weekly.
- Vendors with access to patient data require an approved contract, a data-processing agreement, least-privilege access, and a documented offboarding procedure.
- Production changes require a successful release check, database migration review, and rollback instructions.

## Routine schedule

| Frequency | Required action | Owner |
| --- | --- | --- |
| Daily | Review critical security events, failed MFA attempts, unusual exports, and payment anomalies | Security administrator |
| Weekly | Review privileged actions and inactive users; verify scheduled reports | Clinic owner |
| Monthly | Recertify every user's role and permissions; perform a restore sample | Clinic owner + IT |
| Quarterly | Rotate high-risk integration keys; review vendors; run dependency and vulnerability scans | IT/security |
| Annually | Independent penetration test, incident exercise, privacy and retention review | Management + external specialist |

## Patient rights and privacy requests

Identity must be verified before viewing, correcting, exporting, or deleting patient information. Every request is recorded in the audit log and reviewed by the privacy owner. Deletion is never performed when a legal or medical-retention obligation requires the record to remain; access can be restricted instead.

## Security limitations

No software can honestly guarantee 100% security. The target is layered protection, rapid detection, tested recovery, and documented compliance. Suspected compromise is handled using `INCIDENT_RESPONSE_RUNBOOK.md`.
