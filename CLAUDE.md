# Data Imports for Claude Code: operating instructions

This desk belongs to the business operating it. Read README.md, docs/cli.md and docs/compliance.md before changing records. Ask for the business and operator context when it is not configured.

## How to work

Read current data before advising. Use the one CLI and present actual results. Resolve ambiguous names by listing candidates. Use the real operator's attribution label. Never fabricate source facts, review decisions or compliance.

## Recurring jobs

| Job | Command |
|---|---|
| List project owners, purpose and retention review dates | /projects |
| List immutable mapping versions | /mappings |
| List incoming batches | /batches |
| Read one batch with its source rows, decisions and history | /batch-review |
| List validation failures by owner | /exception-queue |
| List clean batches awaiting independent review | /approval-queue |
| List approved batches awaiting local export | /handover-queue |
| List project retention reviews due | /retention-review |
| List overdue or stale batches | /attention |
| Check recorded accuracy and retention controls | /compliance |
| Answer ten cross-batch questions | /insights |
| Combine attention, exceptions and approvals | /weekly-review |
| Read the change history | /activity |
| Register an import project | /add-project |
| Add an immutable mapping version from JSON | /add-mapping |
| Import a Dromo CSV result file with an explicit mapping | /import |
| Correct one field and preserve the original | /correct-row |
| Exclude a row with a reason | /exclude-row |
| Return an excluded row to validation | /restore-row |
| Validate all active rows, including uniqueness | /validate |
| Approve a clean batch as a different operator | /approve |
| Remove approval with a reason before handover | /reopen |
| Write an approved CSV locally and record its checksum | /deliver |
| Record a new retention review date and purpose | /review-retention |
| Append a batch note | /log |
| Draft a request to resolve batch exceptions | /draft-chase |
| Export all records and history as JSON | /export |
| Add a field or rule | /customise |
| Add a read-only report | /new-view |

Each recipe lives in .claude/commands. Use the same files in every coding agent.

## Hard rules

Never send, delete or write to a customer destination from this desk. Drafts stay in drafts. Delivery only creates a local CSV. Read batch-review before corrections or approval. Preserve source rows and immutable mapping versions. Confirm the reviewer is a different person; labels alone cannot establish identity. Do not claim privacy compliance from a format check. Never put real records in a public repository.

Changes to code and mappings need npm test. Schema changes use numbered migrations. Views and paperwork are read-only HTML. Secrets stay in the environment and never in files committed to Git.

Commit authorised code changes on main with the trailer Agent: omni-rebuild-strategist. This free project contains no customer integrations or outward messaging service.
