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

export default function ExercisesPage() {
  const {
    catalog,
    catalogSearch,
    setCatalogSearch,
    filteredCatalog,
  } = useGym();

  return (
    <div className="app-shell">
      <header className="hero premium">
        <div>
          <div className="eyebrow">Gym RPG</div>
          <h1>Browse Exercises</h1>
          <p className="hero-text">
            Discover exercises in our catalog.
          </p>
        </div>

        <div className="hero-status">
          <div className="status-pill">{loading ? "Syncing..." : "Online"}</div>
          <div className="status-message">{error ? error : message}</div>
        </div>
      </header>

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
              </div>
            ))}
          </div>

          <div className="custom-add-box">
            <p className="helper-text">
              Start a workout session to add exercises to your library.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}