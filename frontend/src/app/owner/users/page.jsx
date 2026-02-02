'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency, getRoleLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import styles from './users.module.css';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        email: '',
        role: 'KASIR',
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await api.getUsers();
            if (response.success) {
                setUsers(response.data);
            }
        } catch (error) {
            toast.error('Gagal memuat data pengguna');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                password: '',
                name: user.name || '',
                email: user.email || '',
                role: user.role,
            });
        } else {
            setEditingUser(null);
            setFormData({ username: '', password: '', name: '', email: '', role: 'KASIR' });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username || (!editingUser && !formData.password)) {
            toast.error('Username dan password harus diisi');
            return;
        }

        try {
            const submitData = { ...formData };
            if (!submitData.password) delete submitData.password;

            if (editingUser) {
                delete submitData.username;
                await api.updateUser(editingUser.id, submitData);
                toast.success('Pengguna berhasil diperbarui');
            } else {
                await api.createUser(submitData);
                toast.success('Pengguna berhasil ditambahkan');
            }
            closeModal();
            loadUsers();
        } catch (error) {
            toast.error(error.message || 'Gagal menyimpan pengguna');
        }
    };

    const handleToggleActive = async (user) => {
        try {
            await api.toggleUserActive(user.id);
            toast.success(`Pengguna ${user.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
            loadUsers();
        } catch (error) {
            toast.error(error.message || 'Gagal mengubah status pengguna');
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
                    <h1 className="page-title">Manajemen Pengguna</h1>
                    <button onClick={() => openModal()} className="btn btn-secondary">
                        ➕ Tambah Pengguna
                    </button>
                </div>

                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Nama</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className={!user.isActive ? styles.inactive : ''}>
                                        <td className="font-semibold">{user.username}</td>
                                        <td>{user.name || '-'}</td>
                                        <td>{user.email || '-'}</td>
                                        <td>
                                            <span className={`badge ${user.role === 'OWNER' ? 'badge-primary' : 'badge-secondary'}`}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                {user.isActive ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button onClick={() => openModal(user)} className="btn btn-ghost btn-sm">
                                                    ✏️
                                                </button>
                                                <button onClick={() => handleToggleActive(user)} className="btn btn-ghost btn-sm">
                                                    {user.isActive ? '🚫' : '✅'}
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
                                <h3 className="modal-title">{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</h3>
                                <button onClick={closeModal} className="modal-close">✕</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Username</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="username"
                                            disabled={!!editingUser}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Password {editingUser && '(kosongkan jika tidak diubah)'}</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder={editingUser ? '••••••' : 'password'}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Nama</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Nama lengkap"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Role</label>
                                            <select
                                                className="form-input form-select"
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            >
                                                <option value="KASIR">Kasir</option>
                                                <option value="OWNER">Owner</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email (opsional)</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={closeModal} className="btn btn-ghost">
                                        Batal
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingUser ? 'Simpan' : 'Tambah'}
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
