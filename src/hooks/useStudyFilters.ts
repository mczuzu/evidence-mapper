import { useState, useMemo } from 'react';
import { Study } from '@/types/study';
import { mockStudies } from '@/data/mockStudies';

export function useStudyFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedParams, setSelectedParams] = useState<string[]>([]);

  const filteredStudies = useMemo(() => {
    return mockStudies.filter((study) => {
      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = study.title.toLowerCase().includes(query);
        const matchesDescription = study.description.toLowerCase().includes(query);
        const matchesLabels = study.semanticLabels.some(
          (label) => label.value.toLowerCase().includes(query)
        );
        const matchesParams = study.parameterTypes.some(
          (param) => param.toLowerCase().includes(query)
        );
        
        if (!matchesTitle && !matchesDescription && !matchesLabels && !matchesParams) {
          return false;
        }
      }

      // Label filter
      if (selectedLabels.length > 0) {
        const studyLabelValues = study.semanticLabels.map((l) => l.value);
        if (!selectedLabels.some((label) => studyLabelValues.includes(label))) {
          return false;
        }
      }

      // Parameter filter
      if (selectedParams.length > 0) {
        if (!selectedParams.some((param) => study.parameterTypes.includes(param))) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedLabels, selectedParams]);

  return {
    searchQuery,
    setSearchQuery,
    selectedLabels,
    setSelectedLabels,
    selectedParams,
    setSelectedParams,
    filteredStudies,
    totalStudies: mockStudies.length,
  };
}
