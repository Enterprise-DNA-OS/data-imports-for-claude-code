# Approve a clean batch as a different operator

Read CLAUDE.md. Read the affected record first. Use the operator's real attribution label, purpose and reason. Preview with --dry-run when useful. Never invent approval or silently choose between ambiguous records.

`npm run imports -- approve NORTH-01 --reason="Source and active rows checked" --actor="Reviewer"`

The arguments above are a fictional example. Replace them with the requested record and verified values. Add --json for structured output. For any failed check, show the reason and the records to fix. A different human reviews source counts, field accuracy and exclusions. Actor labels are not authentication.
