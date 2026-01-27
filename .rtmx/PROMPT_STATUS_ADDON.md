# STATUS.md Maintenance for Ralph

Add these instructions to your PROMPT_build.md to enable human visibility into Ralph's work.

---

## Add after orientation steps (0a, 0b, 0c):

```
0d. Update @.rtmx/STATUS.md using a subagent:
    - Set "Started" to current timestamp
    - Set "Task" to the REQ-ID you're about to work on
    - List the next 5 prioritized tasks in "Queue"
    - Note any blocked items in "Blocked / Needs Human"
```

## Add before git commit (after step 4):

```
4a. Update @.rtmx/STATUS.md using a subagent:
    - Move completed task to "Recently Completed" (keep last 5)
    - Update "Queue" with remaining tasks
    - Set "Last updated" timestamp
    - If blocked, add to "Blocked / Needs Human" with reason
```

---

## Add this guardrail (in the 9s sequence):

```
99999999999999999. IMPORTANT: Maintain @.rtmx/STATUS.md for human visibility.
    At loop START: update current task and queue.
    At loop END: record completion and update queue.
    Keep "Recently Completed" to last 5 items.
    This file is the human's window into your work - keep it current.
```

---

## Example STATUS.md format:

```markdown
# Ralph Status

## Current Session
- **Started**: 2026-01-26 14:30 UTC
- **Task**: REQ-AUTH-003 - Configure Ghost CMS SSO with VIA

## Queue (Next 5)
1. REQ-AUTH-004 - Implement role-based access control
2. REQ-DASH-001 - Build VIA Dashboard user management
3. REQ-DB-007 - Remove MongoDB dependency
4. REQ-VIA-005 - Resend verification link fix
5. REQ-DOCS-001 - Restructure documentation

## Recently Completed
- REQ-AUTH-002 - Set up SigmaBlox site configuration (2026-01-26)
- REQ-AUTH-001 - Configure VIA authentication provider (2026-01-26)
- REQ-DB-001 - Migrate Company endpoints (2026-01-25)

## Blocked / Needs Human
- REQ-VIA-001 - Turnstile theming requires Cloudflare dashboard access

---
_Last updated: 2026-01-26 14:32 UTC_
```
