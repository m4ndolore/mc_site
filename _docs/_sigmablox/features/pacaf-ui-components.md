* PACAF Hub UI Components
 * 
 * React/TypeScript components for the PACAF Intelligence Hub
 * Compatible with Next.js, Remix, or any React framework
 */

import React, { useState } from 'react';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

type TechArea = 
  | "AI/ML"
  | "Cybersecurity & Communications"
  | "Training & Simulation"
  | "Resilience & Well-being"
  | "Materials & Sustainment";

interface PACAProgram {
  id: string;
  name: string;
  slug: string;
  category: "high-priority" | "additional-opportunity";
  overview: string;
  problemNeed: string[];
  objectives: string[];
  techFocusAreas: TechArea[];
  specificTechnologies: string[];
  managedBy: string;
  engagementPathways: string[];
  typesOfCompaniesNeeded: string[];
  budgetRange?: string;
  typicalTimeToAward: string;
  fundingInitiatives: FundingInitiative[];
  suitableStages: string[];
  requiresClearance: boolean;
  opportunityDescription: string;
}

interface FundingInitiative {
  title: string;
  amount?: string;
  description: string;
  link?: string;
}

interface ProgramMatch {
  programId: string;
  programName: string;
  matchScore: number;
  alignmentFactors: string[];
  missingCapabilities: string[];
  recommendedNextSteps: string[];
}

interface AssessmentQuestion {
  id: string;
  question: string;
  type: "multi-select" | "single-select" | "boolean";
  options?: string[];
  field: string;
}

// ==========================================
// PROGRAM MATCHER COMPONENTS
// ==========================================

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "tech-areas",
    question: "Which technology areas does your company specialize in?",
    type: "multi-select",
    field: "technologyAreas",
    options: [
      "AI/ML",
      "Cybersecurity & Communications",
      "Training & Simulation",
      "Resilience & Well-being",
      "Materials & Sustainment"
    ]
  },
  {
    id: "company-stage",
    question: "What stage is your company currently at?",
    type: "single-select",
    field: "companyStage",
    options: ["Early Stage", "Growth", "Established"]
  },
  {
    id: "gov-experience",
    question: "Does your company have previous government contracting experience?",
    type: "boolean",
    field: "hasGovernmentExperience"
  },
  {
    id: "sbir-experience",
    question: "Have you completed SBIR Phase I or II awards?",
    type: "boolean",
    field: "hasSBIRExperience"
  },
  {
    id: "timeframe",
    question: "What's your target timeframe for pursuing opportunities?",
    type: "single-select",
    field: "targetTimeframe",
    options: ["0-6 months", "6-12 months", "12-24 months", "24+ months"]
  },
  {
    id: "clearance",
    question: "Does your team have security clearances?",
    type: "single-select",
    field: "securityClearance",
    options: ["None", "Secret", "Top Secret", "TS/SCI"]
  },
  {
    id: "primary-focus",
    question: "What's your primary product/service focus?",
    type: "multi-select",
    field: "primaryFocus",
    options: [
      "Training Systems",
      "Cybersecurity Solutions",
      "Hardware/Equipment",
      "Software Platforms",
      "Consulting Services",
      "Infrastructure"
    ]
  }
];

