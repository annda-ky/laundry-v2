const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE;
    }

    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    }

    setToken(token) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
        }
    }

    removeToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }

    getUser() {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        }
        return null;
    }

    setUser(user) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    this.removeToken();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                }
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Auth methods
    async login(username, password) {
        const response = await this.post('/api/auth/login', { username, password });
        if (response.success) {
            this.setToken(response.data.token);
            this.setUser(response.data.user);
        }
        return response;
    }

    async logout() {
        try {
            await this.post('/api/auth/logout', {});
        } catch (e) {
            // Ignore logout errors
        }
        this.removeToken();
    }

    async me() {
        return this.get('/api/auth/me');
    }

    // Users
    getUsers() { return this.get('/api/users'); }
    createUser(data) { return this.post('/api/users', data); }
    updateUser(id, data) { return this.put(`/api/users/${id}`, data); }
    toggleUserActive(id) { return this.patch(`/api/users/${id}/toggle-active`); }
    deleteUser(id) { return this.delete(`/api/users/${id}`); }

    // Services
    getServices(includeInactive = false) {
        return this.get(`/api/services${includeInactive ? '?includeInactive=true' : ''}`);
    }
    getService(id) { return this.get(`/api/services/${id}`); }
    createService(data) { return this.post('/api/services', data); }
    updateService(id, data) { return this.put(`/api/services/${id}`, data); }
    deleteService(id) { return this.delete(`/api/services/${id}`); }

    // Customers
    getCustomers(search = '') {
        return this.get(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    }
    getCustomer(id) { return this.get(`/api/customers/${id}`); }
    createCustomer(data) { return this.post('/api/customers', data); }
    updateCustomer(id, data) { return this.put(`/api/customers/${id}`, data); }

    // Orders
    getOrders(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/api/orders${query ? `?${query}` : ''}`);
    }
    getOrder(id) { return this.get(`/api/orders/${id}`); }
    createOrder(data) { return this.post('/api/orders', data); }
    updateOrderStatus(id, status) { return this.put(`/api/orders/${id}/status`, { status }); }
    updatePayment(id, data) { return this.put(`/api/orders/${id}/payment`, data); }
    getReceipt(id) { return this.get(`/api/orders/${id}/receipt`); }

    // Dashboard
    getOwnerDashboard() { return this.get('/api/dashboard/owner'); }
    getKasirDashboard() { return this.get('/api/dashboard/kasir'); }

    // Reports
    getDailyReport(date) {
        return this.get(`/api/reports/daily${date ? `?date=${date}` : ''}`);
    }
    getMonthlyReport(month, year) {
        return this.get(`/api/reports/monthly?month=${month}&year=${year}`);
    }
    getYearlyReport(year) {
        return this.get(`/api/reports/yearly?year=${year}`);
    }
    getCustomReport(startDate, endDate) {
        return this.get(`/api/reports/custom?startDate=${startDate}&endDate=${endDate}`);
    }
    exportExcel(type, startDate, endDate) {
        const token = this.getToken();
        const params = new URLSearchParams({ type });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        window.open(`${this.baseUrl}/api/reports/export/excel?${params}&token=${token}`, '_blank');
    }
    exportPdf(type, startDate, endDate) {
        const token = this.getToken();
        const params = new URLSearchParams({ type });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        window.open(`${this.baseUrl}/api/reports/export/pdf?${params}&token=${token}`, '_blank');
    }

    // Settings
    getSettings() { return this.get('/api/settings'); }
    updateSettings(data) { return this.put('/api/settings', data); }
}

export const api = new ApiClient();
export default api;
