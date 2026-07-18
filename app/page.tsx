"use client";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900">LOOP</h1>
        <p className="text-slate-500 mt-2">AI Customer-Feedback Intelligence Platform</p>
        <button
          onClick={() => { window.location.href = "/login"; }}
          className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 cursor-pointer"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}