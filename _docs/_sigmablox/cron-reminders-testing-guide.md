# Cron Reminders Testing Guide

## Overview

The `webhook/cron-reminders.js` script processes pending note reminders and sends notifications via email and/or in-platform notifications.

## File Location

```
webhook/cron-reminders.js
```

## Architecture

### Components

1. **processReminders()** - Main function that:
   - Connects to MongoDB
   - Queries for notes with pending reminders that are due
   - Processes each reminder
   - Tracks statistics
   - Handles errors gracefully

2. **processReminder()** - Processes individual reminders:
   - Sends email notifications (if requested)
   - Creates in-platform notifications (if requested)
   - Updates reminder status to 'sent'
   - Handles partial failures (email fails but notification succeeds, etc.)

3. **Helper Functions**:
   - `getReminderSubject()` - Generates subject lines based on reminder type
   - `getDefaultReminderMessage()` - Provides default messages
   - `sendReminderEmail()` - Sends email using existing email-notifications module
   - `buildReminderEmailHtml()` - Builds professional HTML email template

## Database Schema

### Notes Collection

```javascript
{
  _id: ObjectId,
  memberEmail: String,
  title: String,
  targetName: String,
  targetType: String, // "company" | "coach"
  reminders: [
    {
      _id: ObjectId,
      reminderType: String, // "note_review" | "phone_call" | "research" | "follow_up" | "custom"
      scheduledFor: Date,
      notificationMethod: String, // "email" | "in-platform" | "both"
      status: String, // "pending" | "sent" | "dismissed" | "snoozed"
      sentAt: Date,
      metadata: {
        customMessage: String
      }
    }
  ]
}
```

### Notifications Collection

```javascript
{
  _id: ObjectId,
  memberEmail: String,
  notificationType: "note_reminder",
  noteId: ObjectId,
  reminderId: ObjectId,
  title: String,
  message: String,
  actionUrl: String,
  isRead: Boolean,
  createdAt: Date
}
```

## Testing Locally

### Prerequisites

1. MongoDB access configured in `.env.dev.yaml`
2. SMTP configured (Mailpit for local dev or production SMTP)
3. Node.js and dependencies installed

### Manual Test Run

```bash
cd webhook
node cron-reminders.js
```

### Expected Output

```
============================================================
SigmaBlox Reminder Processor
============================================================
Started at: 2025-01-23T10:30:00.000Z
Environment: development

[Reminders] 🔔 Starting reminder processor...
[Reminders] Database: sigmablox_users_dev
[Reminders] ✅ Connected to MongoDB
[Reminders] Current time: 2025-01-23T10:30:00.000Z
[Reminders] 📝 Found 3 notes with due reminders
[Reminders] Processing note: 507f1f77bcf86cd799439011 (Meeting notes)
[Reminders] 📬 Processing reminder 507f191e810c19729de860ea for user@example.com
[Reminders] ✅ Email sent to user@example.com
[Reminders] ✅ In-platform notification created for user@example.com
[Reminders] ✅ Reminder 507f191e810c19729de860ea marked as sent
[Reminders] ✅ Processing complete
[Reminders] Statistics: {
  notesChecked: 3,
  remindersProcessed: 3,
  emailsSent: 2,
  notificationsCreated: 3,
  errors: 0,
  durationMs: 1234,
  durationSec: '1.23'
}
[Reminders] 🔌 MongoDB connection closed

============================================================
✅ SUCCESS
============================================================
Final Statistics:
  Notes checked: 3
  Reminders processed: 3
  Emails sent: 2
  Notifications created: 3
  Errors: 0
```

## Creating Test Data

### Insert a Test Note with Reminder

```javascript
// Connect to MongoDB
const { MongoClient, ObjectId } = require('mongodb');
const config = require('./config-manager');

async function createTestReminder() {
  const client = new MongoClient(config.getMongoUri());

  try {
    await client.connect();
    const db = client.db(config.getDbName());
    const notesCollection = db.collection('notes');

    // Create a note with a reminder due in 1 minute
    const oneMinuteLater = new Date(Date.now() + 60000);

    const testNote = {
      memberEmail: 'your-test-email@example.com',
      title: 'Test Note for Reminders',
      content: 'This is a test note to verify reminder functionality',
      targetType: 'company',
      targetName: 'Test Company',
      targetId: 'test-company-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      reminders: [
        {
          _id: new ObjectId(),
          reminderType: 'phone_call',
          scheduledFor: oneMinuteLater,
          notificationMethod: 'both',
          status: 'pending',
          createdAt: new Date(),
          metadata: {
            customMessage: 'Call John about partnership opportunity'
          }
        }
      ]
    };

    const result = await notesCollection.insertOne(testNote);
    console.log('✅ Test note created:', result.insertedId);
    console.log('Reminder scheduled for:', oneMinuteLater.toISOString());
    console.log('Wait 1 minute, then run: node cron-reminders.js');

  } finally {
    await client.close();
  }
}

createTestReminder();
```

