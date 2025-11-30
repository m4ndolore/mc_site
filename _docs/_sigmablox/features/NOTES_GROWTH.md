 What We've Built So Far

  Current Architecture

  Backend (Node.js + MongoDB)
  - Database: MongoDB collection notes storing user notes
  with full CRUD operations
  - API Endpoints: RESTful API at /api/member/notes
    - GET /api/member/notes - Fetch notes with filtering
  (by type, tags, pinned status)
    - POST /api/member/notes - Create, update, or delete
  notes
  - Data Model:
  {
    _id: ObjectId,
    memberEmail: string,
    targetType: 'company' | 'coach',
    targetId: string,
    content: string,           // Plain text/markdown
    title: string,
    tags: [string],
    pinned: boolean,
    createdAt: Date,
    updatedAt: Date,
    sharedWith: []            // Future: collaboration
  }
  - Authentication: Integrated with Ghost CMS
  authentication via x-member-email headers
  - Validation: Input sanitization, character limits (10k
  chars), tag limits

  Frontend (Vanilla JavaScript)

  1. Modal Notes (notes-shared.js)
  - Embedded in company/coach modals
  - Single-note CRUD interface
  - Markdown support
  - Tag management
  - Pin functionality

  2. Notes Page (notes-page.js + notes-page.css)
  - Obsidian-style split layout:
    - Left sidebar: Searchable index of all notes
    - Right panel: Multi-note viewer (multiple notes open
  simultaneously)
  - Features:
    - Real-time search across title/content/tags
    - Filter by type (company/coach)
    - Sort by updated, created, or pinned
    - Markdown rendering
    - Tag-based organization
    - Visual pinned indicators

  Files Created:
  webhook/local-server.js          # API routes (lines
  1221-1404)
  webhook/lib/notes-utils.js       # Validation &
  formatting utilities
  ghost-data/themes/ease/
    ├── page-my-notes.hbs          # Ghost template
    ├── assets/js/
    │   ├── notes-page.js          # Main notes app
    │   └── notes-shared.js        # Modal notes component
    └── assets/css/
        └── notes-page.css         # Obsidian-style UI

  ---
  Roadmap to Real-Time Collaboration

  Phase 1: Foundation Upgrades (1-2 weeks)

  1.1 Upgrade to Tiptap Editor
  - Replace simple <textarea> with Tiptap WYSIWYG editor
  - Benefits: Rich text, better UX, extensibility
  - Implementation:
  npm install @tiptap/core @tiptap/starter-kit
  @tiptap/extension-collaboration
  - Update notes-page.js to initialize Tiptap instead of
  plain textarea
  - Maintain backward compatibility: Store as
  markdown/HTML

  1.2 Database Schema Changes
  // New fields in MongoDB notes collection:
  {
    // Existing fields...
    content: string,              // Keep for fallback
    yjsState: Buffer,             // Yjs document binary
  state
    version: number,              // Document version
  counter
    collaborators: [{
      email: string,
      lastSeen: Date,
      cursor: { anchor, head }
    }],
    sharedWith: [{
      email: string,
      permission: 'view' | 'edit'
    }]
  }

  1.3 User Presence System
  - Track who's currently viewing/editing each note
  - Store in MongoDB with TTL index (auto-expire after 5
  min)
  - Display colored cursors/avatars in editor

  ---
  Phase 2: Real-Time Sync Engine (2-3 weeks)

  2.1 Choose Your Backend

  Option A: Hocuspocus (Recommended for Tiptap)
  npm install @hocuspocus/server
  @hocuspocus/extension-mongodb

  Pros:
  - Official Tiptap collaboration server
  - Built-in MongoDB persistence
  - Authentication hooks
  - Excellent documentation

  Setup:
  // webhook/collaboration-server.js
  import { Server } from '@hocuspocus/server'
  import { MongoDBAdapter } from
  '@hocuspocus/extension-mongodb'

  const server = Server.configure({
    port: 2001,
    extensions: [
      new MongoDBAdapter({
        uri: process.env.MONGO_URI,
        collectionName: 'yjs_documents'
      })
    ],
    async onAuthenticate(data) {
      // Verify member email from Ghost
      const member = await verifyMemberToken(data.token)
      if (!member) throw new Error('Unauthorized')
      return { user: { email: member.email } }
    },
    async onLoadDocument(data) {
      // Load note permissions from MongoDB
      const note = await db.collection('notes').findOne({
  _id: data.documentName })
      if
  (!note.sharedWith.includes(data.context.user.email)) {
        throw new Error('No permission')
      }
    }
  })

  server.listen()

  Option B: PartyKit (Serverless-Friendly)
  - Good for Cloud Run deployment
  - Auto-scaling
  - Built-in presence
  - Higher cost at scale

  Option C: y-websocket (DIY, cheapest)
  - Minimal server, you handle everything
  - More work but full control

  Recommendation: Start with Hocuspocus - best Tiptap
  integration, mature ecosystem.

  2.2 Frontend Integration
  // Update notes-page.js
  import { Editor } from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  import Collaboration from
  '@tiptap/extension-collaboration'
  import CollaborationCursor from
  '@tiptap/extension-collaboration-cursor'
  import * as Y from 'yjs'
  import { HocuspocusProvider } from
  '@hocuspocus/provider'

  async function initEditor(noteId) {
    const ydoc = new Y.Doc()

    const provider = new HocuspocusProvider({
      url: 'ws://localhost:2001',
      name: noteId,
      document: ydoc,
      token: await getAuthToken() // Ghost member token
    })

    const editor = new Editor({
      element: document.querySelector('#editor'),
      extensions: [
        StarterKit.configure({
          history: false // Yjs handles undo/redo
        }),
        Collaboration.configure({
          document: ydoc
        }),
        CollaborationCursor.configure({
          provider,
          user: {
            name: state.memberEmail,
            color: getRandomColor() // User-specific color
          }
        })
      ]
    })

    return { editor, provider }
  }

  2.3 WebSocket Infrastructure
  - Run Hocuspocus on separate port (2001)
  - Update Cloud Run to expose both ports
  - Configure HTTPS/WSS for production
  - Add connection retry logic
  - Handle offline mode (queue changes locally)

  ---
  Phase 3: Collaboration Features (1-2 weeks)

  3.1 Sharing & Permissions
  // Add to notes API
  POST /api/member/notes/:noteId/share
  {
    "email": "teammate@example.com",
    "permission": "edit" | "view"
  }

  // Update UI
  class NoteSharingModal {
    async shareNote(noteId, email, permission) {
      // Add to sharedWith array
      // Send email notification
      // Grant WebSocket access
    }
  }

  3.2 Presence UI
  /* Add to notes-page.css */
  .editor-presence {
    display: flex;
    gap: 8px;
    padding: 8px;
    background: #f8f8f8;
    border-bottom: 1px solid #e0e0e0;
  }

  .presence-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--user-color);
    position: relative;
  }

  .presence-avatar.active::after {
    content: '';
    width: 10px;
    height: 10px;
    background: #10b981;
    border-radius: 50%;
    position: absolute;
    bottom: 0;
    right: 0;
  }

  3.3 Cursor Tracking
  - Tiptap's CollaborationCursor extension handles this
  - Shows colored cursors for each user
  - Displays user name/email on hover
  - Auto-syncs selection ranges

  3.4 Conflict Resolution
  - Yjs CRDT automatically handles conflicts
  - No manual merge logic needed
  - Operation-based transformation
  - Guaranteed eventual consistency

  ---
  Phase 4: Production Hardening (1 week)

  4.1 Performance Optimization
  - Implement note-level WebSocket rooms (don't broadcast
  to all users)
  - Add debouncing for save operations
  - Lazy-load collaboration features (only when note is
  shared)
  - Compress Yjs updates over WebSocket

  4.2 Offline Support
  import { IndexeddbPersistence } from 'y-indexeddb'

  const indexeddbProvider = new
  IndexeddbPersistence(noteId, ydoc)

  provider.on('status', event => {
    if (event.status === 'disconnected') {
      showOfflineBanner()
      // Continue editing - changes queued locally
    }
  })

  provider.on('sync', isSynced => {
    if (isSynced) {
      hideOfflineBanner()
      // Local changes now synced to server
    }
  })

  4.3 Security
  - Validate permissions on every WebSocket message
  - Rate limit document updates
  - Encrypt sensitive notes at rest
  - Audit log for shared note access
  - Implement note-level access tokens

  4.4 Monitoring
  - Track active collaboration sessions
  - Monitor WebSocket connection health
  - Alert on sync failures
  - Analytics on collaboration usage

  ---
  Migration Strategy

  Backward Compatibility

  1. Phase 1: Keep existing REST API, add Tiptap editor
  2. Phase 2: Introduce WebSocket for new notes only
  3. Phase 3: Migrate existing notes on first edit
  4. Phase 4: Deprecate old editor (6 months notice)

  Data Migration

  // Batch job: Convert existing notes to Yjs
  async function migrateNote(noteId) {
    const note = await db.collection('notes').findOne({
  _id: noteId })

    // Create Yjs doc from existing content
    const ydoc = new Y.Doc()
    const ytext = ydoc.getText('content')
    ytext.insert(0, note.content)

    // Save binary state
    const state = Y.encodeStateAsUpdate(ydoc)
    await db.collection('notes').updateOne(
      { _id: noteId },
      { $set: { yjsState: state, version: 1 } }
    )
  }

  ---
  Cost Estimate

  Time Investment

  - Phase 1: 1-2 weeks (1 developer)
  - Phase 2: 2-3 weeks (1-2 developers)
  - Phase 3: 1-2 weeks (1 developer)
  - Phase 4: 1 week (1 developer)
  - Total: 5-8 weeks

  Infrastructure Costs (Monthly)

  - Self-hosted (Hocuspocus): $0 (runs on existing Cloud
  Run)
  - Liveblocks: $99-$499/mo (managed, easier)
  - PartyKit: ~$50-$200/mo (usage-based)
  - MongoDB increase: +$10-20/mo (more documents)

  ---
  Recommended Approach

  Start Small, Iterate Fast:

  1. Week 1-2: Upgrade to Tiptap (no collaboration yet)
    - Better UX immediately
    - Foundation for collaboration
    - Low risk
  2. Week 3-5: Add Hocuspocus + basic sync
    - Single-user real-time sync first
    - Test Yjs persistence
    - Iron out auth flow
  3. Week 6-7: Enable multi-user collaboration
    - Add sharing UI
    - Enable cursor tracking
    - Beta test with small group
  4. Week 8: Production deployment
    - Monitor metrics
    - Gather feedback
    - Plan v2 features

  This gives you Google Docs-like collaboration while
  building on your existing, working foundation. The
  Obsidian-style interface you already have is perfect for
   this - just swap the editor and add real-time sync! 🚀
