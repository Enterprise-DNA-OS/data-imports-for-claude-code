# Data Imports for Claude Code

Incoming customer files, field mappings, row corrections and batch approvals in a database you own. An operator's desk for reviewing CSV imports and handing over checked files.

## Three ways to use it

**Do it yourself.** Free under MIT. Install, try fictional records and map your exports. Works with Claude Code, Codex, OpenCode or Cursor. Hosting and your coding agent are separate costs.

**We customise it.** Enterprise DNA maps your Dromo results, adds your field rules and connections, and builds an upload screen if you need one. A different stack is available. One setup fee, then a retainer.

**We run it for you.** Omni by Enterprise DNA installs and operates your version, with access, backups, reviews and ongoing changes agreed. One setup fee, then a monthly retainer. [Book a 30-minute call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=dromo&utm_medium=github).

## Start with fictional records

Node 20 or 22, Windows or Linux.

```bash
npm install
npm test
npm run demo
```

Tests use a temporary database and remove it. The demo ignores DATABASE_URL and leaves its separate fictional workspace for inspection. For a persistent local workspace:

```bash
npm run migrate
npm run seed
npm run imports -- attention
npm run view
npm run docs
```

Migrate without seeding for real records. DATABASE_URL selects PostgreSQL; otherwise DATA_DIR selects local PGlite. Shared seeding requires --demo-database.

## What ships

27 CLI commands and 29 slash commands. Three read-only dashboards show the week, field exceptions and recorded controls. Three document types produce correction requests, acceptance records and handover manifests. Put your business name, colours and logo in brand.json.

Mappings are immutable versions. Original imported values survive corrections. Validation checks required values, integer bounds, dates, email shape, allowed values and batch-local uniqueness. An independent reviewer accepts a clean batch. Approval locks rows. Reopening clears approval, and delivery writes a new local file with a checksum receipt. Nothing is sent and no destination system is changed.

## Bring Dromo records across

```bash
npm run imports -- import dromo examples/dromo-results.csv --batch=SWITCH-01 --project=DEMO-NORTH --mapping=SUPPLIERS-V1 --due=2027-01-15 --actor="Operator" --dry-run
```

Preview, reconcile and repeat without --dry-run. This example uses the seeded fictional project and mapping. Dromo documents CSV result downloads when backendSyncMode is enabled. Private Mode users need results retained in their own application. Field names depend on your configuration. Preserve original uploads, hooks and history separately. [Full switching guide](docs/replace-dromo.md).

## Ten questions to ask today

Run `npm run imports -- insights`. Each question runs a real query. Dromo supports custom workflows too; this is not a claim that it cannot answer similar questions.

1. Which owners have the most rows needing correction?
2. Which batches are overdue and still unapproved?
3. Which fields repeatedly fail validation?
4. Which batches exclude the largest share of source rows?
5. Which clean batches are waiting for another reviewer?
6. Which projects need a retention decision before handover?
7. Which imported rows have duplicate identifiers?
8. Which mapping versions produce the most invalid batches?
9. Which approved batches still lack a handover receipt?
10. Which source files were loaded into more than one batch?

## Your first hour: ten things to ask for

1. Show this week's batches and owners.
2. Find overdue imports.
3. Read the North batch and its source rows.
4. Find repeated invalid fields.
5. Correct a field using the source owner's evidence.
6. Exclude a duplicate and record why.
7. Validate again and prepare the acceptance record.
8. Have a different operator review the clean batch.
9. Draft a correction request and put our name on it.
10. Add our field through /customise and a report through /new-view.

## Operating boundary

This is a trusted operator workspace, not a multi-tenant service or embedded browser widget. Actor labels are self-declared attribution, not sign-in. Before shared use, configure authenticated identities, least-privilege roles, encryption, controlled report storage, backups and recovery checks. Row security has no public policies; a database owner bypasses it. Source rows and history contain customer data and require an agreed retention/deletion process. The base flags review dates but never deletes records.

Read [compliance checks](docs/compliance.md) and [scope](docs/why-no-front-end.md). A clean batch proves only the configured checks. A person confirms source truth, relevance, privacy authority and exclusions. Exact CSV exports can contain formula-like input; treat them as data in a text editor or a controlled importer. After a crash during delivery, reconcile the file and receipt before retrying.

## Validation

The smoke suite exercises all 27 commands, invalid transitions, duplicate identifiers, locked rows, independent review, retention gates, preview/replay/rollback, complete exports and HTML escaping. The manual CI workflow covers Windows and Linux on Node 20/22, plus disposable PostgreSQL. See actual workflow results before claiming those environments passed.

[CLI reference](docs/cli.md) · [Research and scores](docs/research.md).

MIT. Copyright (c) 2026 Enterprise DNA. Not affiliated with Dromo. Demo data is fictional.
