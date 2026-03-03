# RTMX Hygiene Procedure

## When to Run
- At session start (before picking work)
- After adding new requirements
- During DOCS cleanup passes

## Reconciliation Checklist

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

When completing a requirement:
1. Update `database.csv`: status, completed_date, notes
2. Update the .md file: Status field + sitrep section
3. Both updates in the same commit
