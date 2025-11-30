Overview
Integration of PACAF market intelligence into Merge Combinator platform, providing program matching, company/coach profile enhancements, and actionable insights for defense tech companies.
Core Features
1. PACAF Program Matcher (Priority 1)
Functionality

Interactive quiz/survey that matches companies to PACAF programs based on their capabilities
Scoring algorithm that ranks program fit
Downloadable personalized report with top matches

User Flow

User lands on PACAF hub page
Clicks "Find Your PACAF Programs" CTA
Completes capability assessment (8-10 questions)
Receives ranked list of programs with match scores
Can explore each program in detail
Option to save matches to profile
Option to connect with relevant coaches

Data Model
typescriptinterface CapabilityAssessment {
  userId: string;
  timestamp: Date;
  responses: {
    technologyAreas: string[]; // e.g., ["AI/ML", "Cybersecurity"]
    companyStage: string; // e.g., "Early Stage", "Growth", "Established"
    hasGovernmentExperience: boolean;
    hasSBIRExperience: boolean;
    targetTimeframe: string; // e.g., "0-6 months", "6-12 months"
    teamSize: string;
    securityClearance: string;
    primaryFocus: string[]; // e.g., ["Training", "Infrastructure"]
  };
  matchScores: ProgramMatch[];
}

interface ProgramMatch {
  programId: string;
  programName: string;
  matchScore: number; // 0-100
  alignmentFactors: string[]; // Reasons for match
  missingCapabilities: string[];
  recommendedNextSteps: string[];
}
Scoring Algorithm Logic
typescriptfunction calculateProgramMatch(
  assessment: CapabilityAssessment,
  program: PACAFProgram
): number {
  let score = 0;
  
  // Technology alignment (40 points max)
  const techOverlap = assessment.responses.technologyAreas.filter(
    tech => program.techFocusAreas.includes(tech)
  ).length;
  score += Math.min(40, techOverlap * 10);
  
  // Experience bonus (20 points max)
  if (assessment.responses.hasGovernmentExperience) score += 10;
  if (assessment.responses.hasSBIRExperience) score += 10;
  
  // Stage appropriateness (20 points max)
  if (program.suitableStages.includes(assessment.responses.companyStage)) {
    score += 20;
  }
  
  // Security clearance (10 points max)
  if (program.requiresClearance && assessment.responses.securityClearance !== "None") {
    score += 10;
  }
  
  // Timeframe alignment (10 points max)
  if (matchesTimeframe(assessment.responses.targetTimeframe, program.typicalTimeToAward)) {
    score += 10;
  }
  
  return score;
}
2. PACAF Program Database
Data Structure
typescriptinterface PACAFProgram {
  id: string;
  name: string;
  slug: string;
  category: "high-priority" | "additional-opportunity";
  
  // From PDF pages 24-37
  overview: string;
  problemNeed: string[];
  objectives: string[];
  
  // Technology requirements
  techFocusAreas: TechArea[]; // From page 16 cross-cutting diagram
  specificTechnologies: string[];
  
  // Engagement information
  managedBy: string; // e.g., "PACAF Joint Base Pearl Harbor-Hickam"
  engagementPathways: string[];
  typesOfCompaniesNeeded: string[];
  
  // Financial/Practical
  budgetRange?: string;
  typicalContractSize?: string;
  typicalTimeToAward: string;
  
  // Metadata
  fundingInitiatives: FundingInitiative[];
  relatedIDIQs: string[]; // From page 18
  relatedPrimes: string[]; // From page 17
  
  // Matching criteria
  suitableStages: string[];
  requiresClearance: boolean;
  
  // Content
  opportunityDescription: string;
  lastUpdated: Date;
}

type TechArea = 
  | "AI/ML"
  | "Cybersecurity & Communications"
  | "Training & Simulation"
  | "Resilience & Well-being"
  | "Materials & Sustainment";

