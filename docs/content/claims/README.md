# Claims Inventory Workflow

## Files

- `claims.schema.json`: Canonical schema for extracted claim records.
- `claims-inventory-2026-02-17-initial.json`: Initial JSON inventory for `/`, `/access`, and `/programs/the-combine`.
- `claims-inventory-2026-02-17-initial.csv`: Spreadsheet-friendly export of the same records.

## Regenerate Inventory

```bash
npm run claims:extract -- index.html access.html programs/the-combine.html \
  --out-json docs/content/claims/claims-inventory-YYYY-MM-DD.json \
  --out-csv docs/content/claims/claims-inventory-YYYY-MM-DD.csv
```

## Record Defaults

- `claim_type`: `unclassified`
- `source_status`: `unsourced`
- `status`: `open`
- `owner`: `content-ops`

These defaults are intentional so human review can complete `TRUTH-002` and `TRUTH-003`.

## Auto-Classify + Review Queue

```bash
npm run claims:classify -- \
  --input docs/content/claims/claims-inventory-YYYY-MM-DD.json \
  --out-json docs/content/claims/claims-inventory-YYYY-MM-DD-classified.json \
  --out-csv docs/content/claims/claims-inventory-YYYY-MM-DD-classified.csv \
  --out-queue docs/content/claims/claims-review-queue-YYYY-MM-DD.json
```

Outputs:
- Classified inventory (`claim_type` auto-assigned).
- CSV export for editorial review.
- Prioritized review queue (`P0/P1/P2`) for human override.
