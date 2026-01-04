import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SpendingGraph = ({ expenses, period, loading }) => {
    // Process data for the chart
    const chartData = useMemo(() => {
        if (!expenses || expenses.length === 0) return [];

        // 1. Group by date
        const grouped = expenses.reduce((acc, curr) => {
            const date = curr.date;
            if (!acc[date]) acc[date] = 0;
            acc[date] += Number(curr.amount);
            return acc;
        }, {});

        // 2. Sort dates and fill gaps (optional, simple sort for now)
        const sortedDates = Object.keys(grouped).sort();

        // Map to array
        return sortedDates.map(date => ({
            date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            amount: grouped[date],
            fullDate: date
        }));
    }, [expenses]);

    if (loading) {
        return (
            <div className="card h-full">
                <div className="card-header pb-2">
                    <h2 className="card-title text-xl">Spending Trend</h2>
                    <p className="text-sm text-muted-foreground">Your financial activity over time</p>
                </div>
                <div className="card-content p-6">
                    <div className="w-full" style={{ height: '300px', backgroundColor: 'hsl(var(--muted) / 0.2)', borderRadius: 'var(--radius)' }}>
                        <div style={{ width: '100%', height: '100%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="card h-full">
                <div className="card-header pb-2">
                    <h2 className="card-title text-xl">Spending Trend</h2>
                    <p className="text-sm text-muted-foreground">Your financial activity over time</p>
                </div>
                <div className="card-content flex items-center justify-center text-muted-foreground" style={{ height: '300px' }}>
                    <p>No transaction data to display.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card h-full">
            <div className="card-header pb-2">
                <h2 className="card-title text-xl">Spending Trend</h2>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Your financial activity over time</p>
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))', animation: 'pulse 2s infinite' }}></span>
                        <span className="text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>Live Data</span>
                    </div>
                </div>
            </div>
            <div className="card-content">
                <div className="w-full" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                dy={10}
                                minTickGap={30}
                            />
                            <YAxis
                                hide={true}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    color: 'hsl(var(--card-foreground))'
                                }}
                                itemStyle={{ color: 'hsl(var(--primary))' }}
                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                                formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Spent']}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                                animationDuration={1500}
                                animationEasing="ease-out"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default SpendingGraph;
