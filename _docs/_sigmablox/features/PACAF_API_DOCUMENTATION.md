# PACAF API Documentation

Production-ready Express.js API endpoints for PACAF (Pacific Air Forces) functionality integrated into the SigmaBlox platform.

## Overview

The PACAF API provides comprehensive functionality for:
- Program discovery and matching
- Capability assessment and scoring
- User profile management
- SBIR opportunity tracking
- Advanced search across programs, companies, and coaches

## Base URL

```
Local: http://localhost:3000/api/pacaf
Production: https://api.sigmablox.com/api/pacaf
```

## Authentication

Most endpoints require authentication via Ghost member session:
- **Cookie**: `ghost-members-ssr` (set by Ghost)
- **Header**: `x-ghost-session` (alternative)
- **Header**: `x-member-email` (for development)

Public endpoints (marked with `[Public]`) can be accessed without authentication but may return limited data.

## Endpoints

### 1. List Programs

Get all PACAF programs with optional filtering.

```http
GET /api/pacaf/programs
```

**Authentication**: Optional

**Query Parameters**:
- `category` (optional): Filter by category (`high-priority` or `additional-opportunity`)
- `techArea` (optional): Filter by technology area (e.g., `AI/ML`, `Cybersecurity & Communications`)
- `requiresClearance` (optional): Filter by clearance requirement (`true` or `false`)

**Response**:
```json
{
  "success": true,
  "count": 13,
  "programs": [
    {
      "id": "mca-001",
      "name": "Multi-Capable Airman (MCA) Program",
      "slug": "multi-capable-airman",
      "category": "high-priority",
      "overview": "The Multi-Capable Airman (MCA) program trains...",
      "techFocusAreas": ["Training & Simulation"],
      "budgetRange": "$622M+",
      "typicalTimeToAward": "6-12 months",
      "requiresClearance": false
    }
  ]
}
```

**Example**:
```bash
curl -X GET "http://localhost:3000/api/pacaf/programs?category=high-priority&techArea=Cybersecurity%20%26%20Communications"
```

---

### 2. Get Program Details

Get detailed information about a specific program including related opportunities, companies, and coaches.

```http
GET /api/pacaf/programs/:id
```

**Authentication**: Optional

**Path Parameters**:
- `id` (required): Program ID (e.g., `mca-001`)

**Response**:
```json
{
  "success": true,
  "program": {
    "id": "mca-001",
    "name": "Multi-Capable Airman (MCA) Program",
    "overview": "...",
    "problemNeed": [
      "Airmen are often highly specialized...",
      "Cross-functional skill gaps..."
    ],
    "objectives": ["Train Airmen across multiple roles..."],
    "techFocusAreas": ["Training & Simulation"],
    "specificTechnologies": [
      "VR/AR platforms for cross-functional skill development",
      "Mobile learning apps..."
    ],
    "managedBy": "Eielson Air Force Base",
    "engagementPathways": [
      "PACAF A3 (Air Operations), Training & Readiness directorates",
      "AFWERX SBIR/STTR, STRATFI/TACFI"
    ],
    "fundingInitiatives": [
      {
        "title": "Congressional MCA and ACE Allocation",
        "amount": "$622M",
        "description": "...",
        "link": "https://www.af.mil/..."
      }
    ]
  },
  "relatedOpportunities": [],
  "relatedCompanies": 15,
  "relatedCoaches": [
    {
      "coachId": "coach123",
      "experienceLevel": "Expert",
      "availableFor": ["1:1 Consulting", "Workshops"]
    }
  ]
}
```

**Example**:
```bash
curl -X GET "http://localhost:3000/api/pacaf/programs/mca-001" \
  -H "x-member-email: user@company.com"
```

---

### 3. Submit Capability Assessment

Submit a capability assessment and receive program matches with scores.

```http
POST /api/pacaf/matcher/assess
```

**Authentication**: Required

**Request Body**:
```json
{
  "responses": {
    "technologyAreas": ["AI/ML", "Training & Simulation"],
    "companyStage": "Growth",
    "hasGovernmentExperience": true,
    "hasSBIRExperience": true,
    "targetTimeframe": "6-12 months",
    "teamSize": "10-50",
    "securityClearance": "Secret"
  }
}
```

**Required Fields**:
- `responses.technologyAreas` (array): Technology capabilities of the company

**Optional Fields**:
- `responses.companyStage` (string): Company maturity stage
- `responses.hasGovernmentExperience` (boolean): Previous government contracts
- `responses.hasSBIRExperience` (boolean): SBIR/STTR experience
- `responses.targetTimeframe` (string): Desired timeline to award
- `responses.securityClearance` (string): Security clearance level

