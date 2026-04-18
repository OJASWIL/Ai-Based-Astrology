"use client";

import { useEffect, useState } from "react";

// =====================================================
// 1. YO COMPONENT — components/account-deleted-screen.tsx maa save gara
// =====================================================

export function AccountDeletedScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"icon" | "text" | "done">("icon");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 600);
    const t2 = setTimeout(() => setPhase("done"), 2800);
    const t3 = setTimeout(() => onDone(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#050f0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        gap: "28px",
        opacity: phase === "done" ? 0 : 1,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: phase !== "icon" ? "none" : undefined,
        }}
      >
        {/* Icon circle */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.12)",
            border: "2px solid rgba(239,68,68,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: phase === "icon" ? "scale(0)" : "scale(1)",
            transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            boxShadow: "0 0 24px rgba(239,68,68,0.3)",
          }}
        >
          {/* X icon — SVG */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{
                strokeDasharray: 24,
                strokeDashoffset: phase === "icon" ? 24 : 0,
                transition: "stroke-dashoffset 0.4s ease 0.3s",
              }}
            />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div
        style={{
          textAlign: "center",
          opacity: phase === "text" || phase === "done" ? 1 : 0,
          transform: phase === "text" || phase === "done" ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        <p
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#ef4444",
            letterSpacing: "0.01em",
            margin: 0,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Account Deleted Successfully
        </p>
        <p
          style={{
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.35)",
            marginTop: 8,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          All your data has been permanently removed.
        </p>
      </div>
    </div>
  );
}


// =====================================================
// 2. LOGIN PAGE maa yo useEffect add gara
// =====================================================

/*

import { AccountDeletedScreen } from "@/components/account-deleted-screen";

// state add gara
const [showDeleted, setShowDeleted] = useState(false);

// useEffect add gara
useEffect(() => {
  const deleted = sessionStorage.getItem("deleted_account");
  if (deleted) {
    sessionStorage.removeItem("deleted_account");
    setShowDeleted(true);
  }
}, []);

// JSX maa sabai bhanda maathi add gara
{showDeleted && (
  <AccountDeletedScreen onDone={() => setShowDeleted(false)} />
)}

*/