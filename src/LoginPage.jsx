import { useState } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "https://gym-rpg.onrender.com";

function validateLoginForm(email, password) {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Invalid email format";
  if (!password) return "Password is required";
  return null;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateLoginForm(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Login failed. Please try again.");
        return;
      }

      login(json.data.token, json.data.profile);
    } catch {
      setError("Could not reach the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} noValidate>
      <input
        value={email}
        onChange={(e) => { setEmail(e.target.value); setError(""); }}
        placeholder="Email"
        type="email"
        autoComplete="email"
        disabled={loading}
      />
      <input
        value={password}
        onChange={(e) => { setPassword(e.target.value); setError(""); }}
        placeholder="Password"
        type="password"
        autoComplete="current-password"
        disabled={loading}
      />
      {error && <p className="error-text">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
