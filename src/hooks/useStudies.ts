import { useQuery } from "@tanstack/react-query";
import { supabaseExternal } from "@/lib/supabase-external";
import { StudyListItem, FacetSemanticLabel, FacetParamType } from "@/types/database";

const PAGE_SIZE = 20;

// Spanish → English term mapping for RPC normalization
const TERM_MAP: Record<string, string> = {
  menopausa: "menopause",
  menopausia: "menopause",
  perimenopausa: "perimenopause",
  perimenopausia: "perimenopause",
  posmenopausa: "postmenopausal",
  posmenopausia: "postmenopausal",
  postmenopausa: "postmenopausal",
  postmenopausia: "postmenopausal",
  ansiedad: "anxiety",
  depresion: "depression",
  depresión: "depression",
  sofocos: "hot flashes",
  insomnio: "insomnia",
  tratamiento: "treatment",
  terapia: "therapy",
  cancer: "cancer",
  cáncer: "cancer",
  hormonal: "hormone",
  hormonas: "hormone",
  estrogeno: "estrogen",
  estrógeno: "estrogen",
  progesterona: "progesterone",
};

/**
 * Normalize query for advanced RPC search:
 * - Lowercase
 * - Remove accents
 * - Tokenize on whitespace/punctuation
 * - Map Spanish → English terms
 * - Re-join tokens
 */
function normalizeForAdvancedRpc(query: string): string {
  // Lowercase and normalize unicode (NFD decomposes accents)
  const normalized = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics

  // Tokenize on whitespace and punctuation
  const tokens = normalized.split(/[\s,;:.]+/).filter(Boolean);

  // Map tokens to English equivalents
  const mappedTokens = tokens.map((token) => {
    return TERM_MAP[token] || token;
  });

  return mappedTokens.join(" ");
}

interface UseStudiesParams {
  searchQuery: string;
  selectedLabels: string[];
  selectedParamTypes: string[];
  page: number;
  advancedSearch?: boolean;
}

interface RpcSearchResult {
  nct_id: string;
  brief_title: string;
  official_title: string | null;
  rank: number;
}

// Normalize RPC results to StudyListItem structure
function normalizeRpcResult(item: RpcSearchResult): StudyListItem {
  return {
    nct_id: item.nct_id,
    brief_title: item.brief_title,
    official_title: item.official_title,
    n_result_rows: null,
    n_unique_outcomes: null,
    total_n_reported: null,
    max_n_reported: null,
    has_placebo_or_control_label: null,
    semantic_labels: null,
    param_type_set: null,
  };
}

export function useStudies({
  searchQuery,
  selectedLabels,
  selectedParamTypes,
  page,
  advancedSearch = false,
}: UseStudiesParams) {
  return useQuery({
    queryKey: ["studies", searchQuery, selectedLabels, selectedParamTypes, page, advancedSearch],
    queryFn: async () => {
      // Advanced search using RPC
      if (advancedSearch && searchQuery.trim()) {
        const normalizedQuery = normalizeForAdvancedRpc(searchQuery);
        console.log("[Advanced Search] Original:", searchQuery, "→ Normalized:", normalizedQuery);
        
        const { data, error } = await supabaseExternal.schema("em").rpc("search_menopause_anxiety", {
          q: normalizedQuery,
          limit_n: 500,
        });

        if (error) {
          console.error("Error fetching studies via RPC:", error);
          throw error;
        }

        const rpcResults = (data as RpcSearchResult[]) || [];
        const studies = rpcResults.map(normalizeRpcResult);

        // Apply pagination client-side for RPC results
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE;
        const paginatedStudies = studies.slice(from, to);

        return {
          studies: paginatedStudies,
          totalCount: studies.length,
          pageSize: PAGE_SIZE,
          currentPage: page,
          totalPages: Math.ceil(studies.length / PAGE_SIZE),
        };
      }

      // Standard query
      let query = supabaseExternal
        .from("v_study_summary_v1")
        .select("*", { count: "exact" })
        .order("nct_id", { ascending: false });

      // Text search on brief_title and official_title
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`brief_title.ilike.${searchTerm},official_title.ilike.${searchTerm}`);
      }

      // Filter by semantic labels (contains any of the selected)
      if (selectedLabels.length > 0) {
        query = query.overlaps("semantic_labels", selectedLabels);
      }

      // Filter by param types (contains any of the selected)
      if (selectedParamTypes.length > 0) {
        query = query.overlaps("param_type_set", selectedParamTypes);
      }

      // Pagination
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching studies:", error);
        throw error;
      }

      return {
        studies: (data as StudyListItem[]) || [],
        totalCount: count || 0,
        pageSize: PAGE_SIZE,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / PAGE_SIZE),
      };
    },
  });
}

export function useSemanticLabelsFacet() {
  return useQuery({
    queryKey: ["facet-semantic-labels"],
    queryFn: async () => {
      const { data, error } = await supabaseExternal
        .from("v_ui_facet_semantic_labels")
        .select("*")
        .order("n_studies", { ascending: false });

      if (error) {
        console.error("Error fetching semantic labels facet:", error);
        throw error;
      }

      return (data as FacetSemanticLabel[]) || [];
    },
  });
}

export function useParamTypeFacet() {
  return useQuery({
    queryKey: ["facet-param-type"],
    queryFn: async () => {
      const { data, error } = await supabaseExternal
        .from("v_ui_facet_param_type")
        .select("*")
        .order("n_studies", { ascending: false });

      if (error) {
        console.error("Error fetching param type facet:", error);
        throw error;
      }

      return (data as FacetParamType[]) || [];
    },
  });
}