interface FundingInitiative {
  title: string;
  amount?: string;
  description: string;
  link?: string;
}
Initial Data Population
typescript// Example: Multi-Capable Airman (MCA) Program from page 24
const mcaProgram: PACAFProgram = {
  id: "mca-001",
  name: "Multi-Capable Airman (MCA) Program",
  slug: "multi-capable-airman",
  category: "high-priority",
  
  overview: "The Multi-Capable Airman (MCA) program trains Airmen to perform across multiple roles, enhancing their operational flexibility and readiness. By developing cross-functional skills, the program ensures Airmen can adapt to dynamic mission requirements, enabling rapid deployment and operational effectiveness across PACAF's diverse environments.",
  
  problemNeed: [
    "Airmen are often highly specialized, limiting agility in dynamic, dispersed operational for Indo-Pacific environments",
    "Cross-functional skill gaps reduce readiness for Agile Combat Employment (ACE) scenarios"
  ],
  
  objectives: [
    "Train Airmen across multiple roles and functions",
    "Improve operational flexibility, rapid deployment, and mission adaptability"
  ],
  
  techFocusAreas: ["Training & Simulation"],
  specificTechnologies: [
    "VR/AR platforms for cross-functional skill development",
    "Mobile learning apps enabling in-theater, on-demand upskilling",
    "Digital readiness workforce deployment tools",
    "Digital twin readiness solutions"
  ],
  
  managedBy: "Eielson Air Force Base",
  engagementPathways: [
    "PACAF A3 (Air Operations), Training & Readiness directorates",
    "AFWERX SBIR/STTR, STRATFI/TACFI",
    "OTAs via SOSSEC/NAC"
  ],
  
  typesOfCompaniesNeeded: [
    "Simulation Providers",
    "EdTech Firms",
    "Workforce Management Platforms Providers"
  ],
  
  fundingInitiatives: [
    {
      title: "Congressional MCA and ACE Allocation",
      amount: "$622M",
      description: "Allocated by Congress for MCA and ACE readiness programs",
      link: "https://example.com/funding"
    },
    {
      title: "Multi-Capable Airman Rodeo",
      description: "354th Fighter Wing initiative to enhance cross-functional skills",
      link: "https://example.com/rodeo"
    }
  ],
  
  relatedIDIQs: [],
  relatedPrimes: ["Leidos", "Booz Allen Hamilton", "General Dynamics IT"],
  
  suitableStages: ["Early Stage", "Growth", "Established"],
  requiresClearance: false,
  
  opportunityDescription: "Training: VR/AR platforms for cross-functional skill development\nMobile Learning: Apps enabling in-theater, on-demand upskilling\nDigital Readiness: Workforce deployment tools and digital twin readiness solutions",
  
  lastUpdated: new Date("2025-09-01")
};
3. Profile Enhancement System
Company Profile Additions
typescriptinterface CompanyProfile {
  // Existing fields...
  
  // New PACAF-specific fields
  pacafCapabilities: {
    technologyAreas: TechArea[];
    interestedPrograms: string[]; // Program IDs
    programMatches?: ProgramMatch[]; // Cached from last assessment
    lastAssessmentDate?: Date;
  };
  
  pacafReadiness: {
    hasGovernmentExperience: boolean;
    hasSBIRExperience: boolean;
    securityClearance: string;
    activeContracts?: string[];
    pastPerformance?: string[];
  };
  
  tags: string[]; // e.g., ["PACAF-Cyber", "PACAF-Training", "MCA-Aligned"]
}
Coach Profile Additions
typescriptinterface CoachProfile {
  // Existing fields...
  
  // New PACAF-specific fields
  pacafExpertise: {
    programs: string[]; // Program IDs they specialize in
    experienceLevel: "Familiar" | "Experienced" | "Expert";
    successStories: CoachSuccessStory[];
    availableFor: string[]; // e.g., ["1:1 Consulting", "Workshops", "Pitch Review"]
  };
  
  tags: string[]; // e.g., ["PACAF-Expert", "SBIR-Coach", "Cyber-Specialist"]
}

