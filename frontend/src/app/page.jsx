'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        const token = api.getToken();
        const user = api.getUser();

        if (token && user) {
            router.push(user.role === 'OWNER' ? '/owner' : '/kasir');
        } else {
            router.push('/login');
        }
    }, [router]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg)'
        }}>
            <div className="spinner spinner-lg"></div>
        </div>
    );
}
