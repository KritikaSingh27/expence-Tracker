import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

// Base API URL
const API_BASE = "http://127.0.0.1:8000/api";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState("");

  const [period, setPeriod] = useState("monthly");
  const [activeTab, setActiveTab] = useState("overview"); // overview | daily | expenses
  const [filters, setFilters] = useState({
    start: "",
    end: "",
    search: "",
  });

  // Load expenses list (with optional filters), aligned with current period
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${API_BASE}/expenses/`, {
          params: {
            period,
            start: filters.start || undefined,
            end: filters.end || undefined,
            search: filters.search || undefined,
          },
        });

        setExpenses(response.data || []);
      } catch (err) {
        console.error("Error fetching expenses:", err);
        setError("Something went wrong while loading your expenses.");
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [filters.start, filters.end, filters.search, period]);

  // Load summary + insights for the selected period
  useEffect(() => {
    const fetchSummaryAndInsights = async () => {
      try {
        setSummaryLoading(true);
        // Clear old data when switching periods
        setSummary(null);
        setInsights(null);
        
        // Fetch both summary and insights to ensure we have complete data
        const [summaryRes, insightsRes] = await Promise.all([
          axios.get(`${API_BASE}/expenses/summary/`, {
            params: { period },
          }),
          axios.get(`${API_BASE}/expenses/insights/`, {
            params: { period },
          }),
        ]);

        // Backend returns { summary, charts, cards, insight }
        setSummary(summaryRes.data || null);
        setInsights(insightsRes.data || null);
      } catch (err) {
        console.error("Error fetching summary/insights:", err);
        // Don't override main error banner used for expenses list
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummaryAndInsights();
  }, [period]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Prefer summary from /summary/, but fall back to /insights/ summary if needed
  const effectiveSummary = summary ?? insights?.summary ?? null;

  const totalSpent =
    effectiveSummary?.total ?? insights?.cards?.total_spent ?? null;

  const topCategory =
    insights?.cards?.top_category ||
    (effectiveSummary?.by_category &&
      effectiveSummary.by_category[0] &&
      effectiveSummary.by_category[0].name) ||
    null;

  const insightText =
    typeof insights?.insight === "string"
      ? insights.insight
      : insights?.insight?.text || null;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1 className="app-title">Expense Tracker</h1>
          <p className="app-subtitle">
            A clean dashboard to understand and reflect on your spending.
          </p>
        </div>

        <div className="period-toggle">
          <button
            className={
              period === "weekly"
                ? "pill pill-active"
                : "pill"
            }
            onClick={() => setPeriod("weekly")}
          >
            Weekly
          </button>
          <button
            className={
              period === "monthly"
                ? "pill pill-active"
                : "pill"
            }
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </button>
        </div>
      </header>

      <div className="tabs">
        <button
          className={activeTab === "overview" ? "tab tab-active" : "tab"}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={activeTab === "daily" ? "tab tab-active" : "tab"}
          onClick={() => setActiveTab("daily")}
        >
          Daily trends
        </button>
        <button
          className={activeTab === "expenses" ? "tab tab-active" : "tab"}
          onClick={() => setActiveTab("expenses")}
        >
          Expenses
        </button>
      </div>

      <main className="layout">
        {activeTab === "overview" && (
          <>
            <section className="layout-main">
              <div className="cards-grid">
                <div className="card">
                  <div className="card-label">
                    Total spent ({period === "weekly" ? "this week" : "this month"})
                  </div>
                  <div className="card-value">
                    {summaryLoading ? (
                      <span style={{ opacity: 0.5 }}>Loading...</span>
                    ) : totalSpent !== null ? (
                      `₹${Number(totalSpent).toFixed(2)}`
                    ) : (
                      "–"
                    )}
                  </div>
                  {effectiveSummary?.start && effectiveSummary?.end && (
                    <div className="card-caption">
                      {effectiveSummary.start} → {effectiveSummary.end}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="card-label">Top category</div>
                  <div className="card-value">
                    {summaryLoading ? (
                      <span style={{ opacity: 0.5 }}>Loading...</span>
                    ) : topCategory ? (
                      topCategory
                    ) : (
                      "No data"
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-label">Total expenses</div>
                  <div className="card-value">
                    {summaryLoading ? (
                      <span style={{ opacity: 0.5 }}>Loading...</span>
                    ) : effectiveSummary?.by_category ? (
                      effectiveSummary.by_category.reduce(
                        (acc, cat) => acc + 1,
                        0
                      )
                    ) : (
                      expenses.length
                    )}
                  </div>
                  <div className="card-caption">
                    {period === "weekly" ? "This week" : "This month"}
                  </div>
                </div>
              </div>
            </section>

            <aside className="layout-side">
              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">Category breakdown</h2>
                  <span className="panel-caption">
                    Where your money goes
                  </span>
                </div>
                {effectiveSummary?.by_category &&
                effectiveSummary.by_category.length > 0 &&
                totalSpent ? (
                  <>
                    {/* Pie chart */}
                    <div
                      className="pie-chart"
                      style={{
                        backgroundImage: (() => {
                          const colors = [
                            "#22c55e",
                            "#0ea5e9",
                            "#a855f7",
                            "#f97316",
                            "#e11d48",
                            "#facc15",
                          ];
                          let acc = 0;
                          const segments =
                            effectiveSummary.by_category.map((cat, i) => {
                              const pct =
                                (Number(cat.total) / Number(totalSpent)) * 100;
                              const start = acc;
                              const end = acc + pct;
                              acc = end;
                              const color = colors[i % colors.length];
                              return `${color} ${start}% ${end}%`;
                            });
                          return `conic-gradient(${segments.join(",")})`;
                        })(),
                      }}
                    />
                    {/* Legend + bar breakdown */}
                    <ul className="category-list">
                      {effectiveSummary.by_category.map((cat, idx) => (
                        <li key={cat.id ?? cat.name} className="category-item">
                          <div className="category-main">
                            <span className="category-name">
                              <span
                                className="pie-legend-dot"
                                style={{
                                  backgroundColor: [
                                    "#22c55e",
                                    "#0ea5e9",
                                    "#a855f7",
                                    "#f97316",
                                    "#e11d48",
                                    "#facc15",
                                  ][idx % 6],
                                }}
                              />
                              {cat.name}
                            </span>
                            <span className="category-amount">
                              ₹{Number(cat.total).toFixed(2)}
                            </span>
                          </div>
                          <div className="category-bar-row">
                            <div className="category-bar-track">
                              <div
                                className="category-bar-fill"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (Number(cat.total) / Number(totalSpent)) *
                                      100
                                  ).toFixed(1)}%`,
                                }}
                              />
                            </div>
                            <span className="category-percent">
                              {(
                                (Number(cat.total) / Number(totalSpent)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="empty-state">No category data yet.</p>
                )}
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">AI insights</h2>
                  <span className="panel-caption">
                    Generated from your recent spending
                  </span>
                </div>
                {loading ? (
                  <div className="skeleton-block" />
                ) : insightText ? (
                  <div className="insight-text">{insightText}</div>
                ) : (
                  <p className="empty-state">
                    Insights will appear here when there is enough data.
                  </p>
                )}
              </div>
            </aside>
          </>
        )}

        {activeTab === "daily" && (
          <section className="layout-full">
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">Daily trends</h2>
                <span className="panel-caption">
                  Visual view of spending over time
                </span>
              </div>
              {insights?.charts?.daily_trend &&
              insights.charts.daily_trend.dates.length > 0 ? (
                <div className="chart">
                  <div className="chart-bars">
                    {(() => {
                      const trend = insights.charts.daily_trend;
                      const max = Math.max(...trend.amounts, 1);
                      return trend.dates.map((d, idx) => {
                        const amount = trend.amounts[idx];
                        const height = (amount / max) * 100;
                        return (
                          <div key={d + idx} className="chart-bar-wrapper">
                            <div className="chart-bar-track">
                              <div
                                className="chart-bar-fill"
                                style={{ height: `${height}%` }}
                              />
                            </div>
                            <div className="chart-bar-x">
                              {d.slice(5)}{/* show MM-DD */}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                <p className="empty-state">
                  Not enough data yet to draw a trend.
                </p>
              )}
            </div>
          </section>
        )}

        {activeTab === "expenses" && (
          <section className="layout-full">
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">Expenses</h2>
                <span className="panel-caption">
                  Detailed list of your transactions
                </span>
              </div>

              <div className="filters-row">
                <div className="field">
                  <label className="field-label" htmlFor="start">
                    From
                  </label>
                  <input
                    id="start"
                    name="start"
                    type="date"
                    value={filters.start}
                    onChange={handleFilterChange}
                    className="input"
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="end">
                    To
                  </label>
                  <input
                    id="end"
                    name="end"
                    type="date"
                    value={filters.end}
                    onChange={handleFilterChange}
                    className="input"
                  />
                </div>
                <div className="field field-grow">
                  <label className="field-label" htmlFor="search">
                    Search description
                  </label>
                  <input
                    id="search"
                    name="search"
                    type="text"
                    placeholder="e.g. groceries, cab, rent..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="input"
                  />
                </div>
              </div>

              {loading ? (
                <div className="skeleton-table" />
              ) : error ? (
                <div className="alert alert-error">{error}</div>
              ) : expenses.length === 0 ? (
                <p className="empty-state">No expenses found for this view.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.id}>
                          <td>{expense.date || "–"}</td>
                          <td>{expense.description || "No description"}</td>
                          <td>
                            {expense.category_name || "Uncategorized"}
                          </td>
                          <td className="text-right">
                            ₹{Number(expense.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
