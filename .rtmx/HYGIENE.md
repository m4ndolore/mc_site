# RTMX Hygiene Procedure

## When to Run
- At session start (before picking work)
- After adding new requirements
- During DOCS cleanup passes
- Before trusting `STATUS.md` queue ordering for execution

## Reconciliation Checklist

### 0. Structural Validation

Run the validator first:

```bash
python3 scripts/validate-rtmx.py
```

The validator is intentionally strict. If it fails, RTMX is not trustworthy enough
to drive execution planning until the reported drift is fixed.

### 1. Orphan Detection

Check for DB rows without matching files:
```bash
# Extract req_id and category from database, check each has a file
tail -n +2 .rtmx/database.csv | while IFS=',' read -r id cat _; do
  f=".rtmx/requirements/${cat}/${id}.md"
  [ ! -f "$f" ] && echo "ORPHAN ROW: $id (missing $f)"
done
```

Check for files without matching DB rows:
```bash
# List all requirement files, check each has a DB row
find .rtmx/requirements -name 'REQ-*.md' | while read -r f; do
  id=$(basename "$f" .md)
  grep -q "^${id}," .rtmx/database.csv || echo "ORPHAN FILE: $f (no DB row)"
done
```

### 2. Status Sync

Check that file status matches DB status:
```bash
tail -n +2 .rtmx/database.csv | while IFS=',' read -r id cat _ _ _ _ _ _ status _; do
  f=".rtmx/requirements/${cat}/${id}.md"
  [ -f "$f" ] || continue
  file_status=$(grep -m1 -i 'status' "$f" | grep -oE '(COMPLETE|PARTIAL|PENDING|BLOCKED|BACKLOG)')
  [ -n "$file_status" ] && [ "$file_status" != "$status" ] && echo "MISMATCH: $id DB=$status FILE=$file_status"
done
```

### 3. Fix Procedure

- **Orphan DB row**: Create the requirement .md file with metadata from DB
- **Orphan file**: Either add to database.csv or delete the file
- **Status mismatch**: DB is source of truth. Update the file to match.

### 4. Workflow Rules

When creating a new requirement:
1. Add row to `database.csv` first
2. Create `.rtmx/requirements/<CATEGORY>/REQ-XXX-NNN.md` in the same commit
3. Set status consistently in both locations
4. Run `python3 scripts/validate-rtmx.py`

When completing a requirement:
1. Update `database.csv`: status, completed_date, notes
2. Update the .md file: Status field + sitrep section
3. Both updates in the same commit
4. Run `python3 scripts/validate-rtmx.py`

When picking next work:
1. Prefer open items on the current ship gate over new growth backlog
2. Prefer human-blocked infra fixes over phase 10 ideas
3. Treat `STATUS.md` as derived from the validated tracker, not as the source of truth
