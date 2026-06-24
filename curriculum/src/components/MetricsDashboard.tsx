import { useEffect, useState } from 'react';

export interface CurriculumMetrics {
  triageCompletes: number;
  curriculumViews: number;
  contentClicks: number;
  contentEngaged: number;
  signupPrompts: number;
  signupClicks: number;
  advisoryClicks: number;
  advanceRequests: number;
  stageDistribution: Record<string, number>;
  topResources: Record<string, number>;
}

export function MetricsDashboard({ adminToken }: { adminToken: string }) {
  const [metrics, setMetrics] = useState<CurriculumMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/curriculum/metrics', {
      headers: { 'X-Admin-Token': adminToken },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setMetrics)
      .catch((e) => {
        console.error('Failed to load metrics:', e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [adminToken]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading metrics...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--red)' }}>Error: {error}</div>;
  if (!metrics) return <div style={{ padding: '2rem' }}>No metrics available</div>;

  const conversionFunnel = [
    { label: 'Triage Completes', value: metrics.triageCompletes },
    { label: 'Curriculum Views', value: metrics.curriculumViews },
    { label: 'Content Clicks', value: metrics.contentClicks },
    { label: 'Signup Prompts', value: metrics.signupPrompts },
    { label: 'Signup Clicks', value: metrics.signupClicks },
    { label: 'Advisory Clicks', value: metrics.advisoryClicks },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Curriculum Metrics</h1>

      {/* Conversion Funnel */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Conversion Funnel</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--mc-border)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Stage</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>Count</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>% of Previous</th>
            </tr>
          </thead>
          <tbody>
            {conversionFunnel.map((stage, idx) => {
              const percentage =
                idx === 0
                  ? 100
                  : Math.round((stage.value / conversionFunnel[idx - 1].value) * 100);
              return (
                <tr key={stage.label} style={{ borderBottom: '1px solid var(--mc-border)' }}>
                  <td style={{ padding: '0.75rem' }}>{stage.label}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>{stage.value}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Stage Distribution */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Stage Distribution</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {Object.entries(metrics.stageDistribution).map(([stage, count]) => (
            <div
              key={stage}
              style={{
                padding: '1rem',
                background: 'var(--mc-bg-tertiary)',
                borderRadius: '2px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.875rem', color: 'var(--mc-text-muted)', marginBottom: '0.5rem' }}>
                {stage}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{count}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Resources */}
      <section>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Top Resources (Last 10)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--mc-border)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Resource ID</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(metrics.topResources)
              .slice(0, 10)
              .map(([resourceId, clicks]) => (
                <tr key={resourceId} style={{ borderBottom: '1px solid var(--mc-border)' }}>
                  <td style={{ padding: '0.75rem' }}>{resourceId}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>{clicks}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
