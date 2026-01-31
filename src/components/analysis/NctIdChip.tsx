import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface NctIdChipProps {
  nctId: string;
}

export function NctIdChip({ nctId }: NctIdChipProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/study/${nctId}`);
  };

  return (
    <Badge
      variant="outline"
      className="cursor-pointer hover:bg-accent transition-colors text-xs font-mono"
      onClick={handleClick}
    >
      {nctId}
    </Badge>
  );
}

interface NctIdListProps {
  nctIds: string[];
  max?: number;
}

export function NctIdList({ nctIds, max = 5 }: NctIdListProps) {
  const navigate = useNavigate();
  const displayed = nctIds.slice(0, max);
  const remaining = nctIds.length - max;

  const handleViewAll = () => {
    navigate(`/dataset?ids=${nctIds.join(',')}`);
  };

  if (nctIds.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {displayed.map((id) => (
        <NctIdChip key={id} nctId={id} />
      ))}
      {remaining > 0 && (
        <Badge
          variant="secondary"
          className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs"
          onClick={handleViewAll}
        >
          +{remaining} more
        </Badge>
      )}
    </div>
  );
}
