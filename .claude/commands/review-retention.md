# Record a new retention review date and purpose

Read CLAUDE.md. Read the affected record first. Use the operator's real attribution label, purpose and reason. Preview with --dry-run when useful. Never invent approval or silently choose between ambiguous records.

`npm run imports -- review-retention DEMO-NORTH --review-date=2027-02-01 --purpose="Continued agreed migration" --reason="Owner reviewed purpose" --actor="Operator"`

The arguments above are a fictional example. Replace them with the requested record and verified values. Add --json for structured output. For any failed check, show the reason and the records to fix.
