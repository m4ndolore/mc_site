# Reminder Email Templates Documentation

**Status:** Implemented
**Date:** 2025-01-23
**Location:** `webhook/email-notifications.js`

---

## Overview

Professional, branded email templates have been created for the notes reminder system. Each template follows SigmaBlox branding guidelines with a consistent, mobile-responsive design optimized for all major email clients.

---

## Template Types

### 1. Note Review Reminder (`noteReviewReminder`)
**Purpose:** Reminds users to review their notes
**Subject:** `Review your notes on {targetName}`
**Use Case:** General note review, periodic check-ins

**Features:**
- Clean, professional layout with SigmaBlox branding
- Optional custom message in gray callout box
- Note details table (title, type, related to)
- Clear "Open Note →" call-to-action button
- Footer with platform links

---

### 2. Phone Call Reminder (`phoneCallReminder`)
**Purpose:** Reminds users about scheduled calls
**Subject:** `📞 Call reminder: {targetName}`
**Use Case:** Pre-call prep, meeting reminders

**Features:**
- Yellow/amber callout box for custom messages (higher urgency)
- Scheduled time display (if provided)
- "Review Notes →" CTA to prepare for call
- Contact name prominently displayed

---

### 3. Research Reminder (`researchReminder`)
**Purpose:** Prompts users to continue research activities
**Subject:** `🔍 Research reminder: {targetName}`
**Use Case:** Ongoing research projects, data gathering

**Features:**
- Blue callout box for custom messages (informational tone)
- Research target clearly displayed
- "Continue Research →" CTA
- Note type indicator (company/coach research)

---

### 4. Follow-Up Reminder (`followUpReminder`)
**Purpose:** Reminds users to follow up with contacts
**Subject:** `✉️ Follow up with {targetName}`
**Use Case:** Post-meeting follow-ups, outreach tracking

**Features:**
- Green callout box for custom messages (action-oriented)
- Contact name and type
- "View Notes →" CTA to review previous conversations
- Follow-up context display

---

### 5. Custom Reminder (`customReminder`)
**Purpose:** Generic reminder for any user-defined purpose
**Subject:** `🔔 Reminder: {targetName}` (or custom title)
**Use Case:** Flexible, user-defined reminders

**Features:**
- Purple callout box for custom messages (neutral/custom)
- Supports custom reminder titles
- Generic "View Note →" CTA
- Adaptable to any reminder scenario

---

## Design Specifications

### Color Scheme
- **Primary Brand Color:** `#1a1a1a` (dark gray/black)
- **Header Gradient:** Linear gradient from `#1a1a1a` to `#2d2d2d`
- **Background:** `#f3f4f6` (light gray)
- **Card Background:** `#ffffff` (white)
- **Text Primary:** `#111827` (near black)
- **Text Secondary:** `#6b7280` (medium gray)

### Custom Message Callouts
Each reminder type has a distinct callout color:
- **Note Review:** Gray (`#f8f9fa` background, `#1a1a1a` border)
- **Phone Call:** Yellow/Amber (`#fef3c7` background, `#f59e0b` border)
- **Research:** Blue (`#eff6ff` background, `#3b82f6` border)
- **Follow-Up:** Green (`#dcfce7` background, `#10b981` border)
- **Custom:** Purple (`#f3e8ff` background, `#a855f7` border)

### Typography
- **Font Stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Header Size:** 24px, weight 700
- **Body Size:** 16px, line-height 1.6
- **Metadata Size:** 14px
- **Footer Size:** 12px

---

## Template Structure

All templates follow this consistent structure:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; background-color: #f3f4f6;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table style="max-width: 600px; background-color: #ffffff; border-radius: 12px;">

            <!-- Header Section -->
            <tr>
              <td style="background: linear-gradient(...); padding: 40px 30px;">
                <h1>📝 Time to Review Your Notes</h1>
              </td>
            </tr>

            <!-- Content Section -->
            <tr>
              <td style="padding: 40px 30px;">
                <!-- Message -->
                <!-- Custom Message Callout (if provided) -->
                <!-- Note Details Table -->
                <!-- CTA Button -->
              </td>
            </tr>

            <!-- Footer Section -->
            <tr>
              <td style="padding: 30px; background-color: #f9fafb;">
                <!-- Platform name -->
                <!-- Management links -->
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## Mobile Responsiveness

