'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusClass, getPaymentStatusLabel, getPaymentMethodLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import styles from './detail.module.css';

const STATUS_OPTIONS = ['DITERIMA', 'DICUCI', 'DIKERINGKAN', 'DISETRIKA', 'SELESAI', 'DIAMBIL', 'DIBATALKAN'];

export default function OrderDetailPage({ params }) {
    const { id } = params;
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReceipt, setShowReceipt] = useState(false);

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            const [orderRes, receiptRes] = await Promise.all([
                api.getOrder(id),
                api.getReceipt(id),
            ]);
            if (orderRes.success) {
                setOrder(orderRes.data);
            }
            if (receiptRes.success) {
                setSettings(receiptRes.data.settings);
            }
        } catch (error) {
            toast.error('Gagal memuat data order');
            router.push('/kasir/order');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await api.updateOrderStatus(id, newStatus);
            toast.success(`Status diubah ke ${getStatusLabel(newStatus)}`);
            loadOrder();
        } catch (error) {
            toast.error(error.message || 'Gagal mengubah status');
        }
    };

    const handlePayment = async () => {
        try {
            await api.updatePayment(id, { paymentStatus: 'SUDAH_BAYAR' });
            toast.success('Pembayaran berhasil dicatat');
            loadOrder();
        } catch (error) {
            toast.error(error.message || 'Gagal mengubah status pembayaran');
        }
    };

    const handlePrint = () => {
        window.print();
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

    if (!order) {
        return (
            <DashboardLayout allowedRoles={['KASIR', 'OWNER']}>
                <div className="page-content">
                    <div className="empty-state">
                        <div className="empty-state-icon">❌</div>
                        <div className="empty-state-title">Order Tidak Ditemukan</div>
                        <Link href="/kasir/order" className="btn btn-primary">
                            Kembali ke Daftar Order
                        </Link>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout allowedRoles={['KASIR', 'OWNER']}>
            <div className="page-content">
                <div className="page-header">
                    <div>
                        <Link href="/kasir/order" className={styles.backLink}>← Kembali</Link>
                        <h1 className="page-title">Detail Order #{order.orderNumber}</h1>
                    </div>
                    <div className={styles.headerActions}>
                        <button onClick={() => setShowReceipt(true)} className="btn btn-outline">
                            🧾 Lihat Nota
                        </button>
                        <button onClick={handlePrint} className="btn btn-primary">
                            🖨️ Cetak
                        </button>
                    </div>
                </div>

                <div className={styles.layout}>
                    {/* Main Info */}
                    <div className={styles.mainCol}>
                        {/* Order Info */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Informasi Order</h3>
                                <span className={`status-badge ${getStatusClass(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                </span>
                            </div>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>No. Nota</span>
                                    <span className={styles.infoValue}>{order.orderNumber}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Tanggal</span>
                                    <span className={styles.infoValue}>{formatDateTime(order.createdAt)}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Kasir</span>
                                    <span className={styles.infoValue}>{order.user?.name || order.user?.username}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Pembayaran</span>
                                    <span className={`badge ${order.paymentStatus === 'SUDAH_BAYAR' ? 'badge-success' : 'badge-warning'}`}>
                                        {getPaymentStatusLabel(order.paymentStatus)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="card mt-6">
                            <div className="card-header">
                                <h3 className="card-title">👤 Data Pelanggan</h3>
                            </div>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Nama</span>
                                    <span className={styles.infoValue}>{order.customer.name}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>No. HP</span>
                                    <span className={styles.infoValue}>{order.customer.phone || '-'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Alamat</span>
                                    <span className={styles.infoValue}>{order.customer.address || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="card mt-6">
                            <div className="card-header">
                                <h3 className="card-title">🧺 Detail Layanan</h3>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Layanan</th>
                                            <th>Qty</th>
                                            <th>Harga</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="font-medium">{item.service.name}</td>
                                                <td>{parseFloat(item.quantity)} {item.service.type === 'KILOAN' ? 'kg' : 'pcs'}</td>
                                                <td>{formatCurrency(item.price)}</td>
                                                <td className="font-semibold">{formatCurrency(item.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={3} className="text-right font-semibold">Total</td>
                                            <td className="font-bold text-primary" style={{ fontSize: '1.125rem' }}>
                                                {formatCurrency(order.totalAmount)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            {order.notes && (
                                <div className={styles.notes}>
                                    <strong>Catatan:</strong> {order.notes}
                                </div>
                            )}
                        </div>

                        {/* Status History */}
                        {order.statusHistory?.length > 0 && (
                            <div className="card mt-6">
                                <div className="card-header">
                                    <h3 className="card-title">📋 Riwayat Status</h3>
                                </div>
                                <div className={styles.timeline}>
                                    {order.statusHistory.map((history, index) => (
                                        <div key={history.id} className={styles.timelineItem}>
                                            <div className={`${styles.timelineDot} ${index === 0 ? styles.active : ''}`}></div>
                                            <div className={styles.timelineContent}>
                                                <span className={`status-badge ${getStatusClass(history.status)}`}>
                                                    {getStatusLabel(history.status)}
                                                </span>
                                                <span className={styles.timelineDate}>{formatDateTime(history.changedAt)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Side Actions */}
                    <div className={styles.sideCol}>
                        <div className={`card ${styles.actionsCard}`}>
                            <div className="card-header">
                                <h3 className="card-title">⚡ Aksi Cepat</h3>
                            </div>

                            {/* Status Change */}
                            <div className={styles.actionSection}>
                                <label className="form-label">Ubah Status</label>
                                <div className={styles.statusButtons}>
                                    {STATUS_OPTIONS.map((status) => (
                                        <button
                                            key={status}
                                            className={`${styles.statusBtn} ${order.status === status ? styles.active : ''}`}
                                            onClick={() => handleStatusChange(status)}
                                            disabled={order.status === status}
                                        >
                                            {getStatusLabel(status)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Action */}
                            {order.paymentStatus === 'BELUM_BAYAR' && (
                                <div className={styles.actionSection}>
                                    <button onClick={handlePayment} className="btn btn-success w-full btn-lg">
                                        💰 Konfirmasi Pembayaran
                                    </button>
                                </div>
                            )}

                            {/* WhatsApp */}
                            {order.customer.phone && (
                                <div className={styles.actionSection}>
                                    <a
                                        href={`https://wa.me/${order.customer.phone.replace(/^0/, '62')}?text=Halo ${order.customer.name}, order laundry Anda (${order.orderNumber}) sudah ${getStatusLabel(order.status).toLowerCase()}. Total: ${formatCurrency(order.totalAmount)}. Terima kasih!`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-success w-full"
                                    >
                                        📱 Kirim WhatsApp
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Receipt Modal */}
                {showReceipt && (
                    <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
                        <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Nota Laundry</h3>
                                <button onClick={() => setShowReceipt(false)} className="modal-close">✕</button>
                            </div>
                            <div className="modal-body">
                                <div className={styles.receipt} id="printable-receipt">
                                    <div className={styles.receiptHeader}>
                                        {settings?.logoUrl && (
                                            <img src={settings.logoUrl} alt="Logo" className={styles.receiptLogo} />
                                        )}
                                        <h2>{settings?.businessName || 'Laundry'}</h2>
                                        <p>{settings?.address}</p>
                                        <p>{settings?.phone}</p>
                                    </div>
                                    <div className={styles.receiptDivider}></div>
                                    <div className={styles.receiptInfo}>
                                        <div>
                                            <span>No. Nota</span>
                                            <strong>{order.orderNumber}</strong>
                                        </div>
                                        <div>
                                            <span>Tanggal</span>
                                            <strong>{formatDateTime(order.createdAt)}</strong>
                                        </div>
                                        <div>
                                            <span>Pelanggan</span>
                                            <strong>{order.customer.name}</strong>
                                        </div>
                                    </div>
                                    <div className={styles.receiptDivider}></div>
                                    <div className={styles.receiptItems}>
                                        {order.items.map((item) => (
                                            <div key={item.id} className={styles.receiptItem}>
                                                <span>{item.service.name}</span>
                                                <span>{parseFloat(item.quantity)} x {formatCurrency(item.price)}</span>
                                                <span>{formatCurrency(item.subtotal)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.receiptDivider}></div>
                                    <div className={styles.receiptTotal}>
                                        <span>Total</span>
                                        <strong>{formatCurrency(order.totalAmount)}</strong>
                                    </div>
                                    <div className={styles.receiptStatus}>
                                        <span>Status: {getStatusLabel(order.status)}</span>
                                        <span>Bayar: {getPaymentStatusLabel(order.paymentStatus)}</span>
                                    </div>
                                    <div className={styles.receiptFooter}>
                                        <p>{settings?.footer || 'Terima kasih!'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => setShowReceipt(false)} className="btn btn-ghost">
                                    Tutup
                                </button>
                                <button onClick={handlePrint} className="btn btn-primary">
                                    🖨️ Cetak Nota
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
