'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency, getServiceTypeLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import styles from './layanan.module.css';

export default function LayananPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'KILOAN',
        price: '',
        estimatedTime: 24,
    });

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            const response = await api.getServices(true);
            if (response.success) {
                setServices(response.data);
            }
        } catch (error) {
            toast.error('Gagal memuat layanan');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (service = null) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                type: service.type,
                price: service.price,
                estimatedTime: service.estimatedTime,
            });
        } else {
            setEditingService(null);
            setFormData({ name: '', type: 'KILOAN', price: '', estimatedTime: 24 });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingService(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price) {
            toast.error('Nama dan harga harus diisi');
            return;
        }

        try {
            if (editingService) {
                await api.updateService(editingService.id, formData);
                toast.success('Layanan berhasil diperbarui');
            } else {
                await api.createService(formData);
                toast.success('Layanan berhasil ditambahkan');
            }
            closeModal();
            loadServices();
        } catch (error) {
            toast.error(error.message || 'Gagal menyimpan layanan');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus layanan ini?')) return;

        try {
            await api.deleteService(id);
            toast.success('Layanan berhasil dihapus');
            loadServices();
        } catch (error) {
            toast.error(error.message || 'Gagal menghapus layanan');
        }
    };

    const handleToggleActive = async (service) => {
        try {
            await api.updateService(service.id, { isActive: !service.isActive });
            toast.success(`Layanan ${service.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
            loadServices();
        } catch (error) {
            toast.error('Gagal mengubah status layanan');
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
                    <h1 className="page-title">Manajemen Layanan</h1>
                    <button onClick={() => openModal()} className="btn btn-secondary">
                        ➕ Tambah Layanan
                    </button>
                </div>

                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nama Layanan</th>
                                    <th>Jenis</th>
                                    <th>Harga</th>
                                    <th>Estimasi</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((service) => (
                                    <tr key={service.id} className={!service.isActive ? styles.inactive : ''}>
                                        <td className="font-semibold">{service.name}</td>
                                        <td>
                                            <span className={`badge ${service.type === 'KILOAN' ? 'badge-primary' : 'badge-secondary'}`}>
                                                {getServiceTypeLabel(service.type)}
                                            </span>
                                        </td>
                                        <td>{formatCurrency(service.price)}{service.type === 'KILOAN' ? '/kg' : '/pcs'}</td>
                                        <td>{service.estimatedTime} jam</td>
                                        <td>
                                            <span className={`badge ${service.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                {service.isActive ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button onClick={() => openModal(service)} className="btn btn-ghost btn-sm">
                                                    ✏️
                                                </button>
                                                <button onClick={() => handleToggleActive(service)} className="btn btn-ghost btn-sm">
                                                    {service.isActive ? '🚫' : '✅'}
                                                </button>
                                                <button onClick={() => handleDelete(service.id)} className="btn btn-ghost btn-sm text-danger">
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">{editingService ? 'Edit Layanan' : 'Tambah Layanan'}</h3>
                                <button onClick={closeModal} className="modal-close">✕</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Nama Layanan</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Contoh: Cuci Kering Lipat"
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Jenis</label>
                                            <select
                                                className="form-input form-select"
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            >
                                                <option value="KILOAN">Kiloan</option>
                                                <option value="SATUAN">Satuan</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Harga (Rp)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                placeholder="10000"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Estimasi Pengerjaan (jam)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.estimatedTime}
                                            onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) })}
                                            placeholder="24"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={closeModal} className="btn btn-ghost">
                                        Batal
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingService ? 'Simpan' : 'Tambah'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
