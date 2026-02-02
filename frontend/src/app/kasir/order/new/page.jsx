'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency, getServiceTypeLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import styles from './new.module.css';

export default function NewOrderPage() {
    const router = useRouter();
    const [services, setServices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchCustomer, setSearchCustomer] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    const [formData, setFormData] = useState({
        customerId: '',
        customerName: '',
        customerPhone: '',
        items: [],
        notes: '',
        paymentStatus: 'BELUM_BAYAR',
        paymentMethod: 'TUNAI',
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (searchCustomer.length >= 2) {
            searchCustomers(searchCustomer);
        }
    }, [searchCustomer]);

    const loadData = async () => {
        try {
            const [servicesRes] = await Promise.all([
                api.getServices(),
            ]);
            if (servicesRes.success) {
                setServices(servicesRes.data);
            }
        } catch (error) {
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const searchCustomers = async (query) => {
        try {
            const response = await api.getCustomers(query);
            if (response.success) {
                setCustomers(response.data);
                setShowCustomerDropdown(true);
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const selectCustomer = (customer) => {
        setFormData({
            ...formData,
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone || '',
        });
        setSearchCustomer(customer.name);
        setShowCustomerDropdown(false);
    };

    const addItem = (service) => {
        const existingIndex = formData.items.findIndex((i) => i.serviceId === service.id);
        if (existingIndex >= 0) {
            const newItems = [...formData.items];
            newItems[existingIndex].quantity += 1;
            setFormData({ ...formData, items: newItems });
        } else {
            setFormData({
                ...formData,
                items: [
                    ...formData.items,
                    {
                        serviceId: service.id,
                        serviceName: service.name,
                        serviceType: service.type,
                        price: parseFloat(service.price),
                        quantity: 1,
                    },
                ],
            });
        }
    };

    const updateItemQuantity = (index, quantity) => {
        const newItems = [...formData.items];
        newItems[index].quantity = Math.max(0.1, parseFloat(quantity) || 0);
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.customerName && !formData.customerId) {
            toast.error('Nama pelanggan harus diisi');
            return;
        }

        if (formData.items.length === 0) {
            toast.error('Minimal satu layanan harus dipilih');
            return;
        }

        setSubmitting(true);
        try {
            const orderData = {
                customerId: formData.customerId || undefined,
                customerName: formData.customerId ? undefined : formData.customerName,
                customerPhone: formData.customerId ? undefined : formData.customerPhone,
                items: formData.items.map((i) => ({
                    serviceId: i.serviceId,
                    quantity: i.quantity,
                })),
                notes: formData.notes,
                paymentStatus: formData.paymentStatus,
                paymentMethod: formData.paymentMethod,
            };

            const response = await api.createOrder(orderData);
            if (response.success) {
                toast.success('Order berhasil dibuat!');
                router.push(`/kasir/order/${response.data.id}`);
            }
        } catch (error) {
            toast.error(error.message || 'Gagal membuat order');
        } finally {
            setSubmitting(false);
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
                    <h1 className="page-title">Order Baru</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.layout}>
                        {/* Left: Customer & Services */}
                        <div className={styles.mainCol}>
                            {/* Customer Section */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">👤 Data Pelanggan</h3>
                                </div>
                                <div className={styles.customerSearch}>
                                    <div className="form-group">
                                        <label className="form-label">Nama Pelanggan *</label>
                                        <div className={styles.searchWrapper}>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Ketik nama atau pilih pelanggan..."
                                                value={formData.customerId ? formData.customerName : searchCustomer}
                                                onChange={(e) => {
                                                    setSearchCustomer(e.target.value);
                                                    setFormData({ ...formData, customerId: '', customerName: e.target.value });
                                                }}
                                                onFocus={() => searchCustomer.length >= 2 && setShowCustomerDropdown(true)}
                                            />
                                            {showCustomerDropdown && customers.length > 0 && (
                                                <div className={styles.dropdown}>
                                                    {customers.map((c) => (
                                                        <div
                                                            key={c.id}
                                                            className={styles.dropdownItem}
                                                            onClick={() => selectCustomer(c)}
                                                        >
                                                            <span className={styles.customerName}>{c.name}</span>
                                                            {c.phone && <span className={styles.customerPhone}>{c.phone}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">No. HP (opsional)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="08xxxxxxxxxx"
                                            value={formData.customerPhone}
                                            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                            disabled={!!formData.customerId}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Services Section */}
                            <div className="card mt-6">
                                <div className="card-header">
                                    <h3 className="card-title">🧺 Pilih Layanan</h3>
                                </div>
                                <div className={styles.servicesGrid}>
                                    {services.map((service) => (
                                        <button
                                            key={service.id}
                                            type="button"
                                            className={styles.serviceCard}
                                            onClick={() => addItem(service)}
                                        >
                                            <span className={styles.serviceName}>{service.name}</span>
                                            <span className={styles.servicePrice}>
                                                {formatCurrency(service.price)}
                                                <small>/{service.type === 'KILOAN' ? 'kg' : 'pcs'}</small>
                                            </span>
                                            <span className={`badge ${service.type === 'KILOAN' ? 'badge-primary' : 'badge-secondary'}`}>
                                                {getServiceTypeLabel(service.type)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Cart & Summary */}
                        <div className={styles.sideCol}>
                            <div className={`card ${styles.cartCard}`}>
                                <div className="card-header">
                                    <h3 className="card-title">🛒 Keranjang</h3>
                                </div>

                                {formData.items.length > 0 ? (
                                    <>
                                        <div className={styles.cartItems}>
                                            {formData.items.map((item, index) => (
                                                <div key={index} className={styles.cartItem}>
                                                    <div className={styles.itemInfo}>
                                                        <span className={styles.itemName}>{item.serviceName}</span>
                                                        <span className={styles.itemPrice}>{formatCurrency(item.price)}/{item.serviceType === 'KILOAN' ? 'kg' : 'pcs'}</span>
                                                    </div>
                                                    <div className={styles.itemActions}>
                                                        <input
                                                            type="number"
                                                            className={styles.qtyInput}
                                                            value={item.quantity}
                                                            onChange={(e) => updateItemQuantity(index, e.target.value)}
                                                            min="0.1"
                                                            step="0.1"
                                                        />
                                                        <span className={styles.itemSubtotal}>{formatCurrency(item.price * item.quantity)}</span>
                                                        <button
                                                            type="button"
                                                            className={styles.removeBtn}
                                                            onClick={() => removeItem(index)}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className={styles.cartDivider}></div>

                                        <div className={styles.cartTotal}>
                                            <span>Total</span>
                                            <strong>{formatCurrency(calculateTotal())}</strong>
                                        </div>

                                        <div className={styles.cartDivider}></div>

                                        <div className="form-group">
                                            <label className="form-label">Status Pembayaran</label>
                                            <div className={styles.paymentOptions}>
                                                <label className={`${styles.paymentOption} ${formData.paymentStatus === 'BELUM_BAYAR' ? styles.selected : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="paymentStatus"
                                                        value="BELUM_BAYAR"
                                                        checked={formData.paymentStatus === 'BELUM_BAYAR'}
                                                        onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                                                    />
                                                    <span>Belum Bayar</span>
                                                </label>
                                                <label className={`${styles.paymentOption} ${formData.paymentStatus === 'SUDAH_BAYAR' ? styles.selected : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="paymentStatus"
                                                        value="SUDAH_BAYAR"
                                                        checked={formData.paymentStatus === 'SUDAH_BAYAR'}
                                                        onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                                                    />
                                                    <span>Sudah Bayar</span>
                                                </label>
                                            </div>
                                        </div>

                                        {formData.paymentStatus === 'SUDAH_BAYAR' && (
                                            <div className="form-group">
                                                <label className="form-label">Metode Pembayaran</label>
                                                <select
                                                    className="form-input form-select"
                                                    value={formData.paymentMethod}
                                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                                >
                                                    <option value="TUNAI">Tunai</option>
                                                    <option value="TRANSFER">Transfer</option>
                                                    <option value="QRIS">QRIS</option>
                                                </select>
                                            </div>
                                        )}

                                        <div className="form-group">
                                            <label className="form-label">Catatan (opsional)</label>
                                            <textarea
                                                className="form-input"
                                                rows={2}
                                                placeholder="Catatan tambahan..."
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            ></textarea>
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn btn-secondary btn-lg w-full"
                                            disabled={submitting}
                                        >
                                            {submitting ? 'Memproses...' : '✅ Buat Order'}
                                        </button>
                                    </>
                                ) : (
                                    <div className={styles.emptyCart}>
                                        <span>🛒</span>
                                        <p>Keranjang kosong</p>
                                        <small>Pilih layanan untuk memulai</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
