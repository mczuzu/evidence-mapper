import React, { useState, useCallback, forwardRef } from "react";
import { TableCell } from "@/components/ui/table";
import { HighlightText } from "@/components/HighlightText";

interface TruncatedCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  fullText?: string;
  highlightTerms?: string[];
}

export const TruncatedCell = forwardRef<HTMLTableCellElement, TruncatedCellProps>(
  ({ children, fullText, highlightTerms, className, ...props }, ref) => {
    const [show, setShow] = useState(false);

    const handleEnter = useCallback(() => {
      if (fullText && fullText !== "—") setShow(true);
    }, [fullText]);

    const handleLeave = useCallback(() => setShow(false), []);

    return (
      <TableCell
        ref={ref}
        className={`relative ${className || ""}`}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        {...props}
      >
        {children}
        {show && fullText && (
          <div className="absolute left-0 top-full z-50 mt-1 max-w-sm rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg whitespace-normal break-words pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100">
            {highlightTerms && highlightTerms.length > 0 ? (
              <HighlightText text={fullText} terms={highlightTerms} />
            ) : (
              fullText
            )}
          </div>
        )}
      </TableCell>
    );
  }
);

TruncatedCell.displayName = "TruncatedCell";
