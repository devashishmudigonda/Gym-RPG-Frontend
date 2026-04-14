import { useState } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "https://gym-rpg.onrender.com";

function validateRegisterForm({ email, password, name, age, body_weight }) {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Invalid email format";
  if (email.trim().length > 254) return "Email is too long";

  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password must be 128 characters or less";

  if (!name.trim()) return "Name is required";
  if (name.trim().length > 50) return "Name must be 50 characters or less";

  const ageNum = Number(age);
  if (!age && age !== 0) return "Age is required";
  if (!Number.isInteger(ageNum) || isNaN(ageNum)) return "Age must be a whole number";
  if (ageNum < 13 || ageNum > 120) return "Age must be between 13 and 120";

  const weightNum = Number(body_weight);
  if (!body_weight && body_weight !== 0) return "Body weight is required";
  if (isNaN(weightNum)) return "Body weight must be a number";
  if (weightNum < 20 || weightNum > 500) return "Body weight must be between 20 and 500 kg";

  return null;
}

export default function RegisterPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    age: "",
    body_weight: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateRegisterForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          name: form.name.trim(),
          age: Number(form.age),
          body_weight: Number(form.body_weight),
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Registration failed. Please try again.");
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
    <form onSubmit={handleRegister} noValidate>
      <input
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={update("email")}
        autoComplete="email"
        disabled={loading}
      />
      <input
        placeholder="Password (min 8 characters)"
        type="password"
        value={form.password}
        onChange={update("password")}
        autoComplete="new-password"
        disabled={loading}
      />
      <input
        placeholder="Name"
        type="text"
        value={form.name}
        onChange={update("name")}
        autoComplete="name"
        disabled={loading}
      />
      <input
        placeholder="Age (13–120)"
        type="number"
        min="13"
        max="120"
        value={form.age}
        onChange={update("age")}
        disabled={loading}
      />
      <input
        placeholder="Body Weight in kg (20–500)"
        type="number"
        min="20"
        max="500"
        step="0.1"
        value={form.body_weight}
        onChange={update("body_weight")}
        disabled={loading}
      />
      {error && <p className="error-text">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Register"}
      </button>
    </form>
  );
}
