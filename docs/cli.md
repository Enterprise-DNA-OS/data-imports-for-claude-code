# CLI reference

Run `npm run imports -- <command>`. All commands support --json. Writes require --actor="Name". --dry-run rolls database writes back and prevents delivery, export and draft files. Invalid input exits 1. Ambiguous partial IDs or case-insensitive names list candidates; exact codes win. Read commands accept no extra record argument unless shown below.

## projects

List project owners, purpose and retention review dates.

`npm run imports -- projects`

## mappings

List immutable mapping versions.

`npm run imports -- mappings`

## batches

List incoming batches.

`npm run imports -- batches`

## batch-review

Read one batch with its source rows, decisions and history.

`npm run imports -- batch-review NORTH-01`

## exception-queue

List validation failures by owner.

`npm run imports -- exception-queue`

## approval-queue

List clean batches awaiting independent review.

`npm run imports -- approval-queue`

## handover-queue

List approved batches awaiting local export.

`npm run imports -- handover-queue`

## retention-review

List project retention reviews due.

`npm run imports -- retention-review`

## attention

List overdue or stale batches.

`npm run imports -- attention`

## compliance

Check recorded accuracy and retention controls.

`npm run imports -- compliance`

## insights

Answer ten cross-batch questions.

`npm run imports -- insights`

## weekly-review

Combine attention, exceptions and approvals.

`npm run imports -- weekly-review`

## activity

Read the change history.

`npm run imports -- activity`

## add-project

Register an import project.

`npm run imports -- add-project --code=CLIENT --name="Client import" --owner="Data lead" --purpose="Agreed migration" --review-date=2027-02-01 --actor="Operator"`

## add-mapping

Add an immutable mapping version from JSON.

`npm run imports -- add-mapping --code=FIELDS-V1 --name="Fields version 1" --file=examples/suppliers-map.json --actor="Operator"`

## import

Import a Dromo CSV result file with an explicit mapping.

`npm run imports -- import dromo examples/dromo-results.csv --batch=LOAD-01 --project=DEMO-NORTH --mapping=SUPPLIERS-V1 --due=2027-01-15 --actor="Operator" --dry-run`

## correct-row

Correct one field and preserve the original.

`npm run imports -- correct-row NORTH-01 --row=2 --field=email --value=demo@example.invalid --reason="Checked supplied correction" --actor="Operator"`

## exclude-row

Exclude a row with a reason.

`npm run imports -- exclude-row NORTH-01 --row=2 --reason="Duplicate confirmed against source" --actor="Operator"`

## restore-row

Return an excluded row to validation.

`npm run imports -- restore-row NORTH-01 --row=2 --reason="Correction received" --actor="Operator"`

## validate

Validate all active rows, including uniqueness.

`npm run imports -- validate NORTH-01 --actor="Operator"`

## approve

Approve a clean batch as a different operator.

`npm run imports -- approve NORTH-01 --reason="Source and active rows checked" --actor="Reviewer"`

## reopen

Remove approval with a reason before handover.

`npm run imports -- reopen NORTH-01 --reason="Source clarification" --actor="Operator"`

## deliver

Write an approved CSV locally and record its checksum.

`npm run imports -- deliver NORTH-01 --out=./handover.csv --actor="Operator"`

## review-retention

Record a new retention review date and purpose.

`npm run imports -- review-retention DEMO-NORTH --review-date=2027-02-01 --purpose="Continued agreed migration" --reason="Owner reviewed purpose" --actor="Operator"`

## log

Append a batch note.

`npm run imports -- log NORTH-01 --text="Source owner supplied a correction" --actor="Operator"`

## draft-chase

Draft a request to resolve batch exceptions.

`npm run imports -- draft-chase NORTH-01`

## export

Export all records and history as JSON.

`npm run imports -- export --out=./all-records.json`

Examples use fictional records and dates. Use a future review date appropriate to the organisation. New mappings define required, unique, trim, lowercase, integer min/max and enum options. Keys are stable identifiers; source is an exact exported header (case-insensitive matching). Values remain strings. CSV accepts quoted delimiters, line breaks, BOM and CRLF; blank lines are ignored. Malformed rows and duplicate headers fail. No arbitrary transformation code is evaluated.

A batch moves draft -> invalid or validated -> approved -> delivered. Any correction or exclusion requires revalidation. Reopen clears an undelivered approval. Delivered records require a new corrective batch. A delivered file's checksum is evidence of the local file, not destination acceptance. export includes every business record and change event, not database credentials or schema migrations.
