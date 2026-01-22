# REQ-C2UX-002: Ecosystem Status Dashboard

## Description
Add a dashboard view showing real-time ecosystem activity: builder count, recent additions, docs activity, and engagement metrics.

## Target
**Metric**: Real-time ecosystem activity visible on dashboard

## Reference
- SigmaBlox admin dashboard patterns
- C2UX design doctrine

## Acceptance Criteria
- [ ] Dashboard route: `/dashboard` or `/status`
- [ ] Builder count with trend indicator
- [ ] Recent builder additions (last 7 days)
- [ ] Docs activity feed (recent edits)
- [ ] User engagement metrics (if available)
- [ ] Auto-refresh every 60 seconds
- [ ] C2UX compliant (data-dense, operational)

## Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│ ECOSYSTEM STATUS                           Last: 14:32 │
├─────────────────────┬───────────────────────────────────┤
│ BUILDERS            │ RECENT ACTIVITY                   │
│ ┌─────────────────┐ │ ┌─────────────────────────────┐   │
│ │ 127 (+3)        │ │ │ 14:30 Builder added: Acme   │   │
│ │ Total Records   │ │ │ 14:15 Doc updated: API Ref  │   │
│ └─────────────────┘ │ │ 13:45 User authenticated    │   │
│ ┌─────────────────┐ │ │ 13:30 Builder updated: XYZ  │   │
│ │ 12              │ │ └─────────────────────────────┘   │
│ │ This Week       │ │                                   │
│ └─────────────────┘ │                                   │
├─────────────────────┴───────────────────────────────────┤
│ COVERAGE                                                │
│ Autonomy ████████░░ 80%  ISR ██████░░░░ 60%            │
│ Logistics ████░░░░░░ 40%  Cyber █████████░ 90%         │
└─────────────────────────────────────────────────────────┘
```

## Data Sources
- Builder data: SigmaBlox API `/api/public/companies`
- Docs activity: GitBook/Docusaurus webhook or API
- User metrics: VIA/Authentik API

## Implementation
- **Status**: PENDING
- **Phase**: 4
- **Priority**: LOW

## Validation
- **Method**: Manual Test + Visual Test
- Dashboard loads with live data
- Refresh works without page reload
- Responsive on mobile

## Dependencies
- REQ-C2UX-001 (design system should be in place)
- REQ-AUTH-002 (may need auth for some metrics)
