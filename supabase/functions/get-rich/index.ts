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

  try {
    const url = new URL(req.url);
    const nctId = url.searchParams.get('nct_id');

    if (!nctId) {
      return new Response(
        JSON.stringify({ error: 'Missing nct_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to external Supabase with the em schema
    const externalUrl = 'https://dxtgnfmtuvxbpnvxzxal.supabase.co';
    const externalKey = 'sb_publishable_9XTutsu4Dmnk68u13bcPWA_VUIF2Kk0';
    
    const supabase = createClient(externalUrl, externalKey, {
      db: { schema: 'em' }
    });

    // Query the rich data view (assuming v_ui_study_detail exists)
    // If it doesn't exist, this will return an error which we handle gracefully
    const { data, error } = await supabase
      .from('v_ui_study_detail')
      .select('primary_outcomes, eligibility_preview, detailed_description_preview')
      .eq('nct_id', nctId)
      .single();

    if (error) {
      console.error('Error fetching rich data:', error);
      return new Response(
        JSON.stringify({ error: 'Rich data not available', details: error.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Study not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
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