### Quick Test Script

Save as `webhook/test-reminder-data.js`:

```javascript
#!/usr/bin/env node

const { MongoClient, ObjectId } = require('mongodb');
const config = require('./config-manager');

async function createTestReminder() {
  const client = new MongoClient(config.getMongoUri());

  try {
    await client.connect();
    const db = client.db(config.getDbName());
    const notesCollection = db.collection('notes');

    // Create reminder due NOW (for immediate testing)
    const now = new Date();

    const testNote = {
      memberEmail: process.env.TEST_EMAIL || 'your-email@example.com',
      title: 'Test Reminder Note',
      content: 'Testing reminder system',
      targetType: 'company',
      targetName: 'Acme Defense Corp',
      targetId: 'test-123',
      createdAt: now,
      updatedAt: now,
      reminders: [
        {
          _id: new ObjectId(),
          reminderType: 'phone_call',
          scheduledFor: now, // Due immediately
          notificationMethod: 'both',
          status: 'pending',
          createdAt: now,
          metadata: {
            customMessage: 'This is a test reminder - please verify receipt'
          }
        }
      ]
    };

    const result = await notesCollection.insertOne(testNote);
    console.log('✅ Test note created:', result.insertedId);
    console.log('✅ Reminder scheduled for: NOW');
    console.log('');
    console.log('Next step: Run the cron job');
    console.log('   node cron-reminders.js');

  } finally {
    await client.close();
  }
}

if (require.main === module) {
  createTestReminder()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

module.exports = { createTestReminder };
```

Run it:

```bash
cd webhook
TEST_EMAIL=your-email@example.com node test-reminder-data.js
node cron-reminders.js
```

## Verifying Results

### 1. Check Email Delivery

**Local Development (Mailpit):**
- Open http://localhost:8025
- Look for email to your test address
- Verify subject line and content

**Production:**
- Check your actual email inbox
- Verify email formatting and links work

### 2. Check Database

```javascript
// Check that reminder status was updated
db.notes.findOne(
  { "reminders.status": "sent" },
  { "reminders": 1, "title": 1 }
)

// Check that notification was created
db.notifications.find({
  "notificationType": "note_reminder",
  "isRead": false
}).pretty()
```

### 3. Check Logs

The script provides detailed logging:

```
[Reminders] 📬 Processing reminder X for user@example.com
[Reminders] ✅ Email sent to user@example.com
[Reminders] ✅ In-platform notification created
[Reminders] ✅ Reminder X marked as sent
```

## Production Deployment

### Option 1: Cloud Scheduler + HTTP Endpoint

1. Add cron endpoint to `local-server.js`:

```javascript
// Add this to webhook/local-server.js
app.post('/cron/process-reminders', async (req, res) => {
  // Verify cron secret
  const cronSecret = req.headers['x-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { processReminders } = require('./cron-reminders');
    const stats = await processReminders();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Cron error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

2. Deploy Cloud Scheduler job:

```bash
# Create the job (runs every 5 minutes)
gcloud scheduler jobs create http reminder-processor \
  --schedule="*/5 * * * *" \
  --uri="https://webhook-service-uk2xdq4wjq-uc.a.run.app/cron/process-reminders" \
  --http-method=POST \
  --headers="X-Cron-Secret=${CRON_SECRET}" \
  --location="us-central1" \
  --time-zone="America/Los_Angeles"

# Test the job manually
gcloud scheduler jobs run reminder-processor --location="us-central1"

# View logs
gcloud scheduler jobs describe reminder-processor --location="us-central1"
```

### Option 2: Cloud Run Jobs

```bash
# Deploy as a Cloud Run Job
gcloud run jobs create reminder-processor \
  --image gcr.io/${PROJECT_ID}/reminder-processor \
  --region us-central1 \
  --set-env-vars NODE_ENV=production \
  --tasks 1 \
  --max-retries 2 \
  --task-timeout 5m

# Schedule it
gcloud scheduler jobs create http trigger-reminder-job \
  --schedule="*/5 * * * *" \
  --uri="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT_ID}/jobs/reminder-processor:run" \
  --http-method=POST \
  --oauth-service-account-email=${SERVICE_ACCOUNT_EMAIL}
```

## Monitoring

### Key Metrics to Track

1. **Execution frequency**: Should run every 5 minutes
2. **Success rate**: >99.9% successful runs
3. **Processing time**: Should complete in <30 seconds
4. **Email delivery rate**: >98% successful sends
5. **Error rate**: <0.1% errors

### Logging

View logs in Google Cloud Console:

```bash
# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=webhook-service" \
  --limit 50 \
  --format json | jq -r '.[] | select(.textPayload | contains("[Reminders]"))'

