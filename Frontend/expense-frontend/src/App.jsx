import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";

import SummaryCards from "./components/SummaryCards";
import InsightsPanel from "./components/InsightsPanel";
import CategoryBreakdown from "./components/CategoryBreakdown";
import ExpenseList from "./components/ExpenseList";
import ExpenseModal from "./components/ExpenseModal";

// Base API URL
const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

function App() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  axios.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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

  // Loaders
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const [error, setError] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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

  // --- DATA FETCHING ---

  const fetchExpenses = async () => {
    try {
      setExpensesLoading(true);
      setError("");

      let startDate = "";
      let endDate = "";

      if (filters.start && filters.end) {
        startDate = filters.start;
        endDate = filters.end;
      }
      else {
        if (period === "weekly") {
          const today = new Date();
          const monday = new Date(today);
          monday.setDate(today.getDate() - today.getDay() + 1);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          startDate = monday.toISOString().split('T')[0];
          endDate = sunday.toISOString().split('T')[0];
        }
        else if (period === "monthly") {
          const today = new Date();
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          startDate = firstDay.toISOString().split('T')[0];
          endDate = lastDay.toISOString().split('T')[0];
        }
      }

      const response = await axios.get(`${API_BASE}/expenses/`, {
        params: {
          start: startDate,
          end: endDate,
          search: filters.search || undefined,
        },
      });

      setExpenses(response.data || []);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setError("Something went wrong while loading your expenses.");
    } finally {
      setExpensesLoading(false);
    }
  };

  const fetchSummaryAndInsights = async (forceInsights = false) => {
    const lastFetch = localStorage.getItem('lastAIRequest');
    const now = Date.now();

    // Throttle AI requests (Insights only) - but allow forcing when filters change
    const shouldSkipAI = !forceInsights && lastFetch && (now - lastFetch < 60000); // 1 min throttle

    try {
      setSummaryLoading(true);
      if (!shouldSkipAI) setInsightsLoading(true);

      // Prepare parameters
      let apiParams = { period };
      if (filters.start && filters.end) {
        apiParams.start = filters.start;
        apiParams.end = filters.end;
      }

      // 1. Fetch Summary (Fast)
      axios.get(`${API_BASE}/expenses/summary/`, { params: apiParams })
        .then(res => {
          setSummary(res.data || null);
          setSummaryLoading(false);
        })
        .catch(err => {
          console.error("Error fetching summary:", err);
          setSummaryLoading(false);
        });

      // 2. Fetch Insights (Slow)
      if (!shouldSkipAI) {
        axios.get(`${API_BASE}/expenses/insights/`, { params: apiParams })
          .then(res => {
            setInsights(res.data || null);
            setInsightsLoading(false);
            localStorage.setItem('lastAIRequest', Date.now());
          })
          .catch(err => {
            console.error("Error fetching insights:", err);
            setInsightsLoading(false);
          });
      }

    } catch (err) {
      console.error("Error initiating fetch:", err);
      setSummaryLoading(false);
      setInsightsLoading(false);
    }
  };

  // Initial Load & Filter Changes
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetchExpenses();
    fetchSummaryAndInsights(true); // Force insights refresh when filters change
  }, [isLoaded, isSignedIn, filters.start, filters.end, filters.search, period, selectedMonth, selectedYear]);


  // Refresh Data (Called after mutations)
  const refreshData = async () => {
    // Re-fetch everything
    await Promise.all([
      fetchExpenses(),
      fetchSummaryAndInsights() // This handles its own decoupling
    ]);
  };


  // --- HANDLERS ---

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleMonthChange = (month, year) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (year === currentYear && month > currentMonth) {
      month = currentMonth;
    }

    setSelectedMonth(month);
    setSelectedYear(year);
    setPeriod("monthly");

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    setFilters(prev => ({
      ...prev,
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    }));
  };

  const handleAllTimeClick = () => {
    if (period === "all") {
      setPeriod("monthly");
      setFilters(prev => ({ ...prev, start: "", end: "" }));
    } else {
      setPeriod("all");
      setFilters(prev => ({ ...prev, start: "", end: "" }));
    }
  };

  const handleExpenseFormChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

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

      setExpenseForm({
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        category: "",
      });
      setShowExpenseModal(false);

      // Auto-refresh
      refreshData();

    } catch (err) {
      console.error("Error creating expense:", err);
      setError("Failed to create expense. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setEditForm({
      amount: expense.amount.toString(),
      description: expense.description || "",
      date: expense.date || "",
      category: expense.category_name || "",
    });
    setShowEditModal(true);
    setError("");
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.amount || !editForm.description) {
      setError("Amount and description are required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const requestData = {
        amount: parseFloat(editForm.amount),
        description: editForm.description.trim(),
        date: editForm.date || null,
        category_name: editForm.category.trim() || null,
      };

      await axios.put(`${API_BASE}/expenses/${editingExpense.id}/`, requestData);

      setShowEditModal(false);
      setEditingExpense(null);
      refreshData();

    } catch (err) {
      console.error("Error updating expense:", err);
      setError("Failed to update expense. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!editingExpense) return;
    try {
      setSubmitting(true);
      setError("");
      await axios.delete(`${API_BASE}/expenses/${editingExpense.id}/`);
      setShowEditModal(false);
      setEditingExpense(null);
      refreshData();
    } catch (err) {
      console.error("Error deleting expense:", err);
      setError("Failed to delete expense. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Derived Data
  const effectiveSummary = summary ?? insights?.summary ?? null;
  const totalSpent = effectiveSummary?.total ?? insights?.cards?.total_spent ?? null;
  const topCategory = insights?.cards?.top_category ||
    (effectiveSummary?.by_category && effectiveSummary.by_category[0]?.name) || null;
  const insightText = typeof insights?.insight === "string" ? insights.insight : insights?.insight?.text || null;


  if (!isLoaded) return <div className="loading">Loading Auth...</div>;

  return (
    <div className={theme === "light" ? "light-theme" : ""}>
      <SignedOut>
        <div className="landing-page">
          <nav className="landing-nav">
            <div>
              <div className="logo">Money<span>Notes</span></div>
              <div className="punchline">A quiet place to understand your spending</div>
            </div>
            <SignInButton mode="modal">
              <button className="nav-login-btn">Sign In</button>
            </SignInButton>
          </nav>
          <header className="hero-section">
            <div className="hero-content">
              <div className="badge">New: Gemini 2.5 Insights and Categorization Live</div>
              <h1>Master your money with <span>AI intelligence.</span></h1>
              <p>Track expenses, categorize automatically, and get personalized financial advice powered by Google Gemini.</p>

              <div className="hero-actions">
                <SignInButton mode="modal">
                  <button className="cta-button">Start Tracking for Free</button>
                </SignInButton>
                <div className="trust-badges">
                  <span className="trust-item">✓ Secure Auth by Clerk</span>
                  <span className="trust-item">✓ Private & Encrypted</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="abstract-card main-card">
                <div className="skeleton-line short"></div>
                <div className="skeleton-value"></div>
                <div className="skeleton-line long"></div>
              </div>
              <div className="abstract-card mini-card">
                <div className="ai-pulse-small"></div>
                <div className="skeleton-line medium"></div>
              </div>
            </div>
          </header>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="app">
          <header className="app-header">
            <div>
              <div className="logo">Money<span>Notes</span></div>
              <div className="punchline">A quiet place to understand your spending</div>
            </div>

            <div className="header-actions">
              <div className="period-toggle">
                <button
                  className={period === "weekly" ? "pill pill-active" : "pill"}
                  onClick={() => {
                    setPeriod("weekly");
                    setFilters(prev => ({ ...prev, start: "", end: "" }));
                  }}
                >
                  Weekly
                </button>
                <button
                  className={period === "monthly" ? "pill pill-active" : "pill"}
                  onClick={() => {
                    setPeriod("monthly");
                    setFilters(prev => ({ ...prev, start: "", end: "" }));
                    // Reset to current month when switching to monthly view
                    const now = new Date();
                    setSelectedMonth(now.getMonth() + 1);
                    setSelectedYear(now.getFullYear());
                  }}
                >
                  Monthly
                </button>
              </div>

              <div className="month-picker-container">
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(parseInt(e.target.value), selectedYear)}
                  className="month-input-pill"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'short' })}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => handleMonthChange(selectedMonth, parseInt(e.target.value))}
                  className="month-input-pill"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button className="user-profile-btn menu-dots-btn" onClick={() => setShowUserModal(true)}>
                <img className="three-dots" src="three-dots-menu.png" alt="menu" />
                <img className="three-dots-light" src="three-dots-light.png" alt="menu" />
              </button>
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
                  <InsightsPanel loading={insightsLoading} insightText={insightText} />

                  <div className="panel">
                    <div className="panel-header">
                      <h2 className="panel-title">Category Totals</h2>
                    </div>
                    {effectiveSummary?.by_category ? (
                      <ul className="category-list">
                        {effectiveSummary.by_category.map((cat) => (
                          <li key={cat.id ?? cat.name} className="category-item">
                            <div className="category-main">
                              <span className="category-name">{cat.name}</span>
                              <span className="category-amount">₹{Number(cat.total).toFixed(2)}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-state">No data yet.</p>
                    )}
                  </div>
                </aside>

                <section className="layout-main">
                  <SummaryCards
                    summary={effectiveSummary}
                    loading={summaryLoading}
                    period={period}
                    totalSpent={totalSpent}
                    topCategory={topCategory}
                    expenseCount={effectiveSummary?.count ?? expenses.length ?? 0}
                  />

                  <CategoryBreakdown
                    summary={effectiveSummary}
                    totalSpent={totalSpent}
                    loading={summaryLoading}
                  />
                </section>
              </>
            )}

            {activeTab === "expenses" && (
              <ExpenseList
                expenses={expenses}
                loading={expensesLoading}
                error={error}
                filters={filters}
                onFilterChange={handleFilterChange}
                onEdit={handleEditExpense}
                onAllTimeClick={handleAllTimeClick}
                period={period}
              />
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
        <ExpenseModal
          show={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          onSubmit={handleExpenseSubmit}
          form={expenseForm}
          onChange={handleExpenseFormChange}
          submitting={submitting}
          error={error}
        />

        <ExpenseModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
          form={editForm}
          onChange={handleEditFormChange}
          submitting={submitting}
          error={error}
          isEdit={true}
          onDelete={handleDeleteExpense}
        />

        {showUserModal && (
          <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">User Preference</h2>
                <button className="modal-close" onClick={() => setShowUserModal(false)}>×</button>
              </div>
              <div className="user-settings-content">
                <div className="setting-item">
                  <label className="setting-label">Theme</label>
                  <select
                    className="setting-input"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  >
                    <option value="dark">Dark Theme</option>
                    <option value="light">Light Theme</option>
                  </select>
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