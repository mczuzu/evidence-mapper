import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  count?: number;
}

interface FilterSectionProps {
  title: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  defaultExpanded?: boolean;
}

export function FilterSection({
  title,
  options,
  selected,
  onChange,
  defaultExpanded = true,
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  if (options.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {title}
        </div>
        <p className="text-xs text-muted-foreground pl-6">No options available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left font-medium text-sm text-foreground hover:text-primary transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {title}
        {selected.length > 0 && (
          <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
            {selected.length}
          </span>
        )}
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isExpanded ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <ScrollArea className="h-56 pl-6">
          <div className="space-y-2 pr-4">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => toggleOption(option.value)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1 truncate">
                  {option.value}
                </span>
                {option.count !== undefined && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {option.count}
                  </span>
                )}
              </label>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
