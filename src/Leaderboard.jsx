import { useEffect, useState } from "react";

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

export default function Leaderboard({ token }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadLeaderboard() {
    setLoading(true);
    setError("");

    console.log("Loading leaderboard with token:", token);

    try {
      const res = await apiGet("/leaderboard", token);
      console.log("Leaderboard response:", res);
      setLeaderboard(res.data || []);
    } catch (err) {
      console.error("Leaderboard error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadLeaderboard();
    }
  }, [token]);

  return (
    <div className="card">
      <div className="card-head">
        <h2>🏆 Top Athletes Leaderboard</h2>
        <button type="button" className="ghost" onClick={loadLeaderboard}>
          Refresh
        </button>
      </div>

      {error && <p className="error-text" style={{ marginBottom: "12px" }}>{error}</p>}

      {loading ? (
        <p className="helper-text">Loading leaderboard...</p>
      ) : leaderboard.length > 0 ? (
        <div className="leaderboard-table">
          <table>
            <thead>
              <tr>
                <th className="rank-col">Rank</th>
                <th className="name-col">Athlete</th>
                <th className="xp-col">XP</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(([name, xp], index) => (
                <tr key={`${name}-${index}`} className={`rank-${index + 1}`}>
                  <td className="rank-cell">
                    <span className="rank-badge">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                    </span>
                  </td>
                  <td className="name-cell">{name}</td>
                  <td className="xp-cell">
                    <strong>{Number(xp).toLocaleString()}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="helper-text">No leaderboard data available yet.</p>
      )}
    </div>
  );
}
