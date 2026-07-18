"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/feedback", label: "Feedback" },
  { href: "/themes", label: "Themes" },
  { href: "/ask", label: "Ask LOOP" },
  { href: "/reports", label: "Reports" },
];

export default function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;
  if (pathname === "/login" || pathname === "/") return null;

  return (
    <nav
      style={{
        display: "flex",
        gap: 4,
        padding: "12px 20px",
        borderBottom: "1px solid #333",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontWeight: "bold", marginRight: 16 }}>LOOP</span>
      {links.map((link) => (
        <button
          key={link.href}
          onClick={() => { window.location.href = link.href; }}
          style={{
            padding: "6px 12px",
            background: pathname === link.href ? "#6c5ce7" : "transparent",
            color: "#fff",
            border: "1px solid #444",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {link.label}
        </button>
      ))}
      <button
        onClick={() => { window.location.href = "/api/auth/signout"; }}
        style={{
          marginLeft: "auto",
          padding: "6px 12px",
          background: "transparent",
          color: "#f44336",
          border: "1px solid #444",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        Sign Out
      </button>
    </nav>
  );
}