import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthContext";

const API_BASE = import.meta.env.DEV ? "http://0.0.0.0:3000" : "https://gym-rpg.onrender.com";

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

const GymContext = createContext();

export function GymProvider({ children }) {
  const { token, profile: authProfile, setProfile } = useAuth();

  const [profile, setProfileState] = useState(authProfile || null);
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

  const now = new Date();
  const [calendarData, setCalendarData] = useState(null);
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth() + 1);
  const [heatmapData, setHeatmapData] = useState([]);
  const [workoutNote, setWorkoutNote] = useState("");

  const [message, setMessage] = useState("Ready");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function refreshAll() {
    const [
      profileRes,
      dashboardRes,
      exercisesRes,
      missionsRes,
      todayCoverageRes,
      weekCoverageRes,
      catalogRes,
    ] = await Promise.all([
      apiGet("/me/profile", token),
      apiGet("/me/dashboard", token),
      apiGet("/me/exercises", token),
      apiGet("/me/missions", token),
      apiGet("/me/coverage/today", token),
      apiGet("/me/coverage/week", token),
      apiGet("/catalog/exercises", token),
    ]);

    setProfileState(profileRes.data);
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

    setLoading(true);
    setError("");

    // Check for duplicate exercise name
    const existingExercise = exercises.find(
      (ex) => ex.name.toLowerCase() === exerciseForm.name.toLowerCase()
    );
    if (existingExercise) {
      setError(`Exercise "${exerciseForm.name}" already exists.`);
      setLoading(false);
      return;
    }

    try {
      const res = await apiPost(
        "/exercises",
        {
          profile_id: 0,
          name: exerciseForm.name,
          muscle_group: exerciseForm.muscle_group,
        },
        token
      );

      setExerciseForm({ name: "", muscle_group: "" });
      setSelectedExerciseId(String(res.data.id));
      await refreshAll();
      await loadExerciseDetails(res.data.id);
      setMessage("Exercise added");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUseCatalogExercise(item) {
    setLoading(true);
    setError("");

    // Check for duplicate exercise name
    const existingExercise = exercises.find(
      (ex) => ex.name.toLowerCase() === item.name.toLowerCase()
    );
    if (existingExercise) {
      setError(`Exercise "${item.name}" already exists.`);
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
        },
        token
      );

      setSelectedExerciseId(String(res.data.id));
      await refreshAll();
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
      setWorkoutForm((prev) => ({
        ...prev,
        weight: "",
        reps: "",
      }));

      await refreshAll();
      await loadExerciseDetails(workoutForm.exercise_id);
      await loadActiveWorkout();

      setMessage("Workout logged");
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
      await apiPost(`/workouts/${id}/delete`, {}, token);
      await refreshAll();

      if (selectedExerciseId) {
        await loadExerciseDetails(selectedExerciseId);
      }

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
        {
          weight: Number(editWorkoutForm.weight),
          reps: Number(editWorkoutForm.reps),
        },
        token
      );

      setEditingWorkoutId(null);
      await refreshAll();

      if (selectedExerciseId) {
        await loadExerciseDetails(selectedExerciseId);
      }

      await loadActiveWorkout();
      setMessage("Workout updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCalendarMonth(year, month) {
    try {
      const res = await apiGet(`/me/calendar/${year}/${month}`, token);
      setCalendarData(res.data || null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadHeatmap(year) {
    try {
      const res = await apiGet(`/me/calendar/heatmap/${year}`, token);
      setHeatmapData(res.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveWorkoutNote(date, note) {
    try {
      await apiPost("/me/calendar/note", { date, note }, token);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadWorkoutNote(date) {
    try {
      const res = await apiGet(`/me/calendar/note/${date}`, token);
      setWorkoutNote(res.data?.note || "");
      return res.data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError("");

    refreshAll()
      .then(() => {
        setMessage("Profile loaded");
        const n = new Date();
        loadCalendarMonth(n.getFullYear(), n.getMonth() + 1);
        loadHeatmap(n.getFullYear());
      })
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
    handleUseCatalogExercise,
    handleLogWorkout,
    handleDeleteExercise,
    handleSaveExerciseEdit,
    handleDeleteWorkout,
    handleSaveWorkoutEdit,
    calendarData,
    calendarYear,
    setCalendarYear,
    calendarMonth,
    setCalendarMonth,
    heatmapData,
    workoutNote,
    setWorkoutNote,
    loadCalendarMonth,
    loadHeatmap,
    saveWorkoutNote,
    loadWorkoutNote,
  };

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}

export function useGym() {
  return useContext(GymContext);
}