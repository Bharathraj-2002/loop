"use client";

import { useEffect, useState } from "react";

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
      body: JSON.stringify({ content, channel }),
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

  return (
    <div style={{ padding: 20, maxWidth: 700 }}>
      <h1>Feedback</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: 16, marginBottom: 24 }}>
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
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={submitting} style={{ padding: "8px 16px" }}>
          {submitting ? "Adding..." : "Add Feedback"}
        </button>
      </form>

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
                {f.channel} · {f.status} {f.sentiment ? `· ${f.sentiment}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}