interface CoachSuccessStory {
  companyName?: string; // Optional for privacy
  programName: string;
  outcome: string; // e.g., "SBIR Phase I Award"
  description: string;
  date: Date;
}
```

### 4. PACAF Hub Page Structure

#### URL Structure
```
/pacaf                          # Main hub landing page
/pacaf/matcher                  # Interactive program matcher
/pacaf/programs                 # All programs overview
/pacaf/programs/[slug]          # Individual program detail
/pacaf/opportunities            # Live opportunities feed
/pacaf/companies                # Companies targeting PACAF
/pacaf/coaches                  # Coaches with PACAF expertise
/pacaf/resources                # Downloadable resources
Component Architecture
typescript// Main Hub Page Components
<PacafHub>
  <HeroSection
    title="Navigate $11B+ in PACAF Opportunities"
    subtitle="AI-powered matching to Pacific Air Forces programs"
    cta="Find Your Programs →"
  />
  
  <KeyInsights>
    <StatCard title="Total PACAF Budget" value="$11B+" />
    <StatCard title="Active Programs" value="13+" />
    <StatCard title="Tech Focus Areas" value="5" />
    <StatCard title="Companies Matched" value={companyCount} />
  </KeyInsights>
  
  <ProgramMatcher /> {/* Interactive quiz component */}
  
  <PriorityPrograms>
    {highPriorityPrograms.map(program => (
      <ProgramCard key={program.id} program={program} />
    ))}
  </ProgramMatcher>
  
  <OpportunitiesIntegration>
    {/* Integration with SBIR scraper */}
    <SBIRFeed filter="PACAF-related" limit={5} />
    <Link to="/sbir?filter=pacaf">View All PACAF Opportunities →</Link>
  </OpportunitiesIntegration>
  
  <ExpertCoaches>
    {pacafCoaches.map(coach => (
      <CoachCard key={coach.id} coach={coach} />
    ))}
  </ExpertCoaches>
  
  <CommunityShowcase>
    {/* Featured companies targeting PACAF */}
    <CompanySpotlight />
  </CommunityShowcase>
  
  <ResourceLibrary>
    <ResourceCard
      title="Full PACAF Demand Profile"
      type="PDF"
      description="Complete market intelligence report"
      downloadUrl="/resources/pacaf-demand-profile.pdf"
    />
    <ResourceCard
      title="IDIQ Contracts Reference"
      type="Interactive Table"
      link="/pacaf/resources/idiqs"
    />
    <ResourceCard
      title="Program Comparison Matrix"
      type="Spreadsheet"
      downloadUrl="/resources/pacaf-program-comparison.xlsx"
    />
  </ResourceLibrary>
</PacafHub>
5. SBIR Scraper Integration
Enhancement to Existing SBIR Tool
typescript// Add PACAF-specific filters and tagging
interface SBIROpportunity {
  // Existing fields...
  
  // New PACAF-specific fields
  pacafRelevance?: {
    relatedPrograms: string[]; // Matched program IDs
    relevanceScore: number; // 0-100
    matchingKeywords: string[];
  };
}

// Keyword matching logic
const PACAF_KEYWORDS = {
  "mca-001": [
    "multi-capable",
    "cross-functional training",
    "VR training",
    "AR simulation",
    "airman readiness",
    "agile combat employment"
  ],
  "cyber-001": [
    "cybersecurity",
    "network defense",
    "cyber operations",
    "C2 systems",
    "communications security",
    "joint interoperability"
  ],
  "ngap-001": [
    "aircrew protection",
    "CBRN",
    "protective equipment",
    "decontamination",
    "hazard monitoring"
  ],
  // ... etc for all programs
};

function enrichSBIRWithPacaf(sbir: SBIROpportunity): SBIROpportunity {
  const description = `${sbir.title} ${sbir.description}`.toLowerCase();
  const relatedPrograms: string[] = [];
  const matchingKeywords: string[] = [];
  
  // Check each program's keywords
  Object.entries(PACAF_KEYWORDS).forEach(([programId, keywords]) => {
    const matches = keywords.filter(keyword => 
      description.includes(keyword.toLowerCase())
    );
    
    if (matches.length > 0) {
      relatedPrograms.push(programId);
      matchingKeywords.push(...matches);
    }
  });
  
  if (relatedPrograms.length > 0) {
    sbir.pacafRelevance = {
      relatedPrograms,
      relevanceScore: Math.min(100, relatedPrograms.length * 20 + matchingKeywords.length * 5),
      matchingKeywords
    };
  }
  
  return sbir;
}

