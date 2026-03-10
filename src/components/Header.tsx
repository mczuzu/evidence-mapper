import { Microscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Microscope className="h-5 w-5" />
        </button>
        <div>
          <button
            onClick={() => navigate("/")}
            className="font-serif text-xl font-semibold text-foreground hover:text-foreground/80 transition-colors text-left"
          >
            Evidence Mapper
          </button>
          <p className="text-sm text-muted-foreground">
            Clinical evidence synthesis tool
          </p>
        </div>
      </div>
    </header>
  );
}