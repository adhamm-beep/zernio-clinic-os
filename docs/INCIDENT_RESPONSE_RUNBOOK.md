# Incident Response Runbook

## Examples

Lost staff device, exposed credential, suspicious export, unauthorized patient access, malware, altered payment, unavailable database, or leaked clinical attachment.

## First 30 minutes

1. Do not delete evidence or edit audit records.
2. Disable the affected user or integration and revoke active sessions.
3. Rotate exposed secrets through their provider; never paste replacement secrets into chat or source control.
4. Restrict the affected feature while keeping essential clinical operations safe.
5. Preserve timestamps, user IDs, request IDs, security events, audit entries, provider logs, and relevant screenshots in an access-controlled case.
6. Notify the incident owner, clinic management, privacy owner, and legal adviser.

## Investigation and recovery

- Determine the data categories, patients, employees, systems, and time range affected.
- Confirm whether data was viewed, changed, exported, deleted, or made unavailable.
- Remove the cause, patch the weakness, restore from a verified clean backup if required, and validate RLS/MFA before reopening access.
- Reconcile appointments, invoices, payments, bank postings, inventory movements, and patient messages.
- Use the privacy/legal process to determine required notifications to authorities and affected individuals under applicable Saudi requirements. Do not delay escalation while waiting for perfect information.

## Closure

Create a written post-incident review containing the timeline, root cause, impact, evidence, notifications, recovery proof, and assigned prevention actions. Management approves closure only after every action has an owner and deadline.
