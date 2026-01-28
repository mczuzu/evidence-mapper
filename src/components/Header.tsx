import { Microscope } from 'lucide-react';
export function Header() {
  return <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
          <Microscope className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-semibold text-foreground">Evidence Opportunity Radar</h1>
          <p className="text-sm text-muted-foreground">
            Browse and explore clinical evidence by semantic outcomes
          </p>
        </div>
      </div>
    </header>;
}