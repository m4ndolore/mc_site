# Specifications Directory

This directory contains feature specifications for Ralph to implement.

## How to Write Specs

Each spec should cover **one topic of concern** (not multiple features combined).

### Topic Scope Test
Can you describe the topic in one sentence without "and"?
- Good: "The navigation system provides consistent site-wide navigation"
- Bad: "The user system handles authentication, profiles, and billing" (3 topics)

### Spec Structure

```markdown
# [Feature Name]

## Job to Be Done
What user need does this address?

## Requirements
- Specific, testable requirements
- Use "MUST", "SHOULD", "MAY" language

## Acceptance Criteria
- [ ] Criteria 1 (testable)
- [ ] Criteria 2 (testable)

## Visual/UX Notes
Reference C2UX doctrine from docs/theme/ux.md

## Technical Constraints
Any limitations or dependencies
```

## Existing Specs

Add your specs here as `[topic-name].md` files.
