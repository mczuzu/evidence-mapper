import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const nctIds: string[] = body.nct_ids;

    if (!nctIds || !Array.isArray(nctIds) || nctIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or empty nct_ids array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to external Supabase to fetch study data
    const externalUrl = 'https://dxtgnfmtuvxbpnvxzxal.supabase.co';
    const externalKey = 'sb_publishable_9XTutsu4Dmnk68u13bcPWA_VUIF2Kk0';
    
    const supabaseExternal = createClient(externalUrl, externalKey, {
      db: { schema: 'em' }
    });

    // Fetch study data for the selected NCT IDs (only columns that exist)
    const { data: studies, error: studiesError } = await supabaseExternal
      .from('v_ui_study_list')
      .select('nct_id, brief_title')
      .in('nct_id', nctIds);

    if (studiesError) {
      console.error('Error fetching studies:', studiesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch study data', details: studiesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get study titles for context
    const studyTitles = studies?.map(s => s.brief_title).filter(Boolean) || [];
    const titleSummary = studyTitles.slice(0, 3).join(', ') || 'selected clinical trials';

    // Generate analysis result
    // In production, this would call an AI model
    const analysisResult = {
      analysis: {
        direction: `Analysis of ${nctIds.length} clinical trials related to: ${titleSummary}. The studies show promising research directions in this therapeutic area.`,
        themes: [
          {
            title: 'Primary Research Focus',
            description: `The selected studies focus on clinical outcomes and patient health improvements.`,
            study_ids: nctIds.slice(0, Math.ceil(nctIds.length / 2))
          },
          {
            title: 'Methodological Approaches',
            description: 'Studies employ various methodological approaches including randomized controlled trials and observational studies.',
            study_ids: nctIds.slice(Math.ceil(nctIds.length / 2))
          }
        ],
        gaps: [
          {
            title: 'Long-term Follow-up',
            description: 'Limited long-term outcome data available across the selected studies.',
            study_ids: nctIds.slice(0, 2)
          },
          {
            title: 'Demographic Diversity',
            description: 'Potential gaps in population diversity representation.',
            study_ids: nctIds.slice(-2)
          }
        ],
        suggested_next_steps: [
          'Conduct meta-analysis of primary outcomes',
          'Identify opportunities for collaborative research',
          'Review protocol designs for future studies',
          'Assess feasibility of longer follow-up periods'
        ]
      },
      metadata: {
        study_count: nctIds.length,
        generated_at: new Date().toISOString()
      }
    };

    return new Response(
      JSON.stringify(analysisResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
