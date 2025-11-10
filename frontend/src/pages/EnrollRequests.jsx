// pages/EnrollRequests.jsx
import React, { useEffect, useState } from "react";
import { getEnrollRequests, acceptRequest, rejectRequest } from "../api";

export default function EnrollRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { username, temp_password }

  async function load() {
    setLoading(true);
    try {
      const res = await getEnrollRequests();
      setRequests(res.data || []);
    } catch (err) {
      alert("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onAccept(id) {
    if (!confirm("Accept this enrollment request? This creates a student account.")) return;
    try {
      const res = await acceptRequest(id);
      setModal(res.data);
      await load();
    } catch (err) {
      alert(err?.response?.data?.detail || "Accept failed");
    }
  }

  async function onReject(id) {
    if (!confirm("Reject this enrollment request?")) return;
    try {
      await rejectRequest(id);
      await load();
    } catch (err) {
      alert("Reject failed");
    }
  }

  async function copyCreds() {
    if (!modal) return;
    try {
      await navigator.clipboard.writeText(`Username: ${modal.username}\nTemporary password: ${modal.temp_password}`);
      alert("Copied to clipboard");
    } catch {
      alert("Copy failed");
    }
  }

  return (
    <main className="p-6">
      <div className="container max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Pending Enroll Requests</h1>
        {loading ? (<div>Loading…</div>) : requests.length === 0 ? (<div className="text-slate-600">No pending requests</div>) : (
          <table className="w-full table-auto border-collapse">
            <thead><tr className="text-left"><th>Name</th><th>Email</th><th>Program</th><th>Year</th><th>Submitted</th><th>Actions</th></tr></thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} className="border-t">
                  <td>{r.first_name} {r.last_name}</td>
                  <td>{r.email}</td>
                  <td>{r.program}</td>
                  <td>{r.year_level}</td>
                  <td>{r.created_at}</td>
                  <td className="space-x-2">
                    <button onClick={() => onAccept(r.id)} className="btn btn-primary">Accept</button>
                    <button onClick={() => onReject(r.id)} className="btn border text-red-600">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)}></div>
            <div className="bg-white p-6 rounded shadow z-10 max-w-md">
              <h2 className="text-lg font-semibold mb-2">Account created</h2>
              <p className="mb-2">Give these credentials to the student (one-time):</p>
              <div><strong>Username:</strong> <span className="ml-2 font-mono">{modal.username}</span></div>
              <div className="mb-3"><strong>Temporary password:</strong> <span className="ml-2 font-mono">{modal.temp_password}</span></div>
              <div className="flex justify-end gap-2">
                <button onClick={copyCreds} className="btn border">Copy</button>
                <button onClick={() => setModal(null)} className="btn btn-primary">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
