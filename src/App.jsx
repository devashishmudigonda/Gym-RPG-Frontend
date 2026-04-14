import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { GymProvider } from "./context/GymContext";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import WorkoutPage from "./pages/WorkoutPage";
import ExercisesPage from "./pages/ExercisesPage";

const API_BASE = import.meta.env.VITE_API_URL || "https://gym-rpg.onrender.com";

async function apiGet(path, token) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }

    const text = await res.text();
    if (!text) {
      throw new Error("Empty response from server");
    }

    const data = JSON.parse(text);
    if (data.success === false) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error("Invalid JSON response from server");
    }
    throw err;
  }
}

async function apiPost(path, body = {}, token) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }

    const text = await res.text();
    if (!text) {
      throw new Error("Empty response from server");
    }

    const data = JSON.parse(text);
    if (data.success === false) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error("Invalid JSON response from server");
    }
    throw err;
  }
}

function Card({ title, children, right }) {
  return (
    <div className="card">
      <div className="card-head">
        <h2>{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function BodyMap({ covered = [] }) {
  const groups = [
    "Shoulders",
    "Chest",
    "Back",
    "Core",
    "Biceps",
    "Triceps",
    "Legs",
    "Hamstrings",
    "Glutes",
    "Calves",
  ];

  return (
    <div className="body-map">
      {groups.map((group) => (
        <div
          key={group}
          className={covered.includes(group) ? "body-part active" : "body-part"}
        >
          {group}
        </div>
      ))}
    </div>
  );
}

function AuthGate() {
  const { token } = useAuth();
  const [mode, setMode] = useState("login");

  if (!token) {
    return (
      <div className="app-shell">
        <header className="hero premium">
          <div>
            <div className="eyebrow">Gym RPG</div>
            <h1>Train. Progress. Level Up.</h1>
            <p className="hero-text">
              Sign in to access your own dashboard, workout history, streaks,
              progress graphs, and exercise tracking.
            </p>
          </div>
        </header>

        <div className="grid two">
          <div className="card">
            <div className="card-head">
              <h2>Authentication</h2>
            </div>
            <div className="action-row">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={mode === "login" ? "" : "ghost"}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={mode === "register" ? "" : "ghost"}
              >
                Register
              </button>
            </div>

            <div style={{ marginTop: "16px" }}>
              {mode === "login" ? <LoginPage /> : <RegisterPage />}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Why this changed</h2>
            </div>
            <p className="helper-text">
              Every account now sees only its own profile, workout history,
              exercises, and missions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GymProvider>
      <div className="app-shell">
        <nav className="nav-bar">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            Dashboard
          </NavLink>
          <NavLink to="/workout" className={({ isActive }) => (isActive ? "active" : "")}>
            Workout
          </NavLink>
          <NavLink to="/exercises" className={({ isActive }) => (isActive ? "active" : "")}>
            Exercises
          </NavLink>
          <button type="button" className="danger" onClick={useAuth().logout}>
            Logout
          </button>
        </nav>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </GymProvider>
  );
}

export default function AppRoot() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}