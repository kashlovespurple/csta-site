// frontend/src/App.jsx
import { useState } from "react";
import { enroll, health } from "./api";

export default function App() {
  const [message, setMessage] = useState("");

  async function testHealth() {
    try {
      const r = await health();
      setMessage(JSON.stringify(r));
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function testEnroll() {
    try {
      const payload = {
        first_name: "Kashaya",
        last_name: "San",
        email: "juan@example.com",
        birthdate: "2004-08-28",
        program: "BSIT",
        year_level: "1",
        contact: "09171234567",
        address: "Cebu City",
        remarks: "Applying from frontend"
      };
      const r = await enroll(payload);
      setMessage(JSON.stringify(r));
    } catch (e) {
      setMessage(e.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>CSTA Frontend — Test API</h1>
      <button onClick={testHealth}>Check /api/health</button>
      <button style={{ marginLeft: 8 }} onClick={testEnroll}>POST /api/enroll/online</button>
      <pre style={{ marginTop: 16 }}>{message}</pre>
    </div>
  );
}
