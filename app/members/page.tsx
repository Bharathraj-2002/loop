"use client";

import { useEffect, useState } from "react";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/members")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setMembers(data.members);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (error) return <p style={{ padding: 20, color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Workspace Members</h1>
      <table style={{ borderCollapse: "collapse", marginTop: 20, width: "100%" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #444", padding: 8, textAlign: "left" }}>Name</th>
            <th style={{ border: "1px solid #444", padding: 8, textAlign: "left" }}>Email</th>
            <th style={{ border: "1px solid #444", padding: 8, textAlign: "left" }}>Role</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td style={{ border: "1px solid #444", padding: 8 }}>{m.name}</td>
              <td style={{ border: "1px solid #444", padding: 8 }}>{m.email}</td>
              <td style={{ border: "1px solid #444", padding: 8 }}>{m.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}