import { useState } from "react";
import { useAuth } from "./AuthContext";

// const API_BASE = "https://gym-rpg.onrender.com";
const API_BASE = "http://0.0.0.0:3000";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();

    if (!json.success) {
      setMessage(json.message);
      return;
    }

    login(json.data.token, json.data.profile);
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button type="submit">Login</button>
      <p>{message}</p>
    </form>
  );
}