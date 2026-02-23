COMPREHENSIVE SIGMABLOX CODEBASE ARCHITECTURE SUMMARY

       Based on my thorough exploration of the /Users/paulgarcia/Dev/sigmablox codebase, here is a comprehensive overview of the
       system architecture, key components, and data flows.

       ---
       PROJECT OVERVIEW

       SigmaBlox is a defense technology platform designed for the "Combine" - a digital discovery and networking platform connecting
        national security problem solvers, startups, and coaches. The platform features:

       - Ghost CMS for content/blog management
       - Company Profiles - self-service onboarding and claiming
       - Coach Network for mentorship connections
       - Company Claiming System - where users claim company ownership
       - VIA Dashboard - Admin interface for operations
       - Real-time Data Sync from Airtable
       - User Management with Authentik OAuth2 integration

       ---
       TECH STACK

       Backend:
       - Node.js/Express - Main API server (apps/webhook/local-server.js)
       - PostgreSQL + Prisma ORM - Primary database
       - Authentik - OAuth2/OIDC authentication provider
       - Ghost CMS - Content management
       - Airtable - Legacy data source
       - Hocuspocus - Real-time collaboration server (Y.js)
       - Redis - Rate limiting and caching
       - Google Cloud Functions - Deployment target

       Frontend:
       - Next.js with TypeScript - VIA Dashboard (apps/via-dashboard/)
       - React - UI components
       - Tailwind CSS - Styling
       - Sonner - Toast notifications

       Other Services:
       - Cloudflare Workers - CDN and edge functions
       - SendGrid/Nodemailer - Email notifications
       - OpenAI - Content generation (drafts, assistant)

       ---
       DATABASE MODELS (Prisma Schema)

       Location: /Users/paulgarcia/Dev/sigmablox/apps/webhook/prisma/schema.prisma

       Core Models

       Company

       - id, legacyAirtableId, name, companyName, productName
       - website, linkedInUrl, logoUrl, cfImageId
       - contactName, email, location
       - missionArea, secondaryMissions, warfareDomain, hardwareOrSoftware
       - trlLevel, technicalMaturity, description, problemStatement, videoLink
       - teamSize, fundingStage, founders
       - Government/Compliance: currentCyberCompliance, securityClearanceLevel, atoStatus, etc.
       - Cohort information: cohortId, status, tulsaAttended, podRanking
       - upvoteCount (engagement metric)
       - Relations: claims, sources, posts, feedback, favorites, notes, interests, shareLinks

       CompanyClaim (Company Ownership Claims)

       - id, companyId (FK), claimerEmail, claimerName
       - status: PENDING → VERIFIED → APPROVED (or DENIED)
       - verificationToken, verifiedAt
       - Review fields: reviewedAt, reviewedBy, rejectionReason
       - createdAt, updatedAt

       CompanyProfile (Onboarding Progress)

       - id, email (unique)
       - onboardingStep, onboardingCompleted, completedAt
       - Contact info: firstName, lastName, phone, title
       - Company info: organizationName, companyUrl, teamSize, securityClearance, linkedIn
       - Technical info: primaryMission, warfareDomain, atoStatus
       - Product details: productName, trlLevel
       - Business info: fundingStage, gpcReady
       - Synopsis: synopsisProblem, synopsisSolution
       - profileData (JSON), logoFile
       - memberId (Ghost reference)

       Coach

       - id, legacyAirtableId, name, email, linkedIn, photoUrl
       - goesBy, affiliation, company, combineRole, domain
       - smeArea, problemAreas, expertise (JSON), wishList
       - status, createdAt, lastSyncedAt
       - Relations: favorites, notes, interests

       Cohort

       - id, legacyAirtableId, cohortId (unique, e.g., "25-1")
       - name, status, participantCount
       - Relations: companies

       User Interaction Models

       Favorite:
       - userId, targetType ('company', 'coach', 'cohort')
       - companyId/coachId/cohortId, note, metadata
       - Index: unique per (userId, companyId/coachId/cohortId)

       Note:
       - userId, companyId/coachId, content, contentJson (Y.js state)
       - title, tags, pinned, targetType, targetId
       - Sharing: sharedWith (JSON), isPublic, version
       - Reminders: reminderAt, reminderSent, reminders (NoteReminder relation)
       - Collaboration: collaborators (NoteCollaborator relation), yjsState (Bytes)

       Interest:
       - memberId, memberEmail, targetType ('company' or 'coach')
       - targetId, companyId/coachId, companyName
       - interestType, message, status, statusHistory (JSON)
       - metadata, flags, followUpDate

       NoteReminder:
       - noteId (FK), reminderType (NOTE_REVIEW, PHONE_CALL, RESEARCH, FOLLOW_UP, CUSTOM)
       - scheduledFor, notificationMethod (EMAIL, IN_PLATFORM, BOTH)
       - status (PENDING, SENT, DISMISSED, SNOOZED), sentAt, dismissedAt, snoozedUntil
       - metadata (actionUrl, companyName, coachName)

       Admin/Configuration Models

       AccessRequest:
       - siteId, userEmail, userName, organization, reason, linkedIn, tier
       - Verification: verificationTokenHash, verificationExpiry, autoLoginTokenHash
       - currentRoleId, status (PENDING_VERIFICATION, PENDING, APPROVED, DENIED)
       - resolvedBy, resolvedAt, assignedRoleId

       Site:
       - id, name, slug, ghostUrl, ghostApiKey, authentikAppSlug
       - Relations: enrollmentSettings, roles, accessRequests, auditLogs

       Role:
       - siteId, name, description, level
       - ghostLabel, authentikGroup, autoCreateLabel, isDefault

       EnrollmentSettings:
       - siteId (unique)
       - policy (OPEN, APPROVAL_REQUIRED, INVITE_ONLY, OPEN_ROLE_GATES)
       - defaultRoleId, formFields (JSON)

       Approval/Trust Models:

       ApprovalDecision:
       - email, requestId, approved (boolean)
       - role, reason, autoApproved
       - ghostMemberId, authentikUserId, details (JSON)

       MemberTrust:
       - email (unique), trustSignals (JSON - cac_piv, sam_verified, etc.)

       SamVerification:
       - email (unique), memberId
       - uei, cageCode, entityName, status (pending, verified, invalid, expired)
       - verificationId, verifiedAt, expiresAt, lastResponse (JSON)

       CacAssertion:
       - id (JTI), email, subject, expiresAt
       - Prevents CAC/PIV assertion replay attacks

       Content Models

       CompanyPost:
       - companyId, ghostPostId (unique)
       - title, postType (story, profile, news, case_study)
       - status (draft, pending_review, founder_approved, published, archived)
       - createdBy, metadata, versions (JSON)

       CompanySource:
       - companyId, url, title, sourceOrg, summary, sourceAuthor, publishedAt
       - addedBy, verified, fetchedAt

       CompanyFeedback:
       - companyId, userId, feedbackType, content, rating

       CompanyShareLink:
       - token (unique), companyId, createdBy, createdByName
       - expiresAt, maxViews, requiredRole
       - viewCount, lastViewedAt, revokedAt, revokedBy

       User Onboarding Models

       StoryInvite:
       - token (unique), companyId, ghostPostId, founderEmail, adminEmail
       - companyName, message, status (PENDING, VIEWED, OPTED_IN, OPTED_OUT, APPROVED)
       - Tracking: createdAt, expiresAt, viewedAt, respondedAt, approvedAt
       - feedback, feedbackAt

       UserDraft:
       - userEmail, companyId, title, content (Text)
       - status (DRAFT, SUBMITTED, PUBLISHED), ghostPostId
       - Unique constraint: (userEmail, companyId, status)

       UserSource:
       - userEmail, companyId, url, title, snippet, favicon
       - Unique constraint: (userEmail, companyId, url)

       Invite:
       - email, firstName, lastName, tier
       - inviteToken (unique), customMessage, status (PENDING, ACCEPTED, EXPIRED)
       - expiresAt, acceptedAt

       CohortUpdate:
       - accessToken (unique), companyId, cohortId, companyName
       - contactEmail, lastTouchedBy
       - JSON sections: impact, network, kpis, commentary, followUp
       - status (DRAFT, SUBMITTED), submittedAt, history (JSON)

       SuccessStory:
       - title, companyName, slug (unique)
       - summary, outcomes, quote, quoteAttribution, heroImage
       - cohortId, cohortUpdateId, tags, metrics (JSON)
       - status (DRAFT, REVIEW, PUBLISHED, ARCHIVED), displayOrder, publishedAt

       System/Utility Models

       SyncHistory:
       - timestamp, syncType (manual, auto)
       - success, companiesUpdated, companiesCreated, coachesUpdated, coachesCreated
       - error, errorStack, errors (JSON)

       ContentAssistantSession:
       - userEmail, sessionData (JSON), companyData (JSON), draftPreview (Text)
       - previousStates, ghostPostId, ghostPostUuid
       - messageCount, isComplete, expiresAt

       AppConfig:
       - key (unique), data (JSON) - stores sync config, email settings, etc.

       EmailSettings:
       - adminEmail, fromName, fromEmail, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass
       - Preferences: notifyAdmin, notifyApplicant, autoApprove, autoApproveTiers
       - templates (JSON)

       AuditLog:
       - siteId, action, actor, target, details (JSON), createdAt

       Notification:
       - memberEmail, type, title, message
       - isRead, readAt, sourceType, sourceId, metadata (JSON)

       YjsDocument:
       - name (unique), data (Bytes) - Y.js binary state for collaboration

       NoteCollaborator:
       - noteId, email, status (ONLINE, OFFLINE), lastSeen
       - Unique: (noteId, email)

       ---
       AUTHENTICATION SYSTEM

       Location: /Users/paulgarcia/Dev/sigmablox/apps/webhook/authentik-middleware.js

       OAuth2 Flow

       1. User Initiates Login:
         - Click "Log In" → Redirects to Authentik
       2. Authentik Authentication:
         - Authentik handles 2FA, government email verification, etc.
       3. Callback & Token Exchange:
         - Authentik redirects back with authorization code
         - Middleware exchanges code for access + ID tokens
       4. JWT Processing:
         - Extract user info (email, name, groups) from JWT
         - Verify JWT signature using JWKS
       5. Ghost Member Sync:
         - Create or update Ghost member with appropriate labels
         - Labels correspond to roles: admin, trusted, industry, member, guest, restricted
       6. Authentik Groups Mapping:
       GROUP_TO_ROLE_MAP = {
           'sigmablox-admins': 'admin',
           'sigmablox-trusted': 'trusted',
           'sigmablox-industry': 'industry',
           'sigmablox-members': 'member',
           'sigmablox-guests': 'guest',
           'sigmablox-restricted': 'restricted'
       }
       7. Ghost Session Creation:
         - Create session cookie for browser access

       Role Hierarchy

       ROLE_LEVELS = {
           admin: 4,           // Full admin access
           trusted: 3,         // High-trust (gov, SAM-verified founders)
           industry: 2.5,      // SAM contractors, YC companies
           member: 2,          // Default authenticated users
           guest: 1.5,         // Limited guest access
           limited: 1,         // Restricted view-only
           restricted: 0.5     // Highly restricted
       }

       Approval Service

       Location: /Users/paulgarcia/Dev/sigmablox/apps/webhook/lib/services/approval-service.js

       Auto-Approval Criteria:
       1. Government Email: .mil, .gov, .af.mil, .navy.mil, etc. → Trusted role
       2. SAM.gov Verified: UEI matches POC email → Industry role
       3. Y Combinator Company: Company in YC cohort → Industry (or Trusted if founder)
       4. Default: Everyone else → Member role

       Process:
       - Evaluate request criteria (email, company, UEI)
       - Assign role based on matches
       - Create Ghost member with role label
       - Sync Authentik user to appropriate group
       - Record approval decision in PostgreSQL

       ---
       COMPANY CLAIMING SYSTEM

       Key Files:
       - Repository: /Users/paulgarcia/Dev/sigmablox/apps/webhook/lib/repositories/company-claim.js
       - API: /Users/paulgarcia/Dev/sigmablox/apps/webhook/local-server.js (lines 7366-7556)
       - Frontend: /Users/paulgarcia/Dev/sigmablox/apps/via-dashboard/src/app/(dashboard)/claims/page.tsx

       Claim Status Lifecycle

       PENDING → VERIFIED → APPROVED (or DENIED)
               ↘ Direct rejection

       Endpoints

       Submit Claim:
       POST /api/company/claim
       Requires: industry+ role (auth.requireMinimumRole('industry'))
       Body: { email, companyId, companyName, pocFirstName, pocLastName }

       Get Claim Status:
       GET /api/claim-status
       Returns: { status: 'none'|'pending'|'verified'|'approved', claim?, company? }

       Cancel Claim:
       POST /api/company/claim/cancel
       Body: { claimId }

       Admin - View All Claims:
       GET /api/admin/company-claims
       Returns: Array of claims with company info

       Admin - Unpair/Deny:
       POST /api/admin/company-claims/:claimId/unpair

       Auto-Approval Logic

       Located in: /Users/paulgarcia/Dev/sigmablox/apps/webhook/local-server.js lines 7410-7460

       Criteria:

       1. Email Domain Match:
         - User email domain matches company email/POC email domain
         - E.g., user@acme.com claiming company with poc@acme.com
         - Reason: email_domain
       2. POC Name Match:
         - User-provided name (pocFirstName + pocLastName) matches company contact
         - Uses substring matching (either direction)
         - Reason: poc_name

       Auto-Approval Logic:
       // Check 1: Email domain match
       const userDomain = email.toLowerCase().split('@')[1];
       const companyEmails = [company.email, company.contactEmail, ...];
       const emailMatch = companyEmails.some(e =>
           e.split('@')[1] === userDomain
       );
       if (emailMatch) {
           autoApproved = true;
           matchReason = 'email_domain';
       }

       // Check 2: POC name match
       if (!autoApproved && pocFirstName && pocLastName) {
           const providedName = `${pocFirstName} ${pocLastName}`.toLowerCase();
           const pocNames = [company.contactName, ...];
           const nameMatch = pocNames.some(n =>
               n.includes(providedName) || providedName.includes(n)
           );
           if (nameMatch) {
               autoApproved = true;
               matchReason = 'poc_name';
           }
       }

       Result:
       - If auto-approved: Claim status set to APPROVED immediately
       - If not auto-approved: Claim status set to PENDING (requires manual review)
       - Admin receives email notification in both cases

       CompanyClaimRepository API

       Key Methods:

       // Creation
       create(data) // Creates PENDING claim
       verify(email, token) // Marks as VERIFIED
       approve(id) // Marks as APPROVED
       deny(id, options) // Marks as DENIED with reason

       // Queries
       findById(id)
       findByEmail(email, options) // With status filter
       findByCompany(companyId, options)
       findByCompanyIds(companyIds, options) // Batch
       findActiveByCompany(companyId) // Non-denied claims
       findApprovedByCompany(companyId)
       findApprovedByEmail(email) // Gets company data too
       isCompanyClaimed(companyId) // Check if claimed
       findClaimerByCompany(companyId) // Get email of approver
       countByStatus() // Stats

       ---
       API ROUTES STRUCTURE

       Main Server: /Users/paulgarcia/Dev/sigmablox/apps/webhook/local-server.js

       Public Routes (No Auth)

       GET /api/public/companies              # List companies (paginated, filtered)
       GET /api/public/companies/:id          # Company details
       POST /api/public/companies/:id/upvote  # Upvote company
       GET /api/public/cohorts                # List cohorts
       GET /api/public/cohorts/:cohortId      # Cohort details
       GET /api/public/coaches                # List coaches
       GET /api/public/coaches/:id            # Coach details
       GET /api/search                        # Search (companies + coaches + cohorts)

       Authentication Routes

       GET /auth/login                        # Initiate OAuth
       GET /auth/callback                     # OAuth callback
       GET /auth/logout                       # Logout
       GET /auth/sso/start                    # SSO start
       GET /auth/cac/start                    # CAC/PIV start
       GET /auth/cac/finish                   # CAC/PIV finish
       GET /ghost/sso/login                   # Ghost-specific SSO
       GET /ghost/sso/callback

       Member Routes (Authenticated)

       GET /api/member/favorites              # User's favorites
       POST /api/member/favorites             # Add favorite
       DELETE /api/member/favorites/:targetId # Remove favorite

       GET /api/member/notes                  # User's notes
       POST /api/member/notes                 # Create note
       POST /api/member/notes/:noteId/share   # Share note
       POST /api/member/notes/:noteId/reminders # Add reminder

       GET /api/member/reminders              # Get reminders
       PATCH /api/member/reminders/:reminderId # Update reminder

       GET /api/member/notifications          # Get notifications
       PATCH /api/member/notifications/:id    # Mark as read
       POST /api/member/notifications/mark-all-read

       GET /api/member/:email                 # Member profile
       GET /api/member/recommendations        # Recommended companies
       GET /api/member/2fa-status

       POST /api/company/claim                # Submit claim
       GET /api/company/claim-status          # Check claim status
       POST /api/company/claim/cancel         # Cancel pending claim

       GET /api/my-company                    # Get claimed company
       PUT /api/my-company                    # Update claimed company
       GET /api/my-company/history            # Edit history
       POST /api/my-company/revert/:revisionId # Revert edit

       GET /api/company/profile               # Company onboarding profile
       GET /api/company/share-links           # Share links for company
       POST /api/company/share-links          # Create share link
       POST /api/company/share-links/:id/revoke # Revoke link

       POST /api/company/onboarding/progress  # Save progress
       POST /api/company/onboarding/complete  # Complete onboarding
       POST /api/company/onboarding/reset

       POST /api/member/sam-verification      # Start SAM verification

       Admin Routes (Requires auth.requireAdmin())

       GET /api/admin/company-claims          # All claims
       POST /api/admin/company-claims/:claimId/unpair # Deny/unpair

       GET /getRequests                       # Access requests
       POST /updateRequest                    # Update request
       POST /deleteRequest                    # Delete request
       GET /exportRequests                    # Export as CSV

       POST /createGhostMember                # Manually create member
       GET /getEmailSettings                  # Email config
       POST /saveEmailSettings                # Update email config
       POST /testEmail                        # Send test email
       POST /saveEmailTemplate                # Update template

       GET /getCoaches                        # All coaches
       GET /getCohorts                        # All cohorts
       POST /syncCohortFromAirtable          # Force sync cohort
       POST /updateCohortParticipant         # Update participant
       GET /exportCohort                      # Export cohort

       GET /api/syncConfig                    # Sync settings
       POST /api/syncConfig                   # Update sync config
       GET /api/syncStatus                    # Sync status
       POST /api/manualSync                   # Trigger manual sync
       GET /autoSync                          # Auto-sync trigger

       GET /api/admin/approval-stats          # Approval decision stats

       Routing Structure

       Routes are modularized:
       - Companies: /Users/paulgarcia/Dev/sigmablox/apps/webhook/lib/routes/companies.js
       - Coaches: /Users/paulgarcia/Dev/sigmablox/apps/webhook/lib/routes/coaches.js
       - Content Assistant: /Users/paulgarcia/Dev/sigmablox/apps/webhook/lib/routes/content-assistant.js
       - Chatbot: /Users/paulgarcia/Dev/sigmablox/apps/webhook/lib/routes/chatbot.js
       - Contributor: /Users/paulgarcia/Dev/sigmablox/apps/webhook/lib/routes/contributor.js

       ---
       FRONTEND - VIA DASHBOARD

       Location: /Users/paulgarcia/Dev/sigmablox/apps/via-dashboard/

       Stack: Next.js 15+ with TypeScript, React, Tailwind, shadcn/ui

       Key Pages

       Claims Management:
       - Path: /apps/via-dashboard/src/app/(dashboard)/claims/page.tsx
       - Features:
         - Claims stats bar (total, approved, pending, unpaired)
         - Manual pairing form
         - Claims table with company info
         - Context panel for actions (approve, deny, reassign)

       My Company (for Entrepreneurs):
       - Path: /apps/via-dashboard/src/app/(dashboard)/my-company/page.tsx
       - States:
         - No claim: "Browse companies to claim"
         - Pending claim: "Awaiting approval"
         - Approved claim: Full edit form
       - Fields: Company name, mission area, warfare domain, TRL level, funding stage, etc.

       Dashboard Pages:
       - / - Dashboard overview
       - /companies - Company browser/admin
       - /coaches - Coach management
       - /users - User management with roles
       - /roles - Role configuration
       - /access-requests - Onboarding approvals
       - /cohort-reports - Cohort metrics
       - /story-reviews - Content review
       - /notes - Internal notes
       - /activity - Audit log

       Component Structure

       src/
       ├── app/
       │   ├── auth/
       │   │   ├── signin/page.tsx
       │   │   ├── error/page.tsx
       │   │   └── unauthorized/page.tsx
       │   ├── (dashboard)/
       │   │   ├── layout.tsx        # Main layout with nav
       │   │   ├── page.tsx          # Dashboard home
       │   │   ├── claims/page.tsx   # Claims management
       │   │   ├── companies/page.tsx
       │   │   ├── coaches/page.tsx
       │   │   ├── users/page.tsx
       │   │   ├── my-company/page.tsx
       │   │   ├── roles/page.tsx
       │   │   ├── access-requests/page.tsx
       │   │   └── ...more pages
       │   ├── share/company/[token]/page.tsx
       │   └── layout.tsx            # Root layout
       └── components/
           ├── ui/                   # shadcn/ui components
           ├── claims/              # Claims-specific components
           │   ├── claims-stats-bar.tsx
           │   ├── claims-table.tsx
           │   ├── claim-context.tsx
           │   └── manual-pair-form.tsx
           └── ...more feature components

       ---
       REPOSITORIES (Data Access Layer)

       Location: /Users/paulgarcia/Dev/sigmablox/apps/webhook/lib/repositories/

       Each model has a dedicated repository:

       - company.js - Company queries with search, filters
       - company-claim.js - Claim lifecycle management
       - company-profile.js - Onboarding progress tracking
       - company-post.js - Blog post metadata
       - company-source.js - Article/news sources
       - coach.js - Coach profiles
       - cohort.js - Cohort data
       - favorite.js - User favorites (bulk ops)
       - note.js - Notes with collaboration
       - interest.js - User interests in companies/coaches
       - access-request.js - Access request submissions
       - approval-decision.js - Approval audit trail
       - user-draft.js - Story drafts
       - user-source.js - Custom sources
       - story-invite.js - Founder collaboration invites
       - sam-verification.js - SAM.gov verification
       - member-trust.js - Trust signals (CAC/PIV, SAM)
       - And more...

       Pattern: Each repository:
       class XRepository {
         constructor(db) { this.db = db; }

         async create(data) { ... }
         async findById(id) { ... }
         async findMany(options) { ... }
         async update(id, data) { ... }
         async delete(id) { ... }
         // Custom queries for the model
       }

       module.exports = { XRepository };

       ---
       SERVICES (Business Logic)

       Location: /Users/paulgarcia/Dev/sigmablox/apps/webhook/lib/services/

       - approval-service.js - Auto-approval logic for onboarding
       - email-service.js - Email sending via SendGrid
       - draft-generator.js - AI-powered company story drafts
       - content-assistant.js - AI interview for company profiles
       - company-post-generator.js - Auto-generate blog posts
       - source-fetcher.js - Fetch company sources from web
       - ghost-posts.js - Ghost CMS integration
       - my-company-upload.js - File upload handling for company profiles
       - ai-provider.js - OpenAI integration
       - ai-story-writer.js - Story writing AI service
       - ai-interviewer.js - Interview simulation
       - chatbot-context.js - Context for AI chatbot
       - sigmablox-chatbot.js - Platform-specific chatbot
       - structured-logger.js - Logging utilities
       - event-logger.js - Event tracking

       ---
       COMPANY PROFILE ONBOARDING FLOW

       CompanyProfile Model tracks progress through:
       1. Contact information (name, email, phone, title)
       2. Company info (organization name, URL, team size)
       3. Technical info (mission area, warfare domain, ATO status)
       4. Product details (product name, TRL level)
       5. Business info (funding stage, GPC ready)
       6. Synopsis (problem statement, solution description)
       7. Logo upload

       Endpoints:
       POST /api/company/onboarding/progress    # Save step progress
       POST /api/company/onboarding/complete    # Mark as complete
       POST /api/company/onboarding/reset       # Clear progress
       GET /api/company/profile                 # Get current progress

       Flow:
       1. User starts with empty CompanyProfile
       2. Incremental save via /progress endpoint
       3. Can revert/reset at any time
       4. Once complete, user can submit claim
       5. Upon claim approval, becomes "claimed company" with full edit rights

       ---
       KEY FILES REFERENCE

       Backend Core Files
       ┌────────────────────────────────────────┬───────────────────────────────────────┐
       │                  File                  │                Purpose                │
       ├────────────────────────────────────────┼───────────────────────────────────────┤
       │ apps/webhook/local-server.js           │ Main Express API server (9000+ lines) │
       ├────────────────────────────────────────┼───────────────────────────────────────┤
       │ apps/webhook/prisma/schema.prisma      │ Database schema definition            │
       ├────────────────────────────────────────┼───────────────────────────────────────┤
       │ apps/webhook/authentik-middleware.js   │ OAuth2 authentication                 │
       ├────────────────────────────────────────┼───────────────────────────────────────┤
       │ apps/webhook/auth-middleware-simple.js │ JWT validation                        │
       ├────────────────────────────────────────┼───────────────────────────────────────┤
       │ apps/webhook/airtable-sync.js          │ Airtable data sync                    │
       ├────────────────────────────────────────┼───────────────────────────────────────┤
       │ lib/repositories/*.js                  │ Data access layer (20+ files)         │
       ├────────────────────────────────────────┼───────────────────────────────────────┤
       │ lib/services/*.js                      │ Business logic (16+ files)            │
       ├────────────────────────────────────────┼───────────────────────────────────────┤
       │ lib/routes/*.js                        │ Route handlers (5 files)              │
       └────────────────────────────────────────┴───────────────────────────────────────┘
       Frontend Files
       ┌────────────────────────────────────────────────────────────┬────────────────────────┐
       │                            File                            │        Purpose         │
       ├────────────────────────────────────────────────────────────┼────────────────────────┤
       │ apps/via-dashboard/src/app/(dashboard)/claims/page.tsx     │ Claims management UI   │
       ├────────────────────────────────────────────────────────────┼────────────────────────┤
       │ apps/via-dashboard/src/app/(dashboard)/my-company/page.tsx │ Company profile editor │
       ├────────────────────────────────────────────────────────────┼────────────────────────┤
       │ apps/via-dashboard/src/app/(dashboard)/companies/page.tsx  │ Company browser        │
       ├────────────────────────────────────────────────────────────┼────────────────────────┤
       │ apps/via-dashboard/src/app/layout.tsx                      │ Root layout            │
       ├────────────────────────────────────────────────────────────┼────────────────────────┤
       │ apps/via-dashboard/src/app/(dashboard)/layout.tsx          │ Dashboard layout       │
       └────────────────────────────────────────────────────────────┴────────────────────────┘
       Configuration Files
       ┌─────────────────────────────────┬───────────────────────┐
       │              File               │        Purpose        │
       ├─────────────────────────────────┼───────────────────────┤
       │ apps/webhook/package.json       │ Node dependencies     │
       ├─────────────────────────────────┼───────────────────────┤
       │ apps/via-dashboard/package.json │ Next.js dependencies  │
       ├─────────────────────────────────┼───────────────────────┤
       │ .env.local                      │ Environment variables │
       ├─────────────────────────────────┼───────────────────────┤
       │ .env.example                    │ Environment template  │
       ├─────────────────────────────────┼───────────────────────┤
       │ docker-compose.yml              │ Local dev setup       │
       └─────────────────────────────────┴───────────────────────┘
       Documentation
       ┌────────────────────────┬────────────────────────┐
       │          File          │        Purpose         │
       ├────────────────────────┼────────────────────────┤
       │ CLAUDE.md              │ Development guidelines │
       ├────────────────────────┼────────────────────────┤
       │ QUICK_REFERENCE.md     │ Quick commands         │
       ├────────────────────────┼────────────────────────┤
       │ README.md              │ Project overview       │
       ├────────────────────────┼────────────────────────┤
       │ apps/webhook/README.md │ Webhook service docs   │
       └────────────────────────┴────────────────────────┘
       ---
       IMPORTANT ARCHITECTURAL PATTERNS

       1. Repository Pattern

       All database access goes through repositories, never direct db calls in routes.

       2. Middleware Stack

       - Authentication (Authentik OAuth2)
       - Authorization (role-based, requireAdmin, requireMinimumRole)
       - Rate limiting (per endpoint)
       - Input validation (honeypot, sanitization)
       - CORS handling

       3. Field Whitelisting

       Admin API updates use field whitelists (SEC-006) to prevent mass assignment attacks.

       4. Auto-Approval System

       Company claims automatically approve based on:
       - Email domain matching
       - POC name matching
       - Falls back to manual review if no match

       5. Email Templates

       Stored in database (AppConfig/EmailSettings models) and support dynamic variables.

       6. Real-time Collaboration

       Notes support real-time editing via Y.js + Hocuspocus collaboration server.

       7. Trust Signals

       MemberTrust model tracks: CAC/PIV assertions, SAM verification, YC membership.

       ---
       DEPLOYMENT ARCHITECTURE

       Services Deployment:
       - Ghost CMS: Docker container (port 3002)
       - Webhook API: Google Cloud Functions (production) or Node (development)
       - Via Dashboard: Next.js on Google Cloud Run
       - Authentik: Docker container (OAuth provider)
       - PostgreSQL: Cloud SQL instance
       - Redis: Cloud Memorystore (rate limiting)

       Sync Mechanisms:
       - Airtable → PostgreSQL: Periodic sync (manual or scheduled)
       - PostgreSQL → Ghost: Via Ghost admin API
       - Authentik ↔ Ghost: Real-time via OAuth

       ---
       SECURITY HIGHLIGHTS

       1. No Plaintext Secrets: Uses env vars + Google Secret Manager
       2. JWT Verification: JWKS-based JWT validation for OAuth tokens
       3. Rate Limiting: Redis-backed rate limits per endpoint
       4. Input Validation: express-validator with honeypot protection
       5. CAC/PIV Support: Assertion replay prevention with CacAssertion model
       6. Field Whitelisting: Admin API restricted to allowed fields
       7. Role-Based Access: Granular role hierarchy (admin→trusted→industry→member→guest→restricted)

       ---
       QUICK START FOR DEVELOPERS

       Research Understanding:
       - Start with CLAUDE.md for project philosophy
       - Read /apps/webhook/prisma/schema.prisma for data model
       - Check local-server.js lines 1-500 for middleware setup
       - Review company-claim repository for core business logic

       Key Command Reference:
       cd /Users/paulgarcia/Dev/sigmablox/apps/webhook
       npm run lint          # Check code quality
       npm test             # Run tests
       npm start            # Start API server
       npm run dev          # Local dev with hot reload

       To Understand Company Claiming:
       1. Read /lib/repositories/company-claim.js - full API
       2. Search local-server.js for "Submit company claim" (line 7366)
       3. Check auto-approval logic (lines 7410-7460)
       4. Review /apps/via-dashboard/src/app/(dashboard)/claims/page.tsx

       ---
       This comprehensive overview covers the entire architecture, data models, API structure, authentication flow, and company
       claiming system that powers the SigmaBlox platform. All file paths are absolute and ready for reference.
  ⎿  Done (33 tool uses · 102.5k tokens · 2m 21s)

⏺ Here's a comprehensive summary of how SigmaBlox handles account/user management, company profiles, and the claiming system today:

  ---                                                                                                                                     
  SigmaBlox Architecture Summary
                                                                                                                                          
  Tech Stack                                                                                                                            
                                                                                                                                        
  - Backend: Node.js/Express API (apps/webhook/local-server.js — 9000+ lines monolith)
  - Database: PostgreSQL + Prisma ORM
  - Auth: Authentik (OAuth2/OIDC) with JWT validation
  - Frontend: Next.js + TypeScript VIA Dashboard (apps/via-dashboard/)
  - Content: Ghost CMS for blog/content
  - Data Sync: Airtable (legacy source) → PostgreSQL

  Authentication Flow

  1. User clicks login → redirects to Authentik OAuth2
  2. Authentik handles credentials, 2FA, CAC/PIV
  3. Callback exchanges auth code for JWT tokens
  4. JWT groups map to roles via GROUP_TO_ROLE_MAP:
    - sigmablox-admins → admin (level 4)
    - sigmablox-trusted → trusted (level 3) — gov emails
    - sigmablox-industry → industry (level 2.5) — SAM-verified, YC companies
    - sigmablox-members → member (level 2) — default
    - sigmablox-guests → guest (level 1.5)
    - sigmablox-restricted → restricted (level 0.5)

  Key Data Models (Prisma)
  ┌──────────────────────────────┬───────────────────────────────────────────────────────────────────────────┐
  │            Model             │                                  Purpose                                  │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ Company                      │ Full company profile (name, mission area, TRL, funding, compliance, etc.) │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ CompanyClaim                 │ Tracks ownership claims: PENDING → VERIFIED → APPROVED/DENIED             │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ CompanyProfile               │ Multi-step onboarding wizard progress                                     │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ Coach                        │ Mentor/coach profiles                                                     │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ Favorite/Note/Interest       │ User engagement with companies and coaches                                │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ AccessRequest                │ New user enrollment requests                                              │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ MemberTrust                  │ Trust signals (CAC/PIV, SAM verification, YC membership)                  │
  ├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ Role/Site/EnrollmentSettings │ Multi-site RBAC configuration                                             │
  └──────────────────────────────┴───────────────────────────────────────────────────────────────────────────┘
  Company Claiming System

  Flow:
  1. Authenticated user (industry+ role) submits POST /api/company/claim with email, companyId, POC name
  2. Auto-approval checks run:
    - Email domain match — user's email domain matches company's POC email domain → instant approval
    - POC name match — user-provided name matches company contact → instant approval
  3. If no match → status stays PENDING for admin review
  4. Admin reviews in VIA Dashboard (/claims page) — can approve, deny, or unpair
  5. Once approved, user gets full edit access via GET/PUT /api/my-company

  Key files:
  - Repository: apps/webhook/lib/repositories/company-claim.js
  - Auto-approval logic: apps/webhook/local-server.js (lines ~7410-7460)
  - Admin UI: apps/via-dashboard/src/app/(dashboard)/claims/page.tsx

  Company Onboarding

  Multi-step wizard tracked by CompanyProfile model:
  1. Contact info → 2. Company info → 3. Technical details → 4. Product → 5. Business → 6. Synopsis → 7. Logo

  Dashboard Features (VIA Dashboard)

  - / — Overview dashboard
  - /companies — Browse/manage companies
  - /claims — Claim management with stats bar
  - /my-company — Entrepreneur's profile editor (post-claim)
  - /users — User management with roles
  - /access-requests — Enrollment approvals
  - /coaches, /cohort-reports, /notes, /activity

  Architecture Patterns

  - Repository pattern for all DB access
  - Middleware stack: auth → role check → rate limiting → validation
  - Field whitelisting on admin updates (prevents mass assignment)
  - Services layer for business logic (approval, email, AI content generation)

  ---
  Migration Considerations for mc_site

  The core pieces to bring over are:
  1. User/auth model — role hierarchy, trust signals, enrollment settings
  2. Company model — the full profile schema with mission areas, compliance fields, etc.
  3. Claiming system — the CompanyClaim lifecycle with auto-approval rules
  4. Company onboarding — multi-step wizard for new profiles
  5. Dashboard — user's home, company management, claim status

  The monolithic local-server.js (9000+ lines) will need to be decomposed. The Prisma schema and repository layer are well-structured and
  can transfer more directly. The Authentik integration can likely be reused as-is since mc_site presumably shares the same auth
  infrastructure.