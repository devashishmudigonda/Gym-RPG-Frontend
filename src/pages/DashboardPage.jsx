import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGym } from "../context/GymContext";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_HEADERS = ["M", "T", "W", "T", "F", "S", "S"];

function WorkoutCalendar({ workoutDays = [], currentStreak = 0 }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Monday-first grid: (Sun=0 → 6, Mon=1 → 0, ...)
  const firstDayRaw = new Date(year, month, 1).getDay();
  const firstDayMon = (firstDayRaw + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDayMon; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const pad = (n) => String(n).padStart(2, "0");
  const monthStr = `${year}-${pad(month + 1)}`;
  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  })();

  const isWorkout = (d) => workoutDays.includes(`${monthStr}-${pad(d)}`);
  const isToday = (d) => `${monthStr}-${pad(d)}` === todayStr;

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const canGoNext = new Date(year, month + 1, 1) <= new Date();

  return (
    <div className="cal-wrap">
      <div className="cal-nav">
        <button type="button" className="cal-nav-btn ghost" onClick={prevMonth}>‹</button>
        <span className="cal-title">{MONTH_NAMES[month]} {year}</span>
        <button
          type="button"
          className="cal-nav-btn ghost"
          onClick={nextMonth}
          disabled={canGoNext ? false : true}
        >
          ›
        </button>
      </div>

      <div className="cal-grid">
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className="cal-header">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={[
              "cal-cell",
              !day ? "cal-empty" : "",
              day && isWorkout(day) ? "cal-active" : "",
              day && isToday(day) ? "cal-today" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {day ?? ""}
            {day && isWorkout(day) && <span className="cal-dot" />}
          </div>
        ))}
      </div>

      {currentStreak > 0 && (
        <div className="cal-streak">
          🔥 <strong>{currentStreak}</strong> day streak
        </div>
      )}
    </div>
  );
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
    "Shoulders","Chest","Back","Core",
    "Biceps","Triceps","Legs","Hamstrings","Glutes","Calves",
  ];
  return (
    <div className="body-map">
      {groups.map((g) => (
        <div key={g} className={covered.includes(g) ? "body-part active" : "body-part"}>
          {g}
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const {
    profile,
    dashboard,
    missions,
    todayCoverage,
    weekCoverage,
    workoutDays,
    leaderboard,
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
    return (
      <div className="app-shell">
        <div className="pre-workout-screen">
          <p className="helper-text">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Hero header */}
      <header className="hero premium">
        <div className="hero-left">
          <div className="eyebrow">Gym RPG</div>
          <h1>Welcome back, {profile.name.split(" ")[0]}</h1>
          <p className="hero-text">
            {dashboard.current_streak > 0
              ? `🔥 ${dashboard.current_streak}-day streak. Keep going!`
              : "Start a workout to build your streak."}
          </p>
        </div>
        <div className="hero-right">
          <div className="level-display">
            <span className="level-label">Level</span>
            <span className="level-value">{dashboard.level}</span>
          </div>
          <div className="xp-bar-wrap">
            <div className="xp-bar-label">
              <span>XP</span>
              <span>{dashboard.xp.toLocaleString()}</span>
            </div>
          </div>
          <button
            className={activeWorkout ? "ghost hero-start-btn" : "hero-start-btn"}
            onClick={handleStart}
            disabled={!!activeWorkout || loading}
          >
            {activeWorkout ? "Workout in Progress →" : "Start Workout"}
          </button>
          {(error || (message && message !== "Ready")) && (
            <p className={error ? "error-text" : "helper-text"} style={{ marginTop: 8 }}>
              {error || message}
            </p>
          )}
        </div>
      </header>

      {/* Stats grid */}
      <Card
        title={profile.name}
        right={<div className="level-chip">{dashboard.level}</div>}
      >
        <div className="stats-grid">
          <Stat label="XP" value={dashboard.xp.toLocaleString()} />
          <Stat label="Score" value={dashboard.score.toLocaleString()} />
          <Stat label="Workout Days" value={dashboard.total_workout_days} />
          <Stat label="Streak" value={`${dashboard.current_streak}d`} />
          <Stat label="Best Streak" value={`${dashboard.longest_streak}d`} />
          <Stat label="PRs" value={dashboard.pr_count} />
          <Stat label="Total Volume" value={`${(dashboard.total_volume / 1000).toFixed(1)}t`} />
        </div>
        {dashboard.badges?.length > 0 && (
          <div className="badges-wrap">
            {dashboard.badges.map((b) => (
              <span className="badge-pill" key={b.id} title={b.description}>
                🎖 {b.name}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Calendar + Latest Workout */}
      <div className="grid two">
        <Card title="Workout Calendar">
          <WorkoutCalendar
            workoutDays={workoutDays}
            currentStreak={dashboard.current_streak}
          />
        </Card>

        <Card title="Latest Workout Reward">
          {lastWorkoutResult ? (
            <div className="result-box">
              <div className="result-row">
                <span className="result-label">XP Gained</span>
                <span className="result-value accent">+{lastWorkoutResult.gained_xp}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Total XP</span>
                <span className="result-value">{lastWorkoutResult.total_xp.toLocaleString()}</span>
              </div>
              <div className="result-row">
                <span className="result-label">New PR</span>
                <span className="result-value">{lastWorkoutResult.new_pr ? "🏆 Yes!" : "No"}</span>
              </div>
              {lastWorkoutResult.unlocked_badges?.length > 0 && (
                <div className="result-row">
                  <span className="result-label">Badges</span>
                  <span className="result-value">
                    {lastWorkoutResult.unlocked_badges.join(", ")}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="helper-text">Log a workout set to see your XP reward here.</p>
          )}
        </Card>
      </div>

      {/* Missions + Muscle coverage */}
      <div className="grid two">
        <Card title="Weekly Missions">
          {missions?.weekly_missions?.map((m) => (
            <div className={m.completed ? "mission done" : "mission"} key={m.name}>
              <div>
                <strong>{m.name}</strong>
                <p>{m.description}</p>
              </div>
              <span className={m.completed ? "mission-status done" : "mission-status"}>
                {m.completed ? "✓ Done" : "Pending"}
              </span>
            </div>
          ))}
        </Card>

        <Card title="Today's Muscle Coverage">
          <BodyMap covered={todayCoverage?.covered || []} />
          <p className="coverage-line">
            <strong>Trained:</strong>{" "}
            {(todayCoverage?.covered || []).join(", ") || "Nothing yet today"}
          </p>
          {(todayCoverage?.missing || []).length > 0 && (
            <p className="coverage-line">
              <strong>Not yet:</strong> {todayCoverage.missing.join(", ")}
            </p>
          )}
        </Card>
      </div>

      {/* Weekly coverage */}
      <Card title="Weekly Muscle Coverage">
        <BodyMap covered={weekCoverage?.covered || []} />
        <p className="coverage-line">
          <strong>This week:</strong>{" "}
          {(weekCoverage?.covered || []).join(", ") || "No workouts this week yet"}
        </p>
      </Card>

      {/* Leaderboard */}
      <Card title="🏆 Leaderboard">
        {leaderboard.length > 0 ? (
          <div className="leaderboard-table">
            <table>
              <thead>
                <tr>
                  <th className="rank-col">Rank</th>
                  <th>Athlete</th>
                  <th className="xp-col">XP</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(([name, xp], i) => (
                  <tr key={`${name}-${i}`}>
                    <td className="rank-cell">
                      <span className="rank-badge">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                    </td>
                    <td>{name}</td>
                    <td className="xp-cell">
                      <strong>{Number(xp).toLocaleString()}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="helper-text">No leaderboard data yet.</p>
        )}
      </Card>
    </div>
  );
}
