"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        textAlign: "center",
        padding: 20,
      }}
    >
      <h1 style={{ fontSize: 32, margin: 0 }}>Something went wrong</h1>
      <p style={{ color: "#888", marginTop: 8, maxWidth: 400 }}>
        An unexpected error occurred. You can try again, or head back to the dashboard.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button
          onClick={() => reset()}
          style={{
            padding: "10px 16px",
            background: "#6c5ce7",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <button
          onClick={() => { window.location.href = "/dashboard"; }}
          style={{
            padding: "10px 16px",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}