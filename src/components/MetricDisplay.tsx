import { cn } from '@/lib/utils';

interface MetricDisplayProps {
  label: string;
  value: number;
  className?: string;
}

export function MetricDisplay({ label, value, className }: MetricDisplayProps) {
  const formattedValue = value.toLocaleString();
  
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <span className="text-lg font-semibold text-foreground">{formattedValue}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}
