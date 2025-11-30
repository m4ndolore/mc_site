# Notes UX & Engagement Improvements

**Date:** 2025-01-23
**Status:** Proposed
**Priority:** High - Improves user engagement and platform stickiness

---

## Executive Summary

This document outlines improvements to the SigmaBlox notes feature focusing on:
1. **UX Issues** - Making Clippy less obtrusive while maintaining quick access
2. **Engagement System** - Adding reminders and notifications to drive users back to the platform

**Goal:** Transform notes from a passive feature into an active engagement driver that brings users back regularly.

---

## Part 1: Clippy Widget UX Improvements

### Current Issues

**Problem:** Clippy button is fixed at `bottom-left (24px, 24px)` and always visible:
- Blocks text selection in lower-left area
- Can interfere with reading content
- No way to hide/minimize when not needed
- Takes up screen real estate on mobile

### Proposed Solutions

#### 1.1 Auto-Hide on Scroll
**Benefit:** Reduces distraction during content consumption

```javascript
// clippy-notes.js enhancement
let scrollTimeout;
let lastScrollY = window.scrollY;

function handleScroll() {
    const clippy = document.getElementById('clippy-button');
    const currentScrollY = window.scrollY;

    // Hide when scrolling down, show when scrolling up
    if (currentScrollY > lastScrollY && currentScrollY > 200) {
        clippy.classList.add('hidden-scroll');
    } else {
        clippy.classList.remove('hidden-scroll');
    }

    lastScrollY = currentScrollY;

    // Clear timeout and reset after 2 seconds of no scrolling
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        clippy.classList.remove('hidden-scroll');
    }, 2000);
}

window.addEventListener('scroll', handleScroll, { passive: true });
```

```css
/* clippy-notes.css addition */
.clippy-button.hidden-scroll {
    transform: scale(0.6) translateY(100px);
    opacity: 0.3;
    pointer-events: auto; /* Still clickable */
}
```

#### 1.2 Keyboard Shortcut Toggle
**Benefit:** Power users can quickly access notes without mouse

```javascript
// Add to clippy-notes.js
document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K to toggle Clippy menu
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleMenu();
    }
});
```

**UI Indicator:** Add tooltip showing "Press ⌘K to open notes"

#### 1.3 Minimize/Collapse State
**Benefit:** Users can temporarily hide Clippy without losing access

```javascript
// Add minimize button to Clippy
function addMinimizeOption() {
    const clippy = document.getElementById('clippy-button');

    // Long-press or right-click for options
    let pressTimer;

    clippy.addEventListener('mousedown', (e) => {
        if (e.button === 2) { // Right click
            e.preventDefault();
            showClippyOptions();
        } else {
            pressTimer = setTimeout(() => {
                showClippyOptions();
            }, 800); // Long press
        }
    });

    clippy.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
    });
}

function showClippyOptions() {
    // Show mini-menu: [Minimize] [Move] [Settings]
    const menu = document.createElement('div');
    menu.className = 'clippy-options-menu';
    menu.innerHTML = `
        <button onclick="ClippyNotes.minimize()">Minimize</button>
        <button onclick="ClippyNotes.enableDrag()">Move</button>
    `;
    document.body.appendChild(menu);
}

window.ClippyNotes.minimize = function() {
    const clippy = document.getElementById('clippy-button');
    clippy.classList.add('minimized');
    clippy.style.width = '40px';
    clippy.style.height = '40px';

    // Add expand button
    clippy.title = 'Click to expand notes';
    localStorage.setItem('clippy-minimized', 'true');
};
```

#### 1.4 Draggable Positioning
**Benefit:** Users can move Clippy to a preferred location

```javascript
// Add drag-and-drop
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function enableDragging() {
    const clippy = document.getElementById('clippy-button');
    clippy.classList.add('draggable');

    clippy.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
}

function startDrag(e) {
    if (e.button !== 0) return; // Only left click

    isDragging = true;
    const rect = e.target.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
}

function drag(e) {
    if (!isDragging) return;

    const clippy = document.getElementById('clippy-button');
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;

    // Constrain to viewport
    const maxX = window.innerWidth - clippy.offsetWidth;
    const maxY = window.innerHeight - clippy.offsetHeight;

    clippy.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    clippy.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    clippy.style.bottom = 'auto'; // Override fixed positioning
}

function stopDrag() {
    if (isDragging) {
        const clippy = document.getElementById('clippy-button');
        const position = {
            left: clippy.style.left,
            top: clippy.style.top
        };
        localStorage.setItem('clippy-position', JSON.stringify(position));
    }
    isDragging = false;
}
```

