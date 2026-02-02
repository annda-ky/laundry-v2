'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusClass, getPaymentStatusLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import styles from './order.module.css';

const STATUS_OPTIONS = ['DITERIMA', 'DICUCI', 'DIKERINGKAN', 'DISETRIKA', 'SELESAI', 'DIAMBIL', 'DIBATALKAN'];

export default function OrderListPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        paymentStatus: '',
        search: '',
    });

    useEffect(() => {
        loadOrders();
    }, [filters]);

    const loadOrders = async () => {
        try {
            const params = {};
            if (filters.status) params.status = filters.status;
            if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
            if (filters.search) params.search = filters.search;

            const response = await api.getOrders(params);
            if (response.success) {
                setOrders(response.data);
            }
        } catch (error) {
            toast.error('Gagal memuat data order');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.updateOrderStatus(orderId, newStatus);
            toast.success(`Status diubah ke ${getStatusLabel(newStatus)}`);
            loadOrders();
        } catch (error) {
            toast.error(error.message || 'Gagal mengubah status');
        }
    };

    const handlePaymentChange = async (orderId, paymentStatus) => {
        try {
            await api.updatePayment(orderId, { paymentStatus });
            toast.success('Status pembayaran diperbarui');
            loadOrders();
        } catch (error) {
            toast.error(error.message || 'Gagal mengubah status pembayaran');
        }
    };

    return (
        <DashboardLayout allowedRoles={['KASIR', 'OWNER']}>
            <div className="page-content">
                <div className="page-header">
                    <h1 className="page-title">Daftar Order</h1>
                    <Link href="/kasir/order/new" className="btn btn-secondary">
                        ➕ Order Baru
                    </Link>
                </div>

                {/* Filters */}
                <div className={`card ${styles.filterCard}`}>
                    <div className={styles.filters}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="🔍 Cari nota / nama pelanggan..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <select
                                className="form-input form-select"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">Semua Status</option>
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{getStatusLabel(s)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <select
                                className="form-input form-select"
                                value={filters.paymentStatus}
                                onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                            >
                                <option value="">Semua Pembayaran</option>
                                <option value="SUDAH_BAYAR">Lunas</option>
                                <option value="BELUM_BAYAR">Belum Bayar</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="card">
                    {loading ? (
                        <div className={styles.loading}>
                            <div className="spinner spinner-lg"></div>
                        </div>
                    ) : orders.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>No. Nota</th>
                                        <th>Pelanggan</th>
                                        <th>Layanan</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Pembayaran</th>
                                        <th>Waktu</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id}>
                                            <td>
                                                <Link href={`/kasir/order/${order.id}`} className={styles.orderLink}>
                                                    {order.orderNumber}
                                                </Link>
                                            </td>
                                            <td>
                                                <div>
                                                    <span className="font-medium">{order.customer.name}</span>
                                                    {order.customer.phone && (
                                                        <span className="text-muted" style={{ display: 'block', fontSize: '0.8125rem' }}>
                                                            {order.customer.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.serviceList}>
                                                    {order.items.slice(0, 2).map((item, i) => (
                                                        <span key={i} className={styles.serviceTag}>
                                                            {item.service.name}
                                                        </span>
                                                    ))}
                                                    {order.items.length > 2 && (
                                                        <span className={styles.moreTag}>+{order.items.length - 2}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="font-semibold">{formatCurrency(order.totalAmount)}</td>
                                            <td>
                                                <select
                                                    className={`${styles.statusSelect} status-${order.status.toLowerCase()}`}
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                >
                                                    {STATUS_OPTIONS.map((s) => (
                                                        <option key={s} value={s}>{getStatusLabel(s)}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <button
                                                    className={`${styles.paymentBtn} ${order.paymentStatus === 'SUDAH_BAYAR' ? styles.paid : styles.unpaid}`}
                                                    onClick={() => handlePaymentChange(order.id, order.paymentStatus === 'SUDAH_BAYAR' ? 'BELUM_BAYAR' : 'SUDAH_BAYAR')}
                                                >
                                                    {getPaymentStatusLabel(order.paymentStatus)}
                                                </button>
                                            </td>
                                            <td className="text-muted" style={{ fontSize: '0.8125rem' }}>
                                                {formatDateTime(order.createdAt)}
                                            </td>
                                            <td>
                                                <Link href={`/kasir/order/${order.id}`} className="btn btn-ghost btn-sm">
                                                    👁️
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <div className="empty-state-title">Tidak Ada Order</div>
                            <div className="empty-state-description">Belum ada order yang sesuai filter</div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
