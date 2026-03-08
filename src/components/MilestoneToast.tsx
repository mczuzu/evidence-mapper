import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

type MilestoneType = "silver" | "gold";

interface MilestoneToastData {
  type: MilestoneType;
  title: string;
  subtitle: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
}

interface MilestoneToastProps {
  data: MilestoneToastData | null;
  onDismiss: () => void;
}

export type { MilestoneToastData };

export function MilestoneToast({ data, onDismiss }: MilestoneToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      onDismiss();
    }, 200);
  }, [onDismiss]);

  useEffect(() => {
    if (data) {
      setVisible(true);
      setExiting(false);
      const timer = setTimeout(dismiss, 6000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [data, dismiss]);

  if (!visible || !data) return null;

  const badgeColor = data.type === "silver" ? "hsl(var(--muted-foreground))" : "hsl(45 80% 55%)";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]">
      <div
        className="rounded-xl shadow-2xl border border-white/10 p-5 flex items-start gap-4 transition-all"
        style={{
          backgroundColor: "hsl(var(--foreground))",
          maxWidth: 480,
          minWidth: 340,
          animation: exiting
            ? "milestoneOut 200ms ease-in forwards"
            : "milestoneIn 300ms ease-out forwards",
        }}
      >
        {/* Badge */}
        <div
          className="shrink-0 rounded-full mt-0.5"
          style={{
            width: 20,
            height: 20,
            backgroundColor: badgeColor,
          }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--background))" }}>
            {data.title}
          </p>
          <p className="text-xs" style={{ color: "hsl(0 0% 67%)" }}>
            {data.subtitle}
          </p>
          <p className="text-[11px]" style={{ color: "hsl(0 0% 50%)" }}>
            {data.detail}
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={() => {
            data.onAction();
            dismiss();
          }}
          className="shrink-0 rounded-lg bg-indigo text-indigo-foreground px-3.5 py-1.5 text-xs font-medium hover:bg-indigo-dark transition-colors"
        >
          {data.actionLabel}
        </button>

        {/* Close */}
        <button
          onClick={dismiss}
          className="shrink-0 -mt-1 -mr-1"
          style={{ color: "hsl(0 0% 50%)" }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <style>{`
        @keyframes milestoneIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes milestoneOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
