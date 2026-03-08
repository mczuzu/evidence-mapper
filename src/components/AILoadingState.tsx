import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AILoadingStateProps {
  title: string;
  subtitle: string;
  messages: string[];
}

export function AILoadingState({ title, subtitle, messages }: AILoadingStateProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % messages.length);
        setFade(true);
      }, 200);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: 400 }}>
      <Loader2
        className="animate-spin text-indigo"
        style={{ width: 40, height: 40 }}
      />
      <p className="text-xl font-semibold text-foreground mt-2">{title}</p>
      <p className="text-sm" style={{ color: "#666" }}>{subtitle}</p>
      <p
        className="text-[13px] transition-opacity duration-200 mt-1"
        style={{ opacity: fade ? 1 : 0, color: "#999" }}
      >
        {messages[msgIndex]}
      </p>
    </div>
  );
}
