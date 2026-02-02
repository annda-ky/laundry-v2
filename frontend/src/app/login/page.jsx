'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import styles from './login.module.css';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check if already logged in
        const token = api.getToken();
        const user = api.getUser();
        if (token && user) {
            router.push(user.role === 'OWNER' ? '/owner' : '/kasir');
        }
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error('Username dan password harus diisi');
            return;
        }

        setLoading(true);
        try {
            const response = await api.login(username, password);
            if (response.success) {
                toast.success('Login berhasil!');
                const redirectPath = response.data.user.role === 'OWNER' ? '/owner' : '/kasir';
                router.push(redirectPath);
            }
        } catch (error) {
            toast.error(error.message || 'Login gagal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.background}>
                <div className={styles.shape1}></div>
                <div className={styles.shape2}></div>
                <div className={styles.shape3}></div>
            </div>

            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logo}>🧺</div>
                    <h1 className={styles.title}>LaundryKu</h1>
                    <p className={styles.subtitle}>Sistem Manajemen Laundry</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.input}
                            placeholder="Masukkan username"
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="Masukkan password"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Memproses...
                            </>
                        ) : (
                            'Masuk'
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>© 2026 LaundryKu. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