**Response**:
```json
{
  "success": true,
  "assessmentId": "507f1f77bcf86cd799439011",
  "matches": [
    {
      "programId": "mca-001",
      "programName": "Multi-Capable Airman (MCA) Program",
      "matchScore": 87,
      "alignmentFactors": [
        "Strong technology alignment: Training & Simulation",
        "Government contracting experience",
        "SBIR/STTR experience"
      ],
      "missingCapabilities": [],
      "recommendedNextSteps": [
        "Connect with PACAF Eielson Air Force Base representatives",
        "Review active SBIR/STTR opportunities for this program",
        "Prepare capability statement highlighting your alignment"
      ]
    }
  ],
  "recommendations": [
    "Focus your efforts on your top-matched programs",
    "Develop targeted capability statements for each program"
  ],
  "nextSteps": [
    "Schedule consultation with a PACAF-specialized coach",
    "Review active SBIR opportunities for your top-matched programs"
  ]
}
```

**Scoring Algorithm**:
- **Technology Alignment** (40 points max): Direct match with program technology areas
- **Experience Bonus** (20 points max): Government and SBIR experience
- **Stage Appropriateness** (20 points max): Company stage matches program requirements
- **Security Clearance** (10 points max): Meets clearance requirements
- **Timeframe Alignment** (10 points max): Timeline matches typical award timeframe

**Example**:
```bash
curl -X POST "http://localhost:3000/api/pacaf/matcher/assess" \
  -H "Content-Type: application/json" \
  -H "x-member-email: user@company.com" \
  -d '{
    "responses": {
      "technologyAreas": ["AI/ML", "Training & Simulation"],
      "companyStage": "Growth",
      "hasGovernmentExperience": true,
      "hasSBIRExperience": true
    }
  }'
```

---

### 4. Get Assessment Results

Retrieve results from a previously completed assessment.

```http
GET /api/pacaf/matcher/results/:assessmentId
```

**Authentication**: Required

**Path Parameters**:
- `assessmentId` (required): Assessment ID from previous submission

**Response**:
```json
{
  "success": true,
  "assessment": {
    "id": "507f1f77bcf86cd799439011",
    "timestamp": "2025-11-18T10:30:00.000Z",
    "responses": {
      "technologyAreas": ["AI/ML", "Training & Simulation"],
      "companyStage": "Growth"
    },
    "matches": [
      {
        "programId": "mca-001",
        "matchScore": 87,
        "alignmentFactors": ["..."]
      }
    ]
  }
}
```

**Example**:
```bash
curl -X GET "http://localhost:3000/api/pacaf/matcher/results/507f1f77bcf86cd799439011" \
  -H "x-member-email: user@company.com"
```

---

### 5. Update PACAF Profile

Update user's PACAF-specific profile information.

```http
POST /api/pacaf/profile/update
```

**Authentication**: Required

**Request Body**:
```json
{
  "capabilities": {
    "technologyAreas": ["AI/ML", "Cybersecurity & Communications"]
  },
  "readiness": {
    "hasGovernmentExperience": true,
    "hasSBIRExperience": true,
    "securityClearance": "Secret"
  },
  "interestedPrograms": ["mca-001", "ccep-001", "a6-001"]
}
```

**Response**:
```json
{
  "success": true,
  "profile": {
    "companyEmail": "user@company.com",
    "technologyAreas": ["AI/ML", "Cybersecurity & Communications"],
    "hasGovernmentExperience": true,
    "hasSBIRExperience": true,
    "securityClearance": "Secret",
    "interestedPrograms": ["mca-001", "ccep-001", "a6-001"],
    "updatedAt": "2025-11-18T10:30:00.000Z"
  }
}
```

**Example**:
```bash
curl -X POST "http://localhost:3000/api/pacaf/profile/update" \
  -H "Content-Type: application/json" \
  -H "x-member-email: user@company.com" \
  -d '{
    "capabilities": {
      "technologyAreas": ["AI/ML", "Training & Simulation"]
    }
  }'
```

---

### 6. Get SBIR Opportunities

Get SBIR/STTR opportunities tagged with PACAF program relevance.

```http
GET /api/pacaf/opportunities
```

**Authentication**: Optional

**Query Parameters**:
- `programId` (optional): Filter by specific PACAF program
- `status` (optional): Filter by status (`open`, `closed`, `all`) - default: `open`
- `limit` (optional): Maximum results to return - default: `20`

**Response**:
```json
{
  "success": true,
  "count": 5,
  "opportunities": [
    {
      "sbirId": "AF251-001",
      "relatedPrograms": ["mca-001", "rap-001"],
      "relevanceScore": 85,
      "matchingKeywords": [
        "multi-capable",
        "VR training",
        "aircrew readiness"
      ],
      "computedAt": "2025-11-18T10:00:00.000Z"
    }
  ]
}
```

**Example**:
```bash
curl -X GET "http://localhost:3000/api/pacaf/opportunities?programId=mca-001&status=open&limit=10"
```

---

### 7. Update Notification Preferences

Configure notification settings for PACAF-related alerts.

```http
POST /api/pacaf/notifications/preferences
```

**Authentication**: Required

**Request Body**:
```json
{
  "preferences": {
    "newSBIROpportunities": {
      "enabled": true,
      "programs": ["mca-001", "ccep-001"],
      "frequency": "immediate"
    },
    "programUpdates": {
      "enabled": true,
      "programs": ["mca-001"]
    },
    "matchingCompanies": {
      "enabled": false,
      "minMatchScore": 70
    },
    "budgetChanges": {
      "enabled": true,
      "programs": ["a6-001"]
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Notification preferences updated"
}
```

