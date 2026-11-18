# Remove approval with a reason before handover

Read CLAUDE.md. Read the affected record first. Use the operator's real attribution label, purpose and reason. Preview with --dry-run when useful. Never invent approval or silently choose between ambiguous records.

`npm run imports -- reopen NORTH-01 --reason="Source clarification" --actor="Operator"`

The arguments above are a fictional example. Replace them with the requested record and verified values. Add --json for structured output. For any failed check, show the reason and the records to fix.
