# Company Combine Post Template

This template shows how to create a Ghost post for a company profile on The Combine.

## Ghost Post Structure

### Title
`[Company Name]: [Product Name] - [One-line pitch]`

Example: `Cachai: AI-Powered Threat Detection - Real-time intelligence for modern defense`

### Featured Image
Company logo or product screenshot (recommended: 1200x630px)

### Tags
- `combine`
- `[mission-area]` (e.g., `C2`, `Fires`, `Autonomy`, `Plans`)
- `[cohort-name]` (e.g., `2024-Q4`)

### Custom Excerpt
The problem statement from the company profile (used for previews)

---

## Post Content Template

```markdown
# [Company Name]: [Product Name]

> [One-line pitch / tagline]

**Mission Area:** [Primary Mission Area] | **Team Size:** [X] people | **TRL:** [Level]

---

## The Problem

[Detailed problem statement - 2-3 paragraphs explaining the challenge this company is addressing]

[Auto-populated from: `company.problemStatement`]

---

## Our Solution

[Description of the product/solution - 2-4 paragraphs]

[Auto-populated from: `company.solution` or `company.description`]

**Key Features:**
- [Feature 1]
- [Feature 2]
- [Feature 3]

---

## Technical Approach

**Technology Readiness Level:** TRL [X]

[Details about technical maturity, system architecture, etc.]

[Auto-populated from: `company.technicalMaturity`, `company.trlLevel`]

---

## Team & Background

**Founded:** [Year]
**Location:** [City, State]
**Team Size:** [X] people

[Brief team background, founder bios, relevant experience]

[Auto-populated from: `company.teamSize`, `company.location`, `company.contactName`]

---

## Use Cases

[Specific applications or scenarios where this solution is deployed or intended]

[Auto-populated from: `company.useCases` array]

---

## Current Status & Milestones

- **Current Stage:** [Development/Testing/Deployed]
- **Recent Achievements:** [Major milestones]
- **Next Steps:** [Upcoming goals]

---

## Get Involved

**Website:** [company.website]
**Contact:** [company.email]

**Looking for:**
- [Pilot programs]
- [Strategic partnerships]
- [Investment]
- [Technical talent]

---

## Additional Resources

[Links to demos, whitepapers, case studies, etc.]
```

---

## Example: Cachai Combine Post

Below is a fully populated example for a fictional defense tech company:

```markdown
# Cachai: AI-Powered Threat Detection - Real-time intelligence for modern defense

> Autonomous threat detection that sees what humans miss

**Mission Area:** C2 (Command & Control) | **Team Size:** 12 people | **TRL:** 6

---

## The Problem

Modern defense operations face an overwhelming volume of sensor data, video feeds, and intelligence reports. Human analysts can't process information quickly enough to identify threats in real-time, leading to delayed responses and missed opportunities for preemptive action.

Traditional systems rely on pre-programmed rules and signatures, which fail against novel threats and adaptive adversaries. Warfighters need AI-powered decision support that can analyze multiple data streams simultaneously, identify patterns, and surface critical threats instantly.

---

## Our Solution

Cachai is an AI-powered threat detection platform that processes multi-modal sensor data in real-time to identify, classify, and prioritize threats. Our system combines computer vision, signal processing, and machine learning to provide actionable intelligence to command and control operations.

The platform integrates seamlessly with existing C2 systems, augmenting human decision-making with AI-driven insights. Cachai learns from operator feedback, continuously improving its detection accuracy and reducing false positives.

**Key Features:**
- Real-time multi-sensor fusion (EO/IR, radar, signals intelligence)
- Adaptive threat classification using deep learning
- Automatic alert prioritization based on mission context
- Explainable AI interface showing detection reasoning
- Edge deployment for contested environments

---

## Technical Approach

**Technology Readiness Level:** TRL 6

Cachai has been validated in relevant environments and is currently undergoing operational testing with partner units. Our core ML models achieve 94% detection accuracy with a false positive rate under 2%.

The system is built on a modular architecture that allows for rapid integration of new sensor types and threat models. Our edge computing approach enables operation in denied/degraded environments without cloud connectivity.

---

## Team & Background

**Founded:** 2023
**Location:** San Diego, CA
**Team Size:** 12 people

Our founding team includes former intelligence analysts, computer vision researchers from leading universities, and defense contractors with experience deploying AI systems in operational environments. Combined, we have over 50 years of experience in military intelligence and machine learning.

---

## Use Cases

- **Counter-UAS Operations:** Detecting and classifying small drones in complex airspace
- **Border Security:** Automated monitoring of remote border regions
- **Force Protection:** Perimeter security for forward operating bases
- **Maritime Surveillance:** Tracking suspicious vessel behavior in contested waters
- **Intelligence Analysis:** Accelerating analyst workflows with AI-assisted triage

---

## Current Status & Milestones

- **Current Stage:** Operational testing with government partners
- **Recent Achievements:**
  - Completed successful field trials with USINDOPACOM
  - Achieved Authority to Operate (ATO) for DoD networks
  - Secured $2.5M SBIR Phase II award
- **Next Steps:**
  - Scale to multi-theater deployment
  - Integrate additional sensor types
  - Expand team with ML engineers and field support specialists

---

## Get Involved

**Website:** https://cachai.ai
**Contact:** founders@cachai.ai

**Looking for:**
- Pilot programs with operational units
- Strategic partnerships with prime contractors
- Series A investment ($5-8M round)
- ML engineers with defense clearances

---

## Additional Resources

- [Product Demo Video](link)
- [Technical Whitepaper](link)
- [Case Study: Counter-UAS Field Trial](link)
```

---

## Instructions for Creating a Company Combine Post

### In Ghost Admin:

1. **Create New Post**
   - Go to Ghost Admin → Posts → New Post
   - Use template above as starting point

2. **Set Post URL**
   - Custom URL: `/combine/[company-slug]/`
   - Example: `/combine/cachai/`

3. **Add Tags**
   - `combine` (required)
   - Mission area tag
   - Cohort tag

4. **Featured Image**
   - Upload company logo or product screenshot
   - Alt text: "[Company Name] - [Product Name]"

5. **Publish Settings**
   - Published date: Company's profile date or cohort start date
   - Visibility: Public
   - Featured: Yes (to show in The Combine feed)

### Auto-Population from Company Data

When creating posts programmatically, map these fields:

```javascript
{
  title: `${company.companyName}: ${company.productName} - ${company.oneLiner}`,
  excerpt: company.problemStatement,
  tags: ['combine', company.missionArea, company.cohortId],
  customUrl: `/combine/${generateSlug(company.companyName)}/`,

  // Content sections:
  problem: company.problemStatement,
  solution: company.solution || company.description,
  trl: company.trlLevel,
  technicalApproach: company.technicalMaturity,
  teamSize: company.teamSize,
  location: company.location,
  useCases: company.useCases,
  website: company.website,
  contact: company.email
}
```

### Fallback Behavior

If no combine post exists for a company:
- Clicking the company card opens the modal (current behavior)
- OR redirect to a generic "Combine Post Coming Soon" page
- OR auto-generate a basic post from company data
