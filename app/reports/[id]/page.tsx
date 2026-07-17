"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Report = {
  id: string;
  title: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  contentJson: {
    summary: string;
    topThemes: { name: string; count: number }[];
    sentimentBreakdown: { pos: number; neu: number; neg: number };
    sentimentDeltaPct: number;
    notableQuotes: { content: string; channel: string; sentiment: string }[];
    recommendedActions: string[];
  };
};

export default function ReportDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch("/api/reports/" + id)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setReport(data.report);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p style={{ padding: 20 }}>Loading report...</p>;
  if (error) return <p style={{ padding: 20, color: "#f44336" }}>{error}</p>;
  if (!report) return null;

  return (
    <div
      style={{
        padding: 40,
        maxWidth: 800,
        marginLeft: "auto",
        marginRight: "auto",
        background: "#fff",
        color: "#111",
        minHeight: "100vh",
      }}
    >
      <div
        className="no-print"
        style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}
      >
        <button
          onClick={() => window.print()}
          style={{
            padding: "10px 16px",
            background: "#6c5ce7",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Print / Save as PDF
        </button>
      </div>

      <h1 style={{ marginBottom: 4 }}>{report.title}</h1>
      <p style={{ color: "#666", fontSize: 13 }}>
        Generated {new Date(report.createdAt).toLocaleString()}
      </p>

      <h2>Executive summary</h2>
      <p>{report.contentJson.summary}</p>

      <h2>Top themes</h2>
      <ul>
        {report.contentJson.topThemes.map((t, i) => (
          <li key={i}>{t.name} - {t.count}</li>
        ))}
      </ul>

      <h2>Sentiment breakdown</h2>
      <p>
        Positive: {report.contentJson.sentimentBreakdown.pos} | Neutral:{" "}
        {report.contentJson.sentimentBreakdown.neu} | Negative:{" "}
        {report.contentJson.sentimentBreakdown.neg} | Change vs previous period:{" "}
        {report.contentJson.sentimentDeltaPct}%
      </p>

      <h2>Notable quotes</h2>
      <ul>
        {report.contentJson.notableQuotes.map((q, i) => (
          <li key={i} style={{ marginBottom: 8 }}>
            {q.content} <span style={{ color: "#666" }}>({q.channel}, {q.sentiment})</span>
          </li>
        ))}
      </ul>

      <h2>Recommended actions</h2>
      <ul>
        {report.contentJson.recommendedActions.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
