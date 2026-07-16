"use client";

import { useEffect, useState } from "react";

type Theme = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  count: number;
  currentPeriodCount: number;
  previousPeriodCount: number;
  trend: "up" | "down" | "flat";
  changePercent: number;
};

type Feedback = {
  id: string;
  content: string;
  channel: string;
  sentiment: string | null;
  status: string;
};

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [themeFeedback, setThemeFeedback] = useState<Feedback[]>([]);
  const [loadingDrill, setLoadingDrill] = useState(false);

  useEffect(() => {
    fetch("/api/themes")
      .then((res) => res.json())
      .then((data) => {
        if (data.themes) setThemes(data.themes);
        setLoading(false);
      });
  }, []);

  async function openTheme(theme: Theme) {
    setSelectedTheme(theme);
    setLoadingDrill(true);
    const res = await fetch("/api/themes/" + theme.id);
    const data = await res.json();
    if (data.feedback) setThemeFeedback(data.feedback);
    setLoadingDrill(false);
  }

  function closeDrill() {
    setSelectedTheme(null);
    setThemeFeedback([]);
  }

  if (loading) return <p style={{ padding: 20 }}>Loading themes...</p>;

  return (
    <div style={{ padding: 20, maxWidth: 800, marginLeft: "auto", marginRight: "auto" }}>
      <h1>Themes</h1>
      <p style={{ fontSize: 13, color: "#888" }}>
        Themes are automatically created when feedback is classified. Click a theme to see its feedback.
        Trend compares the last 7 days to the 7 days before that.
      </p>

      {themes.length === 0 ? (
        <p style={{ marginTop: 16, color: "#888" }}>
          No themes yet. Go to the Feedback page and classify some items first.
        </p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => openTheme(t)}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #444",
                background: "#1a1a1a",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <p style={{ margin: 0, fontWeight: "bold" }}>{t.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{t.count} items</p>
              {t.trend !== "flat" ? (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 11,
                    color: t.trend === "up" ? "#f44336" : "#4caf50",
                  }}
                >
                  {t.trend === "up" ? "\u2191" : "\u2193"} {Math.abs(t.changePercent)}% vs last week
                </p>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {selectedTheme ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={closeDrill}
        >
          <div
            style={{
              background: "#111",
              border: "1px solid #444",
              borderRadius: 8,
              padding: 20,
              maxWidth: 600,
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>{selectedTheme.name}</h2>
              <button onClick={closeDrill} style={{ padding: "4px 10px" }}>
                Close
              </button>
            </div>
            <p style={{ fontSize: 13, color: "#888" }}>{selectedTheme.count} items</p>

            {loadingDrill ? (
              <p>Loading...</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
                {themeFeedback.map((f) => (
                  <li
                    key={f.id}
                    style={{
                      border: "1px solid #333",
                      borderRadius: 6,
                      padding: 10,
                      marginBottom: 8,
                    }}
                  >
                    <p style={{ margin: 0 }}>{f.content}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
                      {f.channel} {f.sentiment ? "- " + f.sentiment : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}