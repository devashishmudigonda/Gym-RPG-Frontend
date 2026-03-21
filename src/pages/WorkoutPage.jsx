import { useNavigate } from "react-router-dom";
import { useGym } from "../context/GymContext";

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

export default function WorkoutPage() {
  const {
    activeWorkout,
    handleStartWorkout,
    handleEndWorkout,
    catalog,
    catalogSearch,
    setCatalogSearch,
    filteredCatalog,
    exerciseForm,
    setExerciseForm,
    exercises,
    selectedExerciseId,
    setSelectedExerciseId,
    workoutForm,
    setWorkoutForm,
    handleAddExercise,
    handleUseCatalogExercise,
    handleLogWorkout,
    editingExerciseId,
    setEditingExerciseId,
    editExerciseForm,
    setEditExerciseForm,
    handleDeleteExercise,
    handleSaveExerciseEdit,
    message,
    error,
    loading,
  } = useGym();
  const navigate = useNavigate();

  const handleStart = async () => {
    await handleStartWorkout();
  };

  const handleEnd = async () => {
    await handleEndWorkout();
    navigate("/dashboard");
  };

  return (
    <div className="app-shell">
      <header className="hero premium">
        <div>
          <div className="eyebrow">Gym RPG</div>
          <h1>Workout Session</h1>
          <p className="hero-text">
            Manage your exercises and log your sets.
          </p>
        </div>

        <div className="hero-status">
          <div className="status-pill">{loading ? "Syncing..." : "Online"}</div>
          <div className="status-message">{error ? error : message}</div>
        </div>
      </header>

      <div className="grid two">
        <Card title="Workout Session">
          {!activeWorkout ? (
            <div className="session-box">
              <p className="helper-text">
                No active workout session right now.
              </p>
              <button onClick={handleStart}>Start Workout</button>
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
              <button className="danger" onClick={handleEnd}>
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
                      <button
                        type="button"
                        onClick={() => handleSaveExerciseEdit(exercise.id)}
                      >
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

      {activeWorkout?.session?.id && (
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
      )}
    </div>
  );
}