export const ProgramMatcher: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<any>({});
  const [matches, setMatches] = useState<ProgramMatch[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestion = ASSESSMENT_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / ASSESSMENT_QUESTIONS.length) * 100;

  const handleResponse = (value: any) => {
    setResponses({ ...responses, [currentQuestion.field]: value });
  };

  const handleNext = async () => {
    if (currentStep < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit assessment
      setIsLoading(true);
      try {
        const result = await fetch('/api/pacaf/matcher/assess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responses })
        });
        const data = await result.json();
        setMatches(data.matches);
      } catch (error) {
        console.error('Assessment failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (matches) {
    return <MatchResults matches={matches} responses={responses} />;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentStep + 1} of {ASSESSMENT_QUESTIONS.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {currentQuestion.question}
        </h2>

        {currentQuestion.type === "multi-select" && (
          <MultiSelectOptions
            options={currentQuestion.options!}
            selected={responses[currentQuestion.field] || []}
            onChange={handleResponse}
          />
        )}

        {currentQuestion.type === "single-select" && (
          <SingleSelectOptions
            options={currentQuestion.options!}
            selected={responses[currentQuestion.field]}
            onChange={handleResponse}
          />
        )}

        {currentQuestion.type === "boolean" && (
          <BooleanOptions
            selected={responses[currentQuestion.field]}
            onChange={handleResponse}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!responses[currentQuestion.field] || isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing...' : currentStep === ASSESSMENT_QUESTIONS.length - 1 ? 'Get My Matches' : 'Next'}
        </button>
      </div>
    </div>
  );
};

const MultiSelectOptions: React.FC<{
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
}> = ({ options, selected, onChange }) => {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(o => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-3">
      {options.map(option => (
        <label
          key={option}
          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selected.includes(option)
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => toggleOption(option)}
            className="h-5 w-5 text-blue-600 rounded"
          />
          <span className="ml-3 text-gray-900 font-medium">{option}</span>
        </label>
      ))}
    </div>
  );
};

const SingleSelectOptions: React.FC<{
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}> = ({ options, selected, onChange }) => {
  return (
    <div className="space-y-3">
      {options.map(option => (
        <label
          key={option}
          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selected === option
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            checked={selected === option}
            onChange={() => onChange(option)}
            className="h-5 w-5 text-blue-600"
          />
          <span className="ml-3 text-gray-900 font-medium">{option}</span>
        </label>
      ))}
    </div>
  );
};

const BooleanOptions: React.FC<{
  selected: boolean;
  onChange: (value: boolean) => void;
}> = ({ selected, onChange }) => {
  return (
    <div className="flex gap-4">
      <button
        onClick={() => onChange(true)}
        className={`flex-1 p-6 border-2 rounded-lg font-medium transition-all ${
          selected === true
            ? 'border-blue-600 bg-blue-50 text-blue-900'
            : 'border-gray-200 text-gray-700 hover:border-gray-300'
        }`}
      >
        Yes
      </button>
      <button
        onClick={() => onChange(false)}
        className={`flex-1 p-6 border-2 rounded-lg font-medium transition-all ${
          selected === false
            ? 'border-blue-600 bg-blue-50 text-blue-900'
            : 'border-gray-200 text-gray-700 hover:border-gray-300'
        }`}
      >
        No
      </button>
    </div>
  );
};

// ==========================================
// MATCH RESULTS COMPONENTS
// ==========================================

const MatchResults: React.FC<{
  matches: ProgramMatch[];
  responses: any;
}> = ({ matches, responses }) => {
  const topMatches = matches.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Your PACAF Program Matches
        </h1>
        <p className="text-xl text-gray-600">
          Based on your capabilities, here are your top {topMatches.length} program matches
        </p>
      </div>

      <div className="space-y-6">
        {topMatches.map((match, index) => (
          <ProgramMatchCard key={match.programId} match={match} rank={index + 1} />
        ))}
      </div>

      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-4">Next Steps</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">→</span>
            <span className="text-blue-900">Save these matches to your profile to track opportunities</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">→</span>
            <span className="text-blue-900">Connect with coaches who specialize in your top-matched programs</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">→</span>
            <span className="text-blue-900">Explore current SBIR opportunities related to these programs</span>
          </li>
        </ul>
        <div className="mt-6 flex gap-4">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            Save to Profile
          </button>
          <button className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50">
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
};

const ProgramMatchCard: React.FC<{
  match: ProgramMatch;
  rank: number;
}> = ({ match, rank }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-blue-600">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
              #{rank}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {match.programName}
              </h3>
              <div className="flex items-center gap-4">
                <MatchScoreBadge score={match.matchScore} />
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {expanded ? 'Show Less' : 'Show Details'}
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Why This Matches:</h4>
          <ul className="space-y-1">
            {match.alignmentFactors.map((factor, i) => (
              <li key={i} className="flex items-start text-gray-600">
                <span className="text-green-500 mr-2">✓</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>

        {expanded && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {match.missingCapabilities.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Areas to Develop:</h4>
                <ul className="space-y-1">
                  {match.missingCapabilities.map((cap, i) => (
                    <li key={i} className="flex items-start text-gray-600">
                      <span className="text-yellow-500 mr-2">!</span>
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Recommended Next Steps:</h4>
              <ol className="space-y-2">
                {match.recommendedNextSteps.map((step, i) => (
                  <li key={i} className="flex items-start text-gray-600">
                    <span className="font-medium text-blue-600 mr-2">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          
            href={`/pacaf/programs/${match.programId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            View Program Details
          </a>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
            Find Related Coaches
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
            See Active Opportunities
          </button>
        </div>
      </div>
    </div>
  );
};

const MatchScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Potential Match';
    return 'Low Match';
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getScoreColor(score)}`}>
      <span className="font-bold text-lg">{score}</span>
      <span className="text-sm font-medium">{getScoreLabel(score)}</span>
    </div>
  );
};

// ==========================================
// PROGRAM CARD COMPONENTS
// ==========================================

export const ProgramCard: React.FC<{ program: PACAProgram }> = ({ program }) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">{program.name}</h3>
        {program.category === 'high-priority' && (
          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
            HIGH PRIORITY
          </span>
        )}
      </div>

      <p className="text-gray-600 mb-4 line-clamp-3">{program.overview}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {program.techFocusAreas.map(tech => (
          <span key={tech} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            {tech}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {program.budgetRange && <span className="font-medium">{program.budgetRange}</span>}
          {program.typicalTimeToAward && (
            <span className="ml-2">• {program.typicalTimeToAward} timeline</span>
          )}
        </div>
        
          href={`/pacaf/programs/${program.slug}`}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          Learn More →
        </a>
      </div>
    </div>
  );
};

// ==========================================
// PROGRAM DETAIL PAGE
// ==========================================

export const ProgramDetailPage: React.FC<{ program: PACAProgram }> = ({ program }) => {
  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-4xl font-bold text-gray-900">{program.name}</h1>
          {program.category === 'high-priority' && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
              HIGH PRIORITY
            </span>
          )}
        </div>
        <p className="text-xl text-gray-600">{program.overview}</p>
      </div>

      {/* Key Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium mb-1">Managed By</div>
          <div className="text-gray-900 font-semibold">{program.managedBy}</div>
        </div>
        {program.budgetRange && (
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium mb-1">Budget Range</div>
            <div className="text-gray-900 font-semibold">{program.budgetRange}</div>
          </div>
        )}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium mb-1">Time to Award</div>
          <div className="text-gray-900 font-semibold">{program.typicalTimeToAward}</div>
        </div>
      </div>

      {/* Problem/Need */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Problem / Need</h2>
        <ul className="space-y-2">
          {program.problemNeed.map((need, i) => (
            <li key={i} className="flex items-start">
              <span className="text-red-500 mr-2 mt-1">●</span>
              <span className="text-gray-700">{need}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Objectives */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Objectives</h2>
        <ul className="space-y-2">
          {program.objectives.map((objective, i) => (
            <li key={i} className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              <span className="text-gray-700">{objective}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Technology Focus */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Technology Requirements</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Focus Areas:</h3>
            <div className="flex flex-wrap gap-2">
              {program.techFocusAreas.map(tech => (
                <span key={tech} className="px-3 py-1 bg-blue-100 text-blue-700 font-medium rounded-lg">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Specific Technologies:</h3>
            <ul className="space-y-1">
              {program.specificTechnologies.map((tech, i) => (
                <li key={i} className="text-gray-600">• {tech}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Companies Needed */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Types of Companies Needed</h2>
        <div className="flex flex-wrap gap-3">
          {program.typesOfCompaniesNeeded.map(type => (
            <span key={type} className="px-4 py-2 bg-purple-100 text-purple-800 font-medium rounded-lg">
              {type}
            </span>
          ))}
        </div>
      </section>

      {/* Engagement Pathways */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Engagement Pathways</h2>
        <div className="bg-blue-50 rounded-lg p-6">
          <ul className="space-y-2">
            {program.engagementPathways.map((pathway, i) => (
              <li key={i} className="flex items-start">
                <span className="text-blue-600 mr-2 mt-1">→</span>
                <span className="text-gray-700">{pathway}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Funding Initiatives */}
      {program.fundingInitiatives.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Funding & Initiatives</h2>
          <div className="space-y-4">
            {program.fundingInitiatives.map((initiative, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{initiative.title}</h3>
                    {initiative.amount && (
                      <div className="text-green-600 font-bold mb-2">{initiative.amount}</div>
                    )}
                    <p className="text-gray-600">{initiative.description}</p>
                  </div>
                  {initiative.link && (
                    
                      href={initiative.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                    >
                      Learn More →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Ready to Pursue This Opportunity?</h2>
        <p className="mb-6 text-blue-100">
          Connect with experts, find teaming partners, and access SBIR opportunities related to this program.
        </p>
        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50">
            Find Coaches
          </button>
          <button className="px-6 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-blue-500">
            See Active SBIRs
          </button>
          <button className="px-6 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-blue-500">
            Find Teaming Partners
          </button>
        </div>
      </section>
    </div>
  );
};

// ==========================================
// SBIR INTEGRATION COMPONENT
// ==========================================

export const ProgramSBIRFeed: React.FC<{
  programId: string;
  limit?: number;
}> = ({ programId, limit = 5 }) => {
  // This would integrate with your existing SBIR scraper
  // For now, showing the interface
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Active SBIR Opportunities</h3>
        <a href={`/sbir?program=${programId}`} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          View All →
        </a>
      </div>
      
      <div className="space-y-4">
        {/* SBIR items would be mapped here from your existing scraper */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900">
              Sample SBIR Title Related to This Program
            </h4>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
              OPEN
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-2">
            Brief description of the SBIR opportunity...
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Phase I</span>
            <span>•</span>
            <span>Closes: Jan 15, 2026</span>
            <span>•</span>
            <span className="text-blue-600">85% Relevance</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          Set up alerts for new opportunities →
        </button>
      </div>
    </div>
  );
};
