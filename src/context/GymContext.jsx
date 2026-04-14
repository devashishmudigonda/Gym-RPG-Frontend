import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "https://gym-rpg.onrender.com";

async function apiGet(path, token) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    const text = await res.text();
    if (!text) throw new Error("Empty response from server");
    const data = JSON.parse(text);
    if (data.success === false) throw new Error(data.message || "Request failed");
    return data;
  } catch (err) {
    if (err instanceof SyntaxError) throw new Error("Invalid JSON response from server");
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
    if (!res.ok) throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    const text = await res.text();
    if (!text) throw new Error("Empty response from server");
    const data = JSON.parse(text);
    if (data.success === false) throw new Error(data.message || "Request failed");
    return data;
  } catch (err) {
    if (err instanceof SyntaxError) throw new Error("Invalid JSON response from server");
    throw err;
  }
}

const GymContext = createContext();

export function GymProvider({ children }) {
  const { token, profile: authProfile, setProfile } = useAuth();

  const [profile, setProfileState] = useState(authProfile || null);
  const [dashboard, setDashboard] = useState(null);
  const [missions, setMissions] = useState(null);
  const [todayCoverage, setTodayCoverage] = useState(null);
  const [weekCoverage, setWeekCoverage] = useState(null);
  const [workoutDays, setWorkoutDays] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const [catalog, setCatalog] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState("");

  const [exerciseForm, setExerciseForm] = useState({
    name: "",
    muscle_group: "",
    equipment: "",
    secondary_muscles: "",
  });
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editExerciseForm, setEditExerciseForm] = useState({ name: "", muscle_group: "" });

  const [workoutForm, setWorkoutForm] = useState({ exercise_id: "", weight: "", reps: "" });
  const [history, setHistory] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [lastWorkoutResult, setLastWorkoutResult] = useState(null);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [editWorkoutForm, setEditWorkoutForm] = useState({ weight: "", reps: "" });

  const [activeWorkout, setActiveWorkout] = useState(null);

  const [message, setMessage] = useState("Ready");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) =>
      `${item.name} ${item.muscle_group}`.toLowerCase().includes(catalogSearch.toLowerCase())
    );
  }, [catalog, catalogSearch]);

  const selectedExercise = useMemo(() => {
    return exercises.find((e) => String(e.id) === String(selectedExerciseId)) || null;
  }, [exercises, selectedExerciseId]);

  async function loadActiveWorkout() {
    try {
      const res = await apiGet("/me/workouts/active", token);
      setActiveWorkout(res.data || null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadExerciseDetails(exerciseId) {
    if (!exerciseId) return;
    const [historyRes, graphRes] = await Promise.all([
      apiGet(`/me/exercises/${exerciseId}/history`, token),
      apiGet(`/me/exercises/${exerciseId}/graph`, token),
    ]);
    setHistory(historyRes.data || []);
    setGraphData(graphRes.data || []);
  }

  async function refreshAll(preferredExerciseId = null) {
    // allSettled so one failing endpoint never breaks the rest
    const [
      profileRes,
      dashboardRes,
      exercisesRes,
      missionsRes,
      todayCoverageRes,
      weekCoverageRes,
      catalogRes,
      workoutDaysRes,
      leaderboardRes,
    ] = await Promise.allSettled([
      apiGet("/me/profile", token),
      apiGet("/me/dashboard", token),
      apiGet("/me/exercises", token),
      apiGet("/me/missions", token),
      apiGet("/me/coverage/today", token),
      apiGet("/me/coverage/week", token),
      apiGet("/catalog/exercises", token),
      apiGet("/me/workout-days", token),
      apiGet("/leaderboard", token),
    ]);

    const ok = (r) => r.status === "fulfilled" ? r.value : null;

    const profile    = ok(profileRes);
    const dashboard  = ok(dashboardRes);
    const exercises  = ok(exercisesRes);
    const missions   = ok(missionsRes);
    const todayCov   = ok(todayCoverageRes);
    const weekCov    = ok(weekCoverageRes);
    const catalog    = ok(catalogRes);
    const wDays      = ok(workoutDaysRes);
    const lb         = ok(leaderboardRes);

    if (profile)   { setProfileState(profile.data); setProfile(profile.data); }
    if (dashboard)  setDashboard(dashboard.data);
    if (exercises)  setExercises(exercises.data || []);
    if (missions)   setMissions(missions.data);
    if (todayCov)   setTodayCoverage(todayCov.data);
    if (weekCov)    setWeekCoverage(weekCov.data);
    if (catalog)    setCatalog(catalog.data || []);
    if (wDays)      setWorkoutDays(wDays.data || []);
    if (lb)         setLeaderboard(lb.data || []);

    // Surface the first critical failure so the user knows something is wrong
    const firstFail = [profileRes, dashboardRes, exercisesRes].find(
      (r) => r.status === "rejected"
    );
    if (firstFail) throw firstFail.reason;

    const firstExerciseId =
      preferredExerciseId ||
      selectedExerciseId ||
      (exercisesRes.data?.length ? String(exercisesRes.data[0].id) : "");

    if (firstExerciseId) {
      setSelectedExerciseId(String(firstExerciseId));
      await loadExerciseDetails(firstExerciseId);
    } else {
      setHistory([]);
      setGraphData([]);
    }

    await loadActiveWorkout();
  }

  async function handleStartWorkout() {
    setLoading(true);
    setError("");
    try {
      await apiPost("/workouts/start", { profile_id: 0 }, token);
      await loadActiveWorkout();
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
      await apiPost(`/workouts/end/${activeWorkout.session.id}`, {}, token);
      setActiveWorkout(null);
      await refreshAll();
      setMessage("Workout ended");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExercise(e) {
    e.preventDefault();
    await createExerciseWithFields({
      name: exerciseForm.name,
      muscle_group: exerciseForm.muscle_group,
      equipment: exerciseForm.equipment || "",
      secondary_muscles: exerciseForm.secondary_muscles || "",
    });
    setExerciseForm({ name: "", muscle_group: "", equipment: "", secondary_muscles: "" });
  }

  // Called directly from ExercisesPage / workout picker with explicit fields
  async function createExerciseWithFields({ name, muscle_group, equipment = "", secondary_muscles = "" }) {
    setLoading(true);
    setError("");

    const existing = exercises.find(
      (ex) => ex.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      setError(`Exercise "${name}" already exists.`);
      setLoading(false);
      return null;
    }

    try {
      const res = await apiPost(
        "/exercises",
        { profile_id: 0, name, muscle_group, equipment, secondary_muscles },
        token
      );
      setSelectedExerciseId(String(res.data.id));
      setWorkoutForm((prev) => ({ ...prev, exercise_id: String(res.data.id) }));
      await refreshAll(res.data.id);
      await loadExerciseDetails(res.data.id);
      setMessage("Exercise added");
      return res.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleUseCatalogExercise(item) {
    setLoading(true);
    setError("");

    const existing = exercises.find(
      (ex) => ex.name.toLowerCase() === item.name.toLowerCase()
    );
    if (existing) {
      // Already in list — just select it
      setSelectedExerciseId(String(existing.id));
      setWorkoutForm((prev) => ({ ...prev, exercise_id: String(existing.id) }));
      setLoading(false);
      return;
    }

    try {
      const res = await apiPost(
        "/exercises",
        {
          profile_id: 0,
          name: item.name,
          muscle_group: item.muscle_group,
          equipment: item.equipment || "",
          secondary_muscles: item.secondary_muscles || "",
        },
        token
      );
      setSelectedExerciseId(String(res.data.id));
      setWorkoutForm((prev) => ({ ...prev, exercise_id: String(res.data.id) }));
      await refreshAll(res.data.id);
      await loadExerciseDetails(res.data.id);
      setMessage(`${item.name} added`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogWorkout(e) {
    e.preventDefault();
    if (!activeWorkout?.session?.id) {
      setError("Start a workout first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiPost(
        "/workouts/log",
        {
          profile_id: 0,
          exercise_id: Number(workoutForm.exercise_id),
          session_id: Number(activeWorkout.session.id),
          weight: Number(workoutForm.weight),
          reps: Number(workoutForm.reps),
        },
        token
      );
      setLastWorkoutResult(res.data);
      setWorkoutForm((prev) => ({ ...prev, weight: "", reps: "" }));
      await refreshAll();
      await loadExerciseDetails(workoutForm.exercise_id);
      await loadActiveWorkout();
      setMessage("Set logged ⚡");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteExercise(id) {
    setLoading(true);
    setError("");
    try {
      await apiPost(`/exercises/${id}/delete`, {}, token);
      if (String(selectedExerciseId) === String(id)) {
        setSelectedExerciseId("");
        setHistory([]);
        setGraphData([]);
      }
      await refreshAll();
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
      await apiPost(`/exercises/${id}`, editExerciseForm, token);
      setEditingExerciseId(null);
      await refreshAll();
      if (selectedExerciseId) await loadExerciseDetails(selectedExerciseId);
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
      await apiPost(`/workouts/${id}/delete`, {}, token);
      await refreshAll();
      if (selectedExerciseId) await loadExerciseDetails(selectedExerciseId);
      await loadActiveWorkout();
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
      await apiPost(
        `/workouts/${id}`,
        { weight: Number(editWorkoutForm.weight), reps: Number(editWorkoutForm.reps) },
        token
      );
      setEditingWorkoutId(null);
      await refreshAll();
      if (selectedExerciseId) await loadExerciseDetails(selectedExerciseId);
      await loadActiveWorkout();
      setMessage("Workout updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    refreshAll()
      .then(() => setMessage("Ready"))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = {
    token,
    profile,
    dashboard,
    missions,
    todayCoverage,
    weekCoverage,
    workoutDays,
    leaderboard,
    catalog,
    catalogSearch,
    setCatalogSearch,
    exerciseForm,
    setExerciseForm,
    exercises,
    selectedExerciseId,
    setSelectedExerciseId,
    editingExerciseId,
    setEditingExerciseId,
    editExerciseForm,
    setEditExerciseForm,
    workoutForm,
    setWorkoutForm,
    history,
    graphData,
    lastWorkoutResult,
    editingWorkoutId,
    setEditingWorkoutId,
    editWorkoutForm,
    setEditWorkoutForm,
    activeWorkout,
    message,
    error,
    loading,
    filteredCatalog,
    selectedExercise,
    loadExerciseDetails,
    handleStartWorkout,
    handleEndWorkout,
    handleAddExercise,
    createExerciseWithFields,
    handleUseCatalogExercise,
    handleLogWorkout,
    handleDeleteExercise,
    handleSaveExerciseEdit,
    handleDeleteWorkout,
    handleSaveWorkoutEdit,
  };

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}

export function useGym() {
  return useContext(GymContext);
}
