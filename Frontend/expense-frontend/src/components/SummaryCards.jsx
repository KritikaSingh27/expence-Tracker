import React from 'react';

const SummaryCards = ({ summary, loading, period, totalSpent, topCategory, expenseCount }) => {
    return (
        <div className="grid gap-4 md:grid-cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="card">
                <div className="card-header pb-2">
                    <div className="text-sm font-medium text-muted-foreground">
                        Total spent ({period === "weekly" ? "this week" : "this month"})
                    </div>
                    <div className="card-content p-0">
                        <div className="text-2xl font-bold">
                            {loading ? (
                                <div className="skeleton-line medium" style={{ width: '100px', height: '32px', backgroundColor: 'hsl(var(--muted))', borderRadius: '4px' }}></div>
                            ) : totalSpent !== null ? (
                                `₹${Number(totalSpent).toFixed(2)}`
                            ) : (
                                "–"
                            )}
                        </div>
                        {summary?.start && summary?.end && (
                            <p className="text-xs text-muted-foreground">
                                {summary.start} → {summary.end}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header pb-2">
                    <div className="text-sm font-medium text-muted-foreground">Top category</div>
                    <div className="card-content p-0">
                        <div className="text-2xl font-bold">
                            {loading ? (
                                <div className="skeleton-line medium" style={{ width: '100px', height: '32px', backgroundColor: 'hsl(var(--muted))', borderRadius: '4px' }}></div>
                            ) : topCategory ? (
                                topCategory
                            ) : (
                                "No data"
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header pb-2">
                    <div className="text-sm font-medium text-muted-foreground">Total expenses</div>
                    <div className="card-content p-0">
                        <div className="text-2xl font-bold">
                            {loading ? (
                                <div className="skeleton-line medium" style={{ width: '100px', height: '32px', backgroundColor: 'hsl(var(--muted))', borderRadius: '4px' }}></div>
                            ) : (
                                expenseCount
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {period === "weekly" ? "This week" : "This month"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default SummaryCards;
