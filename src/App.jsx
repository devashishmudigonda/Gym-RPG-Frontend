import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import "./App.css";

const API_BASE = "http://127.0.0.1:3000";

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

function SectionCard({ title, children, right }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{title}</h2>
        {right && <div>{right}</div>}
      </div>
      {children}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default function App() {
  const [profileForm, setProfileForm] = useState({
    name: "",
    age: "",
    body_weight: "",
  });

  const [exerciseForm, setExerciseForm] = useState({
    name: "",
    muscle_group: "",
  });

  const [workoutForm, setWorkoutForm] = useState({
    exercise_id: "",
    weight: "",
    reps: "",
  });

  const [profileIdInput, setProfileIdInput] = useState("1");
  const [activeProfileId, setActiveProfileId] = useState(null);

  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [history, setHistory] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [lastWorkoutResult, setLastWorkoutResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Ready");
  const [error, setError] = useState("");

  const selectedExercise = useMemo(() => {
    return exercises.find((e) => String(e.id) === String(selectedExerciseId)) || null;
  }, [exercises, selectedExerciseId]);

  async function loadProfileData(profileId) {
    setLoading(true);
    setError("");
    try {
      const [profileRes, dashboardRes, exercisesRes] = await Promise.all([
        apiGet(`/profiles/${profileId}`),
        apiGet(`/profiles/${profileId}/dashboard`),
        apiGet(`/profiles/${profileId}/exercises`),
      ]);

      setProfile(profileRes.data);
      setDashboard(dashboardRes.data);
      setExercises(exercisesRes.data || []);
      setActiveProfileId(profileId);

      if ((exercisesRes.data || []).length > 0) {
        const firstId = exercisesRes.data[0].id;
        setSelectedExerciseId(String(firstId));
        await loadExerciseDetails(firstId);
      } else {
        setSelectedExerciseId("");
        setHistory([]);
        setGraphData([]);
      }

      setMessage(`Loaded profile ${profileId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadExerciseDetails(exerciseId) {
    if (!exerciseId) return;
    try {
      const [historyRes, graphRes] = await Promise.all([
        apiGet(`/exercises/${exerciseId}/history`),
        apiGet(`/exercises/${exerciseId}/graph`),
      ]);
      setHistory(historyRes.data || []);
      setGraphData(graphRes.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateProfile(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/profiles", {
        name: profileForm.name,
        age: Number(profileForm.age),
        body_weight: Number(profileForm.body_weight),
      });

      const newProfile = res.data;
      setProfileForm({ name: "", age: "", body_weight: "" });
      setProfileIdInput(String(newProfile.id));
      await loadProfileData(newProfile.id);
      setMessage(`Profile created for ${newProfile.name}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadProfile(e) {
    e.preventDefault();
    if (!profileIdInput) return;
    await loadProfileData(profileIdInput);
  }

  async function handleCreateExercise(e) {
    e.preventDefault();
    if (!activeProfileId) {
      setError("Load or create a profile first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/exercises", {
        profile_id: Number(activeProfileId),
        name: exerciseForm.name,
        muscle_group: exerciseForm.muscle_group,
      });

      const created = res.data;
      const updatedExercises = [created, ...exercises];
      setExercises(updatedExercises);
      setExerciseForm({ name: "", muscle_group: "" });

      setSelectedExerciseId(String(created.id));
      setWorkoutForm((prev) => ({ ...prev, exercise_id: String(created.id) }));

      await loadExerciseDetails(created.id);
      await refreshDashboard(activeProfileId);

      setMessage(`Exercise "${created.name}" added`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogWorkout(e) {
    e.preventDefault();
    if (!activeProfileId) {
      setError("Load or create a profile first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/workouts/log", {
        profile_id: Number(activeProfileId),
        exercise_id: Number(workoutForm.exercise_id),
        weight: Number(workoutForm.weight),
        reps: Number(workoutForm.reps),
      });

      setLastWorkoutResult(res.data);
      setWorkoutForm((prev) => ({
        ...prev,
        weight: "",
        reps: "",
      }));

      if (workoutForm.exercise_id) {
        await loadExerciseDetails(workoutForm.exercise_id);
        setSelectedExerciseId(String(workoutForm.exercise_id));
      }
      await refreshDashboard(activeProfileId);

      setMessage("Workout logged successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshDashboard(profileId) {
    const [dashboardRes, exercisesRes] = await Promise.all([
      apiGet(`/profiles/${profileId}/dashboard`),
      apiGet(`/profiles/${profileId}/exercises`),
    ]);
    setDashboard(dashboardRes.data);
    setExercises(exercisesRes.data || []);
  }

  function handleExerciseSelection(id) {
    setSelectedExerciseId(String(id));
    setWorkoutForm((prev) => ({ ...prev, exercise_id: String(id) }));
    loadExerciseDetails(id);
  }

  useEffect(() => {
    const id = workoutForm.exercise_id || selectedExerciseId;
    if (!workoutForm.exercise_id && id) {
      setWorkoutForm((prev) => ({ ...prev, exercise_id: String(id) }));
    }
  }, [selectedExerciseId, workoutForm.exercise_id]);

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Rust + React Gym Tracker</p>
          <h1>Level up your lifts</h1>
          <p className="hero-text">
            Create a profile, add exercises, log workouts, gain XP, unlock badges,
            and track exercise progress with graphs.
          </p>
        </div>
        <div className="hero-status">
          <div className="status-pill">{loading ? "Loading..." : "Backend Connected"}</div>
          <div className="status-message">{error ? `Error: ${error}` : message}</div>
        </div>
      </header>

      <div className="grid two">
        <SectionCard title="Create Profile">
          <form className="form-grid" onSubmit={handleCreateProfile}>
            <input
              type="text"
              placeholder="Name"
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <input
              type="number"
              placeholder="Age"
              value={profileForm.age}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, age: e.target.value }))
              }
              required
            />
            <input
              type="number"
              step="0.1"
              placeholder="Body weight (kg)"
              value={profileForm.body_weight}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, body_weight: e.target.value }))
              }
              required
            />
            <button type="submit">Create Profile</button>
          </form>
        </SectionCard>

        <SectionCard title="Load Existing Profile">
          <form className="inline-form" onSubmit={handleLoadProfile}>
            <input
              type="number"
              placeholder="Profile ID"
              value={profileIdInput}
              onChange={(e) => setProfileIdInput(e.target.value)}
              required
            />
            <button type="submit">Load</button>
          </form>
          <p className="helper-text">
            After creating a profile once, use its ID here to reload it later.
          </p>
        </SectionCard>
      </div>

      {profile && dashboard && (
        <>
          <SectionCard
            title={`Dashboard — ${profile.name}`}
            right={<span className="level-chip">{dashboard.level}</span>}
          >
            <div className="stats-grid">
              <StatBox label="XP" value={dashboard.xp} />
              <StatBox label="Score" value={dashboard.score} />
              <StatBox label="Workout Days" value={dashboard.total_workout_days} />
              <StatBox label="Current Streak" value={dashboard.current_streak} />
              <StatBox label="Longest Streak" value={dashboard.longest_streak} />
              <StatBox label="PR Count" value={dashboard.pr_count} />
              <StatBox label="Total Volume" value={dashboard.total_volume} />
            </div>

            <div className="badges-wrap">
              {(dashboard.badges || []).length > 0 ? (
                dashboard.badges.map((badge) => (
                  <span key={badge.id} className="badge-pill">
                    {badge.name}
                  </span>
                ))
              ) : (
                <p className="helper-text">No badges unlocked yet.</p>
              )}
            </div>
          </SectionCard>

          <div className="grid two">
            <SectionCard title="Add Exercise">
              <form className="form-grid" onSubmit={handleCreateExercise}>
                <input
                  type="text"
                  placeholder="Exercise name"
                  value={exerciseForm.name}
                  onChange={(e) =>
                    setExerciseForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Muscle group"
                  value={exerciseForm.muscle_group}
                  onChange={(e) =>
                    setExerciseForm((prev) => ({
                      ...prev,
                      muscle_group: e.target.value,
                    }))
                  }
                  required
                />
                <button type="submit">Add Exercise</button>
              </form>
            </SectionCard>

            <SectionCard title="Log Workout">
              <form className="form-grid" onSubmit={handleLogWorkout}>
                <select
                  value={workoutForm.exercise_id}
                  onChange={(e) =>
                    setWorkoutForm((prev) => ({
                      ...prev,
                      exercise_id: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select exercise</option>
                  {exercises.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name} — {exercise.muscle_group}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.1"
                  placeholder="Weight"
                  value={workoutForm.weight}
                  onChange={(e) =>
                    setWorkoutForm((prev) => ({ ...prev, weight: e.target.value }))
                  }
                  required
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={workoutForm.reps}
                  onChange={(e) =>
                    setWorkoutForm((prev) => ({ ...prev, reps: e.target.value }))
                  }
                  required
                />
                <button type="submit">Log Workout</button>
              </form>

              {lastWorkoutResult && (
                <div className="result-box">
                  <p><strong>XP Gained:</strong> {lastWorkoutResult.gained_xp}</p>
                  <p><strong>Total XP:</strong> {lastWorkoutResult.total_xp}</p>
                  <p><strong>New PR:</strong> {lastWorkoutResult.new_pr ? "Yes" : "No"}</p>
                  <p>
                    <strong>Badges Unlocked:</strong>{" "}
                    {lastWorkoutResult.unlocked_badges?.length > 0
                      ? lastWorkoutResult.unlocked_badges.join(", ")
                      : "None"}
                  </p>
                </div>
              )}
            </SectionCard>
          </div>

          <div className="grid two">
            <SectionCard title="Exercises">
              {exercises.length === 0 ? (
                <p className="helper-text">No exercises yet. Add one to begin.</p>
              ) : (
                <div className="exercise-list">
                  {exercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      className={
                        String(selectedExerciseId) === String(exercise.id)
                          ? "exercise-item active"
                          : "exercise-item"
                      }
                      onClick={() => handleExerciseSelection(exercise.id)}
                    >
                      <div>
                        <strong>{exercise.name}</strong>
                        <p>{exercise.muscle_group}</p>
                      </div>
                      <span>#{exercise.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Selected Exercise">
              {selectedExercise ? (
                <div className="selected-exercise-box">
                  <h3>{selectedExercise.name}</h3>
                  <p>Muscle Group: {selectedExercise.muscle_group}</p>
                  <p>Exercise ID: {selectedExercise.id}</p>
                </div>
              ) : (
                <p className="helper-text">Select an exercise to view its progress.</p>
              )}
            </SectionCard>
          </div>

          <div className="grid two">
            <SectionCard title="Max Weight Progress">
              <div className="chart-box">
                {graphData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="max_weight"
                        name="Max Weight"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="helper-text">No graph data yet.</p>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Volume Progress">
              <div className="chart-box">
                {graphData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_volume" name="Total Volume" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="helper-text">No volume data yet.</p>
                )}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Exercise History">
            {history.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Weight</th>
                      <th>Reps</th>
                      <th>Volume</th>
                      <th>PR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item, index) => (
                      <tr key={`${item.date}-${index}`}>
                        <td>{item.date.slice(0, 10)}</td>
                        <td>{item.weight}</td>
                        <td>{item.reps}</td>
                        <td>{item.volume}</td>
                        <td>{item.is_pr ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="helper-text">No history yet for this exercise.</p>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}