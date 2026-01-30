/**
 * Parse filter values from URL query params
 */
export function parseFiltersFromQueryParams(searchParams: URLSearchParams) {
  const searchQuery = searchParams.get('q') || '';
  const labels = searchParams.get('labels')?.split(',').filter(Boolean) || [];
  const paramTypes = searchParams.get('paramTypes')?.split(',').filter(Boolean) || [];
  
  return { searchQuery, labels, paramTypes };
}

/**
 * Build query params string from filter values
 */
export function buildQueryParamsFromFilters(
  searchQuery: string,
  labels: string[],
  paramTypes: string[]
): string {
  const params = new URLSearchParams();
  if (searchQuery) params.set('q', searchQuery);
  if (labels.length > 0) params.set('labels', labels.join(','));
  if (paramTypes.length > 0) params.set('paramTypes', paramTypes.join(','));
  return params.toString();
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncateText(text: string | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}
