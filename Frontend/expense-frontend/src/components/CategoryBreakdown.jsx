import React from 'react';

const CategoryBreakdown = ({ summary, totalSpent, loading }) => {
    return (
        <div className="panel">
            <div className="panel-header">
                <h2 className="panel-title">Category breakdown</h2>
                <span className="panel-caption">Where your money goes</span>
            </div>
            {loading ? (
                <div className="skeleton-chart"></div>
            ) : summary?.by_category && summary.by_category.length > 0 && totalSpent ? (
                <>
                    <div
                        className="pie-chart"
                        style={{
                            backgroundImage: (() => {
                                const colors = ["#a855f7", "#0ea5e9", "#22c55e", "#f97316", "#e11d48", "#facc15"];
                                let acc = 0;
                                const segments = summary.by_category.map((cat, i) => {
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
                        {summary.by_category.map((cat, idx) => (
                            <li key={cat.id ?? cat.name} className="category-item">
                                <div className="category-main">
                                    <span
                                        className="pie-legend-dot"
                                        style={{
                                            backgroundColor: ["#a855f7", "#0ea5e9", "#22c55e", "#f97316", "#e11d48", "#facc15"][idx % 6],
                                        }}
                                    />
                                    <span className="category-name">
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
    );
};

export default CategoryBreakdown;
