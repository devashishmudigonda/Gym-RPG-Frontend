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
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ExercisePicker({
  exercises, catalog, onSelect, onAddFromCatalog, onCreateNew, onClose, loading, title,
}) {
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
          <h2>{title || "Add Exercise"}</h2>
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

        {onAddFromCatalog && catalogNew.length > 0 && (
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

        {onCreateNew && noResults && search.trim() && !showCreate && (
          <div className="picker-create-prompt">
            <p className="helper-text">"{search.trim()}" not found.</p>
            <button type="button" className="picker-create-btn" onClick={() => setShowCreate(true)}>
              + Create "{search.trim()}"
            </button>
          </div>
        )}

        {onCreateNew && showCreate && (
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
                    key={m} type="button"
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

        {myList.length === 0 && !onCreateNew && !search && (
          <p className="helper-text" style={{ padding: "16px 0", textAlign: "center" }}>
            No exercises to pick from. Add exercises first.
          </p>
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
    handleSaveWorkoutEdit,
    editingWorkoutId,
    setEditingWorkoutId,
    editWorkoutForm,
    setEditWorkoutForm,
    lastWorkoutResult,
    message,
    error,
    loading,
  } = useGym();
  const navigate = useNavigate();

  const [elapsed, setElapsed] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("select"); // "select" | "superset"
  const [supersets, setSupersets] = useState([]); // [[exId1, exId2], ...]

  useEffect(() => {
    if (!activeWorkout?.session?.started_at) { setElapsed(0); return; }
    const start = new Date(activeWorkout.session.started_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeWorkout?.session?.started_at]);

  const selectedExercise = exercises.find((e) => String(e.id) === String(selectedExerciseId));
  const sessionSets = activeWorkout?.entries?.length ?? 0;
  const sessionVolume = activeWorkout?.entries?.reduce((s, e) => s + e.total_volume, 0) ?? 0;

  // Group entries by exercise, maintaining first-seen order
  const groupedEntries = (() => {
    const order = [];
    const map = {};
    for (const entry of (activeWorkout?.entries || [])) {
      const key = String(entry.exercise_id);
      if (!map[key]) {
        map[key] = {
          exercise_id: entry.exercise_id,
          exercise_name: entry.exercise_name,
          muscle_group: entry.muscle_group,
          sets: [],
        };
        order.push(key);
      }
      map[key].sets.push(entry);
    }
    return order.map((k) => map[k]);
  })();

  // Superset helpers
  const getSupersetLabel = (exId) => {
    const i = supersets.findIndex((p) => p.includes(String(exId)));
    return i === -1 ? null : String.fromCharCode(65 + i); // A, B, C…
  };
  const getSupersetPartner = (exId) => {
    const pair = supersets.find((p) => p.includes(String(exId)));
    return pair ? pair.find((id) => id !== String(exId)) : null;
  };

  const openPickerSelect = () => { setPickerMode("select"); setShowPicker(true); };
  const openPickerSuperset = () => { setPickerMode("superset"); setShowPicker(true); };
  const closePicker = () => { setShowPicker(false); setPickerMode("select"); };

  const selectExercise = (ex) => {
    setSelectedExerciseId(String(ex.id));
    setWorkoutForm((prev) => ({ ...prev, exercise_id: String(ex.id) }));
    closePicker();
  };
  const addAndSelect = async (item) => { closePicker(); await handleUseCatalogExercise(item); };
  const createAndSelect = async (fields) => { closePicker(); await createExerciseWithFields(fields); };

  const selectSupersetPartner = (ex) => {
    const id1 = String(selectedExerciseId);
    const id2 = String(ex.id);
    if (id1 && id1 !== id2) {
      setSupersets((prev) => {
        const cleaned = prev.filter((p) => !p.includes(id1) && !p.includes(id2));
        return [...cleaned, [id1, id2]];
      });
    }
    closePicker();
  };

  // Add a catalog exercise then link it as superset partner (keeps current exercise selected)
  const addCatalogForSuperset = async (item) => {
    const currentId = String(selectedExerciseId);
    closePicker();
    const newEx = await handleUseCatalogExercise(item);
    if (newEx) {
      const partnerId = String(newEx.id);
      // Restore original selection
      setSelectedExerciseId(currentId);
      setWorkoutForm((prev) => ({ ...prev, exercise_id: currentId }));
      // Link as superset
      setSupersets((prev) => {
        const cleaned = prev.filter((p) => !p.includes(currentId) && !p.includes(partnerId));
        return [...cleaned, [currentId, partnerId]];
      });
    }
  };

  const removeSuperset = (exId) =>
    setSupersets((prev) => prev.filter((p) => !p.includes(String(exId))));

  const handleLogWithSuperset = async (e) => {
    const currentExId = String(selectedExerciseId);
    await handleLogWorkout(e);
    const partner = getSupersetPartner(currentExId);
    if (partner) {
      setSelectedExerciseId(partner);
      setWorkoutForm((prev) => ({ ...prev, exercise_id: partner }));
    }
  };

  const selectFromLog = (exId) => {
    setSelectedExerciseId(String(exId));
    setWorkoutForm((prev) => ({ ...prev, exercise_id: String(exId) }));
  };

  // ── Pre-workout ──────────────────────────────────────────────────
  if (!activeWorkout) {
    return (
      <div className="app-shell">
        <div className="pre-workout-screen">
          <div className="pre-workout-icon">🏋️</div>
          <h1 className="pre-workout-title">Ready to Train?</h1>
          <p className="pre-workout-sub">Start a session to log your exercises, earn XP, and level up.</p>
          <button className="pre-workout-btn" onClick={() => handleStartWorkout()} disabled={loading}>
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
          onSelect={pickerMode === "superset" ? selectSupersetPartner : selectExercise}
          onAddFromCatalog={pickerMode === "superset" ? addCatalogForSuperset : addAndSelect}
          onCreateNew={pickerMode === "superset" ? undefined : createAndSelect}
          onClose={closePicker}
          loading={loading}
          title={pickerMode === "superset" ? "Pick Superset Partner" : "Add Exercise"}
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
            <span className="chip-value">{sessionVolume.toFixed(0)}<small> kg</small></span>
          </div>
        </div>
        <div className="session-banner-right">
          {error && <span className="error-text banner-msg">{error}</span>}
          {!error && message && message !== "Ready" && (
            <span className="session-msg banner-msg">{message}</span>
          )}
          <button
            className="danger end-btn"
            onClick={async () => { await handleEndWorkout(); navigate("/dashboard"); }}
            disabled={loading}
          >
            {loading ? "Saving..." : "End Workout"}
          </button>
        </div>
      </div>

      {/* Add exercise CTA */}
      <button type="button" className="add-exercise-cta" onClick={openPickerSelect} disabled={loading}>
        <span className="cta-plus">+</span> Add Exercise
      </button>

      {/* Log set form */}
      {selectedExercise && (
        <div className="card log-set-card">
          <div className="log-set-header">
            <div className="log-set-meta">
              <span className="log-set-name">{selectedExercise.name}</span>
              <span className="log-set-muscle">{selectedExercise.muscle_group}</span>
              {getSupersetLabel(selectedExercise.id) && (
                <span className="superset-badge">SS {getSupersetLabel(selectedExercise.id)}</span>
              )}
            </div>
            <div className="log-set-actions">
              <button type="button" className="ghost change-btn" onClick={openPickerSelect}>Change</button>
              {getSupersetPartner(selectedExercise.id) ? (
                <button
                  type="button" className="ghost change-btn"
                  style={{ color: "var(--amber)" }}
                  onClick={() => removeSuperset(selectedExercise.id)}
                >
                  ✕ SS
                </button>
              ) : (
                <button type="button" className="ghost change-btn ss-link-btn" onClick={openPickerSuperset}>
                  + Superset
                </button>
              )}
            </div>
          </div>

          {/* Superset partner info */}
          {getSupersetPartner(selectedExercise.id) && (() => {
            const partnerId = getSupersetPartner(selectedExercise.id);
            const partnerEx = exercises.find((e) => String(e.id) === partnerId);
            return partnerEx ? (
              <div className="superset-partner-row">
                <span className="superset-partner-label">Superset with</span>
                <button
                  type="button"
                  className="superset-switch-btn"
                  onClick={() => selectFromLog(partnerId)}
                >
                  {partnerEx.name} →
                </button>
              </div>
            ) : null;
          })()}

          <div className="log-set-set-num">
            Set {(groupedEntries.find((g) => String(g.exercise_id) === String(selectedExercise.id))?.sets.length ?? 0) + 1}
          </div>

          <form className="log-set-form" onSubmit={handleLogWithSuperset}>
            <input
              type="number" step="0.5" min="0.5" placeholder="Weight (kg)"
              value={workoutForm.weight}
              onChange={(e) => setWorkoutForm({ ...workoutForm, weight: e.target.value })}
              required
            />
            <input
              type="number" min="1" placeholder="Reps"
              value={workoutForm.reps}
              onChange={(e) => setWorkoutForm({ ...workoutForm, reps: e.target.value })}
              required
            />
            <button type="submit" className="log-btn" disabled={loading || !activeWorkout?.session?.id}>
              {loading ? "Logging..." : "Log Set ⚡"}
            </button>
          </form>

          {lastWorkoutResult && (
            <div className="xp-feedback">
              <span className="xp-gained">+{lastWorkoutResult.gained_xp} XP</span>
              {lastWorkoutResult.new_pr && <span className="pr-badge">🏆 New PR!</span>}
              {lastWorkoutResult.unlocked_badges?.map((b) => (
                <span key={b} className="badge-unlock">🎖 {b}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Session log — grouped by exercise */}
      <div className="card">
        <div className="card-head">
          <h2>Session Log</h2>
          <span className="helper-text">{sessionSets} {sessionSets === 1 ? "set" : "sets"}</span>
        </div>

        {groupedEntries.length > 0 ? (
          <div className="session-groups">
            {groupedEntries.map((group) => {
              const ssLabel = getSupersetLabel(group.exercise_id);
              const isSelected = String(group.exercise_id) === String(selectedExerciseId);
              const groupVol = group.sets.reduce((s, e) => s + e.total_volume, 0);
              return (
                <div
                  key={group.exercise_id}
                  className={`session-exercise-group${isSelected ? " is-selected" : ""}`}
                >
                  <div
                    className="session-group-header"
                    onClick={() => selectFromLog(group.exercise_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && selectFromLog(group.exercise_id)}
                  >
                    <div className="session-group-meta">
                      <strong className="entry-name">{group.exercise_name}</strong>
                      <span className="entry-muscle">{group.muscle_group}</span>
                      {ssLabel && <span className="superset-badge-sm">SS {ssLabel}</span>}
                    </div>
                    <div className="session-group-right">
                      <span className="session-group-vol">{groupVol.toFixed(0)} kg</span>
                      <span className="session-group-hint">tap to add set</span>
                    </div>
                  </div>

                  <div className="session-sets-list">
                    {group.sets.map((set, i) => (
                      <div key={set.id} className="session-set-row">
                        <span className="set-num">Set {i + 1}</span>

                        {editingWorkoutId === set.id ? (
                          <>
                            <input
                              type="number" step="0.5" min="0.5"
                              className="set-edit-input"
                              value={editWorkoutForm.weight}
                              onChange={(e) => setEditWorkoutForm({ ...editWorkoutForm, weight: e.target.value })}
                            />
                            <span className="entry-x">×</span>
                            <input
                              type="number" min="1"
                              className="set-edit-input"
                              value={editWorkoutForm.reps}
                              onChange={(e) => setEditWorkoutForm({ ...editWorkoutForm, reps: e.target.value })}
                            />
                            <button
                              type="button" className="set-action-btn save"
                              onClick={() => handleSaveWorkoutEdit(set.id)}
                              disabled={loading}
                            >✓</button>
                            <button
                              type="button" className="set-action-btn cancel"
                              onClick={() => setEditingWorkoutId(null)}
                            >✕</button>
                          </>
                        ) : (
                          <>
                            <span className="set-weight">{set.weight} kg</span>
                            <span className="entry-x">×</span>
                            <span className="set-reps">{set.reps} reps</span>
                            <span className="set-vol">{set.total_volume.toFixed(0)} kg</span>
                            <button
                              type="button" className="set-action-btn edit"
                              onClick={() => {
                                setEditingWorkoutId(set.id);
                                setEditWorkoutForm({ weight: String(set.weight), reps: String(set.reps) });
                              }}
                            >Edit</button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="helper-text">No sets logged yet. Tap "Add Exercise" above to get started.</p>
        )}
      </div>
    </div>
  );
}
