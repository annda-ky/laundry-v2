export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatDate = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(date));
};

export const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
};

export const formatTime = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
};

export const formatShortDate = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(date));
};

export const getStatusLabel = (status) => {
    const labels = {
        DITERIMA: 'Diterima',
        DICUCI: 'Dicuci',
        DIKERINGKAN: 'Dikeringkan',
        DISETRIKA: 'Disetrika',
        SELESAI: 'Selesai',
        DIAMBIL: 'Diambil',
        DIBATALKAN: 'Dibatalkan',
    };
    return labels[status] || status;
};

export const getStatusClass = (status) => {
    return `status-${status.toLowerCase()}`;
};

export const getPaymentStatusLabel = (status) => {
    return status === 'SUDAH_BAYAR' ? 'Lunas' : 'Belum Bayar';
};

export const getServiceTypeLabel = (type) => {
    return type === 'KILOAN' ? 'Kiloan' : 'Satuan';
};

export const getPaymentMethodLabel = (method) => {
    const labels = {
        TUNAI: 'Tunai',
        TRANSFER: 'Transfer',
        QRIS: 'QRIS',
    };
    return labels[method] || method;
};

export const getRoleLabel = (role) => {
    return role === 'OWNER' ? 'Owner' : 'Kasir';
};

export const cn = (...classes) => {
    return classes.filter(Boolean).join(' ');
};
