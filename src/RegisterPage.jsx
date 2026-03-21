import { useState } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = "http://0.0.0.0:3000";

export default function RegisterPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    age: "",
    body_weight: "",
  });
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        age: Number(form.age),
        body_weight: Number(form.body_weight),
      }),
    });

    const json = await res.json();

    if (!json.success) {
      setMessage(json.message);
      return;
    }

    login(json.data.token, json.data.profile);
  };

  return (
    <form onSubmit={handleRegister}>
      <h2>Register</h2>
      <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
      <input placeholder="Body Weight" value={form.body_weight} onChange={(e) => setForm({ ...form, body_weight: e.target.value })} />
      <button type="submit">Register</button>
      <p>{message}</p>
    </form>
  );
}