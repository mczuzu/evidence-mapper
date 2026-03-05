import React, { useRef, useState, useCallback } from "react";
import { TableCell } from "@/components/ui/table";

interface TruncatedCellProps {
  children: React.ReactNode;
  fullText?: string;
  className?: string;
}

/**
 * A TableCell that shows a floating tooltip with the full text on hover,
 * appearing instantly (no native title delay). Only shows when text is present.
 */
export function TruncatedCell({ children, fullText, className }: TruncatedCellProps) {
  const [show, setShow] = useState(false);
  const cellRef = useRef<HTMLTableCellElement>(null);

  const handleEnter = useCallback(() => {
    if (fullText && fullText !== "—") setShow(true);
  }, [fullText]);

  const handleLeave = useCallback(() => setShow(false), []);

  return (
    <TableCell
      ref={cellRef}
      className={`relative ${className || ""}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {show && fullText && (
        <div className="absolute left-0 top-full z-50 mt-1 max-w-sm rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg whitespace-normal break-words pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100">
          {fullText}
        </div>
      )}
    </TableCell>
  );
}
