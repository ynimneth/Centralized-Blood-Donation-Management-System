import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import {
    canApproveAppointments,
    canCreateHospitalRequest,
    canDispatchHospitalRequest,
    canDispatchEmergency,
    canManageCredentials,
    canViewInventory,
    canViewLab
} from '../constants/permissions';

const AuthContext = createContext(null);

const normalizeUser = (payload) => {
    if (!payload) return null;

    const resolvedId = payload.id ?? payload.userId ?? null;
    return {
        ...payload,
        id: resolvedId,
        userId: resolvedId
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const hydrateAuth = async () => {
            try {
                const response = await api.get('/api/auth/me');
                setUser(normalizeUser(response?.data));
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        hydrateAuth();
    }, []);

    const login = async (nicNo, password) => {
        const response = await api.post('/api/auth/login', { nicNo, password });
        const payload = response?.data || {};

        const userData = normalizeUser({
            userId: payload.userId,
            name: payload.name,
            nicNo: payload.nicNo,
            phoneNumber: payload.phoneNumber,
            role: payload.role
        });

        setUser(userData);
        return userData;
    };

    const register = async (data) => {
        const response = await api.post('/api/auth/register', {
            fullName: data.fullName,
            nicNo: data.nicNo,
            phoneNumber: data.phoneNumber,
            password: data.password,
            bloodType: data.bloodType
        });
        const payload = response?.data || {};

        const newUser = normalizeUser({
            userId: payload.userId,
            name: payload.name,
            nicNo: payload.nicNo,
            phoneNumber: payload.phoneNumber,
            role: payload.role || 'DONOR',
            province: data.province,
            district: data.district,
            nearestHospital: data.nearestHospital
        });
        setUser(newUser);
        return newUser;
    };

    const logout = async () => {
        try {
            await api.post('/api/auth/logout');
        } catch {
            // Even if backend logout fails, clear local auth state.
        } finally {
            setUser(null);
        }
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        canViewInventory: canViewInventory(user?.role),
        canViewLab: canViewLab(user?.role),
        canApproveAppointments: canApproveAppointments(user?.role),
        canManageCredentials: canManageCredentials(user?.role),
        canCreateHospitalRequest: canCreateHospitalRequest(user?.role),
        canDispatchHospitalRequest: canDispatchHospitalRequest(user?.role),
        canDispatchEmergency: canDispatchEmergency(user?.role)
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
