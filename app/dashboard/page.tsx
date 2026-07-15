"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

type Stats = {
  total: number;
  percentNegative: number;
  newThisWeek: number;
  sentimentData: { name: string; value: number }[];
  channelData: { name: string; count: number }[];
  volumeData: { date: string; count: number }[];
};

const SENTIMENT_COLORS: Record<string, string> = {
  POS: "#4caf50",
  NEU: "#9e9e9e",
  NEG: "#f44336",
  Unclassified: "#555",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <p style={{ padding: 20 }}>Loading dashboard...</p>;
  if (!stats) return <p style={{ padding: 20, color: "red" }}>Failed to load stats.</p>;

  return (
    <div style={{ padding: 20, maxWidth: 900, marginLeft: "auto", marginRight: "auto" }}>
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: 12, marginTop: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <div style={{ border: "1px solid #444", borderRadius: 6, padding: 16, flex: 1, minWidth: 150 }}>
          <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Total items</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: "bold" }}>{stats.total}</p>
        </div>
        <div style={{ border: "1px solid #444", borderRadius: 6, padding: 16, flex: 1, minWidth: 150 }}>
          <p style={{ margin: 0, fontSize: 12, color: "#888" }}>% negative</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: "bold" }}>{stats.percentNegative}%</p>
        </div>
        <div style={{ border: "1px solid #444", borderRadius: 6, padding: 16, flex: 1, minWidth: 150 }}>
          <p style={{ margin: 0, fontSize: 12, color: "#888" }}>New this week</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: "bold" }}>{stats.newThisWeek}</p>
        </div>
      </div>

      <h2>Volume over time</h2>
      <div style={{ width: "100%", height: 250, marginBottom: 32 }}>
        <ResponsiveContainer>
          <LineChart data={stats.volumeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2>Sentiment breakdown</h2>
      <div style={{ width: "100%", height: 250, marginBottom: 32 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={stats.sentimentData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {stats.sentimentData.map((entry, index) => (
                <Cell key={index} fill={SENTIMENT_COLORS[entry.name] || "#8884d8"} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <h2>Top channels</h2>
      <div style={{ width: "100%", height: 300, marginBottom: 32 }}>
        <ResponsiveContainer>
          <BarChart data={stats.channelData} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
            <Tooltip />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}