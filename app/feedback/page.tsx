"use client";

import { useEffect, useRef, useState } from "react";

type Feedback = {
  id: string;
  content: string;
  channel: string;
  sentiment: string | null;
  status: string;
  createdAt: string;
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ imported: number; failed: number; total: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadFeedback() {
    const res = await fetch("/api/feedback");
    const data = await res.json();
    if (data.feedback) setFeedback(data.feedback);
    setLoading(false);
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content, channel: channel }),
    });
    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else {
      setContent("");
      setChannel("");
      await loadFeedback();
    }
    setSubmitting(false);
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) {
      return;
    }
    setUploading(true);
    setCsvResult(null);

    const text = await file.text();
    const res = await fetch("/api/feedback/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: text }),
    });
    const data = await res.json();
    setCsvResult(data);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    await loadFeedback();
  }

  async function handleSimulate() {
    setSimulating(true);
    setSimResult(null);

    const res = await fetch("/api/feedback/simulate", {
      method: "POST",
    });
    const data = await res.json();
    if (data.created !== undefined) {
      setSimResult(data.created);
    }
    setSimulating(false);
    await loadFeedback();
  }

  return (
    <div style={{ padding: 20, maxWidth: 700 }}>
      <h1>Feedback</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <textarea
            placeholder="Feedback content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{ width: "100%", padding: 8, minHeight: 60 }}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Channel (e.g. Support ticket, NPS survey)"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        {error ? <p style={{ color: "red" }}>{error}</p> : null}
        <button type="submit" disabled={submitting} style={{ padding: "8px 16px" }}>
          {submitting ? "Adding..." : "Add Feedback"}
        </button>
      </form>

      <div style={{ marginBottom: 16, border: "1px solid #444", borderRadius: 6, padding: 12 }}>
        <p style={{ marginTop: 0, fontWeight: "bold" }}>Bulk upload (CSV)</p>
        <p style={{ fontSize: 12, color: "#888" }}>
          Columns required: content, channel (optional: customer_label)
        </p>
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleCsvUpload}
          disabled={uploading}
        />
        {uploading ? <p>Uploading...</p> : null}
        {csvResult ? (
          <p style={{ fontSize: 13 }}>
            Imported: {csvResult.imported} / {csvResult.total} - Failed: {csvResult.failed}
          </p>
        ) : null}
      </div>

      <div style={{ marginBottom: 24, border: "1px solid #444", borderRadius: 6, padding: 12 }}>
        <p style={{ marginTop: 0, fontWeight: "bold" }}>Simulated channel import</p>
        <p style={{ fontSize: 12, color: "#888" }}>
          Pulls sample feedback from a simulated integration (Zendesk, App Store, Twitter, Community).
        </p>
        <button onClick={handleSimulate} disabled={simulating} style={{ padding: "8px 16px" }}>
          {simulating ? "Importing..." : "Import from channels"}
        </button>
        {simResult !== null ? (
          <p style={{ fontSize: 13, marginTop: 8 }}>Imported {simResult} items.</p>
        ) : null}
      </div>

      <h2>All Feedback</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {feedback.map((f) => (
            <li
              key={f.id}
              style={{
                border: "1px solid #444",
                borderRadius: 6,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <p style={{ margin: 0 }}>{f.content}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
                {f.channel} - {f.status} {f.sentiment ? "- " + f.sentiment : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}