import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import loginBackground from '../assets/loginpage.png';
import donorBackground from '../assets/donorportal.jpg';
import emergencyBackground from '../assets/emergency.jpg';
import campBackground from '../assets/camps.jpg';
import hospitalBackground from '../assets/hospitals.jpg';

const Dashboard = () => {
    const navigate = useNavigate();
    const {
        user,
        canViewInventory,
        canViewLab,
        canCreateHospitalRequest,
        canManageCredentials
    } = useAuth();
    const [recentActivity, setRecentActivity] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [activityLoading, setActivityLoading] = useState(true);
    const [inventoryLoading, setInventoryLoading] = useState(true);
    const [activityError, setActivityError] = useState(false);
    const [inventoryError, setInventoryError] = useState(false);

    const modules = [
        ...(canViewInventory ? [{ title: 'Inventory Command', desc: 'Monitor stock, queues, and dispatch readiness.', path: '/inventory', color: '#DC2626', icon: '🩸' }] : []),
        ...(canViewLab ? [{ title: 'Lab Screening', desc: 'Process test results before units enter inventory.', path: '/lab', color: '#2563EB', icon: '🧪' }] : []),
        ...(canCreateHospitalRequest ? [{ title: 'Hospital Requests', desc: 'Create and track routine or emergency demand.', path: '/emergency', color: '#7C3AED', icon: '🏥' }] : []),
        ...(canCreateHospitalRequest || canManageCredentials ? [{ title: 'Transport Control', desc: 'Manage vehicles, delivery routing, and transport visibility.', path: '/transport', color: '#2563EB', icon: '🚑' }] : []),
        ...(canManageCredentials ? [{ title: 'Staff Access', desc: 'Manage users, permissions, and account roles.', path: '/credentials', color: '#0F766E', icon: '🛡️' }] : []),
        ...(canManageCredentials ? [{ title: 'Hospitals', desc: 'Maintain partner hospitals and service coverage.', path: '/hospitals', color: '#0EA5E9', icon: '🏨' }] : []),
        { title: 'Donor Network', desc: 'Track donors, safety history, and registrations.', path: '/donors', color: '#10B981', icon: '💚' },
        { title: 'Bookings', desc: 'Handle appointments, approvals, and completions.', path: '/appointments', color: '#F59E0B', icon: '📅' },
        { title: 'Donation Camps', desc: 'Review mobile campaigns and upcoming community drives.', path: '/camps', color: '#EC4899', icon: '📍' }
    ];

    const quickActions = [
        { label: 'Book Donation', helper: 'Create a new donor booking', path: '/appointments/book', show: true, tone: '#DC2626' },
        { label: 'Open Alerts', helper: 'See inventory and emergency alerts', path: canViewInventory ? '/inventory' : '/emergency/alerts', show: true, tone: '#7C3AED' },
        { label: 'Browse Camps', helper: 'Explore nearby donation campaigns', path: '/camps', show: true, tone: '#0EA5E9' },
        { label: 'Create Request', helper: 'Submit a hospital blood request', path: '/emergency', show: canCreateHospitalRequest, tone: '#10B981' }
    ].filter(action => action.show);

    const showcasePanels = [
        {
            title: 'Donor Journey',
            subtitle: 'Eligibility checks, bookings, and donor engagement in one flow.',
            image: donorBackground,
            path: '/appointments',
            tone: '#DC2626'
        },
        {
            title: 'Emergency Coordination',
            subtitle: 'Respond faster to hospital demand and urgent blood shortages.',
            image: emergencyBackground,
            path: canCreateHospitalRequest ? '/emergency' : '/emergency/alerts',
            tone: '#7C3AED'
        },
        {
            title: 'Community Campaigns',
            subtitle: 'Grow supply through mobile camps and regional donor outreach.',
            image: campBackground,
            path: '/camps',
            tone: '#0EA5E9'
        }
    ];

    useEffect(() => {
        setActivityLoading(true);
        axios.get('http://localhost:8080/api/activity/recent')
            .then(res => {
                setRecentActivity(res.data || []);
                setActivityLoading(false);
            })
            .catch(err => {
                console.error('Error fetching recent activity', err);
                setActivityError(true);
                setActivityLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!canViewInventory) {
            setInventoryLoading(false);
            return;
        }

        setInventoryLoading(true);
        axios.get('http://localhost:8080/api/inventory')
            .then(res => {
                setInventory(res.data || []);
                setInventoryLoading(false);
            })
            .catch(err => {
                console.error('Error fetching inventory', err);
                setInventoryError(true);
                setInventoryLoading(false);
            });
    }, [canViewInventory]);

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return 'Just now';
        const diffMs = Date.now() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} mins ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hrs ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days ago`;
    };

    const emergencyAlerts = useMemo(() => {
        return recentActivity.filter(item => {
            const type = (item.activityType || '').toUpperCase();
            const desc = (item.description || '').toLowerCase();
            return type.includes('EMERGENCY') || desc.includes('emergency');
        });
    }, [recentActivity]);

    const liveInventoryStats = useMemo(() => {
        let safeUnits = 0;
        let pendingLab = 0;
        let discards = 0;
        const bloodTypeTotals = {};
        const criticalItems = [];

        inventory.forEach(item => {
            const quantity = Number(item.quantity || 0);
            const testStatus = String(item.testStatus || '').toUpperCase();
            const safetyFlag = String(item.safetyFlag || '').toUpperCase();
            const status = String(item.status || '').toUpperCase();
            const bloodType = item.bloodType || 'Unknown';

            if (testStatus === 'PENDING') {
                pendingLab += 1;
            }

            if (safetyFlag === 'BIO-HAZARD' || status === 'DISCARD') {
                discards += quantity || 1;
            }

            if (safetyFlag === 'SAFE' || status === 'SAFE' || status === 'AVAILABLE') {
                safeUnits += quantity;
                bloodTypeTotals[bloodType] = (bloodTypeTotals[bloodType] || 0) + quantity;
            }

            if ((quantity > 0 && quantity <= 2) || status.includes('CRITICAL') || status.includes('LOW')) {
                criticalItems.push(item);
            }
        });

        const lowestBloodTypes = Object.entries(bloodTypeTotals)
            .sort((a, b) => a[1] - b[1])
            .slice(0, 4)
            .map(([bloodType, units]) => ({ bloodType, units }));

        return {
            safeUnits,
            pendingLab,
            discards,
            criticalItems,
            lowestBloodTypes
        };
    }, [inventory]);

    const statCards = [
        {
            title: 'Emergency Alerts',
            value: emergencyAlerts.length,
            helper: emergencyAlerts.length > 0 ? 'Requires immediate coordination' : 'No active escalations',
            accent: '#DC2626'
        },
        {
            title: 'Recent Events',
            value: recentActivity.length,
            helper: 'Latest operational updates',
            accent: '#2563EB'
        },
        {
            title: 'Safe Units',
            value: canViewInventory ? liveInventoryStats.safeUnits : '--',
            helper: canViewInventory ? 'Available for dispatch' : 'Visible to inventory team',
            accent: '#10B981'
        },
        {
            title: 'Pending Lab',
            value: canViewInventory ? liveInventoryStats.pendingLab : '--',
            helper: canViewInventory ? 'Bags waiting for screening' : 'Visible to inventory team',
            accent: '#F59E0B'
        }
    ];

    const showOperationalStats = user?.role === 'ADMIN';

    const systemMessage = canViewInventory
        ? (inventoryLoading
            ? 'Syncing inventory signals from the blood bank...'
            : `${liveInventoryStats.criticalItems.length} stock alerts and ${emergencyAlerts.length} emergency events in view.`)
        : `${emergencyAlerts.length} emergency events tracked from recent activity.`;

    return (
        <div style={{ minHeight: '100vh', width: '100%', position: 'relative', backgroundColor: '#F6F7FB' }}>
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: `linear-gradient(rgba(247, 248, 252, 0.84), rgba(255, 238, 242, 0.78)), url(${loginBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />
            <div className="container" style={{ position: 'relative', zIndex: 1, padding: '2rem 1rem 3rem' }}>
                <section
                    className="glass-panel"
                    style={{
                        padding: '2rem',
                        marginBottom: '1.75rem',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,247,248,0.88) 100%)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div style={{ maxWidth: '760px' }}>
                            <div style={{ display: 'inline-flex', padding: '0.55rem 0.95rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.9)', color: '#475569', fontWeight: '700', marginBottom: '1rem' }}>
                                LIVE OPERATIONS
                            </div>
                            <h1 style={{ fontSize: '3.9rem', lineHeight: 1.02, marginBottom: '0.9rem', color: '#0F172A' }}>
                                LifeLine
                            </h1>    
                            <h3>    
                                (Centralized Blood Donation & Management System)
                            </h3>
                                <br />
                            <p style={{ color: '#526581', fontSize: '1.14rem', maxWidth: '680px', marginBottom: '1.25rem' }}>
                                Monitor stock readiness, screening flow, hospital demand, donor activity, and urgent blood alerts from one operational dashboard.
                            </p>
                            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={() => navigate(canViewInventory ? '/inventory' : '/appointments')}
                                    style={{
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #E11D48 0%, #D90429 100%)',
                                        color: 'white',
                                        borderRadius: '18px',
                                        padding: '1rem 1.35rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        boxShadow: '0 12px 24px rgba(217, 4, 41, 0.2)'
                                    }}
                                >
                                    Open Operations
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/appointments')}
                                    style={{
                                        border: '1px solid rgba(148, 163, 184, 0.25)',
                                        background: 'rgba(255,255,255,0.88)',
                                        color: '#0F172A',
                                        borderRadius: '18px',
                                        padding: '1rem 1.35rem',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Review Bookings
                                </button>
                            </div>
                        </div>

                        <div style={{ minWidth: '300px', flex: '1 1 320px', maxWidth: '380px', display: 'grid', gap: '1rem' }}>
                            <div
                                className="glass-panel"
                                style={{
                                    padding: '1.25rem',
                                    minHeight: '220px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    color: 'white',
                                    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.42), rgba(15, 23, 42, 0.68)), url(${hospitalBackground})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            >
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(255,255,255,0.18)', color: 'white', borderRadius: '9999px', padding: '0.35rem 0.7rem', fontSize: '0.82rem', fontWeight: '700', width: 'fit-content' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                                    LifeLine
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem' }}>Centralized Blood Donation & Management System</div>
                                    <div style={{ fontSize: '0.95rem', lineHeight: 1.5, opacity: 0.94 }}>
                                        A unified control point for donors, labs, hospital requests, camps, and blood stock visibility.
                                    </div>
                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.84)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <div style={{ fontWeight: '800', color: '#0F172A' }}>System Overview</div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#ECFDF5', color: '#047857', borderRadius: '9999px', padding: '0.35rem 0.7rem', fontSize: '0.82rem', fontWeight: '700' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                                        Operational
                                    </div>
                                </div>
                                <div style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '0.9rem' }}>
                                    {systemMessage}
                                </div>
                                <div style={{ display: 'grid', gap: '0.65rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1E293B' }}>
                                        <span>Signed in as</span>
                                        <strong>{user?.role || 'USER'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1E293B' }}>
                                        <span>Operator</span>
                                        <strong>{user?.name || 'LifeLine User'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1E293B' }}>
                                        <span>Recent activity</span>
                                        <strong>{activityLoading ? '...' : `${recentActivity.length} items`}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {showOperationalStats && (
                    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                        {statCards.map(card => (
                            <div key={card.title} className="glass-panel" style={{ padding: '1.35rem', background: 'rgba(255,255,255,0.88)' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: card.accent, marginBottom: '1rem' }} />
                                <div style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '0.45rem' }}>{card.title}</div>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.35rem' }}>{card.value}</div>
                                <div style={{ color: '#64748B', fontSize: '0.9rem' }}>{card.helper}</div>
                            </div>
                        ))}
                    </section>
                )}

                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                    {showcasePanels.map(panel => (
                        <button
                            key={panel.title}
                            type="button"
                            onClick={() => navigate(panel.path)}
                            className="glass-panel"
                            style={{
                                minHeight: '230px',
                                padding: '1.35rem',
                                border: '1px solid rgba(255,255,255,0.5)',
                                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0.64)), url(${panel.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                color: 'white',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                textAlign: 'left',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'inline-flex', width: 'fit-content', padding: '0.35rem 0.7rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.18)', fontWeight: '700', fontSize: '0.82rem' }}>
                                LifeLine
                            </div>
                            <div>
                                <div style={{ fontSize: '1.45rem', fontWeight: '800', marginBottom: '0.45rem' }}>{panel.title}</div>
                                <div style={{ fontSize: '0.95rem', lineHeight: 1.5, opacity: 0.95 }}>{panel.subtitle}</div>
                            </div>
                        </button>
                    ))}
                </section>

                <section style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.9)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>Operational Areas</h2>
                                <p style={{ color: '#64748B' }}>Move between the parts of the platform used most during daily blood-bank operations.</p>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                            {modules.map(mod => (
                                <button
                                    key={mod.title}
                                    type="button"
                                    onClick={() => navigate(mod.path)}
                                    className="glass-panel"
                                    style={{
                                        padding: '1.2rem',
                                        textAlign: 'left',
                                        border: '1px solid rgba(255,255,255,0.65)',
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(250,250,252,0.86) 100%)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '16px',
                                        background: `${mod.color}15`,
                                        color: mod.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.45rem',
                                        marginBottom: '0.95rem'
                                    }}>
                                        {mod.icon}
                                    </div>
                                    <div style={{ fontWeight: '800', color: '#0F172A', marginBottom: '0.4rem' }}>{mod.title}</div>
                                    <div style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.45 }}>{mod.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.9)' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>Quick Workflow</h2>
                        <p style={{ color: '#64748B', marginBottom: '1rem' }}>Common actions for live donor, hospital, and operations work.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {quickActions.map(action => (
                                <button
                                    key={action.label}
                                    type="button"
                                    onClick={() => navigate(action.path)}
                                    style={{
                                        border: '1px solid rgba(148, 163, 184, 0.16)',
                                        background: 'rgba(255,255,255,0.94)',
                                        borderRadius: '18px',
                                        padding: '1rem 1.1rem',
                                        textAlign: 'left',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ fontWeight: '800', color: '#0F172A', marginBottom: '0.25rem' }}>{action.label}</div>
                                    <div style={{ color: '#64748B', fontSize: '0.9rem' }}>{action.helper}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.9)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>Recent Activity Feed</h2>
                                <p style={{ color: '#64748B' }}>Latest actions from donation, screening, and request handling.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/appointments')}
                                style={{
                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                    background: 'rgba(255,255,255,0.9)',
                                    color: '#0F172A',
                                    borderRadius: '14px',
                                    padding: '0.75rem 1rem',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Open Booking Board
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {activityLoading && <div style={{ color: '#64748B' }}>Loading activity...</div>}
                            {!activityLoading && activityError && <div style={{ color: '#64748B' }}>Unable to load activity.</div>}
                            {!activityLoading && !activityError && recentActivity.length === 0 && <div style={{ color: '#64748B' }}>No recent operational activity.</div>}
                            {!activityLoading && !activityError && recentActivity.slice(0, 8).map(item => (
                                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.9rem', padding: '0.85rem 0', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
                                    <div style={{ color: '#64748B', fontSize: '0.88rem', fontWeight: '700' }}>{formatTimeAgo(item.timestamp)}</div>
                                    <div style={{ color: '#1E293B', lineHeight: 1.45 }}>{item.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #991B1B 0%, #E11D48 100%)', color: 'white' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'white' }}>Critical Alert Board</h2>
                            <div style={{ fontSize: '2.7rem', fontWeight: '800', marginBottom: '0.35rem' }}>
                                {canViewInventory ? (inventoryLoading ? '...' : liveInventoryStats.criticalItems.length) : emergencyAlerts.length}
                            </div>
                            <p style={{ opacity: 0.92, lineHeight: 1.45 }}>
                                {canViewInventory
                                    ? (inventoryLoading
                                        ? 'Checking stock conditions and screening outcomes...'
                                        : `Low stock, unsafe, or critical items currently in the system.`)
                                    : 'Emergency broadcasts and urgent request activity from the live feed.'}
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate(canViewInventory ? '/inventory' : '/emergency/alerts')}
                                style={{
                                    marginTop: '1rem',
                                    border: 'none',
                                    background: 'white',
                                    color: '#BE123C',
                                    borderRadius: '14px',
                                    padding: '0.85rem 1rem',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                }}
                            >
                                Review Alerts
                            </button>
                        </div>

                        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.9)' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>Blood Type Watch</h2>
                            <p style={{ color: '#64748B', marginBottom: '1rem' }}>Lowest available safe blood types from current inventory.</p>
                            {canViewInventory && inventoryError && <div style={{ color: '#64748B' }}>Unable to load inventory insights.</div>}
                            {!canViewInventory && <div style={{ color: '#64748B' }}>Inventory insight cards are visible to stock operators.</div>}
                            {canViewInventory && inventoryLoading && <div style={{ color: '#64748B' }}>Loading blood-type distribution...</div>}
                            {canViewInventory && !inventoryLoading && liveInventoryStats.lowestBloodTypes.length === 0 && (
                                <div style={{ color: '#64748B' }}>No safe inventory available right now.</div>
                            )}
                            {canViewInventory && !inventoryLoading && liveInventoryStats.lowestBloodTypes.length > 0 && (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {liveInventoryStats.lowestBloodTypes.map(item => (
                                        <div key={item.bloodType} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.95rem 1rem', borderRadius: '16px', background: item.units <= 2 ? '#FEE2E2' : '#FEF3C7', color: item.units <= 2 ? '#B42318' : '#B45309' }}>
                                            <div style={{ fontWeight: '800', fontSize: '1rem' }}>{item.bloodType}</div>
                                            <div style={{ fontWeight: '700' }}>{item.units} units</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
