#!/usr/bin/env python3
"""Validate RTMX tracker integrity for mc_site.

This intentionally fails on structural drift so the tracker cannot silently
decay into a human-only artifact.
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / ".rtmx" / "database.csv"
REQ_ROOT = ROOT / ".rtmx" / "requirements"

EXPECTED_HEADER = [
    "req_id",
    "category",
    "subcategory",
    "requirement_text",
    "target_value",
    "test_module",
    "test_function",
    "validation_method",
    "status",
    "priority",
    "phase",
    "notes",
    "effort_weeks",
    "dependencies",
    "blocks",
    "assignee",
    "sprint",
    "started_date",
    "completed_date",
    "requirement_file",
]

KNOWN_CATEGORIES = {
    "AUTH",
    "BUGS",
    "C2UX",
    "CONTENT",
    "DOCS",
    "INFRA",
    "LEGAL",
    "MERCH",
    "PLATFORM",
    "SECURITY",
    "UX",
}
KNOWN_STATUSES = {"COMPLETE", "PARTIAL", "PENDING", "BLOCKED", "BACKLOG"}
KNOWN_PRIORITIES = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
KNOWN_VALIDATION_METHODS = {
    "Manual Test",
    "Visual Test",
    "Automated Test",
    "Manual Review",
}
KNOWN_PHASES = {str(i) for i in range(1, 12)}
DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")
FILE_STATUS_RE = re.compile(
    r"(?:^|\n)\s*-?\s*\*\*?Status\**?\s*:\s*"
    r"(COMPLETE|PARTIAL|PENDING|BLOCKED|BACKLOG)",
    re.IGNORECASE,
)


def fail(errors: list[str]) -> int:
    if not errors:
        print("RTMX validation passed.")
        return 0
    print("RTMX validation failed:")
    for error in errors:
        print(f"- {error}")
    return 1


def main() -> int:
    errors: list[str] = []

    if not DB_PATH.is_file():
        return fail([f"Missing database file: {DB_PATH}"])

    with DB_PATH.open(newline="") as handle:
        rows = list(csv.reader(handle))

    if not rows:
        return fail([f"Database file is empty: {DB_PATH}"])

    header = rows[0]
    if header != EXPECTED_HEADER:
        errors.append(
            "database header does not match expected schema "
            f"({len(header)} cols found, expected {len(EXPECTED_HEADER)})"
        )

    seen_ids: set[str] = set()
    db_ids: set[str] = set()

    for lineno, row in enumerate(rows[1:], start=2):
        if len(row) != len(EXPECTED_HEADER):
            errors.append(
                f"line {lineno}: expected {len(EXPECTED_HEADER)} columns, found {len(row)}"
            )
            continue

        record = dict(zip(EXPECTED_HEADER, row))
        req_id = record["req_id"]
        db_ids.add(req_id)

        if req_id in seen_ids:
            errors.append(f"line {lineno}: duplicate req_id {req_id}")
        seen_ids.add(req_id)

        if record["category"] not in KNOWN_CATEGORIES:
            errors.append(
                f"line {lineno}: unknown category {record['category']} for {req_id}"
            )

        if record["validation_method"] and record["validation_method"] not in KNOWN_VALIDATION_METHODS:
            errors.append(
                f"line {lineno}: unknown validation_method {record['validation_method']} for {req_id}"
            )

        if record["status"] not in KNOWN_STATUSES:
            errors.append(f"line {lineno}: unknown status {record['status']!r} for {req_id}")

        if record["priority"] not in KNOWN_PRIORITIES:
            errors.append(
                f"line {lineno}: unknown priority {record['priority']!r} for {req_id}"
            )

        if record["phase"] not in KNOWN_PHASES:
            errors.append(f"line {lineno}: unknown phase {record['phase']!r} for {req_id}")

        for field in ("started_date", "completed_date"):
            value = record[field]
            if value and not DATE_RE.fullmatch(value):
                errors.append(f"line {lineno}: invalid {field} {value!r} for {req_id}")

        req_file = record["requirement_file"]
        if not req_file:
            errors.append(f"line {lineno}: missing requirement_file for {req_id}")
            continue

        req_path = ROOT / req_file
        if not req_path.is_file():
            errors.append(f"line {lineno}: missing requirement file {req_file} for {req_id}")
            continue

        text = req_path.read_text()
        status_match = FILE_STATUS_RE.search(text)
        if status_match:
            file_status = status_match.group(1).upper()
            if file_status != record["status"]:
                errors.append(
                    f"line {lineno}: status mismatch for {req_id} "
                    f"(db={record['status']} file={file_status})"
                )

    for req_file in sorted(REQ_ROOT.rglob("REQ-*.md")):
        req_id = req_file.stem
        if req_id not in db_ids:
            rel = req_file.relative_to(ROOT)
            errors.append(f"orphan requirement file with no DB row: {rel}")

    return fail(errors)


if __name__ == "__main__":
    sys.exit(main())