**Example**:
```bash
curl -X POST "http://localhost:3000/api/pacaf/notifications/preferences" \
  -H "Content-Type: application/json" \
  -H "x-member-email: user@company.com" \
  -d '{
    "preferences": {
      "newSBIROpportunities": {
        "enabled": true,
        "programs": ["mca-001"],
        "frequency": "daily"
      }
    }
  }'
```

---

### 8. Advanced Search

Search across programs, companies, and coaches with PACAF expertise.

```http
GET /api/pacaf/search
```

**Authentication**: Optional

**Query Parameters**:
- `query` (optional): Text search query
- `programs` (optional): Comma-separated program IDs
- `techAreas` (optional): Comma-separated technology areas
- `companyStage` (optional): Company stage filter
- `hasGovernmentExperience` (optional): Filter by government experience (`true` or `false`)
- `limit` (optional): Maximum results per category - default: `50`

**Response**:
```json
{
  "success": true,
  "query": "cybersecurity",
  "totalResults": 25,
  "results": {
    "programs": [
      {
        "id": "ccep-001",
        "name": "Cyber Collaboration & Exchange Program (CCEP)",
        "type": "program",
        "techFocusAreas": ["Cybersecurity & Communications"]
      }
    ],
    "companies": [
      {
        "companyEmail": "company@example.com",
        "technologyAreas": ["Cybersecurity & Communications"],
        "type": "company"
      }
    ],
    "coaches": [
      {
        "coachId": "coach123",
        "specialistPrograms": ["ccep-001", "a6-001"],
        "experienceLevel": "Expert",
        "type": "coach"
      }
    ]
  }
}
```

**Example**:
```bash
curl -X GET "http://localhost:3000/api/pacaf/search?query=training&techAreas=Training%20%26%20Simulation&limit=20"
```

---

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes**:
- `200 OK`: Successful request
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limiting

PACAF API endpoints use the following rate limits:

- **Assessment endpoints**: 60 requests per minute per user
- **General API endpoints**: 100 requests per minute per IP
- **Search endpoints**: 30 requests per minute per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1637251200
```

---

## Integration with Existing Features

### SBIR Scraper Integration

The PACAF API integrates with the existing SBIR scraper at https://www.mergecombinator.com/sbir by:

1. Tagging SBIR opportunities with relevant PACAF programs
2. Calculating relevance scores based on keyword matching
3. Providing filtered views of SBIR opportunities per program

### Ghost Member Integration

- Uses existing Ghost authentication middleware
- Stores PACAF profile data linked to member email
- Respects existing role-based access control

### MongoDB Collections

New collections created:
- `pacaf_programs`: Program definitions
- `pacaf_assessments`: User assessments
- `company_pacaf_profiles`: Company PACAF data
- `coach_pacaf_profiles`: Coach PACAF expertise
- `pacaf_notifications`: Notification queue
- `notification_preferences`: User preferences
- `sbir_pacaf_relevance`: SBIR-program mappings

---

## Development

### Setup

1. Ensure MongoDB is running
2. Load program data from `/Users/paulgarcia/Dev/sigmablox/_docs/features/pacaf-data-seed.json`
3. Start the server:

```bash
cd /Users/paulgarcia/Dev/sigmablox/webhook
npm install
node local-server.js
```

### Testing

Test the API endpoints using curl or Postman:

```bash
# Test program listing
curl -X GET "http://localhost:3000/api/pacaf/programs"

# Test assessment (requires auth)
curl -X POST "http://localhost:3000/api/pacaf/matcher/assess" \
  -H "Content-Type: application/json" \
  -H "x-member-email: test@example.com" \
  -d '{"responses":{"technologyAreas":["AI/ML"]}}'
```

---

## Files

**API Implementation**:
- `/Users/paulgarcia/Dev/sigmablox/webhook/pacaf-api.js` - Main API class
- `/Users/paulgarcia/Dev/sigmablox/webhook/local-server.js` - Route integration

**Data & Documentation**:
- `/Users/paulgarcia/Dev/sigmablox/_docs/features/pacaf-data-seed.json` - Program seed data
- `/Users/paulgarcia/Dev/sigmablox/_docs/features/pacaf-hub-technical-spec.md` - Technical specification
- `/Users/paulgarcia/Dev/sigmablox/_docs/features/PACAF_API_DOCUMENTATION.md` - This file

**Utilities**:
- `/Users/paulgarcia/Dev/sigmablox/webhook/lib/favorites-utils.js` - Shared validation utilities

---

## Next Steps

1. **Data Population**: Load the 13 PACAF programs from `pacaf-data-seed.json` into MongoDB
2. **Frontend Integration**: Build UI components for the matcher and profile management
3. **SBIR Integration**: Implement keyword-based SBIR opportunity tagging
4. **Notification System**: Build email templates and notification triggers
5. **Testing**: Create comprehensive test suite for all endpoints

---

## Support

For questions or issues, contact:
- Technical Lead: paul@sigmablox.com
- Platform: https://www.sigmablox.com
