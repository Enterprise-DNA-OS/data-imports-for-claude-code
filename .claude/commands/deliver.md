# Write an approved CSV locally and record its checksum

Read CLAUDE.md. Read the affected record first. Use the operator's real attribution label, purpose and reason. Preview with --dry-run when useful. Never invent approval or silently choose between ambiguous records.

`npm run imports -- deliver NORTH-01 --out=./handover.csv --actor="Operator"`

The arguments above are a fictional example. Replace them with the requested record and verified values. Add --json for structured output. For any failed check, show the reason and the records to fix. This writes a new local CSV only. Do not send it or load it into a destination without separate authorisation.
