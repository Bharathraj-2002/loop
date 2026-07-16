"use client";

import { useState } from "react";

type Source = {
  index: number;
  id: string;
  content: string;
  channel: string;
};

export default function AskLoopPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else {
      setAnswer(data.answer);
      setSources(data.sources || []);
    }
    setLoading(false);
  }

  const examples = [
    "What are users saying about onboarding?",
    "What issues do customers have with billing?",
    "What do people like about the product?",
  ];

  return (
    <div style={{ padding: 20, maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
      <h1>Ask LOOP</h1>
      <p style={{ fontSize: 13, color: "#888" }}>
        Ask a question in plain English. Answers are grounded in your actual feedback data.
      </p>

      <form onSubmit={handleAsk} style={{ marginTop: 16 }}>
        <textarea
          placeholder="e.g. What are users saying about onboarding?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ width: "100%", padding: 10, minHeight: 70 }}
        />
        <button type="submit" disabled={loading} style={{ padding: "8px 16px", marginTop: 8 }}>
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => setQuestion(ex)}
            style={{ fontSize: 12, padding: "6px 10px", background: "#1a1a1a", border: "1px solid #444", borderRadius: 6 }}
          >
            {ex}
          </button>
        ))}
      </div>

      {error ? <p style={{ color: "red", marginTop: 16 }}>{error}</p> : null}

      {answer ? (
        <div style={{ marginTop: 24, border: "1px solid #444", borderRadius: 8, padding: 16 }}>
          <p style={{ margin: 0, fontWeight: "bold" }}>Answer</p>
          <p style={{ marginTop: 8, lineHeight: 1.5 }}>{answer}</p>

          {sources.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, fontWeight: "bold", color: "#888" }}>Sources</p>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {sources.map((s) => (
                  <li
                    key={s.id}
                    style={{
                      fontSize: 13,
                      color: "#aaa",
                      borderLeft: "2px solid #444",
                      paddingLeft: 10,
                      marginBottom: 8,
                    }}
                  >
                    [{s.index}] {s.content} <span style={{ color: "#666" }}>({s.channel})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}