import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FilterSectionProps {
  title: string;
  options: string[];
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

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

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
          'space-y-1.5 pl-6 overflow-hidden transition-all duration-200',
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`${title}-${option}`}
              checked={selected.includes(option)}
              onCheckedChange={() => handleToggle(option)}
            />
            <Label
              htmlFor={`${title}-${option}`}
              className="text-sm font-normal text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            >
              {option}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
