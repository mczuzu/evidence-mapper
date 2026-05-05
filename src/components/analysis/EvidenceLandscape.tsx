import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabaseExternal } from '@/lib/supabase-external';

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

function useConditionTotal(conditionName: string) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conditionName) {
      setLoading(false);
      setCount(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { count: c, error } = await supabaseExternal
        .from('study_index_complete')
        .select('nct_id', { count: 'exact', head: true })
        .ilike('conditions', `%${conditionName}%`);
      if (cancelled) return;
      if (error) {
        setCount(null);
      } else {
        setCount(c ?? 0);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [conditionName]);

  return { count, loading };
}

function getDensitySignal(gold: number, conditionTotal: number | null) {
  if (!conditionTotal || conditionTotal === 0) return null;
  const pct = (gold / conditionTotal) * 100;
  if (pct > 5) {
    return {
      label: '◆ HIGH evidence density',
      color: 'text-amber-400',
      pct,
      description:
        'Strong evidence base relative to all completed trials for this condition. New trials need strong differentiation to add value.',
    };
  }
  if (pct >= 1) {
    return {
      label: '◆ MEDIUM evidence density',
      color: 'text-yellow-400',
      pct,
      description:
        'Selective evidence base. Relevant scored trials exist but coverage is far from saturated. Targeted opportunities may exist.',
    };
  }
  return {
    label: '◆ LOW evidence density',
    color: 'text-green-400',
    pct,
    description:
      'Emerging evidence base. Very few scored trials relative to the full condition landscape. Significant opportunity for first-mover advantage.',
  };
}

export function EvidenceLandscape({ conditionName, bronzeCount, goldCount }: EvidenceLandscapeProps) {
  const { count: rctCount, loading: rctLoading } = useRctCount(conditionName);
  const { count: conditionTotal, loading: conditionLoading } = useConditionTotal(conditionName);
  const signal = getDensitySignal(goldCount, conditionTotal);
  const precisionPct = bronzeCount > 0 ? (goldCount / bronzeCount) * 100 : null;

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
        {/* Total condition trials */}
        <div>
          {conditionLoading ? (
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#4F46E5' }} />
          ) : (
            <div className="text-white font-bold" style={{ fontSize: '32px' }}>
              {conditionTotal !== null ? conditionTotal.toLocaleString() : '—'}
            </div>
          )}
          <div style={{ color: '#999', fontSize: '12px' }} className="mt-1">
            Trials available for condition
          </div>
          <div style={{ color: '#666', fontSize: '11px' }} className="mt-0.5">
            AACT full dataset
          </div>
        </div>

        {/* Bronze */}
        <div>
          <div className="text-white font-bold" style={{ fontSize: '32px' }}>
            {bronzeCount.toLocaleString()}
          </div>
          <div style={{ color: '#999', fontSize: '12px' }} className="mt-1">
            Matched by your filters
          </div>
          <div style={{ color: '#666', fontSize: '11px' }} className="mt-0.5">
            Bronze tier
          </div>
        </div>

        {/* Gold */}
        <div>
          <div className="text-white font-bold" style={{ fontSize: '32px' }}>
            {goldCount.toLocaleString()}
          </div>
          <div style={{ color: '#999', fontSize: '12px' }} className="mt-1">
            Scored against objective
          </div>
          <div style={{ color: '#666', fontSize: '11px' }} className="mt-0.5">
            Gold tier · After AI filtering
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="my-5" style={{ height: '1px', backgroundColor: '#333' }} />

      {/* SIGNAL ROW */}
      {signal && (
        <div>
          <div className={`font-semibold ${signal.color}`} style={{ fontSize: '14px' }}>
            {signal.label} · {signal.pct.toFixed(2)}%
          </div>
          <p style={{ color: '#999', fontSize: '13px' }} className="mt-1">
            {signal.description}
          </p>
          <p style={{ color: '#666', fontSize: '12px' }} className="mt-2">
            Density = scored trials / total completed trials for condition ({goldCount.toLocaleString()} / {conditionTotal?.toLocaleString()}).
            {precisionPct !== null && (
              <> Pipeline precision (Gold / Bronze): {precisionPct.toFixed(1)}%.</>
            )}
            {!rctLoading && rctCount && (
              <> PubMed RCTs indexed for "{conditionName}": {Number(rctCount) ? Number(rctCount).toLocaleString() : rctCount}.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
