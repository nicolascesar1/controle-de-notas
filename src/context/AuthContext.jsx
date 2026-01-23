import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('finance_app_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        // Mock Login Logic
        // In the future, this will be replaced by Firebase Auth
        if (email === 'admin@admin.com' && password === 'admin') {
            const userData = {
                uid: '12345',
                email: email,
                name: 'Administrador'
            };
            setUser(userData);
            localStorage.setItem('finance_app_user', JSON.stringify(userData));
            return { success: true };
        } else {
            return { success: false, error: 'Credenciais inválidas. Use admin@admin.com / admin' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('finance_app_user');
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
