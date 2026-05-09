import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import api from '../services/api';

vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

const AuthProbe = () => {
    const auth = useAuth();

    return (
        <div>
            <div data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'null'}</div>
            <div data-testid="loading">{String(auth.loading)}</div>
            <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
            <div data-testid="admin">{String(auth.isAdmin)}</div>
            <div data-testid="inventory">{String(auth.canViewInventory)}</div>
            <div data-testid="lab">{String(auth.canViewLab)}</div>
            <div data-testid="approve">{String(auth.canApproveAppointments)}</div>
            <div data-testid="credentials">{String(auth.canManageCredentials)}</div>
            <div data-testid="hospital-create">{String(auth.canCreateHospitalRequest)}</div>
            <div data-testid="hospital-dispatch">{String(auth.canDispatchHospitalRequest)}</div>
            <div data-testid="emergency-dispatch">{String(auth.canDispatchEmergency)}</div>
            <button onClick={() => auth.login('991234567V', 'secret')}>login</button>
            <button
                onClick={() =>
                    auth.register({
                        fullName: 'Jane Doe',
                        nicNo: '991234567V',
                        phoneNumber: '0771234567',
                        password: 'Secret123!',
                        bloodType: 'A+',
                        province: 'Western',
                        district: 'Colombo',
                        nearestHospital: 'National Hospital'
                    })
                }
            >
                register
            </button>
            <button onClick={() => auth.logout()}>logout</button>
        </div>
    );
};

const renderAuth = () =>
    render(
        <AuthProvider>
            <AuthProbe />
        </AuthProvider>
    );

describe('AuthContext operations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('hydrates the authenticated user and exposes permission flags', async () => {
        api.get.mockResolvedValueOnce({
            data: {
                userId: 7,
                name: 'Admin User',
                nicNo: '900000000V',
                phoneNumber: '0710000000',
                role: 'ADMIN'
            }
        });

        renderAuth();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });

        expect(api.get).toHaveBeenCalledWith('/api/auth/me');
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('admin').textContent).toBe('true');
        expect(screen.getByTestId('inventory').textContent).toBe('true');
        expect(screen.getByTestId('lab').textContent).toBe('true');
        expect(screen.getByTestId('approve').textContent).toBe('true');
        expect(screen.getByTestId('credentials').textContent).toBe('true');
        expect(screen.getByTestId('hospital-create').textContent).toBe('true');
        expect(screen.getByTestId('hospital-dispatch').textContent).toBe('true');
        expect(screen.getByTestId('emergency-dispatch').textContent).toBe('true');
        expect(screen.getByTestId('user').textContent).toContain('"id":7');
        expect(screen.getByTestId('user').textContent).toContain('"userId":7');
    });

    it('clears the user when hydration fails and still renders children after loading', async () => {
        api.get.mockRejectedValueOnce(new Error('Unauthorized'));

        renderAuth();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });

        expect(screen.getByTestId('user').textContent).toBe('null');
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('inventory').textContent).toBe('false');
    });

    it('logs in with credentials and normalizes the returned user', async () => {
        api.get.mockRejectedValueOnce(new Error('No session'));
        api.post.mockResolvedValueOnce({
            data: {
                userId: 12,
                name: 'Lab User',
                nicNo: '881234567V',
                phoneNumber: '0781234567',
                role: 'LAB'
            }
        });

        renderAuth();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });

        fireEvent.click(screen.getByText('login'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
                nicNo: '991234567V',
                password: 'secret'
            });
        });

        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('inventory').textContent).toBe('true');
        expect(screen.getByTestId('lab').textContent).toBe('true');
        expect(screen.getByTestId('approve').textContent).toBe('false');
        expect(screen.getByTestId('user').textContent).toContain('"id":12');
        expect(screen.getByTestId('user').textContent).toContain('"role":"LAB"');
    });

    it('registers a donor, maps the request payload, and applies the default role', async () => {
        api.get.mockRejectedValueOnce(new Error('No session'));
        api.post.mockResolvedValueOnce({
            data: {
                userId: 22,
                name: 'Jane Doe',
                nicNo: '991234567V',
                phoneNumber: '0771234567'
            }
        });

        renderAuth();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });

        fireEvent.click(screen.getByText('register'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/api/auth/register', {
                fullName: 'Jane Doe',
                nicNo: '991234567V',
                phoneNumber: '0771234567',
                password: 'Secret123!',
                bloodType: 'A+'
            });
        });

        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('user').textContent).toContain('"role":"DONOR"');
        expect(screen.getByTestId('user').textContent).toContain('"province":"Western"');
        expect(screen.getByTestId('user').textContent).toContain('"district":"Colombo"');
        expect(screen.getByTestId('user').textContent).toContain('"nearestHospital":"National Hospital"');
    });

    it('logs out and clears local auth state even if the API call fails', async () => {
        api.get.mockResolvedValueOnce({
            data: {
                userId: 30,
                name: 'Hospital User',
                nicNo: '901234567V',
                phoneNumber: '0751234567',
                role: 'HOSPITAL'
            }
        });
        api.post.mockRejectedValueOnce(new Error('Logout failed'));

        renderAuth();

        await waitFor(() => {
            expect(screen.getByTestId('authenticated').textContent).toBe('true');
        });

        fireEvent.click(screen.getByText('logout'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/api/auth/logout');
        });

        expect(screen.getByTestId('user').textContent).toBe('null');
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('approve').textContent).toBe('false');
    });

    it('throws when useAuth is used outside AuthProvider', () => {
        const OutsideConsumer = () => {
            useAuth();
            return null;
        };

        expect(() => render(<OutsideConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    });
});