#### 1.5 Smart Positioning Logic
**Benefit:** Clippy moves automatically when it would block important content

```javascript
// Detect text selection and move Clippy if it overlaps
function handleTextSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const clippy = document.getElementById('clippy-button');
    const clippyRect = clippy.getBoundingClientRect();

    // Check for overlap
    if (rectsOverlap(rect, clippyRect)) {
        // Temporarily move Clippy to top-right
        clippy.classList.add('temp-moved');
        setTimeout(() => {
            if (!window.getSelection().toString()) {
                clippy.classList.remove('temp-moved');
            }
        }, 3000);
    }
}

document.addEventListener('selectionchange', handleTextSelection);
```

---

## Part 2: Reminder & Notification System

### Business Impact

**Problem:** Users create notes but never return to review them
- Notes become "write-once, never-read" content
- Lost opportunity for engagement
- No follow-up on important contacts/research

**Solution:** Proactive reminder system that brings users back

**Expected Outcomes:**
- 3x increase in return visits
- Higher note engagement (review/edit rate)
- Stronger platform habit formation
- Better action follow-through for users

### Architecture

#### 2.1 Database Schema Changes

**Add to MongoDB `notes` collection:**

```javascript
{
  // Existing fields...
  reminders: [{
    _id: ObjectId,                        // Unique reminder ID
    reminderType: String,                  // "note_review" | "phone_call" | "research" | "follow_up" | "custom"
    scheduledFor: Date,                    // When to send reminder
    notificationMethod: String,            // "email" | "in-platform" | "both"
    status: String,                        // "pending" | "sent" | "dismissed" | "snoozed"
    createdAt: Date,
    sentAt: Date,                          // When notification was sent
    dismissedAt: Date,
    snoozedUntil: Date,
    metadata: {
      customMessage: String,               // User's custom reminder text
      actionUrl: String,                   // Deep link (e.g., /my-notes/?note=123)
      companyName: String,                 // For context in email
      coachName: String
    }
  }],
  lastReminderCheck: Date                  // For cron optimization
}
```

**New collection: `notifications`**

```javascript
{
  _id: ObjectId,
  memberEmail: String,                     // Lowercase normalized
  notificationType: String,                // "note_reminder" | "shared_note" | "comment" (future)
  noteId: ObjectId,
  reminderId: ObjectId,
  title: String,                           // "Review notes on Company X"
  message: String,                         // "You scheduled a call for today"
  actionUrl: String,                       // Link to note/company
  isRead: Boolean,
  createdAt: Date,
  readAt: Date
}
```

**Indexes:**
```javascript
// notes collection
{ "reminders.scheduledFor": 1, "reminders.status": 1 } // Find due reminders
{ "memberEmail": 1, "reminders.scheduledFor": 1 }      // User's upcoming reminders

// notifications collection
{ "memberEmail": 1, "isRead": 1, "createdAt": -1 }    // User's unread notifications
{ "createdAt": 1 }, { expireAfterSeconds: 2592000 }   // TTL: 30 days
```

#### 2.2 Backend API Endpoints

**New routes in `webhook/local-server.js`:**

```javascript
// Add reminder to note
POST /api/member/notes/:noteId/reminders
{
  "reminderType": "phone_call",
  "scheduledFor": "2025-01-25T14:00:00Z",
  "notificationMethod": "both",
  "customMessage": "Call John about partnership"
}

Response:
{
  "success": true,
  "reminder": { ... },
  "note": { ... }
}

// List all reminders for user
GET /api/member/reminders
Query params:
  - status: "pending" | "sent" | "all"
  - from: Date (filter by scheduledFor)
  - to: Date

Response:
{
  "reminders": [
    {
      "reminderId": "...",
      "noteId": "...",
      "noteTitle": "Meeting notes",
      "reminderType": "phone_call",
      "scheduledFor": "2025-01-25T14:00:00Z",
      "status": "pending",
      "targetType": "company",
      "targetName": "Acme Corp"
    }
  ],
  "total": 5
}

// Update reminder (snooze, dismiss)
PATCH /api/member/reminders/:reminderId
{
  "action": "snooze" | "dismiss" | "reschedule",
  "snoozedUntil": "2025-01-26T14:00:00Z"  // for snooze
}

// Get in-platform notifications
GET /api/member/notifications
Query params:
  - unread: true (only unread)
  - limit: 20

Response:
{
  "notifications": [ ... ],
  "unreadCount": 3
}

// Mark notification as read
PATCH /api/member/notifications/:notificationId
{
  "isRead": true
}
```

