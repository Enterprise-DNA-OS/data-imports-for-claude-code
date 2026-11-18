# Accuracy and retention checks

Checked 18 November 2026. These are record checks for the operator, not a legal opinion, certification or a claim that a validation pass proves compliance.

| Check | Source | What this desk does |
|---|---|---|
| Accuracy before use | [NZ Privacy Act principle 8](https://www.privacy.org.nz/privacy-principles/8/) | Flags batches without completed validation and independent approval. Validation tests the configured fields, not whether the source is true. |
| Accuracy on collection and use | [Australian Privacy Principle 10](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-10-app-10-quality-of-personal-information) | Preserves source values and corrections, checks required values, formats and duplicate keys. A person checks relevance and source reliability. APP applicability must be assessed for the organisation. |
| Retention limited to purpose | [NZ Privacy Act principle 9](https://www.privacy.org.nz/privacy-principles/9/) | Flags an overdue project retention review and blocks approval and handover until that review is recorded. Review dates are the operator's policy, not a statutory retention period. |
| Independent review | Local operational policy | Importer and last editor cannot approve their own batch. Actor labels are self-declared, not verified identities. |
| Handover evidence | Local operational policy | Produces a local CSV and records its SHA-256 checksum and count. Nothing is sent or loaded into another system. |

Run `npm run imports -- compliance`. Findings show missing recorded controls. The operator must inspect source evidence and correct inaccurate information, including copies already held elsewhere. This desk does not verify legal authority to collect, identity, consent, cross-border disclosure, encryption, recovery or access policies.

Source rows, corrections and history can contain personal information. The base flags retention review but never deletes. Agree a retention and deletion procedure for all copies, backups, drafts and exports before using real personal information. A database owner can change history directly. This is not a tamper-proof archive.
