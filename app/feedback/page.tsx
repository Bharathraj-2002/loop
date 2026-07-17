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
  const [role, setRole] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [classifyingId, setClassifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.role) setRole(data.role);
      });
  }, []);

  const isViewer = role === "VIEWER";

  async function loadFeedback() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (channelFilter) params.set("channel", channelFilter);
    if (sentimentFilter) params.set("sentiment", sentimentFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const res = await fetch("/api/feedback?" + params.toString());
    const data = await res.json();
    if (data.feedback) {
      setFeedback(data.feedback);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadFeedback();
  }, [page, search, statusFilter, channelFilter, sentimentFilter, dateFrom, dateTo]);

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
      setPage(1);
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
    setPage(1);
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
    setPage(1);
    await loadFeedback();
  }

  async function handleStatusChange(id: string, newStatus: string) {
    await fetch("/api/feedback/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await loadFeedback();
  }

  async function handleClassify(id: string) {
    setClassifyingId(id);
    await fetch("/api/feedback/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackId: id }),
    });
    setClassifyingId(null);
    await loadFeedback();
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setChannelFilter("");
    setSentimentFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <div style={{ padding: 20, maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
      <h1>Feedback</h1>

      {isViewer ? (
        <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
          You are signed in as a Viewer. You can browse and search feedback, but adding,
          uploading, importing, and status changes are read-only for your role.
        </p>
      ) : null}

      {!isViewer && (
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
      )}

      {!isViewer && (
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
      )}

      {!isViewer && (
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
      )}

      <h2>Inbox</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <input
          placeholder="Search feedback..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ flex: 1, minWidth: 150, padding: 8 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{ padding: 8 }}
        >
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="ACTIONED">Actioned</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <select
          value={channelFilter}
          onChange={(e) => {
            setChannelFilter(e.target.value);
            setPage(1);
          }}
          style={{ padding: 8 }}
        >
          <option value="">All channels</option>
          <option value="Support ticket">Support ticket</option>
          <option value="App store review">App store review</option>
          <option value="NPS survey">NPS survey</option>
          <option value="Sales call note">Sales call note</option>
          <option value="Community post">Community post</option>
          <option value="Zendesk">Zendesk</option>
          <option value="App Store">App Store</option>
          <option value="Twitter">Twitter</option>
        </select>
        <select
          value={sentimentFilter}
          onChange={(e) => {
            setSentimentFilter(e.target.value);
            setPage(1);
          }}
          style={{ padding: 8 }}
        >
          <option value="">All sentiments</option>
          <option value="POS">Positive</option>
          <option value="NEU">Neutral</option>
          <option value="NEG">Negative</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontSize: 12, color: "#888" }}>
          From:
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            style={{ marginLeft: 4, padding: 6 }}
          />
        </label>
        <label style={{ fontSize: 12, color: "#888" }}>
          To:
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            style={{ marginLeft: 4, padding: 6 }}
          />
        </label>
        <button onClick={clearFilters} style={{ padding: "6px 12px", fontSize: 12 }}>
          Clear filters
        </button>
      </div>

      <p style={{ fontSize: 13, color: "#888" }}>{total} total items</p>

      {loading ? (
        <p>Loading...</p>
      ) : feedback.length === 0 ? (
        <p style={{ color: "#888" }}>No feedback matches your filters.</p>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                  {f.channel} {f.sentiment ? "- " + f.sentiment : ""}
                </p>
                {!isViewer && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      onClick={() => handleClassify(f.id)}
                      disabled={classifyingId === f.id}
                      style={{ fontSize: 11, padding: "4px 8px" }}
                    >
                      {classifyingId === f.id ? "Classifying..." : "Classify"}
                    </button>
                    <select
                      value={f.status}
                      onChange={(e) => handleStatusChange(f.id, e.target.value)}
                      style={{ fontSize: 12, padding: 4 }}
                    >
                      <option value="NEW">New</option>
                      <option value="REVIEWED">Reviewed</option>
                      <option value="ACTIONED">Actioned</option>
                    </select>
                  </div>
                )}
                {isViewer && (
                  <span style={{ fontSize: 12, color: "#666" }}>{f.status}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16 }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          style={{ padding: "6px 12px" }}
        >
          Previous
        </button>
        <span style={{ fontSize: 13 }}>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          style={{ padding: "6px 12px" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}