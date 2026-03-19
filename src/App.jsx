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

async function apiPost(path, body = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }
  return data;
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

export default function App() {
  const [profileForm, setProfileForm] = useState({
    name: "",
    age: "",
    body_weight: "",
  });
  const [profileIdInput, setProfileIdInput] = useState("1");

  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [missions, setMissions] = useState(null);
  const [todayCoverage, setTodayCoverage] = useState(null);
  const [weekCoverage, setWeekCoverage] = useState(null);

  const [catalog, setCatalog] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState("");

  const [exerciseForm, setExerciseForm] = useState({
    name: "",
    muscle_group: "",
  });
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editExerciseForm, setEditExerciseForm] = useState({
    name: "",
    muscle_group: "",
  });

  const [workoutForm, setWorkoutForm] = useState({
    exercise_id: "",
    weight: "",
    reps: "",
  });
  const [history, setHistory] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [lastWorkoutResult, setLastWorkoutResult] = useState(null);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [editWorkoutForm, setEditWorkoutForm] = useState({
    weight: "",
    reps: "",
  });

  const [activeWorkout, setActiveWorkout] = useState(null);

  const [message, setMessage] = useState("Ready");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activeProfileId = profile?.id || null;

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) =>
      `${item.name} ${item.muscle_group}`
        .toLowerCase()
        .includes(catalogSearch.toLowerCase())
    );
  }, [catalog, catalogSearch]);

  const selectedExercise = useMemo(() => {
    return (
      exercises.find((e) => String(e.id) === String(selectedExerciseId)) || null
    );
  }, [exercises, selectedExerciseId]);

  async function loadActiveWorkout(profileId) {
    try {
      const res = await apiGet(`/workouts/active/${profileId}`);
      setActiveWorkout(res.data || null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadExerciseDetails(exerciseId) {
    if (!exerciseId) return;

    const [historyRes, graphRes] = await Promise.all([
      apiGet(`/exercises/${exerciseId}/history`),
      apiGet(`/exercises/${exerciseId}/graph`),
    ]);

    setHistory(historyRes.data || []);
    setGraphData(graphRes.data || []);
  }

  async function refreshAll(profileId) {
    const [
      profileRes,
      dashboardRes,
      exercisesRes,
      missionsRes,
      todayCoverageRes,
      weekCoverageRes,
      catalogRes,
    ] = await Promise.all([
      apiGet(`/profiles/${profileId}`),
      apiGet(`/profiles/${profileId}/dashboard`),
      apiGet(`/profiles/${profileId}/exercises`),
      apiGet(`/profiles/${profileId}/missions`),
      apiGet(`/profiles/${profileId}/coverage/today`),
      apiGet(`/profiles/${profileId}/coverage/week`),
      apiGet(`/catalog/exercises`),
    ]);

    setProfile(profileRes.data);
    setDashboard(dashboardRes.data);
    setExercises(exercisesRes.data || []);
    setMissions(missionsRes.data);
    setTodayCoverage(todayCoverageRes.data);
    setWeekCoverage(weekCoverageRes.data);
    setCatalog(catalogRes.data || []);

    const firstExerciseId =
      selectedExerciseId ||
      (exercisesRes.data?.length ? String(exercisesRes.data[0].id) : "");

    if (firstExerciseId) {
      setSelectedExerciseId(String(firstExerciseId));
      await loadExerciseDetails(firstExerciseId);
    } else {
      setHistory([]);
      setGraphData([]);
    }

    await loadActiveWorkout(profileId);
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

      setProfileIdInput(String(res.data.id));
      setProfileForm({ name: "", age: "", body_weight: "" });

      await refreshAll(res.data.id);
      setMessage("Profile created");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadProfile(e) {
    e.preventDefault();
    if (!profileIdInput) return;

    setLoading(true);
    setError("");

    try {
      await refreshAll(profileIdInput);
      setMessage(`Profile ${profileIdInput} loaded`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartWorkout() {
    if (!activeProfileId) {
      setError("Create or load a profile first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiPost("/workouts/start", {
        profile_id: Number(activeProfileId),
      });

      await loadActiveWorkout(activeProfileId);
      setMessage("Workout started");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEndWorkout() {
    if (!activeWorkout?.session?.id) return;

    setLoading(true);
    setError("");

    try {
      await apiPost(`/workouts/end/${activeWorkout.session.id}`);
      setActiveWorkout(null);
      await refreshAll(activeProfileId);
      setMessage("Workout ended");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExercise(e) {
    e.preventDefault();

    if (!activeProfileId) {
      setError("Create or load a profile first.");
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

      setExerciseForm({ name: "", muscle_group: "" });
      setSelectedExerciseId(String(res.data.id));
      await refreshAll(activeProfileId);
      await loadExerciseDetails(res.data.id);
      setMessage("Exercise added");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUseCatalogExercise(item) {
    if (!activeProfileId) {
      setError("Create or load a profile first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiPost("/exercises", {
        profile_id: Number(activeProfileId),
        name: item.name,
        muscle_group: item.muscle_group,
      });

      setSelectedExerciseId(String(res.data.id));
      await refreshAll(activeProfileId);
      await loadExerciseDetails(res.data.id);
      setMessage(`${item.name} added from catalog`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogWorkout(e) {
    e.preventDefault();

    if (!activeProfileId) {
      setError("Create or load a profile first.");
      return;
    }

    if (!activeWorkout?.session?.id) {
      setError("Start a workout first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiPost("/workouts/log", {
        profile_id: Number(activeProfileId),
        exercise_id: Number(workoutForm.exercise_id),
        session_id: Number(activeWorkout.session.id),
        weight: Number(workoutForm.weight),
        reps: Number(workoutForm.reps),
      });

      setLastWorkoutResult(res.data);
      setWorkoutForm((prev) => ({
        ...prev,
        weight: "",
        reps: "",
      }));

      await refreshAll(activeProfileId);
      await loadExerciseDetails(workoutForm.exercise_id);
      await loadActiveWorkout(activeProfileId);

      setMessage("Workout logged");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteExercise(id) {
    if (!activeProfileId) return;

    setLoading(true);
    setError("");

    try {
      await apiPost(`/exercises/${id}/delete`);

      if (String(selectedExerciseId) === String(id)) {
        setSelectedExerciseId("");
        setHistory([]);
        setGraphData([]);
      }

      await refreshAll(activeProfileId);
      setMessage("Exercise deleted");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveExerciseEdit(id) {
    setLoading(true);
    setError("");

    try {
      await apiPost(`/exercises/${id}`, editExerciseForm);
      setEditingExerciseId(null);

      await refreshAll(activeProfileId);
      if (selectedExerciseId) {
        await loadExerciseDetails(selectedExerciseId);
      }

      setMessage("Exercise updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteWorkout(id) {
    setLoading(true);
    setError("");

    try {
      await apiPost(`/workouts/${id}/delete`);
      await refreshAll(activeProfileId);

      if (selectedExerciseId) {
        await loadExerciseDetails(selectedExerciseId);
      }

      if (activeProfileId) {
        await loadActiveWorkout(activeProfileId);
      }

      setMessage("Workout deleted");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveWorkoutEdit(id) {
    setLoading(true);
    setError("");

    try {
      await apiPost(`/workouts/${id}`, {
        weight: Number(editWorkoutForm.weight),
        reps: Number(editWorkoutForm.reps),
      });

      setEditingWorkoutId(null);
      await refreshAll(activeProfileId);

      if (selectedExerciseId) {
        await loadExerciseDetails(selectedExerciseId);
      }

      if (activeProfileId) {
        await loadActiveWorkout(activeProfileId);
      }

      setMessage("Workout updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    apiGet("/catalog/exercises")
      .then((res) => setCatalog(res.data || []))
      .catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      <header className="hero premium">
        <div>
          <div className="eyebrow">Gym RPG</div>
          <h1>Train. Progress. Level Up.</h1>
          <p className="hero-text">
            Premium workout tracking with XP, streaks, progress graphs, exercise
            catalog, muscle coverage, and custom exercise support.
          </p>
        </div>

        <div className="hero-status">
          <div className="status-pill">{loading ? "Syncing..." : "Online"}</div>
          <div className="status-message">{error ? error : message}</div>
        </div>
      </header>

      <div className="grid two">
        <Card title="Create Profile">
          <form className="form-grid" onSubmit={handleCreateProfile}>
            <input
              placeholder="Name"
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
              required
            />
            <input
              type="number"
              placeholder="Age"
              value={profileForm.age}
              onChange={(e) =>
                setProfileForm({ ...profileForm, age: e.target.value })
              }
              required
            />
            <input
              type="number"
              step="0.1"
              placeholder="Body Weight"
              value={profileForm.body_weight}
              onChange={(e) =>
                setProfileForm({ ...profileForm, body_weight: e.target.value })
              }
              required
            />
            <button type="submit">Create Profile</button>
          </form>
        </Card>

        <Card title="Load Profile">
          <form className="inline-form" onSubmit={handleLoadProfile}>
            <input
              value={profileIdInput}
              onChange={(e) => setProfileIdInput(e.target.value)}
              placeholder="Profile ID"
            />
            <button type="submit">Load</button>
          </form>
        </Card>
      </div>

      {profile && dashboard && (
        <>
          <Card
            title={`Dashboard — ${profile.name}`}
            right={<div className="level-chip">{dashboard.level}</div>}
          >
            <div className="stats-grid">
              <Stat label="XP" value={dashboard.xp} />
              <Stat label="Score" value={dashboard.score} />
              <Stat label="Workout Days" value={dashboard.total_workout_days} />
              <Stat label="Current Streak" value={dashboard.current_streak} />
              <Stat label="Longest Streak" value={dashboard.longest_streak} />
              <Stat label="PR Count" value={dashboard.pr_count} />
              <Stat label="Total Volume" value={dashboard.total_volume} />
            </div>

            <div className="badges-wrap">
              {dashboard.badges?.map((b) => (
                <span className="badge-pill" key={b.id}>
                  {b.name}
                </span>
              ))}
            </div>
          </Card>

          <div className="grid two">
            <Card title="Workout Session">
              {!activeWorkout ? (
                <div className="session-box">
                  <p className="helper-text">
                    No active workout session right now.
                  </p>
                  <button onClick={handleStartWorkout}>Start Workout</button>
                </div>
              ) : (
                <div className="session-box">
                  <p>
                    <strong>Status:</strong> Active
                  </p>
                  <p>
                    <strong>Session ID:</strong> {activeWorkout.session.id}
                  </p>
                  <p>
                    <strong>Started:</strong> {activeWorkout.session.started_at}
                  </p>
                  <button className="danger" onClick={handleEndWorkout}>
                    End Workout
                  </button>
                </div>
              )}
            </Card>

            <Card title="Current Session Logs">
              {activeWorkout?.entries?.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Exercise</th>
                        <th>Muscle</th>
                        <th>Weight</th>
                        <th>Reps</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeWorkout.entries.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.exercise_name}</td>
                          <td>{entry.muscle_group}</td>
                          <td>{entry.weight}</td>
                          <td>{entry.reps}</td>
                          <td>{entry.performed_at.slice(11, 19)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="helper-text">
                  {activeWorkout
                    ? "No exercises logged in this session yet."
                    : "Start a workout to begin logging."}
                </p>
              )}
            </Card>
          </div>

          <div className="grid two">
            <Card title="Weekly Missions">
              {missions?.weekly_missions?.map((m) => (
                <div className={m.completed ? "mission done" : "mission"} key={m.name}>
                  <div>
                    <strong>{m.name}</strong>
                    <p>{m.description}</p>
                  </div>
                  <span>{m.completed ? "Done" : "Pending"}</span>
                </div>
              ))}
            </Card>

            <Card title="Latest Workout Reward">
              {lastWorkoutResult ? (
                <div className="result-box">
                  <p>
                    <strong>XP Gained:</strong> {lastWorkoutResult.gained_xp}
                  </p>
                  <p>
                    <strong>Total XP:</strong> {lastWorkoutResult.total_xp}
                  </p>
                  <p>
                    <strong>New PR:</strong>{" "}
                    {lastWorkoutResult.new_pr ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Badges:</strong>{" "}
                    {lastWorkoutResult.unlocked_badges?.join(", ") || "None"}
                  </p>
                </div>
              ) : (
                <p className="helper-text">Log a workout to see rewards.</p>
              )}
            </Card>
          </div>

          <div className="grid two">
            <Card title="Exercise Catalog">
              <input
                placeholder="Search exercise..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />

              <div className="catalog-list">
                {filteredCatalog.slice(0, 15).map((item) => (
                  <div className="catalog-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.muscle_group}</p>
                    </div>
                    <button onClick={() => handleUseCatalogExercise(item)}>
                      Add
                    </button>
                  </div>
                ))}
              </div>

              {filteredCatalog.length === 0 && (
                <div className="custom-add-box">
                  <p className="helper-text">
                    Exercise not found. Add your custom one below.
                  </p>
                </div>
              )}
            </Card>

            <Card title="Add Custom Exercise">
              <form className="form-grid" onSubmit={handleAddExercise}>
                <input
                  placeholder="Exercise name"
                  value={exerciseForm.name}
                  onChange={(e) =>
                    setExerciseForm({ ...exerciseForm, name: e.target.value })
                  }
                  required
                />
                <input
                  placeholder="Muscle group"
                  value={exerciseForm.muscle_group}
                  onChange={(e) =>
                    setExerciseForm({
                      ...exerciseForm,
                      muscle_group: e.target.value,
                    })
                  }
                  required
                />
                <button type="submit">Add Custom Exercise</button>
              </form>
            </Card>
          </div>

          <div className="grid two">
            <Card title="Today's Muscle Coverage">
              <BodyMap covered={todayCoverage?.covered || []} />
              <p className="coverage-line">
                <strong>Covered:</strong>{" "}
                {(todayCoverage?.covered || []).join(", ") || "None"}
              </p>
              <p className="coverage-line">
                <strong>Missing:</strong>{" "}
                {(todayCoverage?.missing || []).join(", ") || "None"}
              </p>
            </Card>

            <Card title="Weekly Muscle Coverage">
              <BodyMap covered={weekCoverage?.covered || []} />
              <p className="coverage-line">
                <strong>Covered:</strong>{" "}
                {(weekCoverage?.covered || []).join(", ") || "None"}
              </p>
              <p className="coverage-line">
                <strong>Missing:</strong>{" "}
                {(weekCoverage?.missing || []).join(", ") || "None"}
              </p>
            </Card>
          </div>

          <div className="grid two">
            <Card title="Your Exercises">
              <div className="exercise-list">
                {exercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className={
                      String(selectedExerciseId) === String(exercise.id)
                        ? "exercise-item active"
                        : "exercise-item"
                    }
                  >
                    {editingExerciseId === exercise.id ? (
                      <div className="edit-stack">
                        <input
                          value={editExerciseForm.name}
                          onChange={(e) =>
                            setEditExerciseForm({
                              ...editExerciseForm,
                              name: e.target.value,
                            })
                          }
                        />
                        <input
                          value={editExerciseForm.muscle_group}
                          onChange={(e) =>
                            setEditExerciseForm({
                              ...editExerciseForm,
                              muscle_group: e.target.value,
                            })
                          }
                        />
                        <div className="action-row">
                          <button onClick={() => handleSaveExerciseEdit(exercise.id)}>
                            Save
                          </button>
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => setEditingExerciseId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          onClick={() => {
                            setSelectedExerciseId(String(exercise.id));
                            loadExerciseDetails(exercise.id);
                            setWorkoutForm((prev) => ({
                              ...prev,
                              exercise_id: String(exercise.id),
                            }));
                          }}
                        >
                          <strong>{exercise.name}</strong>
                          <p>{exercise.muscle_group}</p>
                        </div>

                        <div className="action-row vertical">
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => {
                              setEditingExerciseId(exercise.id);
                              setEditExerciseForm({
                                name: exercise.name,
                                muscle_group: exercise.muscle_group,
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeleteExercise(exercise.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Log Workout">
              <form className="form-grid" onSubmit={handleLogWorkout}>
                <select
                  value={workoutForm.exercise_id}
                  onChange={(e) =>
                    setWorkoutForm({
                      ...workoutForm,
                      exercise_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select exercise</option>
                  {exercises.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} — {e.muscle_group}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.1"
                  placeholder="Weight"
                  value={workoutForm.weight}
                  onChange={(e) =>
                    setWorkoutForm({ ...workoutForm, weight: e.target.value })
                  }
                  required
                />

                <input
                  type="number"
                  placeholder="Reps"
                  value={workoutForm.reps}
                  onChange={(e) =>
                    setWorkoutForm({ ...workoutForm, reps: e.target.value })
                  }
                  required
                />

                <button type="submit" disabled={!activeWorkout?.session?.id}>
                  {activeWorkout?.session?.id
                    ? "Log Workout"
                    : "Start Workout First"}
                </button>
              </form>
            </Card>
          </div>

          <div className="grid two">
            <Card title="Max Weight Progress">
              <div className="chart-box">
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
                      strokeWidth={3}
                      name="Max Weight"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Volume Progress">
              <div className="chart-box">
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
              </div>
            </Card>
          </div>

          <Card title="Workout History">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Weight</th>
                    <th>Reps</th>
                    <th>Volume</th>
                    <th>PR</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => {
                    const workoutId = item.id;

                    return (
                      <tr key={`${item.date}-${index}`}>
                        <td>{item.date.slice(0, 10)}</td>

                        <td>
                          {editingWorkoutId === workoutId ? (
                            <input
                              value={editWorkoutForm.weight}
                              onChange={(e) =>
                                setEditWorkoutForm({
                                  ...editWorkoutForm,
                                  weight: e.target.value,
                                })
                              }
                            />
                          ) : (
                            item.weight
                          )}
                        </td>

                        <td>
                          {editingWorkoutId === workoutId ? (
                            <input
                              value={editWorkoutForm.reps}
                              onChange={(e) =>
                                setEditWorkoutForm({
                                  ...editWorkoutForm,
                                  reps: e.target.value,
                                })
                              }
                            />
                          ) : (
                            item.reps
                          )}
                        </td>

                        <td>{item.volume}</td>
                        <td>{item.is_pr ? "Yes" : "No"}</td>

                        <td>
                          <div className="action-row">
                            {editingWorkoutId === workoutId ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveWorkoutEdit(workoutId)}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="ghost"
                                  onClick={() => setEditingWorkoutId(null)}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="ghost"
                                  onClick={() => {
                                    setEditingWorkoutId(workoutId);
                                    setEditWorkoutForm({
                                      weight: item.weight,
                                      reps: item.reps,
                                    });
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() => handleDeleteWorkout(workoutId)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}