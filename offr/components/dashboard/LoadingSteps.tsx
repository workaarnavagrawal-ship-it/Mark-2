"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  steps: string[];
}

/**
 * Sequences through `steps` at ~700ms each, showing a spinner on the active
 * step and a ✓ on completed ones. Stays on the last step once all are shown.
 * Unmounting (when loading finishes) is handled by the parent.
 */
export function LoadingSteps({ steps }: Props) {
  const [count, setCount] = useState(1);
  const prevActive = useRef(false);

  // Reset count whenever we remount (parent shows this when loading starts)
  useEffect(() => {
    setCount(1);
    prevActive.current = true;
  }, []);

  useEffect(() => {
    if (count >= steps.length) return;
    const id = setTimeout(() => setCount(c => c + 1), 700);
    return () => clearTimeout(id);
  }, [count, steps.length]);

  return (
    <div style={{ padding: "12px 0 4px" }}>
      {steps.slice(0, count).map((step, i) => {
        const isCurrent = i === count - 1;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "5px 0",
              animation: "lsFadeIn 0.3s ease both",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isCurrent ? (
                <span
                  style={{
                    width: "13px",
                    height: "13px",
                    border: "1.5px solid var(--t3)",
                    borderTopColor: "var(--t)",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "lsSpin 0.75s linear infinite",
                  }}
                />
              ) : (
                <span style={{ color: "var(--safe-t)", fontSize: "13px", lineHeight: 1 }}>
                  ✓
                </span>
              )}
            </span>
            <span
              style={{
                fontSize: "13px",
                lineHeight: 1.4,
                color: isCurrent ? "var(--t)" : "var(--t3)",
                transition: "color 0.3s",
              }}
            >
              {step}
            </span>
          </div>
        );
      })}

      <style>{`
        @keyframes lsFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lsSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
