"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Report = {
  id: string;
  title: string;
  createdAt: string;
  contentJson: {
    summary: string;
    topThemes: { name: string; count: number }[];
    sentimentBreakdown: { pos: number; neu: number; neg: number };
    sentimentDeltaPct: number;
    notableQuotes: { content: string; channel: string; sentiment: string }[];
    recommendedActions: string[];
  };
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);

  function loadReports() {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setReports(data.reports);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodDays: 30 }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        loadReports();
        setSelected(data.report);
      }
    } catch (err) {
      setError("Something went wrong generating the report.");
    }
    setGenerating(false);
  }

  if (loading) return <p style={{ padding: 20 }}>Loading reports...</p>;

  return (
    <div style={{ padding: 20, maxWidth: 900, marginLeft: "auto", marginRight: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1>Voice-of-Customer Reports</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            padding: "10px 16px",
            background: generating ? "#555" : "#6c5ce7",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: generating ? "default" : "pointer",
          }}
        >
          {generating ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {error && <p style={{ color: "#f44336", marginTop: 12 }}>{error}</p>}

      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 100%", minWidth: 0, maxWidth: 400 }}>
          <h3>Past reports</h3>
          {reports.length === 0 && <p style={{ color: "#888" }}>No reports yet.</p>}
          {reports.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelected(r)}
              style={{
                border: "1px solid #444",
                borderRadius: 6,
                padding: 12,
                marginBottom: 8,
                cursor: "pointer",
                background: selected?.id === r.id ? "#2a2a3a" : "transparent",
              }}
            >
              <p style={{ margin: 0, fontSize: 14 }}>{r.title}</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#888" }}>
                {new Date(r.createdAt).toLocaleString()}
              </p>
              <Link href={"/reports/" + r.id} style={{ fontSize: 11, color: "#8e7cf0" }}>
                Open full page / export
              </Link>
            </div>
          ))}
        </div>

        <div style={{ flex: "1 1 100%", minWidth: 0 }}>
          {selected ? (
            <div>
              <h2 style={{ marginTop: 0 }}>{selected.title}</h2>
              <p>{selected.contentJson.summary}</p>

              <h3>Top themes</h3>
              <ul>
                {selected.contentJson.topThemes.map((t, i) => (
                  <li key={i}>{t.name} - {t.count}</li>
                ))}
              </ul>

              <h3>Sentiment breakdown</h3>
              <p>
                Positive: {selected.contentJson.sentimentBreakdown.pos} | Neutral:{" "}
                {selected.contentJson.sentimentBreakdown.neu} | Negative:{" "}
                {selected.contentJson.sentimentBreakdown.neg} | Change vs previous period:{" "}
                {selected.contentJson.sentimentDeltaPct}%
              </p>

              <h3>Notable quotes</h3>
              <ul>
                {selected.contentJson.notableQuotes.map((q, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    {q.content} <span style={{ color: "#888" }}>({q.channel}, {q.sentiment})</span>
                  </li>
                ))}
              </ul>

              <h3>Recommended actions</h3>
              <ul>
                {selected.contentJson.recommendedActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>

              <Link
                href={"/reports/" + selected.id}
                style={{
                  display: "inline-block",
                  marginTop: 16,
                  padding: "8px 14px",
                  background: "#6c5ce7",
                  color: "#fff",
                  borderRadius: 6,
                  textDecoration: "none",
                }}
              >
                Open full page / export as PDF
              </Link>
            </div>
          ) : (
            <p style={{ color: "#888" }}>Select a report to view it, or generate a new one.</p>
          )}
        </div>
      </div>
    </div>
  );
}