#### 2.3 Cron Job for Reminder Processing

**New file: `webhook/cron-reminders.js`**

```javascript
/**
 * Reminder Processing Cron Job
 * Runs every 5 minutes to check for due reminders
 */

const { MongoClient } = require('mongodb');
const { sendEmail } = require('./email-notifications');

const MONGO_URI = process.env.MONGO_URI;
const BATCH_SIZE = 100;

async function processReminders() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db('sigmablox');
    const notesCollection = db.collection('notes');
    const notificationsCollection = db.collection('notifications');

    const now = new Date();

    // Find all notes with pending reminders that are due
    const notesWithDueReminders = await notesCollection.find({
      'reminders.status': 'pending',
      'reminders.scheduledFor': { $lte: now }
    }).limit(BATCH_SIZE).toArray();

    console.log(`[Reminders] Found ${notesWithDueReminders.length} notes with due reminders`);

    for (const note of notesWithDueReminders) {
      for (const reminder of note.reminders) {
        if (reminder.status === 'pending' && new Date(reminder.scheduledFor) <= now) {
          await processReminder(note, reminder, notesCollection, notificationsCollection);
        }
      }
    }

  } catch (error) {
    console.error('[Reminders] Error processing reminders:', error);
  } finally {
    await client.close();
  }
}

async function processReminder(note, reminder, notesCollection, notificationsCollection) {
  const reminderId = reminder._id;
  const memberEmail = note.memberEmail;
  const notificationMethod = reminder.notificationMethod || 'both';

  console.log(`[Reminders] Processing reminder ${reminderId} for ${memberEmail}`);

  // Prepare notification content
  const noteTitle = note.title || 'Untitled Note';
  const targetName = note.targetName || note.targetType || 'Unknown';
  const customMessage = reminder.metadata?.customMessage || '';

  const subject = getReminderSubject(reminder.reminderType, targetName);
  const actionUrl = `https://sigmablox.ai/my-notes/?note=${note._id}`;

  // Send email if requested
  if (notificationMethod === 'email' || notificationMethod === 'both') {
    try {
      await sendReminderEmail(memberEmail, {
        subject,
        noteTitle,
        targetName,
        reminderType: reminder.reminderType,
        customMessage,
        actionUrl
      });
      console.log(`[Reminders] Email sent to ${memberEmail}`);
    } catch (emailError) {
      console.error(`[Reminders] Failed to send email:`, emailError);
    }
  }

  // Create in-platform notification if requested
  if (notificationMethod === 'in-platform' || notificationMethod === 'both') {
    await notificationsCollection.insertOne({
      memberEmail: memberEmail.toLowerCase(),
      notificationType: 'note_reminder',
      noteId: note._id,
      reminderId: reminderId,
      title: subject,
      message: customMessage || getDefaultReminderMessage(reminder.reminderType, targetName),
      actionUrl,
      isRead: false,
      createdAt: new Date()
    });
    console.log(`[Reminders] In-platform notification created`);
  }

  // Update reminder status to 'sent'
  await notesCollection.updateOne(
    {
      _id: note._id,
      'reminders._id': reminderId
    },
    {
      $set: {
        'reminders.$.status': 'sent',
        'reminders.$.sentAt': new Date()
      }
    }
  );

  console.log(`[Reminders] Reminder ${reminderId} marked as sent`);
}

