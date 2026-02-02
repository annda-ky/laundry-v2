'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusClass, getPaymentStatusLabel } from '@/lib/utils';
import styles from './dashboard.module.css';

export default function KasirDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await api.getKasirDashboard();
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
            <DashboardLayout allowedRoles={['KASIR', 'OWNER']}>
                <div className={styles.loading}>
                    <div className="spinner spinner-lg"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout allowedRoles={['KASIR', 'OWNER']}>
            <div className="page-content">
                <div className="page-header">
                    <h1 className="page-title">Dashboard Kasir</h1>
                    <Link href="/kasir/order/new" className="btn btn-secondary">
                        ➕ Order Baru
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-4">
                    <div className="stat-card">
                        <div className="stat-icon secondary">📋</div>
                        <div className="stat-content">
                            <div className="stat-value">{data?.today?.orders || 0}</div>
                            <div className="stat-label">Order Masuk Hari Ini</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon success">💰</div>
                        <div className="stat-content">
                            <div className="stat-value">{formatCurrency(data?.today?.revenue || 0)}</div>
                            <div className="stat-label">Pemasukan Hari Ini</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon warning">⏳</div>
                        <div className="stat-content">
                            <div className="stat-value">{data?.unpaidOrders || 0}</div>
                            <div className="stat-label">Belum Dibayar</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon primary">📦</div>
                        <div className="stat-content">
                            <div className="stat-value">{data?.notPickedUp || 0}</div>
                            <div className="stat-label">Belum Diambil</div>
                        </div>
                    </div>
                </div>

                {/* Pending Orders */}
                <div className={`card ${styles.tableCard}`}>
                    <div className="card-header">
                        <h3 className="card-title">Order Dalam Proses</h3>
                        <Link href="/kasir/order" className="btn btn-ghost btn-sm">
                            Lihat Semua →
                        </Link>
                    </div>

                    {data?.pendingOrders?.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>No. Nota</th>
                                        <th>Pelanggan</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Pembayaran</th>
                                        <th>Waktu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.pendingOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td>
                                                <Link href={`/kasir/order/${order.id}`} className={styles.orderLink}>
                                                    {order.orderNumber}
                                                </Link>
                                            </td>
                                            <td>
                                                <div className={styles.customerInfo}>
                                                    <span className={styles.customerName}>{order.customer.name}</span>
                                                    {order.customer.phone && (
                                                        <span className={styles.customerPhone}>{order.customer.phone}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="font-semibold">{formatCurrency(order.totalAmount)}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(order.status)}`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${order.paymentStatus === 'SUDAH_BAYAR' ? 'badge-success' : 'badge-warning'}`}>
                                                    {getPaymentStatusLabel(order.paymentStatus)}
                                                </span>
                                            </td>
                                            <td className="text-muted">{formatDateTime(order.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <div className="empty-state-title">Tidak Ada Order Pending</div>
                            <div className="empty-state-description">Semua order sudah selesai diproses</div>
                        </div>
                    )}
                </div>

                {/* Recent Orders Today */}
                <div className={`card ${styles.tableCard}`}>
                    <div className="card-header">
                        <h3 className="card-title">Order Hari Ini</h3>
                    </div>

                    {data?.recentOrders?.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>No. Nota</th>
                                        <th>Pelanggan</th>
                                        <th>Layanan</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Waktu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td>
                                                <Link href={`/kasir/order/${order.id}`} className={styles.orderLink}>
                                                    {order.orderNumber}
                                                </Link>
                                            </td>
                                            <td>{order.customer.name}</td>
                                            <td>
                                                <div className={styles.serviceList}>
                                                    {order.items.slice(0, 2).map((item, i) => (
                                                        <span key={i} className={styles.serviceItem}>
                                                            {item.service.name}
                                                        </span>
                                                    ))}
                                                    {order.items.length > 2 && (
                                                        <span className={styles.moreItems}>+{order.items.length - 2} lainnya</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="font-semibold">{formatCurrency(order.totalAmount)}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(order.status)}`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </td>
                                            <td className="text-muted">{formatDateTime(order.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <div className="empty-state-title">Belum Ada Order</div>
                            <div className="empty-state-description">Order baru akan muncul di sini</div>
                            <Link href="/kasir/order/new" className="btn btn-primary">
                                Buat Order Baru
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
