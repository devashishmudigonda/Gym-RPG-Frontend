import { useState } from "react";
import { useGym } from "../context/GymContext";

const MUSCLE_GROUPS = [
  "Chest", "Back", "Legs", "Shoulders", "Biceps",
  "Triceps", "Core", "Hamstrings", "Glutes", "Calves", "Forearms", "Full Body",
];

const EQUIPMENT_OPTIONS = [
  "Barbell", "Dumbbell", "Machine", "Cable",
  "Bodyweight", "Kettlebell", "EZ Bar", "Resistance Band", "Other",
];

function MuscleToggle({ selected, onChange }) {
  return (
    <div className="pill-grid">
      {MUSCLE_GROUPS.map((m) => (
        <button
          key={m}
          type="button"
          className={selected.includes(m) ? "pill-btn active" : "pill-btn"}
          onClick={() =>
            onChange(
              selected.includes(m)
                ? selected.filter((x) => x !== m)
                : [...selected, m]
            )
          }
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function AddExerciseForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    name: "",
    muscle_group: "",
    equipment: "",
    secondary: [],
  });
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr("");
    if (!form.name.trim()) return setErr("Exercise name is required");
    if (!form.muscle_group) return setErr("Select a primary muscle group");
    if (!form.equipment) return setErr("Select equipment");
    onSubmit({
      name: form.name.trim(),
      muscle_group: form.muscle_group,
      equipment: form.equipment,
      secondary_muscles: form.secondary.join(", "),
    });
    setForm({ name: "", muscle_group: "", equipment: "", secondary: [] });
  };

  return (
    <form className="add-exercise-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label className="field-label">Exercise Name *</label>
        <input
          placeholder="e.g. Incline Dumbbell Press"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="form-row-two">
        <div className="form-field">
          <label className="field-label">Primary Muscle *</label>
          <select
            value={form.muscle_group}
            onChange={(e) => set("muscle_group", e.target.value)}
            disabled={loading}
          >
            <option value="">Select muscle group</option>
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="field-label">Equipment *</label>
          <select
            value={form.equipment}
            onChange={(e) => set("equipment", e.target.value)}
            disabled={loading}
          >
            <option value="">Select equipment</option>
            {EQUIPMENT_OPTIONS.map((eq) => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label className="field-label">Secondary Muscles (optional)</label>
        <MuscleToggle
          selected={form.secondary}
          onChange={(v) => set("secondary", v)}
        />
      </div>

      {err && <p className="error-text">{err}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Exercise"}
      </button>
    </form>
  );
}

export default function ExercisesPage() {
  const {
    exercises,
    catalog,
    createExerciseWithFields,
    handleDeleteExercise,
    handleSaveExerciseEdit,
    editingExerciseId,
    setEditingExerciseId,
    editExerciseForm,
    setEditExerciseForm,
    loading,
    error,
    message,
  } = useGym();

  const [search, setSearch] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const q = search.toLowerCase();
  const cq = catalogSearch.toLowerCase();

  const myFiltered = exercises.filter((e) =>
    `${e.name} ${e.muscle_group} ${e.equipment}`.toLowerCase().includes(q)
  );

  const catalogFiltered = catalog.filter(
    (c) =>
      `${c.name} ${c.muscle_group} ${c.equipment}`.toLowerCase().includes(cq)
  );

  const handleCustomAdd = async (fields) => {
    const result = await createExerciseWithFields(fields);
    if (result) setShowAddForm(false);
  };

  return (
    <div className="app-shell">
      {/* My Exercises */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h2>My Exercises</h2>
          <button
            type="button"
            className={showAddForm ? "ghost" : ""}
            style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? "Cancel" : "+ Add Exercise"}
          </button>
        </div>

        {showAddForm && (
          <div className="add-form-panel">
            <AddExerciseForm onSubmit={handleCustomAdd} loading={loading} />
          </div>
        )}

        <input
          placeholder="Search your exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        {myFiltered.length > 0 ? (
          <div className="exercise-cards">
            {myFiltered.map((ex) => (
              <div key={ex.id} className="exercise-card">
                {editingExerciseId === ex.id ? (
                  <div className="edit-stack">
                    <input
                      value={editExerciseForm.name}
                      onChange={(e) =>
                        setEditExerciseForm({ ...editExerciseForm, name: e.target.value })
                      }
                      placeholder="Name"
                    />
                    <select
                      value={editExerciseForm.muscle_group || ""}
                      onChange={(e) =>
                        setEditExerciseForm({ ...editExerciseForm, muscle_group: e.target.value })
                      }
                    >
                      <option value="">Muscle group</option>
                      {MUSCLE_GROUPS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={editExerciseForm.equipment || ""}
                      onChange={(e) =>
                        setEditExerciseForm({ ...editExerciseForm, equipment: e.target.value })
                      }
                    >
                      <option value="">Equipment</option>
                      {EQUIPMENT_OPTIONS.map((eq) => (
                        <option key={eq} value={eq}>{eq}</option>
                      ))}
                    </select>
                    <div className="action-row">
                      <button type="button" onClick={() => handleSaveExerciseEdit(ex.id)}>Save</button>
                      <button type="button" className="ghost" onClick={() => setEditingExerciseId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="exercise-card-info">
                      <strong className="exercise-card-name">{ex.name}</strong>
                      <div className="exercise-card-tags">
                        <span className="tag muscle">{ex.muscle_group}</span>
                        {ex.equipment && <span className="tag equipment">{ex.equipment}</span>}
                        {ex.secondary_muscles && (
                          <span className="tag secondary">+{ex.secondary_muscles}</span>
                        )}
                      </div>
                    </div>
                    <div className="exercise-card-actions">
                      <button
                        type="button"
                        className="ghost"
                        style={{ width: "auto", padding: "6px 12px", fontSize: 12 }}
                        onClick={() => {
                          setEditingExerciseId(ex.id);
                          setEditExerciseForm({
                            name: ex.name,
                            muscle_group: ex.muscle_group,
                            equipment: ex.equipment,
                            secondary_muscles: ex.secondary_muscles,
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        style={{ width: "auto", padding: "6px 12px", fontSize: 12 }}
                        onClick={() => handleDeleteExercise(ex.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="helper-text">
            {search ? `No exercises match "${search}".` : "No exercises yet. Add one above!"}
          </p>
        )}

        {(error || (message && message !== "Ready")) && (
          <p className={error ? "error-text" : "helper-text"} style={{ marginTop: 10 }}>
            {error || message}
          </p>
        )}
      </div>

      {/* Exercise Catalog */}
      <div className="card">
        <div className="card-head">
          <h2>Exercise Catalog</h2>
          <span className="helper-text">{catalog.length} exercises</span>
        </div>

        <input
          placeholder="Search catalog..."
          value={catalogSearch}
          onChange={(e) => setCatalogSearch(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <div className="exercise-cards">
          {catalogFiltered.map((item) => {
            const alreadyAdded = exercises.some(
              (e) => e.name.toLowerCase() === item.name.toLowerCase()
            );
            return (
              <div key={item.id} className={alreadyAdded ? "exercise-card added" : "exercise-card"}>
                <div className="exercise-card-info">
                  <strong className="exercise-card-name">{item.name}</strong>
                  <div className="exercise-card-tags">
                    <span className="tag muscle">{item.muscle_group}</span>
                    {item.equipment && <span className="tag equipment">{item.equipment}</span>}
                    {item.secondary_muscles && (
                      <span className="tag secondary">+{item.secondary_muscles}</span>
                    )}
                  </div>
                </div>
                {alreadyAdded && (
                  <span className="added-badge">✓ Added</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