// Add filter to existing SBIR page
interface SBIRFilters {
  // Existing filters...
  pacafProgram?: string; // Filter by specific PACAF program
  pacafRelevant?: boolean; // Show only PACAF-relevant opportunities
}
New SBIR Component for PACAF Programs
typescript// Add to individual program pages
<ProgramOpportunities programId={programId}>
  <SBIROpportunitiesFeed
    filter={{
      pacafProgram: programId,
      status: "open"
    }}
    displayMode="compact"
    showAlerts={true}
    emptyState={
      <NoOpportunities>
        <p>No active SBIR opportunities for this program right now.</p>
        <Button onClick={setupAlert}>Get notified when opportunities open</Button>
      </NoOpportunities>
    }
  />
</ProgramOpportunities>
6. Tagging System
Tag Categories
typescripttype TagCategory = 
  | "program"      // e.g., "PACAF-MCA", "PACAF-Cyber"
  | "technology"   // e.g., "AI-ML", "VR-AR", "Cybersecurity"
  | "stage"        // e.g., "SBIR-Phase-I", "Contract-Ready"
  | "clearance"    // e.g., "Secret-Cleared", "Top-Secret"
  | "expertise"    // e.g., "AFWERX-Expert", "OTA-Specialist"
  | "industry";    // e.g., "Defense-Prime", "Dual-Use"

interface Tag {
  id: string;
  label: string;
  category: TagCategory;
  color: string; // For UI display
  description?: string;
}

// Predefined PACAF tags
const PACAF_TAGS: Tag[] = [
  // Program tags
  { id: "tag-mca", label: "MCA Program", category: "program", color: "#3B82F6" },
  { id: "tag-cyber", label: "Cyber Ops", category: "program", color: "#8B5CF6" },
  { id: "tag-ngap", label: "NGAP", category: "program", color: "#10B981" },
  { id: "tag-rap", label: "Ready Aircrew", category: "program", color: "#F59E0B" },
  { id: "tag-tsc", label: "Theater Security", category: "program", color: "#EF4444" },
  
  // Technology tags (from page 16)
  { id: "tag-aiml", label: "AI/ML", category: "technology", color: "#06B6D4" },
  { id: "tag-cyber-tech", label: "Cybersecurity", category: "technology", color: "#8B5CF6" },
  { id: "tag-training", label: "Training & Simulation", category: "technology", color: "#F59E0B" },
  { id: "tag-resilience", label: "Resilience & Well-being", category: "technology", color: "#10B981" },
  { id: "tag-materials", label: "Materials & Sustainment", category: "technology", color: "#6366F1" },
  
  // Stage tags
  { id: "tag-sbir-1", label: "SBIR Phase I Ready", category: "stage", color: "#84CC16" },
  { id: "tag-sbir-2", label: "SBIR Phase II Ready", category: "stage", color: "#22C55E" },
  { id: "tag-ota", label: "OTA Qualified", category: "stage", color: "#14B8A6" },
  
  // Expertise tags (for coaches)
  { id: "tag-afwerx", label: "AFWERX Expert", category: "expertise", color: "#3B82F6" },
  { id: "tag-pacaf-exp", label: "PACAF Experience", category: "expertise", color: "#8B5CF6" },
];
Auto-tagging Logic
typescriptfunction autoTagCompany(company: CompanyProfile): string[] {
  const tags: string[] = [];
  
  // Tag based on program matches
  if (company.pacafCapabilities?.programMatches) {
    company.pacafCapabilities.programMatches
      .filter(match => match.matchScore > 60)
      .forEach(match => {
        tags.push(`program:${match.programId}`);
      });
  }
  
  // Tag based on technology areas
  company.pacafCapabilities?.technologyAreas.forEach(tech => {
    tags.push(`technology:${tech.toLowerCase().replace(/\s+/g, '-')}`);
  });
  
  // Tag based on readiness
  if (company.pacafReadiness?.hasSBIRExperience) {
    tags.push('stage:sbir-experienced');
  }
  
  if (company.pacafReadiness?.securityClearance !== 'None') {
    tags.push(`clearance:${company.pacafReadiness.securityClearance.toLowerCase()}`);
  }
  
  return tags;
}
7. Search and Discovery
Enhanced Search
typescriptinterface SearchQuery {
  text?: string;
  filters: {
    tags?: string[];
    programs?: string[];
    techAreas?: TechArea[];
    companyStage?: string[];
    hasGovernmentExperience?: boolean;
    clearanceLevel?: string[];
  };
  sort: "relevance" | "match-score" | "updated" | "alphabetical";
}

