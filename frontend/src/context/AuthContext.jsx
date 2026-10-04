import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/axios.js';
import { API_PATHS } from '../utils/apiPaths.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        api.get(API_PATHS.AUTH.ME)
            .then((res) => setUser(res.data))
            .catch(() => localStorage.removeItem('token'))
            .finally(() => setLoading(false));
    }, []);

    const login = async (emailOrCredentials, password) => {
        // Automatically handles whether you passed an object or two arguments
        const payload = 
            typeof emailOrCredentials === 'object' 
                ? emailOrCredentials 
                : { email: emailOrCredentials, password };

        try {
            const res = await api.post(API_PATHS.AUTH.LOGIN, payload);
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
            return res.data;
        } catch (error) {
            // This will print the backend's exact validation error message in your F12 console
            console.error("Backend validation error details:", error.response?.data);
            throw error;
        }
    };

    const register = async (payload) => {
        const res = await api.post(API_PATHS.AUTH.REGISTER, payload);
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);