# Move an operator-led import workflow from Dromo

## Obtain your own result files

[Dromo's FAQ](https://developer.dromo.io/faqs), checked 18 November 2026, documents final CSV and JSON downloads from the Imports tab when backendSyncMode is enabled. Private Mode does not create that retained server-side history. Use results already retained by your application in that case. The column names depend on your own importer configuration. Do not assume the supplied fictional fixture is a universal Dromo layout.

Save a complete CSV result file. Preserve its original, any uploaded files, your Dromo field definitions, validation hooks and delivery history separately. This import loads result rows; it does not reconstruct Dromo workspaces, original pre-cleaning values, approval history, hooks or error annotations from a result file. Here, `original` means the values in the result CSV you imported.

## Configure once

Create an empty database with `npm run migrate`. Seed only a fictional workspace. Register a project with its owner, purpose and retention review date. Copy examples/suppliers-map.json, then set each source column to an actual exported header. Supported checks are text, email, integer, date, enum, required and batch-local uniqueness. Hooks require deliberate reimplementation and testing.

```bash
npm run imports -- add-project --code=SUPPLIERS --name="Supplier onboarding" --owner="Data lead" --purpose="Agreed supplier migration" --review-date=2027-02-01 --actor="Operator"
npm run imports -- add-mapping --code=SUPPLIERS-V1 --name="Supplier fields version 1" --file=examples/suppliers-map.json --actor="Operator"
```

## One import command

```bash
npm run imports -- import dromo examples/dromo-results.csv --batch=SWITCH-01 --project=SUPPLIERS --mapping=SUPPLIERS-V1 --due=2027-01-15 --actor="Operator" --dry-run
```

Review the row count and unmapped columns. Repeat without --dry-run to stage the batch. Exact replay with the same batch code, bytes, project, mapping and due date is a no-op. Different input under that code is refused. Unknown columns are preserved in the source row and reported, but are absent from delivered data. A missing mapped column fails before any rows land. Review the source: importing Dromo's cleaned results cannot recover earlier rejected rows.

## Reconcile before switching

Read batch-review, run validate, correct or explicitly exclude bad rows, and validate again. Compare active plus excluded rows to the source count. Have another operator approve the clean result. Deliver to a new local CSV file and compare counts, selected records and the checksum. Import that file into your destination using its own authorised procedure. A local receipt is not confirmation of a destination load.

The switch-in-a-day path applies to an agreed CSV layout and an operator-led workload. Keep Dromo until your field rules and destination checks pass. An embedded customer upload screen, Excel ingestion, live SFTP feeds, authentication and application connections need a separately scoped implementation. Enterprise DNA maps and tests these through the customised or managed path.

## Limits and recovery

Local CSV input limit: 20 MiB and 100,000 rows. No claim of tested production throughput. Rows remain strings, including integer fields, so identifiers and original formatting survive. Uniqueness is case-sensitive unless lowercasing is configured, and is checked within a batch only. Mapping versions are immutable; create a new version and a new batch when rules change.

Delivery writes an exact machine-readable CSV, without altering formula-like values. Do not open untrusted output as an executable spreadsheet. Use a text editor or an importer configured to treat fields as data. Output files are created exclusively and never overwritten. A normal write or commit error removes the new file and rolls back the receipt. A process or machine crash between file creation and commit can leave an orphan file: reconcile its checksum and batch state before retrying to a new path. After a completed handover, use a new corrective batch instead of changing history.
