import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGym } from "../context/GymContext";

const MUSCLE_GROUPS = [
  "Chest", "Back", "Legs", "Shoulders", "Biceps",
  "Triceps", "Core", "Hamstrings", "Glutes", "Calves", "Forearms", "Full Body",
];
const EQUIPMENT_OPTIONS = [
  "Barbell", "Dumbbell", "Machine", "Cable",
  "Bodyweight", "Kettlebell", "EZ Bar", "Resistance Band", "Other",
];

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ExercisePicker({ exercises, catalog, onSelect, onAddFromCatalog, onCreateNew, onClose, loading }) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ muscle_group: "", equipment: "", secondary: [] });
  const [createErr, setCreateErr] = useState("");

  const q = search.toLowerCase();

  const myList = exercises.filter((e) =>
    `${e.name} ${e.muscle_group} ${e.equipment}`.toLowerCase().includes(q)
  );
  const catalogNew = catalog.filter(
    (c) =>
      `${c.name} ${c.muscle_group} ${c.equipment}`.toLowerCase().includes(q) &&
      !exercises.some((e) => e.name.toLowerCase() === c.name.toLowerCase())
  );

  const noResults = myList.length === 0 && catalogNew.length === 0;

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setCreateErr("");
    if (!createForm.muscle_group) return setCreateErr("Select a primary muscle");
    if (!createForm.equipment) return setCreateErr("Select equipment");
    onCreateNew({
      name: search.trim(),
      muscle_group: createForm.muscle_group,
      equipment: createForm.equipment,
      secondary_muscles: createForm.secondary.join(", "),
    });
  };

  const toggleSecondary = (m) =>
    setCreateForm((f) => ({
      ...f,
      secondary: f.secondary.includes(m)
        ? f.secondary.filter((x) => x !== m)
        : [...f.secondary, m],
    }));

  return (
    <div className="picker-backdrop" onClick={onClose}>
      <div className="picker-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="picker-top">
          <h2>Add Exercise</h2>
          <button type="button" className="picker-close-btn" onClick={onClose}>✕</button>
        </div>

        <input
          className="picker-search-input"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowCreate(false); }}
          autoFocus
        />

        {myList.length > 0 && (
          <div className="picker-section">
            <div className="picker-section-label">Your Exercises</div>
            {myList.map((ex) => (
              <button key={ex.id} type="button" className="picker-item" onClick={() => onSelect(ex)} disabled={loading}>
                <div className="picker-item-text">
                  <strong>{ex.name}</strong>
                  <span>{ex.muscle_group}{ex.equipment ? ` · ${ex.equipment}` : ""}</span>
                </div>
                <span className="picker-tag select">Select →</span>
              </button>
            ))}
          </div>
        )}

        {catalogNew.length > 0 && (
          <div className="picker-section">
            <div className="picker-section-label">Add from Catalog</div>
            {catalogNew.slice(0, 10).map((item) => (
              <button key={item.id} type="button" className="picker-item" onClick={() => onAddFromCatalog(item)} disabled={loading}>
                <div className="picker-item-text">
                  <strong>{item.name}</strong>
                  <span>{item.muscle_group}{item.equipment ? ` · ${item.equipment}` : ""}</span>
                </div>
                <span className="picker-tag add">+ Add</span>
              </button>
            ))}
          </div>
        )}

        {/* Create new — shown when search has text and no matches */}
        {noResults && search.trim() && !showCreate && (
          <div className="picker-create-prompt">
            <p className="helper-text">
              "{search.trim()}" not found.
            </p>
            <button
              type="button"
              className="picker-create-btn"
              onClick={() => setShowCreate(true)}
            >
              + Create "{search.trim()}"
            </button>
          </div>
        )}

        {showCreate && (
          <form className="picker-create-form" onSubmit={handleCreateSubmit} noValidate>
            <div className="picker-section-label">Create New Exercise</div>
            <p className="picker-create-name">"{search.trim()}"</p>

            <div className="form-row-two">
              <div className="form-field">
                <label className="field-label">Primary Muscle *</label>
                <select
                  value={createForm.muscle_group}
                  onChange={(e) => setCreateForm((f) => ({ ...f, muscle_group: e.target.value }))}
                  disabled={loading}
                >
                  <option value="">Select muscle</option>
                  {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="field-label">Equipment *</label>
                <select
                  value={createForm.equipment}
                  onChange={(e) => setCreateForm((f) => ({ ...f, equipment: e.target.value }))}
                  disabled={loading}
                >
                  <option value="">Select equipment</option>
                  {EQUIPMENT_OPTIONS.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="field-label">Secondary Muscles (optional)</label>
              <div className="pill-grid">
                {MUSCLE_GROUPS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={createForm.secondary.includes(m) ? "pill-btn active" : "pill-btn"}
                    onClick={() => toggleSecondary(m)}
                    disabled={loading}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {createErr && <p className="error-text">{createErr}</p>}

            <button type="submit" className="picker-create-submit" disabled={loading}>
              {loading ? "Creating..." : "Create & Select Exercise"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function WorkoutPage() {
  const {
    activeWorkout,
    handleStartWorkout,
    handleEndWorkout,
    catalog,
    exercises,
    selectedExerciseId,
    setSelectedExerciseId,
    workoutForm,
    setWorkoutForm,
    handleUseCatalogExercise,
    createExerciseWithFields,
    handleLogWorkout,
    lastWorkoutResult,
    message,
    error,
    loading,
  } = useGym();
  const navigate = useNavigate();

  const [elapsed, setElapsed] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!activeWorkout?.session?.started_at) {
      setElapsed(0);
      return;
    }
    const start = new Date(activeWorkout.session.started_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeWorkout?.session?.started_at]);

  const selectedExercise = exercises.find(
    (e) => String(e.id) === String(selectedExerciseId)
  );
  const sessionSets = activeWorkout?.entries?.length ?? 0;
  const sessionVolume =
    activeWorkout?.entries?.reduce((s, e) => s + e.total_volume, 0) ?? 0;

  const handleStart = async () => {
    await handleStartWorkout();
  };

  const handleEnd = async () => {
    await handleEndWorkout();
    navigate("/dashboard");
  };

  const selectExercise = (ex) => {
    setSelectedExerciseId(String(ex.id));
    setWorkoutForm((prev) => ({ ...prev, exercise_id: String(ex.id) }));
    setShowPicker(false);
  };

  const addAndSelect = async (item) => {
    setShowPicker(false);
    await handleUseCatalogExercise(item);
  };

  const createAndSelect = async (fields) => {
    setShowPicker(false);
    await createExerciseWithFields(fields);
    // selectedExerciseId is set inside createExerciseWithFields
  };

  // ── Pre-workout ──────────────────────────────────────────────────
  if (!activeWorkout) {
    return (
      <div className="app-shell">
        <div className="pre-workout-screen">
          <div className="pre-workout-icon">🏋️</div>
          <h1 className="pre-workout-title">Ready to Train?</h1>
          <p className="pre-workout-sub">
            Start a session to log your exercises, earn XP, and level up.
          </p>
          <button
            className="pre-workout-btn"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? "Starting..." : "Start Workout"}
          </button>
          {error && <p className="error-text" style={{ marginTop: 16 }}>{error}</p>}
        </div>
      </div>
    );
  }

  // ── Active workout ────────────────────────────────────────────────
  return (
    <div className="app-shell">
      {showPicker && (
        <ExercisePicker
          exercises={exercises}
          catalog={catalog}
          onSelect={selectExercise}
          onAddFromCatalog={addAndSelect}
          onCreateNew={createAndSelect}
          onClose={() => setShowPicker(false)}
          loading={loading}
        />
      )}

      {/* Session banner */}
      <div className="session-banner">
        <div className="session-stats">
          <div className="session-chip">
            <span className="chip-label">Duration</span>
            <span className="chip-value mono">{formatElapsed(elapsed)}</span>
          </div>
          <div className="session-chip">
            <span className="chip-label">Sets</span>
            <span className="chip-value">{sessionSets}</span>
          </div>
          <div className="session-chip">
            <span className="chip-label">Volume</span>
            <span className="chip-value">
              {sessionVolume.toFixed(0)}<small> kg</small>
            </span>
          </div>
        </div>
        <div className="session-banner-right">
          {error && <span className="error-text banner-msg">{error}</span>}
          {!error && message && message !== "Ready" && (
            <span className="session-msg banner-msg">{message}</span>
          )}
          <button
            className="danger end-btn"
            onClick={handleEnd}
            disabled={loading}
          >
            {loading ? "Saving..." : "End Workout"}
          </button>
        </div>
      </div>

      {/* Add exercise CTA */}
      <button
        type="button"
        className="add-exercise-cta"
        onClick={() => setShowPicker(true)}
        disabled={loading}
      >
        <span className="cta-plus">+</span> Add Exercise
      </button>

      {/* Log set form — visible when an exercise is selected */}
      {selectedExercise && (
        <div className="card log-set-card">
          <div className="log-set-header">
            <div className="log-set-meta">
              <span className="log-set-name">{selectedExercise.name}</span>
              <span className="log-set-muscle">{selectedExercise.muscle_group}</span>
            </div>
            <button
              type="button"
              className="ghost change-btn"
              onClick={() => setShowPicker(true)}
            >
              Change
            </button>
          </div>

          <form className="log-set-form" onSubmit={handleLogWorkout}>
            <input
              type="number"
              step="0.5"
              min="0.5"
              placeholder="Weight (kg)"
              value={workoutForm.weight}
              onChange={(e) =>
                setWorkoutForm({ ...workoutForm, weight: e.target.value })
              }
              required
            />
            <input
              type="number"
              min="1"
              placeholder="Reps"
              value={workoutForm.reps}
              onChange={(e) =>
                setWorkoutForm({ ...workoutForm, reps: e.target.value })
              }
              required
            />
            <button
              type="submit"
              className="log-btn"
              disabled={loading || !activeWorkout?.session?.id}
            >
              {loading ? "Logging..." : "Log Set ⚡"}
            </button>
          </form>

          {/* Inline XP feedback */}
          {lastWorkoutResult && (
            <div className="xp-feedback">
              <span className="xp-gained">+{lastWorkoutResult.gained_xp} XP</span>
              {lastWorkoutResult.new_pr && (
                <span className="pr-badge">🏆 New PR!</span>
              )}
              {lastWorkoutResult.unlocked_badges?.map((b) => (
                <span key={b} className="badge-unlock">🎖 {b}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Session log */}
      <div className="card">
        <div className="card-head">
          <h2>Session Log</h2>
          <span className="helper-text">
            {sessionSets} {sessionSets === 1 ? "set" : "sets"}
          </span>
        </div>

        {activeWorkout.entries.length > 0 ? (
          <div className="session-entries">
            {activeWorkout.entries.map((entry) => (
              <div key={entry.id} className="session-entry">
                <div className="entry-left">
                  <strong className="entry-name">{entry.exercise_name}</strong>
                  <span className="entry-muscle">{entry.muscle_group}</span>
                </div>
                <div className="entry-right">
                  <span className="entry-weight">{entry.weight} kg</span>
                  <span className="entry-x">×</span>
                  <span className="entry-reps">{entry.reps}</span>
                  <span className="entry-vol">{entry.total_volume.toFixed(0)} kg</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="helper-text">
            No sets logged yet. Tap "Add Exercise" above to get started.
          </p>
        )}
      </div>
    </div>
  );
}
