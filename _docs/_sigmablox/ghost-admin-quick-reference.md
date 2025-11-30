# Ghost Admin Design - Quick Reference

## Component Cheatsheet

### Stats Cards
```handlebars
<div class="ghost-stats-grid">
    <div class="ghost-stat-card success">
        <div class="ghost-stat-label">Label</div>
        <div class="ghost-stat-value">123</div>
        <div class="ghost-stat-change">Change text</div>
    </div>
</div>
```
**Colors:** `success`, `warning`, `error`, `info`

---

### Buttons
```handlebars
<button class="ghost-btn ghost-btn-primary">Primary</button>
<button class="ghost-btn ghost-btn-secondary">Secondary</button>
<button class="ghost-btn ghost-btn-danger">Danger</button>
<button class="ghost-btn ghost-btn-link">Link</button>

{{!-- Sizes --}}
<button class="ghost-btn ghost-btn-primary ghost-btn-sm">Small</button>
<button class="ghost-btn ghost-btn-primary ghost-btn-lg">Large</button>
```

---

### Cards
```handlebars
<div class="ghost-card">
    <div class="ghost-card-header">
        <h2 class="ghost-card-title">Title</h2>
    </div>
    <div class="ghost-card-body">
        Content
    </div>
</div>
```

---

### Tables
```handlebars
<div class="ghost-table-container">
    <table class="ghost-table">
        <thead>
            <tr><th>Column</th></tr>
        </thead>
        <tbody>
            <tr><td>Data</td></tr>
        </tbody>
    </table>
</div>
```

---

### Badges
```handlebars
<span class="ghost-badge ghost-badge-success">Active</span>
<span class="ghost-badge ghost-badge-warning">Pending</span>
<span class="ghost-badge ghost-badge-error">Error</span>
```

---

### Forms
```handlebars
<div class="ghost-form-group">
    <label class="ghost-form-label">Label</label>
    <input type="text" class="ghost-form-input">
    <span class="ghost-form-hint">Hint text</span>
</div>
```

---

### Page Template
```handlebars
{{!< default}}
{{#post}}

{{#> ghost-admin-layout pageTitle="Page Title" activeNav="nav-key"}}

<div class="ghost-admin">
    {{!-- Components here --}}
</div>

{{/ghost-admin-layout}}

{{/post}}
```

---

## Color Variables

```css
--ghost-accent-green: #30CF43;   /* Primary/Success */
--ghost-accent-blue: #14B8FF;    /* Info */
--ghost-accent-red: #F50B23;     /* Error/Danger */
--ghost-accent-yellow: #FFB41F;  /* Warning */

--ghost-text-primary: #15171A;   /* Main text */
--ghost-text-secondary: #738A94; /* Secondary text */
--ghost-sidebar-bg: #1C1E22;     /* Sidebar dark */
```

---

## JavaScript Helpers

### Show Notification
```javascript
showNotification('Success!', 'success');
showNotification('Error!', 'error');
showNotification('Warning', 'warning');
```

### Loading State
```handlebars
<div class="ghost-loading">
    <div class="ghost-spinner"></div>
    <p>Loading...</p>
</div>
```
