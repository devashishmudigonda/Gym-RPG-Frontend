import { useNavigate } from "react-router-dom";
import { useGym } from "../context/GymContext";
import Leaderboard from "../Leaderboard";

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

export default function DashboardPage() {
  const {
    token,
    profile,
    dashboard,
    missions,
    todayCoverage,
    weekCoverage,
    activeWorkout,
    handleStartWorkout,
    message,
    error,
    loading,
    lastWorkoutResult,
  } = useGym();
  const navigate = useNavigate();

  const handleStart = async () => {
    await handleStartWorkout();
    navigate("/workout");
  };

  if (!profile || !dashboard) {
    return <div>Loading...</div>;
  }

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
          <div style={{ marginTop: "12px" }}>
            <button
              onClick={handleStart}
              disabled={activeWorkout}
            >
              {activeWorkout ? "Workout in Progress" : "Start Workout"}
            </button>
          </div>
        </div>
      </header>

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

      <Leaderboard token={token} />

      <div className="grid two">
        <Card title="Weekly Missions">
          {missions?.weekly_missions?.map((m) => (
            <div
              className={m.completed ? "mission done" : "mission"}
              key={m.name}
            >
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