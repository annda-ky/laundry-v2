'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import styles from './Sidebar.module.css';

const ownerMenuItems = [
    { path: '/owner', label: 'Dashboard', icon: '📊' },
    { path: '/owner/layanan', label: 'Layanan', icon: '🧺' },
    { path: '/owner/laporan', label: 'Laporan', icon: '📈' },
    { path: '/owner/users', label: 'Users', icon: '👥' },
    { path: '/owner/pengaturan', label: 'Pengaturan', icon: '⚙️' },
];

const kasirMenuItems = [
    { path: '/kasir', label: 'Dashboard', icon: '📊' },
    { path: '/kasir/order', label: 'Daftar Order', icon: '📋' },
    { path: '/kasir/order/new', label: 'Order Baru', icon: '➕' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const menuItems = user?.role === 'OWNER' ? ownerMenuItems : kasirMenuItems;

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <span className={styles.logoIcon}>🧺</span>
                <span className={styles.logoText}>LaundryKu</span>
            </div>

            <nav className={styles.nav}>
                <div className={styles.navSection}>
                    <span className={styles.navLabel}>Menu</span>
                    <ul className={styles.navList}>
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    href={item.path}
                                    className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
                                >
                                    <span className={styles.navIcon}>{item.icon}</span>
                                    <span className={styles.navText}>{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            <div className={styles.footer}>
                <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                        {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </div>
                    <div className={styles.userDetails}>
                        <span className={styles.userName}>{user?.name || user?.username}</span>
                        <span className={styles.userRole}>{user?.role}</span>
                    </div>
                </div>
                <button onClick={logout} className={styles.logoutBtn}>
                    🚪 Logout
                </button>
            </div>
        </aside>
    );
}
