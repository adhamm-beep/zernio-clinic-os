# Data Retention Policy Template

This template must be approved by the clinic's legal/privacy owner before automated deletion is enabled.

| Data class | Proposed retention | End-of-period action | Approval required |
| --- | --- | --- | --- |
| Medical record and treatment media | Set from applicable medical regulation and clinic policy | Restrict, archive, or securely delete | Medical + legal |
| Invoice, payment, tax, and ledger data | Set from tax/accounting obligations | Encrypted archive then secure deletion | Finance + legal |
| Patient support messages | Business need plus complaint requirements | Secure deletion or anonymization | Privacy owner |
| Security and audit logs | Risk-based period sufficient for investigation | Secure deletion after legal hold check | Security + legal |
| Temporary exports and local files | Minimum operational period | Immediate secure deletion after use | Data owner |

Legal holds override deletion. Retention actions must be tenant-scoped, auditable, reversible during a grace period where appropriate, and tested on non-production data first.
