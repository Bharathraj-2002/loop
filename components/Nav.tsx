"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/feedback", label: "Feedback", icon: "💬" },
  { href: "/themes", label: "Themes", icon: "🏷️" },
  { href: "/ask", label: "Ask LOOP", icon: "🔍" },
  { href: "/reports", label: "Reports", icon: "📄" },
];

export default function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [theme, setTheme] = useState("dark");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("loop-theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("loop-theme", next);
  }

  if (!session) return null;
  if (pathname === "/login" || pathname === "/") return null;

  const desktopBtn = (isActive: boolean): React.CSSProperties => ({
    padding: "10px 16px",
    background: isActive ? "var(--btn-active)" : "var(--btn-bg)",
    color: isActive ? "#ffffff" : "var(--foreground)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  });

  const mobileBtn = (isActive: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    background: isActive ? "var(--btn-active)" : "transparent",
    color: isActive ? "#ffffff" : "var(--foreground)",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 500,
    width: "100%",
    textAlign: "left",
  });

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--nav-bg)",
        position: "relative",
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 20px",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: "bold", color: "var(--foreground)", fontSize: 18 }}>
          LOOP
        </span>

        <div className="loop-nav-desktop" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {links.map((link) => (
            <button
              key={link.href}
              onClick={() => { window.location.href = link.href; }}
              style={desktopBtn(pathname === link.href)}
            >
              {link.label}
            </button>
          ))}
          <button onClick={toggleTheme} title="Toggle theme" style={desktopBtn(false)}>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button
            onClick={() => { window.location.href = "/api/auth/signout"; }}
            style={{
              padding: "10px 16px",
              background: "#c0392b",
              color: "#ffffff",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Sign Out
          </button>
        </div>

        <button
          className="loop-nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "none",
            background: "var(--btn-bg)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
          aria-label="Menu"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      <div
        className={`loop-nav-mobile-panel ${menuOpen ? "open" : ""}`}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "8px 16px 16px 16px",
          borderTop: "1px solid var(--border)",
          background: "var(--card-bg)",
        }}
      >
        {links.map((link) => (
          <button
            key={link.href}
            onClick={() => { window.location.href = link.href; }}
            style={mobileBtn(pathname === link.href)}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </button>
        ))}
        <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
        <button onClick={toggleTheme} style={mobileBtn(false)}>
          <span>{theme === "dark" ? "☀️" : "🌙"}</span>
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
        <button
          onClick={() => { window.location.href = "/api/auth/signout"; }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 16px",
            background: "#c0392b",
            color: "#ffffff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 500,
            width: "100%",
            marginTop: 4,
          }}
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>

      <style jsx global>{`
        .loop-nav-mobile-panel {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          border-top: none !important;
          transition: max-height 0.3s ease, opacity 0.25s ease;
        }
        .loop-nav-mobile-panel.open {
          max-height: 600px;
          opacity: 1;
          padding-top: 8px !important;
          padding-bottom: 16px !important;
          border-top: 1px solid var(--border) !important;
        }
        @media (max-width: 768px) {
          .loop-nav-desktop {
            display: none !important;
          }
          .loop-nav-hamburger {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}