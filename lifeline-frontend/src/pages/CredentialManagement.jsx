import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import credentialBackground from '../assets/Credential.jpg';

const roles = ['DONOR', 'HOSPITAL', 'LAB', 'ADMIN'];

const CredentialManagement = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingId, setSavingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formError, setFormError] = useState('');
    const [newUser, setNewUser] = useState({
        name: '',
        nicNo: '',
        phoneNumber: '',
        password: '',
        role: 'HOSPITAL'
    });

    // Load the current user list so admins can manage staff accounts in one place.
    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('http://localhost:8080/api/admin/users', {
                params: { actingUserId: user?.id }
            });
            setUsers(res.data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load users.');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [user?.id]);

    // Create a new staff account and refresh the table after a successful save.
    const createUser = async (e) => {
        e.preventDefault();
        if (!newUser.name.trim() || !newUser.nicNo.trim() || !newUser.phoneNumber.trim() || !newUser.password.trim()) {
            setFormError('Name, NIC No, phone number, and password are required.');
            return;
        }

        try {
            setFormError('');
            await axios.post('http://localhost:8080/api/admin/users', {
                actingUserId: user?.id,
                ...newUser
            });
            setNewUser({ name: '', nicNo: '', phoneNumber: '', password: '', role: 'HOSPITAL' });
            fetchUsers();
        } catch (err) {
            console.error(err);
            setFormError(typeof err?.response?.data === 'string' ? err.response.data : 'Failed to create user.');
        }
    };

    // Persist role changes for a single user while showing row-level save feedback.
    const updateRole = async (targetUserId, role) => {
        setSavingId(targetUserId);
        try {
            await axios.put(`http://localhost:8080/api/admin/users/${targetUserId}/role`, {
                actingUserId: user?.id,
                role
            });
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert(typeof err?.response?.data === 'string' ? err.response.data : 'Failed to update role.');
        } finally {
            setSavingId(null);
        }
    };

    // Keep the search responsive by deriving the visible rows from the latest query.
    const filteredUsers = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) {
            return users;
        }

        return users.filter(entry => (
            String(entry.name || '').toLowerCase().includes(query) ||
            String(entry.nicNo || '').toLowerCase().includes(query) ||
            String(entry.phoneNumber || '').toLowerCase().includes(query) ||
            String(entry.role || '').toLowerCase().includes(query)
        ));
    }, [users, searchTerm]);

    return (
        <div style={{ minHeight: '100vh', width: '100%', position: 'relative', backgroundColor: '#F0F4FF' }}>
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: `linear-gradient(rgba(240, 244, 255, 0.72), rgba(255, 228, 230, 0.72)), url(${credentialBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />
        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '2rem 1rem' }}>
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>Credential Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Assign and control platform roles</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-primary" onClick={fetchUsers}>Refresh</button>
                    <button className="btn" style={{ border: '1px solid #E2E8F0' }} onClick={() => navigate(-1)}>Back</button>
                </div>
            </header>

            <form className="glass-panel" style={{ padding: '1.2rem', marginBottom: '1.25rem' }} onSubmit={createUser}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.8rem' }}>Create Staff Account</h2>
                {formError && <div style={{ color: '#B91C1C', marginBottom: '0.8rem' }}>{formError}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.7rem' }}>
                    <input className="input-field" placeholder="Name" value={newUser.name} onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))} required />
                    <input className="input-field" placeholder="NIC No" value={newUser.nicNo} onChange={(e) => setNewUser(prev => ({ ...prev, nicNo: e.target.value }))} required />
                    <input className="input-field" placeholder="Phone Number" value={newUser.phoneNumber} onChange={(e) => setNewUser(prev => ({ ...prev, phoneNumber: e.target.value }))} required />
                    <input className="input-field" placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))} required />
                    <select className="input-field" value={newUser.role} onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}>
                        {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>Create User</button>
            </form>

            <div className="glass-panel" style={{ padding: '1.2rem' }}>
                <input
                    type="text"
                    placeholder="Search by name, NIC No, phone number, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '1rem 1.1rem',
                        borderRadius: '14px',
                        border: '1px solid rgba(148, 163, 184, 0.35)',
                        background: 'rgba(255,255,255,0.92)',
                        fontSize: '1rem',
                        marginBottom: '0.9rem',
                        outline: 'none'
                    }}
                />

                {loading && <div style={{ color: 'var(--text-muted)' }}>Loading users...</div>}
                {!loading && error && <div style={{ color: '#B91C1C' }}>{error}</div>}
                {!loading && !error && users.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No users found.</div>}
                {!loading && !error && users.length > 0 && (
                    <>
                        <div style={{ color: '#64748B', marginBottom: '0.8rem' }}>{filteredUsers.length} users found</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <th style={{ textAlign: 'left', padding: '0.6rem' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '0.6rem' }}>NIC No</th>
                                <th style={{ textAlign: 'left', padding: '0.6rem' }}>Phone Number</th>
                                <th style={{ textAlign: 'left', padding: '0.6rem' }}>Role</th>
                                <th style={{ textAlign: 'left', padding: '0.6rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((entry) => (
                                <tr key={entry.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '0.6rem' }}>{entry.name}</td>
                                    <td style={{ padding: '0.6rem' }}>{entry.nicNo}</td>
                                    <td style={{ padding: '0.6rem' }}>{entry.phoneNumber}</td>
                                    <td style={{ padding: '0.6rem' }}>
                                        <select
                                            className="input-field"
                                            value={entry.role}
                                            onChange={(e) => {
                                                const role = e.target.value;
                                                setUsers(prev => prev.map(u => (u.id === entry.id ? { ...u, role } : u)));
                                            }}
                                        >
                                            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                                        </select>
                                    </td>
                                    <td style={{ padding: '0.6rem' }}>
                                        <button
                                            className="btn btn-primary"
                                            disabled={savingId === entry.id}
                                            onClick={() => updateRole(entry.id, entry.role)}
                                        >
                                            {savingId === entry.id ? 'Saving...' : 'Save Role'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </>
                )}
                {!loading && !error && users.length > 0 && filteredUsers.length === 0 && (
                    <div style={{ color: 'var(--text-muted)' }}>No users match your search.</div>
                )}
            </div>
        </div>
        </div>
    );
};

export default CredentialManagement;
