import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'LaundryKu - Sistem Manajemen Laundry',
    description: 'Sistem Informasi Manajemen Laundry Profesional untuk UMKM',
};

export default function RootLayout({ children }) {
    return (
        <html lang="id">
            <body className={inter.className}>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1e3a5f',
                            color: '#fff',
                            borderRadius: '10px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#27ae60',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#e74c3c',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}
