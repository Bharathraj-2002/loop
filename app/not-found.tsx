"use client";

export default function NotFound() {
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
      <h1 style={{ fontSize: 48, margin: 0 }}>404</h1>
      <p style={{ color: "#888", marginTop: 8 }}>
        This page does not exist, or you do not have access to it.
      </p>
      <button
        onClick={() => { window.location.href = "/dashboard"; }}
        style={{
          marginTop: 20,
          padding: "10px 16px",
          background: "#6c5ce7",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}