// Example search component
<AdvancedSearch>
  <SearchBar placeholder="Search companies, coaches, or programs..." />
  
  <FilterPanel>
    <FilterGroup label="Programs">
      <CheckboxGroup options={allPrograms} />
    </FilterGroup>
    
    <FilterGroup label="Technology Areas">
      <CheckboxGroup options={techAreas} />
    </FilterGroup>
    
    <FilterGroup label="Experience Level">
      <RadioGroup options={experienceLevels} />
    </FilterGroup>
    
    <FilterGroup label="Security Clearance">
      <CheckboxGroup options={clearanceLevels} />
    </FilterGroup>
  </FilterPanel>
  
  <SearchResults>
    {results.map(result => (
      <SearchResultCard
        key={result.id}
        type={result.type}
        data={result}
        matchScore={result.matchScore}
        highlightedTags={result.matchingTags}
      />
    ))}
  </SearchResults>
</AdvancedSearch>
8. Notification System
Alert Types
typescriptinterface NotificationPreferences {
  userId: string;
  alerts: {
    newSBIROpportunities: {
      enabled: boolean;
      programs: string[]; // Which programs to watch
      frequency: "immediate" | "daily" | "weekly";
    };
    programUpdates: {
      enabled: boolean;
      programs: string[];
    };
    matchingCompanies: {
      enabled: boolean; // New companies that match for teaming
      minMatchScore: number;
    };
    budgetChanges: {
      enabled: boolean;
      programs: string[];
    };
  };
}

interface Notification {
  id: string;
  userId: string;
  type: "sbir-opportunity" | "program-update" | "budget-change" | "company-match";
  title: string;
  message: string;
  link?: string;
  data: any; // Type-specific data
  read: boolean;
  createdAt: Date;
}
Notification Triggers
typescript// Example: New SBIR opportunity matching user's programs
async function checkForNewSBIROpportunities() {
  const newOpportunities = await getSBIRsSince(lastCheckTime);
  
  for (const sbir of newOpportunities) {
    if (sbir.pacafRelevance) {
      // Find users interested in these programs
      const interestedUsers = await findUsersInterestedIn(
        sbir.pacafRelevance.relatedPrograms
      );
      
      for (const user of interestedUsers) {
        await createNotification({
          userId: user.id,
          type: "sbir-opportunity",
          title: "New SBIR Opportunity",
          message: `${sbir.title} matches your interest in ${getProgramNames(sbir.pacafRelevance.relatedPrograms)}`,
          link: `/sbir/${sbir.id}`,
          data: { sbirId: sbir.id, programs: sbir.pacafRelevance.relatedPrograms }
        });
      }
    }
  }
}
API Endpoints
Program Matcher API
typescript// POST /api/pacaf/matcher/assess
// Complete the capability assessment
{
  body: CapabilityAssessment,
  response: {
    matches: ProgramMatch[],
    recommendations: string[],
    nextSteps: string[]
  }
}

// GET /api/pacaf/programs
// Get all programs with optional filtering
{
  query: {
    category?: "high-priority" | "additional-opportunity",
    techArea?: TechArea,
    minBudget?: number
  },
  response: PACAFProgram[]
}

// GET /api/pacaf/programs/:id
// Get detailed program information
{
  params: { id: string },
  response: PACAProgram & {
    relatedCompanies: CompanyProfile[],
    relatedCoaches: CoachProfile[],
    activeOpportunities: SBIROpportunity[]
  }
}

// POST /api/pacaf/profile/update
// Update user's PACAF-specific profile fields
{
  body: {
    capabilities?: Partial<CompanyProfile['pacafCapabilities']>,
    readiness?: Partial<CompanyProfile['pacafReadiness']>
  },
  response: { success: boolean, updatedProfile: CompanyProfile }
}

// GET /api/pacaf/opportunities
// Get SBIR opportunities with PACAF relevance
{
  query: {
    programId?: string,
    status?: "open" | "closed" | "all",
    limit?: number
  },
  response: SBIROpportunity[]
}

// POST /api/pacaf/notifications/preferences
// Update notification preferences
{
  body: NotificationPreferences,
  response: { success: boolean }
}

