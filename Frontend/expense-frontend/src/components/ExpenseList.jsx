import React from 'react';

const ExpenseList = ({ expenses, loading, error, filters, onFilterChange, onEdit, onAllTimeClick, period }) => {
    return (
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
                            onChange={onFilterChange}
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
                            onChange={onFilterChange}
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
                            onChange={onFilterChange}
                            className="input"
                        />
                    </div>
                    <div className="field">
                        <label className="field-label">&nbsp;</label>
                        <button
                            onClick={onAllTimeClick}
                            className={period === "all" ? "pill pill-active all-time-btn" : "pill all-time-btn"}
                            title="Show all expenses"
                        >
                            All Time
                        </button>
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
                                                onClick={() => onEdit(expense)}
                                                title="Edit expense"
                                            >
                                                <svg
                                                    className="edit-icon"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
    );
};

export default ExpenseList;
