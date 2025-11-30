// PACAF Hub Matcher Component (MVP + Week 2 Visionary Features)

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser } from '@/lib/hooks/useUser';

const mockPrograms = [
  { id: 'pacaf-001', title: 'Base Resiliency AI Toolkit', keywords: ['resilience', 'infra', 'AI'] },
  { id: 'pacaf-002', title: 'Comms Interop Layer', keywords: ['mesh', 'C2', 'satcom'] },
  { id: 'pacaf-003', title: 'Edge ISR Enhancements', keywords: ['edge', 'ISR', 'compute'] },
];

export default function PacafMatcher() {
  const { user, isAuthenticated } = useUser();
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [saved, setSaved] = useState(() => new Set());

  const handleMatch = () => {
    const q = query.toLowerCase();
    const results = mockPrograms.filter((p) =>
      p.keywords.some((kw) => kw.toLowerCase().includes(q))
    );
    setMatches(results);
  };

  const handleSave = (id) => {
    if (!isAuthenticated) {
      alert('Please login to save matches to your profile.');
      return;
    }
    setSaved((prev) => new Set(prev).add(id));
    // TODO: Call backend to persist save to user profile
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">PACAF Hub Matcher</h1>
      <p className="text-sm text-gray-600 mb-6">
        Enter your core tech focus or keyword. We’ll match you to relevant PACAF needs.
      </p>

      <div className="flex space-x-2 mb-4">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. AI, satcom, ISR" />
        <Button onClick={handleMatch}>Match</Button>
      </div>

      {matches.length > 0 && (
        <div className="space-y-4">
          {matches.map((program) => (
            <Card key={program.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-lg">{program.title}</h2>
                    <p className="text-xs text-gray-500">Keywords: {program.keywords.join(', ')}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleSave(program.id)}
                    disabled={saved.has(program.id)}
                  >
                    {saved.has(program.id) ? 'Saved' : 'Save to Profile'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