// GET /api/pacaf/search
// Advanced search across companies, coaches, programs
{
  query: SearchQuery,
  response: {
    companies: CompanyProfile[],
    coaches: CoachProfile[],
    programs: PACAProgram[],
    totalResults: number
  }
}
Database Schema
sql-- Programs table
CREATE TABLE pacaf_programs (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  overview TEXT,
  problem_need JSONB,
  objectives JSONB,
  tech_focus_areas JSONB,
  specific_technologies JSONB,
  managed_by VARCHAR(255),
  engagement_pathways JSONB,
  types_of_companies_needed JSONB,
  budget_range VARCHAR(100),
  typical_contract_size VARCHAR(100),
  typical_time_to_award VARCHAR(100),
  funding_initiatives JSONB,
  related_idiqs JSONB,
  related_primes JSONB,
  suitable_stages JSONB,
  requires_clearance BOOLEAN,
  opportunity_description TEXT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Capability assessments table
CREATE TABLE pacaf_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) REFERENCES users(id),
  responses JSONB NOT NULL,
  match_scores JSONB NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company PACAF profiles (extends existing company profile)
CREATE TABLE company_pacaf_profiles (
  company_id VARCHAR(50) PRIMARY KEY REFERENCES companies(id),
  technology_areas JSONB,
  interested_programs JSONB,
  program_matches JSONB,
  last_assessment_date TIMESTAMP,
  has_government_experience BOOLEAN,
  has_sbir_experience BOOLEAN,
  security_clearance VARCHAR(50),
  active_contracts JSONB,
  past_performance JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coach PACAF profiles (extends existing coach profile)
CREATE TABLE coach_pacaf_profiles (
  coach_id VARCHAR(50) PRIMARY KEY REFERENCES coaches(id),
  specialist_programs JSONB,
  experience_level VARCHAR(50),
  success_stories JSONB,
  available_for JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
  id VARCHAR(50) PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  color VARCHAR(20),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Entity tags (many-to-many)
CREATE TABLE entity_tags (
  entity_id VARCHAR(50) NOT NULL,
  entity_type VARCHAR(20) NOT NULL, -- 'company', 'coach', 'program'
  tag_id VARCHAR(50) REFERENCES tags(id),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entity_id, entity_type, tag_id)
);

-- Notifications table
CREATE TABLE pacaf_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification preferences table
CREATE TABLE notification_preferences (
  user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id),
  preferences JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SBIR PACAF relevance (extends existing SBIR data)
CREATE TABLE sbir_pacaf_relevance (
  sbir_id VARCHAR(100) PRIMARY KEY,
  related_programs JSONB,
  relevance_score INTEGER,
  matching_keywords JSONB,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_company_tech_areas ON company_pacaf_profiles USING GIN (technology_areas);
CREATE INDEX idx_company_interested_programs ON company_pacaf_profiles USING GIN (interested_programs);
CREATE INDEX idx_coach_programs ON coach_pacaf_profiles USING GIN (specialist_programs);
CREATE INDEX idx_entity_tags_entity ON entity_tags(entity_id, entity_type);
CREATE INDEX idx_notifications_user_unread ON pacaf_notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_sbir_relevance_programs ON sbir_pacaf_relevance USING GIN (related_programs);

Content Integration Strategies
1. Interactive Program Matcher
Create a dynamic tool where companies can:

Input their technology capabilities (AI/ML, cybersecurity, training/simulation, etc.)
Get matched with relevant PACAF programs
See their alignment score with specific opportunities
Export a customized report with their top 3-5 program matches

2. Layered Content Architecture
Level 1 - Quick Wins (Free, Public)

PACAF overview infographic
Top 6 priority programs summary
Cross-cutting tech opportunities diagram (from page 16)
Budget trends visualization

Level 2 - Deep Dives (Gated for Community Members)

Full program profiles with problem/objective/opportunity breakdowns
Engagement pathway guides
Contracting vehicle information (IDIQs)
Company examples already working with PACAF

Level 3 - Actionable Intelligence (Premium/Active Members)

Quarterly updates on program developments
POC contact information
Pitch deck templates tailored to specific programs
Success stories and lessons learned

3. Community Engagement Features
Discussion Forums by Program
Create dedicated spaces for:

Multi-Capable Airman (MCA) opportunities
Cyber programs (A6, CCEP)
Training & simulation needs
Each major program area

Office Hours/AMAs
Host monthly sessions with:

Companies who've won contracts in these areas
Former PACAF personnel who understand the buying process
Your coaches who specialize in DoD sales

4. Smart Notification System
Alert companies when:

New RFIs/RFPs drop for programs they're matched with
Related SBIR/STTR topics open
Similar companies close deals (inspiration + validation)
Budget changes affect their target programs

5. Value-Add Tools
Capability Statement Generator
Pre-populated templates that:

Reference specific PACAF pain points from the report
Use language from program objectives
Highlight relevant past performance areas
Format for government buyers

Competitive Landscape Mapping
Show companies:

Prime contractors already working with target programs (page 17)
Potential teaming partners in your community
White space opportunities

ROI Calculator
Help companies prioritize by showing:

Program budget sizes
Typical contract values
Time to award
Competition levels

6. Lead Generation Integration
Coach Profiles Enhancement

Tag coaches with PACAF program expertise
Show which programs they've helped companies win
Create "Ask Me About..." badges (e.g., "Ask Me About NGAP")

Company Profiles Enhancement

Let companies self-identify target PACAF programs
Display capability alignment scores
Enable filtered searches ("Show me all companies targeting cyber programs")

7. Content Series to Drive Traffic
Weekly "Program Spotlight" Campaign

Deep dive on one program per week
Email + social media push
Feature a company from your community pursuing it
Include a coach commentary

Monthly "Funding Alert"

Highlight upcoming opportunities
Recent awards analysis
Budget movement tracking

Quarterly "Market Intelligence Brief"

Synthesize what's changed
Emerging needs analysis
Strategic recommendations

8. Partnership Opportunities Page
Create a dedicated section showing:

Prime Partnerships: List primes working with PACAF who might need subs
Teaming Opportunities: Match complementary companies in your community
Technology Bundles: Show how 2-3 technologies could combine for bigger impact

Example: "Companies offering training simulation + AI/ML + cyber together could address the complete MCA program need"
9. Gamification Elements

Readiness Score: Rate how "PACAF-ready" a company is
Action Items: Checklist of steps to pursue each program
Progress Tracking: Show companies advancing through the process
Community Leaders: Highlight most active/helpful members

10. Launch Strategy
Week 1: Teaser Campaign

"We surveyed PACAF programs and found $XXM in opportunities"
Share the budget trends chart
Drive to landing page for full access

Week 2: Program Matcher Launch

Big splash announcement
Challenge: "Find your perfect PACAF program in 3 minutes"
Incentive: First 50 companies get free 1:1 review with a coach

Week 3: Community Showcase

Feature 3-5 companies from your community
Show how the intelligence applies to their specific tech
Include coach commentary on their approach

Week 4: Deep Dive Workshop

Live walkthrough of the full report
Q&A with PACAF expertise
Announce ongoing content calendar

Technical Implementation
Quick Wins (Week 1-2)

Create a dedicated PACAF hub page
Upload PDF with interactive table of contents
Add capability matcher quiz (Typeform/Jotform)
Set up email capture

Medium Term (Month 1-2)

Build discussion forums
Implement tagging system
Create coach/company profile enhancements
Launch content series

Long Term (Month 3+)

Build full matchmaking algorithm
Implement notification system
Develop partnership marketplace
Add competitive intelligence layer

Measurement Strategy
Track:

Engagement: Time on PACAF pages, downloads, quiz completions
Community Activity: Forum posts, connections made, events attended
Business Outcomes: Proposals submitted, contracts won, partnerships formed
Content Performance: Which programs get most interest
Conversion: Free → active community member → successful contract

Monetization Angles (Future)
While starting free:

Premium tier: Quarterly updates, direct coach access, proprietary market intelligence
Corporate partnerships: Primes paying for access to your vetted companies
Event sponsorships: Program-specific deep dives sponsored by relevant companies
Recruitment: PACAF or primes recruiting from your talent pool


Immediate Next Step: I'd recommend starting with the Interactive Program Matcher + Launch Campaign. This gives quick value, drives engagement, and helps you learn what your community cares about most. The data from the matcher will tell you which programs to focus your ongoing content on.
Would you like me to help you design the Program Matcher quiz or draft the launch campaign messaging?RetryPThis is great. Tech implementation the discussion forum and conversation can come later. I expect that will be in the form of a Signal derivative like Element (matrix). The ability to enhance profiles and tagging is great. The Long term is outstanding. We have another off the shelf capability I built that I can integrate into this tool which is a DSIP SIBR scraper here:
https://www.mergecombinator.com/sbir
I also have a very popular customGPT that a few folks "swear by." 
Create one or more artifacts so I can hand this off to claude code and other AI coding agents to build as a part of our existing platform.Architected modular technical specifications for AI coding agent handoff.The user wants me to create artifacts that can be handed off to Claude Code and other AI coding agents to build features for their existing platform. They want to integrate:

A PACAF program matcher/hub
Profile enhancements with tagging
Integration with their existing SBIR scraper at mergecombinator.com/sbir
Potentially integrate with their customGPT

They want practical, implementable specifications that coding agents can work from. I should create:

A comprehensive technical specification document
A database schema
API specifications
UI/UX wireframes or component specifications
Integration specifications for the SBIR scraper

Let me create multiple artifacts that break this down into actionable pieces for AI coding agents.I'll create comprehensive specifications that you can hand off to Claude Code and other AI agents. These will be structured for easy implementation into your existing platform.
<create_file>
<parameter name="path">/mnt/user-data/outputs/pacaf-hub-technical-spec.md</parameter>
<parameter name="content"># PACAF Intelligence Hub - Technical Specification

Implementation Phases
Phase 1: Foundation (Week 1-2)

 Set up database tables and relationships
 Populate PACAF programs database (13 programs from PDF)
 Create PACAF hub landing page
 Build basic program listing and detail pages

Phase 2: Matcher & Profiles (Week 3-4)

 Implement capability assessment quiz
 Build matching algorithm
 Add PACAF fields to company profiles
 Add PACAF fields to coach profiles
 Create results/recommendations page

Phase 3: Integration & Discovery (Week 5-6)

 Integrate with existing SBIR scraper
 Implement tagging system
 Build advanced search functionality
 Add filtering to company/coach directories

Phase 4: Engagement & Notifications (Week 7-8)

 Implement notification system
 Build notification preferences UI
 Create email templates for alerts
 Add "Save to Profile" functionality

Testing Checklist

 Program matcher produces accurate scores
 All 13 programs display correctly with full data
 Company profiles save and display PACAF data
 Coach profiles show expertise correctly
 SBIR integration shows relevant opportunities
 Tags auto-apply correctly
 Search returns accurate results
 Notifications trigger appropriately
 Mobile responsive on all new pages
 Performance: Page loads under 2 seconds

Analytics to Track
typescript// Key metrics for measuring success
interface PACMetrics {
  // Engagement
  totalAssessments: number;
  averageCompletionRate: number; // % who finish the quiz
  averageTimeOnPacafPages: number;
  
  // Matching
  averageMatchScore: number;
  mostPopularPrograms: { programId: string, count: number }[];
  companiesWithMatches: number;
  
  // Profile adoption
  companiesWithPacafProfiles: number;
  coachesWithPacafExpertise: number;
  
  // Opportunity engagement
  sbirClickthroughRate: number;
  programDetailViews: { programId: string, views: number }[];
  
  // Community
  companyToCoachConnections: number;
  companyToCompanyTeaming: number;
}
CustomGPT Integration Points
Your existing customGPT can be enhanced with:

Direct API calls to pull live program data
Context injection - Feed it specific program details for deeper guidance
Embedding on program pages - Let users ask questions about specific programs
Enhanced prompts - System messages that include PACAF program structure

typescript// Example: Enhanced GPT system message
const enhancedSystemMessage = `
You are an expert in helping defense tech companies navigate PACAF (Pacific Air Forces) opportunities.

You have access to detailed information about ${programs.length} PACAF programs, including:
- Program objectives and pain points
- Technology requirements
- Engagement pathways (SBIR, OTA, direct contracts)
- Budget information
- Typical timelines

Current user context:
- Company: ${company.name}
- Technologies: ${company.pacafCapabilities.technologyAreas.join(', ')}
- Top matched programs: ${company.pacafCapabilities.programMatches?.slice(0, 3).map(m => m.programName).join(', ')}

Help them:
1. Understand which PACAF programs best fit their capabilities
2. Navigate the engagement process (SBIR, OTA, direct)
3. Craft compelling proposals that address specific program needs
4. Connect with relevant coaches and partners in the community
