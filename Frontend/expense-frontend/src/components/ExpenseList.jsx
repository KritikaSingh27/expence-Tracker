import React from 'react';

const ExpenseList = ({ expenses, loading, error, filters, onFilterChange, onEdit, onAllTimeClick, period }) => {
    return (
        <section className="w-full">
            <div className="card">
                <div className="card-header pb-4 border-b mb-4">
                    <h2 className="card-title text-xl">Expenses</h2>
                    <p className="text-sm text-muted-foreground">Detailed list of your transactions</p>
                </div>
                <div className="card-content">
                    <div className="grid-filters">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium" htmlFor="start">From</label>
                            <input
                                id="start"
                                name="start"
                                type="date"
                                value={filters.start}
                                onChange={onFilterChange}
                                className="input"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium" htmlFor="end">To</label>
                            <input
                                id="end"
                                name="end"
                                type="date"
                                value={filters.end}
                                onChange={onFilterChange}
                                className="input"
                            />
                        </div>
                        <div className="flex flex-col gap-2" style={{ flexGrow: 1 }}>
                            <label className="text-sm font-medium" htmlFor="search">Search</label>
                            <input
                                id="search"
                                name="search"
                                type="text"
                                placeholder="Filter expenses..."
                                value={filters.search}
                                onChange={onFilterChange}
                                className="input"
                            />
                        </div>
                        <div className="flex flex-col gap-2 justify-end">
                            <button
                                onClick={onAllTimeClick}
                                className={`btn ${period === "all" ? "btn-secondary" : "btn-outline"}`}
                                title="Show all expenses"
                            >
                                All Time
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            <div className="skeleton-line medium h-12 w-full bg-muted rounded"></div>
                            <div className="skeleton-line medium h-12 w-full bg-muted rounded"></div>
                            <div className="skeleton-line medium h-12 w-full bg-muted rounded"></div>
                        </div>
                    ) : error ? (
                        <div className="p-4 text-sm text-destructive border border-destructive/50 rounded bg-destructive/10">{error}</div>
                    ) : expenses.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">No expenses found for this view.</div>
                    ) : (
                        <div className="table-container">
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
                                        <tr key={expense.id}>
                                            <td className="whitespace-nowrap text-sm">{expense.date || "–"}</td>
                                            <td className="font-medium text-sm">{expense.description || "No description"}</td>
                                            <td>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                    {expense.category_name || "Uncategorized"}
                                                </span>
                                            </td>
                                            <td className="text-right font-medium text-sm">₹{Number(expense.amount).toFixed(2)}</td>
                                            <td className="text-center">
                                                <button
                                                    className="btn btn-ghost btn-icon h-8 w-8"
                                                    onClick={() => onEdit(expense)}
                                                    title="Edit expense"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="h-4 w-4"
                                                        style={{ width: '1rem', height: '1rem' }}
                                                    >
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
            </div>
        </section>
    );
};

export default ExpenseList;
