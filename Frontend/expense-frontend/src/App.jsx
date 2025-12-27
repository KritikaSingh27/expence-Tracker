import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";

// Base API URL
const API_BASE = "http://127.0.0.1:8000/api";

function App() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  axios.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          // console.log("Token attached to request:", config.url); // For debugging
        } else {
          console.warn("No token found for request:", config.url);
        }
      } catch (error) {
        console.error("Error in Axios Interceptor:", error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState("");

  const [period, setPeriod] = useState("monthly");
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    start: "",
    end: "",
    search: "",
  });
  
  // Expense form modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    category: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // User profile modal state
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Theme state - default is dark
  const [theme, setTheme] = useState("dark");

  // Edit expense modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    description: "",
    date: "",
    category: "",
  });

  // Load expenses list filtered by current period
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError("");

        // Calculate date range based on current period
        let startDate = "";
        let endDate = "";
        
        if (period === "weekly") {
          const today = new Date();
          const monday = new Date(today);
          monday.setDate(today.getDate() - today.getDay() + 1);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          
          startDate = monday.toISOString().split('T')[0];
          endDate = sunday.toISOString().split('T')[0];
        } else if (period === "monthly") {
          const today = new Date();
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          
          startDate = firstDay.toISOString().split('T')[0];
          endDate = lastDay.toISOString().split('T')[0];
        }

        const response = await axios.get(`${API_BASE}/expenses/`, {
          params: {
            start: filters.start || startDate,
            end: filters.end || endDate,
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
  }, [isLoaded, isSignedIn, filters.start, filters.end, filters.search, period]);

  // Load summary + insights for the selected period
  useEffect(() => {
    const fetchSummaryAndInsights = async () => {
      try {
        setSummaryLoading(true);
        setSummary(null);
        setInsights(null);
        
        const [summaryRes, insightsRes] = await Promise.all([
          axios.get(`${API_BASE}/expenses/summary/`, {
            params: { period },
          }),
          axios.get(`${API_BASE}/expenses/insights/`, {
            params: { period },
          }),
        ]);

        setSummary(summaryRes.data || null);
        setInsights(insightsRes.data || null);
      } catch (err) {
        console.error("Error fetching summary/insights:", err);
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

  // Handle expense form changes
  const handleExpenseFormChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit new expense
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    
    if (!expenseForm.amount || !expenseForm.description) {
      setError("Amount and description are required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await axios.post(`${API_BASE}/expenses/`, {
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        date: expenseForm.date,
        category: expenseForm.category || null,
      });

      // Reset form and close modal
      setExpenseForm({
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        category: "",
      });
      setShowExpenseModal(false);

      // Refresh data
      await refreshData();
    } catch (err) {
      console.error("Error creating expense:", err);
      setError("Failed to create expense. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit expense
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setEditForm({
      amount: expense.amount.toString(),
      description: expense.description || "",
      date: expense.date || "",
      category: expense.category_name || "",
    });
    setShowEditModal(true);
    setError(""); // Clear any previous errors
  };

  // Handle edit form changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit edited expense
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editForm.amount || !editForm.description) {
      setError("Amount and description are required");
      return;
    }

    const amount = parseFloat(editForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (amount > 99999999.99) {
      setError("Amount cannot exceed 99,999,999.99");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const requestData = {
        amount: amount,
        description: editForm.description.trim(),
        date: editForm.date || null,
        category_name: editForm.category.trim() || null,
      };

      await axios.put(`${API_BASE}/expenses/${editingExpense.id}/`, requestData);
      
      // Close modal and refresh data
      setShowEditModal(false);
      setEditingExpense(null);
      await refreshData();
      
    } catch (err) {
      console.error("Error updating expense:", err);
      setError("Failed to update expense. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete expense
  const handleDeleteExpense = async () => {
    if (!editingExpense) return;

    try {
      setSubmitting(true);
      setError("");

      await axios.delete(`${API_BASE}/expenses/${editingExpense.id}/`);

      setShowEditModal(false);
      setEditingExpense(null);
      await refreshData();
      
    } catch (err) {
      console.error("Error deleting expense:", err);
      setError("Failed to delete expense. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Function to refresh data
  const refreshData = async () => {
    try {
      let startDate = "";
      let endDate = "";
      
      if (period === "weekly") {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        startDate = monday.toISOString().split('T')[0];
        endDate = sunday.toISOString().split('T')[0];
      } else if (period === "monthly") {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
      }

      // Refresh expenses
      const expensesResponse = await axios.get(`${API_BASE}/expenses/`, {
        params: {
          start: filters.start || startDate,
          end: filters.end || endDate,
          search: filters.search || undefined,
        },
      });
      setExpenses(expensesResponse.data || []);

      // Refresh summary and insights with error handling
      try {
        const summaryRes = await axios.get(`${API_BASE}/expenses/summary/`, {
          params: { period },
        });
        setSummary(summaryRes.data || null);
      } catch (summaryErr) {
        console.error("Error refreshing summary:", summaryErr);
      }

      try {
        const insightsRes = await axios.get(`${API_BASE}/expenses/insights/`, {
          params: { period },
        });
        setInsights(insightsRes.data || null);
      } catch (insightsErr) {
        console.error("Error refreshing insights:", insightsErr);
      }
      
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  };

  // Prefer summary from /summary/, but fall back to /insights/ summary if needed
  const effectiveSummary = summary ?? insights?.summary ?? null;

  const totalSpent = effectiveSummary?.total ?? insights?.cards?.total_spent ?? null;

  const topCategory = insights?.cards?.top_category ||
    (effectiveSummary?.by_category &&
      effectiveSummary.by_category[0] &&
      effectiveSummary.by_category[0].name) ||
    null;

  const insightText = typeof insights?.insight === "string"
      ? insights.insight
      : insights?.insight?.text || null;

 if (!isLoaded) return <div className="loading">Loading Auth...</div>;

return (
    <div className={theme === "light" ? "light-theme" : ""}>
      
      {/* --- SIGNED OUT VIEW --- */}
      <SignedOut>
        <div className="clerk-auth-container">
          <div className="clerk-auth-card">
            <h1 className="app-title">Expense Tracker</h1>
            <p className="app-subtitle">
              A clean dashboard to understand and reflect on your spending.
            </p>
            <div className="clerk-login-wrapper">
              <SignInButton mode="modal">
                <button className="pill pill-active clerk-custom-btn">
                  Sign In to Get Started
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </SignedOut>

      {/* --- SIGNED IN VIEW --- */}
      <SignedIn>
        <div className="app">
          <header className="app-header">
            <div>
              <h1 className="app-title">Expense Tracker</h1>
              <p className="app-subtitle">
                A clean dashboard to understand and reflect on your spending.
              </p>
            </div>

            <div className="header-actions">
              <div className="period-toggle">
                <button
                  className={period === "weekly" ? "pill pill-active" : "pill"}
                  onClick={() => setPeriod("weekly")}
                >
                  Weekly
                </button>
                <button
                  className={period === "monthly" ? "pill pill-active" : "pill"}
                  onClick={() => setPeriod("monthly")}
                >
                  Monthly
                </button>
              </div>

            <button
                className="user-profile-btn menu-dots-btn"
                onClick={() => setShowUserModal(true)}
                title="App Settings"
              >
                <img className="three-dots" src="three-dots-menu.png"/>
                <img className="three-dots-light" src="three-dots-light.png" />
              </button>

              {/* CLERK USER BUTTON: Handles Profile and Sign Out automatically */}
              <UserButton afterSignOutUrl="/" />
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
              className={activeTab === "expenses" ? "tab tab-active" : "tab"}
              onClick={() => setActiveTab("expenses")}
            >
              Expenses
            </button>
          </div>

          <main className="layout">
            {activeTab === "overview" && (
              <>
                <aside className="layout-side">
                  <div className="panel ai-insights-panel">
                    <div className="ai-badge">
                      <svg className="ai-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                      </svg>
                      <span>AI Powered</span>
                    </div>
                    <div className="panel-header">
                      <h2 className="panel-title ai-title">
                        <span className="ai-gradient-text">Smart Insights</span>
                      </h2>
                      <span className="panel-caption">
                        Personalized analysis powered by Google Gemini AI
                      </span>
                    </div>
                    {loading ? (
                      <div className="ai-loading">
                        <div className="ai-loading-animation">
                          <div className="ai-pulse"></div>
                          <div className="ai-pulse"></div>
                          <div className="ai-pulse"></div>
                        </div>
                        <span>AI is analyzing your spending patterns...</span>
                      </div>
                    ) : insightText ? (
                      <div className="ai-insight-content">
                        <div className="ai-insight-text">{insightText}</div>
                        <div className="ai-footer">
                          <svg className="ai-footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v6m0 6v6"/>
                            <path d="m15.5 3.5-1.5 1.5"/>
                            <path d="m10 12 1.5 1.5"/>
                            <path d="m15.5 20.5-1.5-1.5"/>
                            <path d="M4 12l2-2"/>
                            <path d="M20 12l-2-2"/>
                            <path d="m4.5 5.5 2 2"/>
                            <path d="m18.5 5.5-2 2"/>
                            <path d="m18.5 18.5-2-2"/>
                            <path d="m4.5 18.5 2-2"/>
                          </svg>
                          <span>Generated by AI • Powered by Google Gemini</span>
                        </div>
                      </div>
                    ) : (
                      <div className="ai-empty-state">
                        <div className="ai-empty-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                          </svg>
                        </div>
                        <p>AI insights will appear here when there is enough spending data to analyze.</p>
                        <span className="ai-empty-caption">Add more expenses to unlock personalized insights!</span>
                      </div>
                    )}
                  </div>

                  <div className="panel">
                    <div className="panel-header">
                      <h2 className="panel-title">Category Totals</h2>
                      <span className="panel-caption">
                        Spending breakdown by category
                      </span>
                    </div>
                    {effectiveSummary?.by_category && effectiveSummary.by_category.length > 0 ? (
                      <ul className="category-list">
                        {effectiveSummary.by_category.map((cat, idx) => (
                          <li key={cat.id ?? cat.name} className="category-item">
                            <div className="category-main">
                              <span className="category-name">{cat.name}</span>
                              <span className="category-amount">₹{Number(cat.total).toFixed(2)}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-state">No category data yet.</p>
                    )}
                  </div>
                </aside>

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
                          effectiveSummary.by_category.reduce((acc, cat) => acc + 1, 0)
                        ) : (
                          expenses.length
                        )}
                      </div>
                      <div className="card-caption">
                        {period === "weekly" ? "This week" : "This month"}
                      </div>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-header">
                      <h2 className="panel-title">Category breakdown</h2>
                      <span className="panel-caption">Where your money goes</span>
                    </div>
                    {effectiveSummary?.by_category && effectiveSummary.by_category.length > 0 && totalSpent ? (
                      <>
                        <div
                          className="pie-chart"
                          style={{
                            backgroundImage: (() => {
                              const colors = ["#22c55e", "#0ea5e9", "#a855f7", "#f97316", "#e11d48", "#facc15"];
                              let acc = 0;
                              const segments = effectiveSummary.by_category.map((cat, i) => {
                                const pct = (Number(cat.total) / Number(totalSpent)) * 100;
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
                        <ul className="category-list">
                          {effectiveSummary.by_category.map((cat, idx) => (
                            <li key={cat.id ?? cat.name} className="category-item">
                              <div className="category-main">
                                <span className="category-name">
                                  <span
                                    className="pie-legend-dot"
                                    style={{
                                      backgroundColor: ["#22c55e", "#0ea5e9", "#a855f7", "#f97316", "#e11d48", "#facc15"][idx % 6],
                                    }}
                                  />
                                  {cat.name}
                                </span>
                                <span className="category-amount">₹{Number(cat.total).toFixed(2)}</span>
                              </div>
                              <div className="category-bar-row">
                                <div className="category-bar-track">
                                  <div
                                    className="category-bar-fill"
                                    style={{
                                      width: `${Math.min(100, (Number(cat.total) / Number(totalSpent)) * 100).toFixed(1)}%`,
                                    }}
                                  />
                                </div>
                                <span className="category-percent">
                                  {((Number(cat.total) / Number(totalSpent)) * 100).toFixed(1)}%
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
                </section>
              </>
            )}

            {activeTab === "expenses" && (
              <section className="layout-full">
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">Expenses</h2>
                    <span className="panel-caption">Detailed list of your transactions</span>
                  </div>

                  <div className="filters-row">
                    <div className="field">
                      <label className="field-label" htmlFor="start">From</label>
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
                      <label className="field-label" htmlFor="end">To</label>
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
                      <label className="field-label" htmlFor="search">Search description</label>
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
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((expense) => (
                            <tr key={expense.id} className="expense-row">
                              <td>{expense.date || "–"}</td>
                              <td>{expense.description || "No description"}</td>
                              <td>{expense.category_name || "Uncategorized"}</td>
                              <td className="text-right">₹{Number(expense.amount).toFixed(2)}</td>
                              <td className="text-center">
                                <button
                                  className="edit-btn"
                                  onClick={() => handleEditExpense(expense)}
                                  title="Edit expense"
                                >
                                  <svg 
                                    className="edit-icon" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
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

        {/* Floating Add Button */}
        <button
          className="floating-add-btn"
          onClick={() => setShowExpenseModal(true)}
          title="Add new expense"
        >
          <span className="floating-btn-icon">+</span>
          <span className="floating-btn-text">Add Expense</span>
        </button>

        {/* Modals */}
        {showExpenseModal && (
          <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Add New Expense</h2>
                <button className="modal-close" onClick={() => setShowExpenseModal(false)}>×</button>
              </div>
              
              <form onSubmit={handleExpenseSubmit} className="expense-form">
                <div className="form-row">
                  <div className="field">
                    <label className="field-label" htmlFor="amount">Amount *</label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max="99999999.99"
                      placeholder="0.00"
                      value={expenseForm.amount}
                      onChange={handleExpenseFormChange}
                      className="input"
                      required
                    />
                  </div>
                  
                  <div className="field">
                    <label className="field-label" htmlFor="date">Date</label>
                    <input
                      id="date"
                      name="date"
                      type="date"
                      value={expenseForm.date}
                      onChange={handleExpenseFormChange}
                      className="input"
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="description">Description *</label>
                  <input
                    id="description"
                    name="description"
                    type="text"
                    placeholder="e.g. Groceries, Coffee, Taxi..."
                    value={expenseForm.description}
                    onChange={handleExpenseFormChange}
                    className="input"
                    required
                  />
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="category">Category (Optional)</label>
                  <input
                    id="category"
                    name="category"
                    type="text"
                    placeholder="e.g. Food, Transport, Entertainment..."
                    value={expenseForm.category}
                    onChange={handleExpenseFormChange}
                    className="input"
                  />
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="form-actions">
                  <button type="button" onClick={() => setShowExpenseModal(false)} className="btn btn-secondary" disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Adding..." : "Add Expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Edit Expense</h2>
                <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="expense-form">
                <div className="form-row">
                  <div className="field">
                    <label className="field-label" htmlFor="edit-amount">Amount *</label>
                    <input
                      id="edit-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max="99999999.99"
                      placeholder="0.00"
                      value={editForm.amount}
                      onChange={handleEditFormChange}
                      className="input"
                      required
                    />
                  </div>
                  
                  <div className="field">
                    <label className="field-label" htmlFor="edit-date">Date</label>
                    <input
                      id="edit-date"
                      name="date"
                      type="date"
                      value={editForm.date}
                      onChange={handleEditFormChange}
                      className="input"
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="edit-description">Description *</label>
                  <input
                    id="edit-description"
                    name="description"
                    type="text"
                    placeholder="e.g. Groceries, Coffee, Taxi..."
                    value={editForm.description}
                    onChange={handleEditFormChange}
                    className="input"
                    required
                  />
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="edit-category">Category</label>
                  <input
                    id="edit-category"
                    name="category"
                    type="text"
                    placeholder="e.g. Food, Transport, Entertainment..."
                    value={editForm.category}
                    onChange={handleEditFormChange}
                    className="input"
                  />
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={handleDeleteExpense} 
                    className="btn btn-danger" 
                    disabled={submitting}
                  >
                    {submitting ? "Deleting..." : "Delete"}
                  </button>
                  <div className="form-actions-right">
                    <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary" disabled={submitting}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {showUserModal && (
          <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">User Preferences </h2>
                <button className="modal-close" onClick={() => setShowUserModal(false)}>×</button>
              </div>
              
              <div className="user-settings-content">
                <div className="setting-item">
                  <label className="setting-label" htmlFor="month-start">Month Start Date</label>
                  <select 
                    id="month-start" 
                    className="setting-input"
                    defaultValue="1"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <p className="setting-description">
                    Choose which day of the month your budget cycle starts
                  </p>
                </div>

                <div className="setting-item">
                  <label className="setting-label" htmlFor="theme">Theme</label>
                  <select 
                    id="theme" 
                    className="setting-input"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  >
                    <option value="dark">Dark Theme</option>
                    <option value="light">Light Theme</option>
                  </select>
                  <p className="setting-description">
                    Choose your preferred color scheme
                  </p>
                </div>

                <div className="settings-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowUserModal(false)} 
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SignedIn>
    </div>
  );
}

export default App;