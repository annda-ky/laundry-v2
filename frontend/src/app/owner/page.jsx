'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import styles from './dashboard.module.css';

const COLORS = ['#e67e22', '#1e3a5f', '#27ae60', '#3498db', '#9b59b6'];

export default function OwnerDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await api.getOwnerDashboard();
            if (response.success) {
                setData(response.data);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout allowedRoles={['OWNER']}>
                <div className={styles.loading}>
                    <div className="spinner spinner-lg"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout allowedRoles={['OWNER']}>
            <div className="page-content">
                <div className="page-header">
                    <h1 className="page-title">Dashboard Owner</h1>
                    <span className={styles.date}>
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-4">
                    <div className="stat-card">
                        <div className="stat-icon secondary">💰</div>
                        <div className="stat-content">
                            <div className="stat-value">{formatCurrency(data?.today?.revenue || 0)}</div>
                            <div className="stat-label">Pendapatan Hari Ini</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon primary">📅</div>
                        <div className="stat-content">
                            <div className="stat-value">{formatCurrency(data?.monthly?.revenue || 0)}</div>
                            <div className="stat-label">Pendapatan Bulan Ini</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon success">📈</div>
                        <div className="stat-content">
                            <div className="stat-value">{formatCurrency(data?.yearly?.revenue || 0)}</div>
                            <div className="stat-label">Pendapatan Tahun Ini</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon warning">📋</div>
                        <div className="stat-content">
                            <div className="stat-value">{data?.monthly?.orders || 0}</div>
                            <div className="stat-label">Transaksi Bulan Ini</div>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className={styles.chartsRow}>
                    {/* Daily Revenue Chart */}
                    <div className={`card ${styles.chartCard}`}>
                        <div className="card-header">
                            <h3 className="card-title">Pendapatan 7 Hari Terakhir</h3>
                        </div>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={data?.charts?.daily || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        formatter={(value) => [formatCurrency(value), 'Pendapatan']}
                                        labelStyle={{ color: '#1e3a5f' }}
                                        contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#e67e22"
                                        strokeWidth={3}
                                        dot={{ fill: '#e67e22', strokeWidth: 2 }}
                                        activeDot={{ r: 6, fill: '#e67e22' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Monthly Revenue Chart */}
                    <div className={`card ${styles.chartCard}`}>
                        <div className="card-header">
                            <h3 className="card-title">Pendapatan 6 Bulan Terakhir</h3>
                        </div>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={data?.charts?.monthly || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
                                    />
                                    <Tooltip
                                        formatter={(value) => [formatCurrency(value), 'Pendapatan']}
                                        contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="revenue" fill="#1e3a5f" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Top Services & Customers */}
                <div className={styles.chartsRow}>
                    {/* Top Services */}
                    <div className={`card ${styles.chartCard}`}>
                        <div className="card-header">
                            <h3 className="card-title">Layanan Paling Laku</h3>
                        </div>
                        {data?.topServices?.length > 0 ? (
                            <div className={styles.chartContainer}>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={data.topServices}
                                            dataKey="count"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={({ name, percent }) => `${name.slice(0, 15)}... (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {data.topServices.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [value, name]}
                                            contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p className="text-muted">Belum ada data layanan</p>
                            </div>
                        )}
                    </div>

                    {/* Top Customers */}
                    <div className={`card ${styles.chartCard}`}>
                        <div className="card-header">
                            <h3 className="card-title">Pelanggan Paling Sering</h3>
                        </div>
                        {data?.topCustomers?.length > 0 ? (
                            <div className={styles.listContainer}>
                                {data.topCustomers.map((customer, index) => (
                                    <div key={index} className={styles.listItem}>
                                        <div className={styles.listRank}>{index + 1}</div>
                                        <div className={styles.listInfo}>
                                            <span className={styles.listName}>{customer.name}</span>
                                            <span className={styles.listSub}>{customer.count} transaksi</span>
                                        </div>
                                        <div className={styles.listValue}>{formatCurrency(customer.revenue)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p className="text-muted">Belum ada data pelanggan</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
