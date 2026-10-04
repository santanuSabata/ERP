import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    
    // 🔍 ADD THIS LOG TO VERIFY TOKEN
    //console.log('🔑 [Axios Interceptor] Token found in localStorage:', token ? 'YES (Length: ' + token.length + ')' : 'NO TOKEN FOUND');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    //console.log('📤 [Axios Interceptor] Outgoing request headers:', config.headers);
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && window.location.pathname !== '/login') {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;