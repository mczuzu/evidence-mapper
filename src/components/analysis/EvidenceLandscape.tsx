import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface EvidenceLandscapeProps {
  conditionName: string;
  bronzeCount: number;
  goldCount: number;
}

function useRctCount(meshTerm: string) {
  const [count, setCount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meshTerm) {
      setLoading(false);
      setCount('—');
      return;
    }
    let cancelled = false;
    fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term="${encodeURIComponent(meshTerm)}"[MeSH]+AND+randomized+controlled+trial[pt]&rettype=count&retmode=json`
    )
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setCount(d.esearchresult?.count ?? '—');
      })
      .catch(() => {
        if (!cancelled) setCount('—');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [meshTerm]);

  return { count, loading };
}

function getDensitySignal(gold: number, bronze: number) {
  if (bronze === 0) return null;
  const ratio = gold / bronze;
  if (ratio >= 0.5) {
    return {
      label: '◆ HIGH evidence density',
      color: 'text-amber-400',
      description:
        'Strong evidence base. This therapeutic space is well-studied. New trials need strong differentiation to add value.',
    };
  }
  if (ratio >= 0.2) {
    return {
      label: '◆ MODERATE evidence density',
      color: 'text-yellow-400',
      description:
        'Selective evidence base. Relevant trials exist but coverage is not saturated. Targeted opportunities may exist.',
    };
  }
  return {
    label: '◆ LOW evidence density',
    color: 'text-green-400',
    description:
      'Emerging evidence base. Limited high-quality trials in this space. Significant opportunity for first-mover advantage.',
  };
}

export function EvidenceLandscape({ conditionName, bronzeCount, goldCount }: EvidenceLandscapeProps) {
  const { count: rctCount, loading: rctLoading } = useRctCount(conditionName);
  const signal = getDensitySignal(goldCount, bronzeCount);

  return (
    <div
      className="rounded-xl w-full mb-8 evidence-landscape-print"
      style={{ backgroundColor: '#0a0a0a', padding: '32px' }}
    >
      {/* TOP ROW */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-bold" style={{ fontSize: '16px' }}>
            Evidence Landscape
          </h3>
          {conditionName && (
            <p style={{ color: '#888', fontSize: '13px' }} className="mt-1">
              {conditionName}
            </p>
          )}
        </div>
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-1 whitespace-nowrap"
          style={{ borderColor: '#333', color: '#888', fontSize: '12px' }}
        >
          ClinicalTrials.gov · Updated monthly
        </span>
      </div>

      {/* DIVIDER */}
      <div className="my-5" style={{ height: '1px', backgroundColor: '#333' }} />

      {/* METRICS ROW */}
      <div className="grid grid-cols-3 gap-6">
        {/* Bronze */}
        <div>
          <div className="text-white font-bold" style={{ fontSize: '32px' }}>
            {bronzeCount.toLocaleString()}
          </div>
          <div style={{ color: '#999', fontSize: '12px' }} className="mt-1">
            Completed trials matched
          </div>
          <div style={{ color: '#666', fontSize: '11px' }} className="mt-0.5">
            ClinicalTrials.gov
          </div>
        </div>

        {/* Gold */}
        <div>
          <div className="text-white font-bold" style={{ fontSize: '32px' }}>
            {goldCount.toLocaleString()}
          </div>
          <div style={{ color: '#999', fontSize: '12px' }} className="mt-1">
            Trials scored against objective
          </div>
          <div style={{ color: '#666', fontSize: '11px' }} className="mt-0.5">
            After AI filtering
          </div>
        </div>

        {/* PubMed */}
        <div>
          {rctLoading ? (
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#4F46E5' }} />
          ) : (
            <div className="text-white font-bold" style={{ fontSize: '32px' }}>
              {Number(rctCount) ? Number(rctCount).toLocaleString() : rctCount}
            </div>
          )}
          <div style={{ color: '#999', fontSize: '12px' }} className="mt-1">
            Published RCTs
          </div>
          <div style={{ color: '#666', fontSize: '11px' }} className="mt-0.5">
            PubMed · MeSH indexed
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="my-5" style={{ height: '1px', backgroundColor: '#333' }} />

      {/* SIGNAL ROW */}
      {signal && (
        <div>
          <div className={`font-semibold ${signal.color}`} style={{ fontSize: '14px' }}>
            {signal.label}
          </div>
          <p style={{ color: '#999', fontSize: '13px' }} className="mt-1">
            {signal.description}
          </p>
        </div>
      )}
    </div>
  );
}
