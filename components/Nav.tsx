"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

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
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("loop-theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("loop-theme", next);
  }

  if (!session) return null;
  if (pathname === "/login" || pathname === "/") return null;

  return (
    <nav
      style={{
        display: "flex",
        gap: 8,
        padding: "12px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--nav-bg)",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontWeight: "bold", marginRight: 12, color: "var(--foreground)" }}>
        LOOP
      </span>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <button
            key={link.href}
            onClick={() => { window.location.href = link.href; }}
            style={{
              padding: "8px 14px",
              background: isActive ? "var(--btn-active)" : "var(--btn-bg)",
              color: isActive ? "#ffffff" : "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {link.label}
          </button>
        );
      })}

      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          style={{
            padding: "8px 12px",
            background: "var(--btn-bg)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
        <button
          onClick={() => { window.location.href = "/api/auth/signout"; }}
          style={{
            padding: "8px 14px",
            background: "#c0392b",
            color: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}