All templates are mobile-responsive with:
- **Max width:** 600px on desktop
- **Table-based layout** for email client compatibility
- **Proper viewport meta tag** for mobile devices
- **Touch-friendly CTA buttons** (minimum 44px tap target)
- **Readable font sizes** on small screens

---

## Email Client Compatibility

Templates are optimized for:
- ✅ Gmail (web, iOS, Android)
- ✅ Apple Mail (macOS, iOS)
- ✅ Outlook (web, desktop, mobile)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Thunderbird

**Techniques used:**
- Table-based layout (not CSS grid/flexbox)
- Inline styles (not external stylesheets)
- `role="presentation"` for semantic tables
- Fallback colors for unsupported gradients

---

## Usage Example

### From cron-reminders.js:

```javascript
const { emailTemplates } = require('./email-notifications');

// Select template based on reminder type
const template = emailTemplates.phoneCallReminder({
  noteTitle: 'Partnership Discussion',
  targetName: 'Acme Defense Corp',
  targetType: 'company',
  customMessage: 'Call scheduled for 3pm EST - discuss Q1 roadmap',
  actionUrl: 'https://sigmablox.ai/my-notes/?note=abc123',
  scheduledFor: '2025-01-23T15:00:00Z'
});

// Send email
await sendEmail('user@example.com', template);
```

---

## Template Parameters

Each template accepts these parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `noteTitle` | string | Yes | Title of the note |
| `targetName` | string | Yes | Name of company/coach |
| `targetType` | string | Yes | Either "company" or "coach" |
| `customMessage` | string | No | User's custom reminder message |
| `actionUrl` | string | Yes | Deep link to the note |
| `scheduledFor` | Date | No* | When reminder was scheduled for |
| `reminderTitle` | string | No** | Custom subject line |

\* Only used in `phoneCallReminder`
\*\* Only used in `customReminder`

---

## Footer Links

All templates include footer links to:
- **Manage Reminders:** `/my-notes/` - View and edit all reminders
- **Visit Platform:** `/` - Return to SigmaBlox homepage

---

## Styling Considerations

### Why Tables?
Email HTML requires table-based layouts because many email clients (especially Outlook) have poor CSS support. Tables ensure consistent rendering across all platforms.

### Why Inline Styles?
Email clients strip out `<style>` tags and external stylesheets. All styles must be inline for maximum compatibility.

### Box Model Differences
Outlook uses Microsoft Word's HTML rendering engine, which has different box model calculations. Our templates use:
- Explicit widths on all containers
- `border-collapse: collapse` on all tables
- Padding instead of margins where possible

### Dark Mode Support
Templates use solid backgrounds (not transparent) to ensure readability in both light and dark modes.

---

## Testing Checklist

Before deploying new templates:
- [ ] Test in Gmail (web and mobile)
- [ ] Test in Apple Mail (macOS and iOS)
- [ ] Test in Outlook (web and desktop)
- [ ] Verify mobile responsiveness (< 400px width)
- [ ] Check links are clickable
- [ ] Verify custom message rendering
- [ ] Test with and without custom message
- [ ] Ensure emojis render correctly
- [ ] Verify CTA button is prominent
- [ ] Check footer links work

---

## Future Enhancements

Potential improvements:
1. **Rich Snippets:** Add JSON-LD for Google Calendar integration
2. **Calendar Invite:** Include .ics attachment for phone call reminders
3. **Snooze Link:** Quick snooze option directly from email
4. **Preview Text:** Optimize for email client preview panes
5. **AMP for Email:** Interactive snooze/dismiss buttons
6. **Localization:** Multi-language support
7. **Timezone Display:** Show reminder time in user's timezone
8. **Note Preview:** Include snippet of note content

---

## Related Files

- **Email Templates:** `/webhook/email-notifications.js` (lines 385-851)
- **Send Function:** `/webhook/email-notifications.js` (lines 855-879)
- **Cron Processor:** `/webhook/cron-reminders.js`
- **Requirements Doc:** `/_docs/features/NOTES_UX_AND_ENGAGEMENT_IMPROVEMENTS.md`

---

## Questions or Issues?

For template modifications or bug reports, see the main notes feature documentation.
