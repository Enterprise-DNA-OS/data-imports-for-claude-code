# Import a Dromo CSV result file with an explicit mapping

Read CLAUDE.md. Read the affected record first. Use the operator's real attribution label, purpose and reason. Preview with --dry-run when useful. Never invent approval or silently choose between ambiguous records.

`npm run imports -- import dromo examples/dromo-results.csv --batch=LOAD-01 --project=DEMO-NORTH --mapping=SUPPLIERS-V1 --due=2027-01-15 --actor="Operator" --dry-run`

The arguments above are a fictional example. Replace them with the requested record and verified values. Add --json for structured output. For any failed check, show the reason and the records to fix.
