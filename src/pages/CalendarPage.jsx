import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGym } from "../context/GymContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const MUSCLE_COLORS = {
  Chest: "#ff6b6b",
  Back: "#6e7cff",
  Legs: "#25d5cc",
  Shoulders: "#ffa94d",
  Biceps: "#e599f7",
  Triceps: "#74c0fc",
  Core: "#ffd43b",
  Hamstrings: "#69db7c",
  Glutes: "#f06595",
  Calves: "#a9e34b",
};

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getIntensityClass(volume) {
  if (volume <= 0) return "intensity-0";
  if (volume < 1000) return "intensity-1";
  if (volume < 3000) return "intensity-2";
  if (volume < 6000) return "intensity-3";
  return "intensity-4";
}

export default function CalendarPage() {
  const {
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
    loading,
    error,
  } = useGym();

  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef(null);
  const noteRef = useRef(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    loadCalendarMonth(calendarYear, calendarMonth);
  }, [calendarYear, calendarMonth]);

  useEffect(() => {
    loadHeatmap(calendarYear);
  }, [calendarYear]);

  // Close panel on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        setPanelOpen(false);
        setSelectedDay(null);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelOpen && panelRef.current && !panelRef.current.contains(e.target)) {
        const clickedDay = e.target.closest(".calendar-day");
        if (!clickedDay) {
          setPanelOpen(false);
          setSelectedDay(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [panelOpen]);

  function handlePrevMonth() {
    if (calendarMonth === 1) {
      setCalendarYear(calendarYear - 1);
      setCalendarMonth(12);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
    setPanelOpen(false);
    setSelectedDay(null);
  }

  function handleNextMonth() {
    if (calendarMonth === 12) {
      setCalendarYear(calendarYear + 1);
      setCalendarMonth(1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
    setPanelOpen(false);
    setSelectedDay(null);
  }

  async function handleDayClick(day) {
    setSelectedDay(day);
    setPanelOpen(true);
    await loadWorkoutNote(day.date);
  }

  const handleNoteBlur = useCallback(async () => {
    if (selectedDay) {
      await saveWorkoutNote(selectedDay.date, workoutNote);
    }
  }, [selectedDay, workoutNote]);

  // Auto-resize textarea
  function autoResize(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  // Build calendar grid
  const calendarGrid = useMemo(() => {
    if (!calendarData?.days) return [];
    const firstDay = new Date(calendarYear, calendarMonth - 1, 1).getDay();
    const blanks = Array(firstDay).fill(null);
    return [...blanks, ...calendarData.days];
  }, [calendarData, calendarYear, calendarMonth]);

  // Muscle group chart data
  const muscleChartData = useMemo(() => {
    if (!calendarData?.days) return [];
    const counts = {};
    calendarData.days.forEach((day) => {
      day.muscle_groups.forEach((mg) => {
        counts[mg] = (counts[mg] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [calendarData]);

  // Heatmap organized by week columns
  const heatmapWeeks = useMemo(() => {
    if (!heatmapData.length) return [];
    const weeks = [];
    let currentWeek = [];

    // Pad first week
    const firstDate = new Date(heatmapData[0].date + "T00:00:00");
    const startDow = firstDate.getDay();
    for (let i = 0; i < startDow; i++) {
      currentWeek.push(null);
    }

    heatmapData.forEach((day) => {
      const d = new Date(day.date + "T00:00:00");
      if (d.getDay() === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }
    return weeks;
  }, [heatmapData]);

  const [hoveredHeatmap, setHoveredHeatmap] = useState(null);

  return (
    <div className="calendar-page">
      {loading && <div className="status-pill">Syncing...</div>}
      {error && <p className="error-text">{error}</p>}

      {/* SECTION C - Month Stats Bar */}
      {calendarData && (
        <div className="month-stat-bar">
          <button className="month-nav-btn" onClick={handlePrevMonth}>
            &larr;
          </button>
          <h2 className="month-title">
            {MONTH_NAMES[calendarData.month]} {calendarData.year}
          </h2>
          <button className="month-nav-btn" onClick={handleNextMonth}>
            &rarr;
          </button>
          <div className="month-stat-cards">
            <div className="month-stat-card">
              <span className="month-stat-label">Workout Days</span>
              <span className="month-stat-value">{calendarData.total_workout_days}</span>
            </div>
            <div className="month-stat-card">
              <span className="month-stat-label">Total Volume</span>
              <span className="month-stat-value">
                {calendarData.total_volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="month-stat-card">
              <span className="month-stat-label">Best Day</span>
              <span className="month-stat-value">
                {calendarData.best_day_volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="month-stat-card">
              <span className="month-stat-label">Current Streak</span>
              <span className="month-stat-value">{calendarData.current_streak}</span>
            </div>
            <div className="month-stat-card">
              <span className="month-stat-label">Best Streak</span>
              <span className="month-stat-value">{calendarData.best_streak}</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION A - Month Calendar Grid */}
      <div className="calendar-container">
        <div className="calendar-grid-wrapper">
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="calendar-day-header">{d}</div>
            ))}
            {calendarGrid.map((day, i) => {
              if (!day) {
                return <div key={`blank-${i}`} className="calendar-day blank" />;
              }

              const isToday = day.date === todayStr;
              const isSelected = selectedDay?.date === day.date;
              const dayNum = parseInt(day.date.split("-")[2], 10);

              return (
                <div
                  key={day.date}
                  className={`calendar-day ${day.had_workout ? "has-workout" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${getIntensityClass(day.total_volume)}`}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="day-number">{dayNum}</span>
                  {day.had_workout && (
                    <>
                      <div className="muscle-dots">
                        {day.muscle_groups.slice(0, 3).map((mg) => (
                          <span
                            key={mg}
                            className="muscle-dot"
                            style={{ background: MUSCLE_COLORS[mg] || "#6e7cff" }}
                            title={mg}
                          />
                        ))}
                        {day.muscle_groups.length > 3 && (
                          <span className="muscle-dot-more">
                            +{day.muscle_groups.length - 3}
                          </span>
                        )}
                      </div>
                      <span className="day-volume">
                        {day.total_volume.toLocaleString(undefined, { maximumFractionDigits: 0 })} vol
                      </span>
                      <span className="day-xp-badge">+{day.total_xp_earned} XP</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION B - Day Detail Side Panel */}
        <div
          ref={panelRef}
          className={`day-side-panel ${panelOpen ? "open" : ""}`}
        >
          {selectedDay && (
            <>
              <button
                className="panel-close-btn"
                onClick={() => {
                  setPanelOpen(false);
                  setSelectedDay(null);
                }}
              >
                &times;
              </button>
              <h3 className="panel-date">{selectedDay.date}</h3>

              {selectedDay.had_workout ? (
                <>
                  <div className="panel-pills">
                    {selectedDay.muscle_groups.map((mg) => (
                      <span
                        key={mg}
                        className="panel-pill"
                        style={{
                          background: `${MUSCLE_COLORS[mg] || "#6e7cff"}33`,
                          borderColor: MUSCLE_COLORS[mg] || "#6e7cff",
                        }}
                      >
                        {mg}
                      </span>
                    ))}
                  </div>

                  <div className="panel-stats">
                    <div className="panel-stat">
                      <span className="panel-stat-label">Volume</span>
                      <span className="panel-stat-value">
                        {selectedDay.total_volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="panel-stat">
                      <span className="panel-stat-label">XP Earned</span>
                      <span className="panel-stat-value">+{selectedDay.total_xp_earned}</span>
                    </div>
                    <div className="panel-stat">
                      <span className="panel-stat-label">Sessions</span>
                      <span className="panel-stat-value">{selectedDay.session_count}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="panel-rest-day">
                  <p>Rest day</p>
                  <button
                    onClick={() => navigate("/workout")}
                    className="panel-log-btn"
                  >
                    Log Workout
                  </button>
                </div>
              )}

              <div className="panel-note-section">
                <label className="panel-note-label">Notes</label>
                <textarea
                  ref={noteRef}
                  className="panel-note-textarea"
                  placeholder="Add a note for this day..."
                  value={workoutNote}
                  onChange={(e) => {
                    setWorkoutNote(e.target.value);
                    autoResize(e.target);
                  }}
                  onBlur={handleNoteBlur}
                  onInput={(e) => autoResize(e.target)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECTION D - Year Heatmap */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h2>{calendarYear} Activity</h2>
        </div>
        <div className="heatmap-scroll">
          <div className="heatmap-grid">
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="heatmap-col">
                {week.map((day, di) => {
                  if (!day) {
                    return <div key={`e-${di}`} className="heatmap-cell empty" />;
                  }
                  return (
                    <div
                      key={day.date}
                      className={`heatmap-cell ${getIntensityClass(day.total_volume)}`}
                      onMouseEnter={() => setHoveredHeatmap(day)}
                      onMouseLeave={() => setHoveredHeatmap(null)}
                      onClick={() => {
                        const parts = day.date.split("-");
                        setCalendarYear(parseInt(parts[0], 10));
                        setCalendarMonth(parseInt(parts[1], 10));
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          {hoveredHeatmap && (
            <div className="heatmap-tooltip">
              {hoveredHeatmap.date} &mdash;{" "}
              {hoveredHeatmap.had_workout
                ? `${hoveredHeatmap.total_volume.toLocaleString(undefined, { maximumFractionDigits: 0 })} vol, ${hoveredHeatmap.session_count} session(s)`
                : "Rest day"}
            </div>
          )}
        </div>
        <div className="heatmap-legend">
          <span className="heatmap-legend-label">Less</span>
          <div className="heatmap-cell intensity-0" />
          <div className="heatmap-cell intensity-1" />
          <div className="heatmap-cell intensity-2" />
          <div className="heatmap-cell intensity-3" />
          <div className="heatmap-cell intensity-4" />
          <span className="heatmap-legend-label">More</span>
        </div>
      </div>

      {/* SECTION E - Muscle Group Monthly Chart */}
      {muscleChartData.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-head">
            <h2>Muscle Groups — {MONTH_NAMES[calendarMonth]}</h2>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={muscleChartData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#cfd9ff", fontSize: 12 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: "#cfd9ff", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(8,17,32,0.95)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    color: "#f4f7ff",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {muscleChartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={MUSCLE_COLORS[entry.name] || (index % 2 === 0 ? "#6e7cff" : "#25d5cc")}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
