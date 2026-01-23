import { Study } from '@/types/study';
import { StudyCard } from './StudyCard';
import { FileSearch } from 'lucide-react';

interface StudyListProps {
  studies: Study[];
  totalCount: number;
}

export function StudyList({ studies, totalCount }: StudyListProps) {
  if (studies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
          No studies found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try adjusting your search terms or clearing some filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{studies.length}</span> of{' '}
        <span className="font-medium text-foreground">{totalCount}</span> studies
      </p>
      <div className="grid gap-4">
        {studies.map((study) => (
          <StudyCard key={study.id} study={study} />
        ))}
      </div>
    </div>
  );
}
