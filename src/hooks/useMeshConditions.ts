import { useState, useEffect, useRef } from "react";
import { supabaseExternal } from "@/lib/supabase-external";

interface MeshCondition {
  mesh_term: string;
}

export function useMeshConditions(searchText: string) {
  const [results, setResults] = useState<MeshCondition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(0);

  useEffect(() => {
    const id = ++abortRef.current;
    const timer = setTimeout(async () => {
      if (id !== abortRef.current) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabaseExternal.rpc("search_mesh_conditions", {
          q: searchText,
          lim: 20,
        });
        if (id !== abortRef.current) return;
        if (error) throw error;
        setResults((data as MeshCondition[]) || []);
      } catch (err) {
        if (id === abortRef.current) setResults([]);
        console.error("MeSH search error:", err);
      } finally {
        if (id === abortRef.current) setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchText]);

  return { results, isLoading };
}