# Cloud Scheduler logs
gcloud logging read "resource.type=cloud_scheduler_job" --limit 50
```

### Alerts

Set up alerts in Cloud Monitoring:

1. **High error rate**: Alert if error rate > 5%
2. **Failed executions**: Alert if job fails 3 times in a row
3. **Long execution time**: Alert if execution > 2 minutes
4. **Email failures**: Alert if email delivery rate < 95%

## Error Handling

The script has comprehensive error handling:

1. **Email failures**: Logged but don't prevent notification creation
2. **Notification failures**: Logged but don't prevent status update
3. **Status update failures**: Thrown as critical errors (reminder might be sent twice)
4. **MongoDB connection failures**: Fatal error, script exits with code 1

### Recovery

If the script fails partway through:

1. Reminders with status='sent' won't be processed again
2. Reminders with status='pending' will be retried on next run
3. Check logs for the specific error
4. Fix the issue and let the next scheduled run pick up remaining reminders

## Reminder Types and Templates

### Available Reminder Types

1. **note_review**: Generic note review
   - Subject: "Review your notes on [Company]"
   - Use case: Periodic note review

2. **phone_call**: Scheduled call reminder
   - Subject: "Scheduled call reminder: [Company]"
   - Use case: Pre-call preparation

3. **research**: Research continuation
   - Subject: "Research reminder for [Company]"
   - Use case: Ongoing research tasks

4. **follow_up**: Follow-up reminder
   - Subject: "Follow up with [Company]"
   - Use case: Post-meeting follow-ups

5. **custom**: User-defined
   - Subject: "Reminder: [Company]"
   - Use case: Any custom reminder

### Email Template Features

- Professional, branded design
- Mobile-responsive
- Clear call-to-action button
- Custom message support
- Reminder metadata display
- Links to note and reminder management

## Troubleshooting

### Issue: Reminders not processing

**Check:**
1. MongoDB connection: `node -e "require('./config-manager').getMongoUri()"`
2. Database contains pending reminders: Query MongoDB
3. System time is correct: `date`
4. Script has permissions: `ls -la cron-reminders.js`

### Issue: Emails not sending

**Check:**
1. SMTP configuration in `.env.dev.yaml` or `.env.prod.yaml`
2. Email credentials are valid
3. Mailpit is running (local dev): http://localhost:8025
4. Check spam folder
5. Review email-notifications.js logs

### Issue: Notifications not appearing

**Check:**
1. Notifications collection exists in MongoDB
2. Frontend is polling `/api/member/notifications`
3. Member email matches exactly (case-sensitive)

### Issue: Reminders sent multiple times

**Cause:** Status update failed but email/notification succeeded

**Fix:**
1. Check MongoDB connection stability
2. Review status update logs
3. Manually set status='sent' for affected reminders:

```javascript
db.notes.updateOne(
  { "reminders._id": ObjectId("REMINDER_ID") },
  { $set: {
    "reminders.$.status": "sent",
    "reminders.$.sentAt": new Date()
  }}
)
```

## Performance Considerations

### Batch Size

Current: 100 notes per run (every 5 minutes = up to 1,200 reminders/hour)

To increase:

```javascript
const BATCH_SIZE = 500; // Process more notes per run
```

### Database Indexes

Required indexes (should exist):

```javascript
// In notes collection
{ "reminders.status": 1, "reminders.scheduledFor": 1 }
{ "memberEmail": 1, "reminders.scheduledFor": 1 }

// In notifications collection
{ "memberEmail": 1, "isRead": 1, "createdAt": -1 }
```

### Scaling

For high volume (>10,000 reminders/day):

1. Reduce cron frequency to every 2 minutes
2. Increase batch size to 500
3. Add parallel processing with worker threads
4. Consider moving to Cloud Run Jobs for better scalability

## Security

### Best Practices

1. **Cron secret**: Always use `X-Cron-Secret` header for HTTP endpoints
2. **Environment variables**: Never commit secrets to git
3. **Email content**: Sanitize custom messages to prevent XSS
4. **Rate limiting**: Consider rate limiting on email sends
5. **Access control**: Restrict cron endpoint to Cloud Scheduler IPs

## Summary

The cron reminders system is production-ready with:

- ✅ Comprehensive error handling
- ✅ Detailed logging for debugging
- ✅ Professional email templates
- ✅ Graceful partial failure handling
- ✅ Proper MongoDB connection management
- ✅ Statistics tracking
- ✅ Command-line executable
- ✅ Module export for testing
- ✅ Zero linting errors

Next steps:
1. Test locally with test data
2. Verify email delivery
3. Deploy to Cloud Scheduler
4. Monitor first few runs
5. Set up alerts for failures
