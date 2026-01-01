import React from 'react';

const SummaryCards = ({ summary, loading, period, totalSpent, topCategory, expenseCount }) => {
    return (
        <div className="cards-grid">
            <div className="card">
                <div className="card-label">
                    Total spent ({period === "weekly" ? "this week" : "this month"})
                </div>
                <div className="card-value">
                    {loading ? (
                        <div className="skeleton-line medium"></div>
                    ) : totalSpent !== null ? (
                        `₹${Number(totalSpent).toFixed(2)}`
                    ) : (
                        "–"
                    )}
                </div>
                {summary?.start && summary?.end && (
                    <div className="card-caption">
                        {summary.start} → {summary.end}
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-label">Top category</div>
                <div className="card-value">
                    {loading ? (
                        <div className="skeleton-line medium"></div>
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
                    {loading ? (
                        <div className="skeleton-line medium"></div>
                    ) : (
                        expenseCount
                    )}
                </div>
                <div className="card-caption">
                    {period === "weekly" ? "This week" : "This month"}
                </div>
            </div>
        </div>
    );
};

export default SummaryCards;