function getReminderSubject(reminderType, targetName) {
  const subjects = {
    note_review: `📝 Review your notes on ${targetName}`,
    phone_call: `📞 Scheduled call reminder: ${targetName}`,
    research: `🔍 Research reminder for ${targetName}`,
    follow_up: `✉️ Follow up with ${targetName}`,
    custom: `🔔 Reminder: ${targetName}`
  };
  return subjects[reminderType] || subjects.custom;
}

function getDefaultReminderMessage(reminderType, targetName) {
  const messages = {
    note_review: `Time to review your notes about ${targetName}. Click to open.`,
    phone_call: `You scheduled a call related to ${targetName}. Review your notes before the call.`,
    research: `Continue your research on ${targetName}. Check your notes for next steps.`,
    follow_up: `Don't forget to follow up regarding ${targetName}.`,
    custom: `You have a reminder for ${targetName}.`
  };
  return messages[reminderType] || messages.custom;
}

async function sendReminderEmail(memberEmail, details) {
  const emailTemplate = {
    to: memberEmail,
    subject: details.subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a1a; color: #fff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; }
          .cta-button {
            display: inline-block;
            background: #1a1a1a;
            color: #fff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 20px;
          }
          .meta { color: #666; font-size: 14px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 SigmaBlox Reminder</h1>
          </div>
          <div class="content">
            <h2>${details.subject}</h2>

            <p><strong>Note:</strong> ${details.noteTitle}</p>

            ${details.customMessage ? `<p style="background: #f8f8f8; padding: 16px; border-left: 4px solid #1a1a1a; margin: 20px 0;">${details.customMessage}</p>` : ''}

            <a href="${details.actionUrl}" class="cta-button">Open Note →</a>

            <div class="meta">
              <p><strong>Related to:</strong> ${details.targetName}</p>
              <p><strong>Reminder type:</strong> ${details.reminderType.replace('_', ' ')}</p>
            </div>
          </div>
          <div class="footer">
            <p>SigmaBlox - Defense Tech Combine Platform</p>
            <p><a href="https://sigmablox.ai/my-notes/">Manage your reminders</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return sendEmail(emailTemplate);
}

// Run every 5 minutes
if (require.main === module) {
  console.log('[Reminders] Starting reminder processor...');
  processReminders().then(() => {
    console.log('[Reminders] Processing complete');
    process.exit(0);
  }).catch(error => {
    console.error('[Reminders] Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { processReminders };
```

**Deploy as Cloud Scheduler:**
```bash
# Run every 5 minutes
gcloud scheduler jobs create http reminder-processor \
  --schedule="*/5 * * * *" \
  --uri="https://webhook-service-uk2xdq4wjq-uc.a.run.app/cron/process-reminders" \
  --http-method=POST \
  --headers="X-Cron-Secret=YOUR_SECRET_HERE"
```

#### 2.4 Frontend: Reminder UI in Notes

**Add to `notes-page.js` - Reminder Section in Editor:**

```javascript
function renderReminderSection(reminders) {
  const reminderSection = document.getElementById('note-reminders-section');

  if (!reminders || reminders.length === 0) {
    reminderSection.innerHTML = `
      <div class="reminder-empty">
        <p>No reminders set</p>
        <button class="reminder-add-btn" onclick="NotesApp.addReminder()">
          + Add Reminder
        </button>
      </div>
    `;
    return;
  }

  // Filter only pending/snoozed reminders
  const activeReminders = reminders.filter(r =>
    r.status === 'pending' || r.status === 'snoozed'
  );

  reminderSection.innerHTML = `
    <div class="reminder-list">
      ${activeReminders.map(reminder => `
        <div class="reminder-item ${reminder.status}">
          <div class="reminder-icon">${getReminderIcon(reminder.reminderType)}</div>
          <div class="reminder-info">
            <div class="reminder-type">${getReminderLabel(reminder.reminderType)}</div>
            <div class="reminder-time">${formatReminderTime(reminder.scheduledFor)}</div>
            ${reminder.metadata?.customMessage ? `<div class="reminder-message">"${reminder.metadata.customMessage}"</div>` : ''}
          </div>
          <div class="reminder-actions">
            <button onclick="NotesApp.editReminder('${reminder._id}')" title="Edit">✏️</button>
            <button onclick="NotesApp.deleteReminder('${reminder._id}')" title="Delete">🗑️</button>
          </div>
        </div>
      `).join('')}

      <button class="reminder-add-btn small" onclick="NotesApp.addReminder()">
        + Add Another Reminder
      </button>
    </div>
  `;
}

function addReminder() {
  const modal = document.createElement('div');
  modal.className = 'reminder-modal';
  modal.innerHTML = `
    <div class="reminder-modal-content">
      <h3>Add Reminder</h3>

      <div class="form-group">
        <label>Reminder Type</label>
        <select id="reminder-type">
          <option value="note_review">Review Note</option>
          <option value="phone_call">Phone Call</option>
          <option value="research">Research/Investigation</option>
          <option value="follow_up">Follow Up</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div class="form-group">
        <label>When</label>
        <input type="datetime-local" id="reminder-datetime" />

        <div class="reminder-quick-options">
          <button onclick="NotesApp.setReminderQuick('1hour')">In 1 hour</button>
          <button onclick="NotesApp.setReminderQuick('tomorrow')">Tomorrow 9 AM</button>
          <button onclick="NotesApp.setReminderQuick('nextweek')">Next Week</button>
        </div>
      </div>

      <div class="form-group">
        <label>Custom Message (optional)</label>
        <input type="text" id="reminder-message" placeholder="E.g., 'Call before 3pm'" />
      </div>

      <div class="form-group">
        <label>Notify Me Via</label>
        <select id="reminder-method">
          <option value="both">Email + In-Platform</option>
          <option value="email">Email Only</option>
          <option value="in-platform">In-Platform Only</option>
        </select>
      </div>

      <div class="modal-actions">
        <button class="btn-secondary" onclick="NotesApp.closeReminderModal()">Cancel</button>
        <button class="btn-primary" onclick="NotesApp.saveReminder()">Add Reminder</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Set default time to tomorrow 9am
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  document.getElementById('reminder-datetime').value = formatDatetimeLocal(tomorrow);
}

async function saveReminder() {
  const reminderType = document.getElementById('reminder-type').value;
  const datetime = document.getElementById('reminder-datetime').value;
  const customMessage = document.getElementById('reminder-message').value;
  const method = document.getElementById('reminder-method').value;

  if (!datetime) {
    alert('Please select a date and time');
    return;
  }

  const scheduledFor = new Date(datetime).toISOString();

  try {
    const response = await fetch(`${API_BASE}/api/member/notes/${state.currentNote._id}/reminders`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-member-email': state.memberEmail
      },
      body: JSON.stringify({
        reminderType,
        scheduledFor,
        notificationMethod: method,
        customMessage
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to add reminder');
    }

    // Update current note with new reminder
    state.currentNote = data.note;
    renderReminderSection(data.note.reminders);

    closeReminderModal();
    showEditorMessage('Reminder added!', 'success');

  } catch (error) {
    console.error('Error adding reminder:', error);
    alert('Failed to add reminder: ' + error.message);
  }
}
```

**Add to `notes-page.hbs` template:**

```handlebars
<!-- Add after tags section -->
<div class="note-section">
  <h3 class="note-section-title">⏰ Reminders</h3>
  <div id="note-reminders-section"></div>
</div>
```

**CSS for reminders (`notes-page.css`):**

```css
.reminder-empty {
  text-align: center;
  padding: 20px;
  color: #666;
}

.reminder-add-btn {
  background: #1a1a1a;
  color: #fff;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.reminder-add-btn.small {
  margin-top: 12px;
  width: 100%;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f8f8;
  border-left: 4px solid #1a1a1a;
  border-radius: 6px;
}

.reminder-item.snoozed {
  opacity: 0.6;
  border-left-color: #999;
}

.reminder-icon {
  font-size: 24px;
}

.reminder-info {
  flex: 1;
}

.reminder-type {
  font-weight: 600;
  font-size: 14px;
}

.reminder-time {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.reminder-message {
  font-size: 13px;
  font-style: italic;
  color: #666;
  margin-top: 4px;
}

.reminder-actions {
  display: flex;
  gap: 8px;
}

.reminder-actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
}

.reminder-actions button:hover {
  background: #e0e0e0;
}

.reminder-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.reminder-modal-content {
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.reminder-modal-content h3 {
  margin: 0 0 20px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}

.reminder-quick-options {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.reminder-quick-options button {
  flex: 1;
  padding: 8px;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.reminder-quick-options button:hover {
  background: #e0e0e0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  padding: 10px 20px;
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
```

#### 2.5 Notification Bell UI

**Add to main navigation** (in `default.hbs` or sticky nav):

```handlebars
<div class="notification-bell" id="notification-bell">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
  <span class="notification-badge" id="notification-badge" style="display:none;">0</span>
</div>

<div class="notification-dropdown" id="notification-dropdown" style="display:none;">
  <div class="notification-header">
    <h3>Notifications</h3>
    <button onclick="NotificationManager.markAllRead()">Mark all read</button>
  </div>
  <div class="notification-list" id="notification-list">
    <!-- Populated by JavaScript -->
  </div>
</div>
```

**New file: `notification-manager.js`**

```javascript
(function() {
  'use strict';

  const API_BASE = window.SigmaBloxConfig ? window.SigmaBloxConfig.apiBase : 'https://webhook-service-uk2xdq4wjq-uc.a.run.app';

  const state = {
    notifications: [],
    unreadCount: 0,
    isOpen: false,
    pollInterval: null
  };

  async function init() {
    const memberEmail = await getMemberEmail();
    if (!memberEmail) return;

    setupEventListeners();
    await loadNotifications();

    // Poll for new notifications every 60 seconds
    state.pollInterval = setInterval(loadNotifications, 60000);
  }

  async function loadNotifications() {
    try {
      const response = await fetch(`${API_BASE}/api/member/notifications?unread=true`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        state.notifications = data.notifications || [];
        state.unreadCount = data.unreadCount || 0;
        updateBadge();
      }
    } catch (error) {
      console.error('[Notifications] Error loading:', error);
    }
  }

  function updateBadge() {
    const badge = document.getElementById('notification-badge');
    if (state.unreadCount > 0) {
      badge.textContent = state.unreadCount > 9 ? '9+' : state.unreadCount;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  function renderNotifications() {
    const list = document.getElementById('notification-list');

    if (state.notifications.length === 0) {
      list.innerHTML = `
        <div class="notification-empty">
          No new notifications
        </div>
      `;
      return;
    }

    list.innerHTML = state.notifications.map(notif => `
      <div class="notification-item ${notif.isRead ? 'read' : 'unread'}"
           onclick="NotificationManager.openNotification('${notif._id}', '${notif.actionUrl}')">
        <div class="notification-icon">🔔</div>
        <div class="notification-content">
          <div class="notification-title">${notif.title}</div>
          <div class="notification-message">${notif.message}</div>
          <div class="notification-time">${formatDate(notif.createdAt)}</div>
        </div>
      </div>
    `).join('');
  }

  async function openNotification(notificationId, actionUrl) {
    // Mark as read
    await fetch(`${API_BASE}/api/member/notifications/${notificationId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: true })
    });

    // Navigate to action URL
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  }

  async function markAllRead() {
    try {
      await fetch(`${API_BASE}/api/member/notifications/mark-all-read`, {
        method: 'POST',
        credentials: 'include'
      });

      await loadNotifications();
      renderNotifications();
    } catch (error) {
      console.error('[Notifications] Error marking all read:', error);
    }
  }

  function setupEventListeners() {
    const bell = document.getElementById('notification-bell');
    const dropdown = document.getElementById('notification-dropdown');

    if (bell) {
      bell.addEventListener('click', () => {
        state.isOpen = !state.isOpen;
        dropdown.style.display = state.isOpen ? 'block' : 'none';
        if (state.isOpen) {
          renderNotifications();
        }
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (state.isOpen && !bell.contains(e.target) && !dropdown.contains(e.target)) {
        state.isOpen = false;
        dropdown.style.display = 'none';
      }
    });
  }

  // Export
  window.NotificationManager = {
    openNotification,
    markAllRead,
    refresh: loadNotifications
  };

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 600));
  } else {
    setTimeout(init, 600);
  }

})();
```

---

## Part 3: Implementation Plan

### Phase 1: Clippy UX Improvements (Week 1)
**Effort:** 3-5 days

**Tasks:**
1. ✅ Add auto-hide on scroll functionality
2. ✅ Implement keyboard shortcut (Cmd/Ctrl + K)
3. ✅ Add minimize/collapse state with localStorage persistence
4. ✅ Smart positioning to avoid text selection overlaps
5. ✅ Add draggable repositioning (optional enhancement)

**Testing:**
- Mobile responsiveness
- Keyboard navigation
- Position persistence across sessions
- Performance impact (no jank)

### Phase 2: Backend Reminder System (Week 2)
**Effort:** 5-7 days

**Tasks:**
1. ✅ Update MongoDB schema (add reminders to notes, create notifications collection)
2. ✅ Create indexes for efficient querying
3. ✅ Build API endpoints for reminder CRUD
4. ✅ Build API endpoints for notifications
5. ✅ Create cron job (`cron-reminders.js`)
6. ✅ Deploy cron job to Google Cloud Scheduler
7. ✅ Add email templates for reminders
8. ✅ Test email delivery

**Testing:**
- Unit tests for reminder logic
- Integration tests for cron job
- Email template rendering
- Load testing (100 concurrent reminders)

### Phase 3: Frontend Reminder UI (Week 3)
**Effort:** 5-7 days

**Tasks:**
1. ✅ Add reminder section to note editor
2. ✅ Build reminder modal with datetime picker
3. ✅ Add quick reminder options (1 hour, tomorrow, next week)
4. ✅ Implement reminder editing/deletion
5. ✅ Create notification bell UI in navigation
6. ✅ Build notification dropdown
7. ✅ Add notification polling (60s interval)
8. ✅ Integrate with note opening (deep links)

**Testing:**
- Cross-browser compatibility
- Mobile UI/UX
- Notification badge updates
- Deep link navigation
- Timezone handling

### Phase 4: Polish & Launch (Week 4)
**Effort:** 3-5 days

**Tasks:**
1. ✅ End-to-end testing
2. ✅ Performance optimization
3. ✅ User documentation
4. ✅ Admin monitoring dashboard (optional)
5. ✅ Beta rollout to 10-20 users
6. ✅ Gather feedback
7. ✅ Fix bugs
8. ✅ Full launch

---

## Part 4: Success Metrics

### Engagement Metrics
- **Return visit rate:** Target 3x increase within 30 days
- **Note edit frequency:** Users edit/review notes 2x more often
- **Reminder adoption:** 60%+ of active users set at least one reminder
- **Email open rate:** 40%+ for reminder emails
- **Action completion rate:** 70%+ click through from reminder to note

### Technical Metrics
- **Cron job reliability:** 99.9% successful executions
- **Email delivery rate:** 98%+ successful sends
- **API response time:** <200ms for reminder endpoints
- **Notification latency:** Delivered within 5 minutes of scheduled time

### User Feedback (Qualitative)
- "I never forget to follow up now"
- "Love the phone call reminders before meetings"
- "The email reminders bring me back to the platform"

---

## Part 5: Future Enhancements

### v2.0 Features (Post-Launch)
1. **Recurring Reminders** - Weekly check-ins, monthly reviews
2. **Smart Suggestions** - AI suggests when to follow up based on note content
3. **Team Reminders** - Remind collaborators about shared notes
4. **Integration with Calendar** - Add reminders to Google Calendar
5. **Snooze Functionality** - Postpone reminders easily
6. **Reminder Templates** - Pre-configured reminder workflows
7. **Analytics Dashboard** - Show users their follow-up habits

### v3.0 Features (Long-term)
1. **AI-Powered Summaries** - "Here's what you wrote last week"
2. **Voice Reminders** - Integrate with voice assistants
3. **SMS Notifications** - For critical reminders
4. **Slack Integration** - Send reminders via Slack DM
5. **Priority Scoring** - ML model prioritizes which notes need attention

---

## Conclusion

These improvements transform notes from a passive feature into an active engagement driver:

**UX Improvements** make Clippy less annoying while maintaining quick access
**Reminder System** brings users back to the platform regularly
**Email Notifications** re-engage users who haven't logged in
**In-Platform Notifications** reward active users with timely information

**Expected Outcome:**
Users develop a habit loop: Create note → Set reminder → Get notified → Return to platform → Take action → Repeat

This drives platform stickiness and positions SigmaBlox as a productivity tool, not just a directory.
