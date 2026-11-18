# Correct one field and preserve the original

Read CLAUDE.md. Read the affected record first. Use the operator's real attribution label, purpose and reason. Preview with --dry-run when useful. Never invent approval or silently choose between ambiguous records.

`npm run imports -- correct-row NORTH-01 --row=2 --field=email --value=demo@example.invalid --reason="Checked supplied correction" --actor="Operator"`

The arguments above are a fictional example. Replace them with the requested record and verified values. Add --json for structured output. For any failed check, show the reason and the records to fix.
