import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import inventoryBackground from '../assets/inventory.png';

const TAB_CONFIG = {
    emergency: {
        title: 'Emergency Priority Queue',
        description: 'Critical requests stay isolated so dispatching is faster and safer.',
        badgeSuffix: 'active',
        accent: '#B42318',
        softBg: 'linear-gradient(135deg, rgba(254,242,242,0.96) 0%, rgba(255,236,236,0.96) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.28)'
    },
    normal: {
        title: 'Normal Request Queue',
        description: 'Routine requests from hospital and emergency forms stay separate from critical alerts.',
        badgeSuffix: 'active',
        accent: '#2F5BEA',
        softBg: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(245,248,255,0.96) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.18)'
    },
    fulfilled: {
        title: 'Fulfilled Orders',
        description: 'Completed dispatches stay accessible without cluttering the live queues.',
        badgeSuffix: 'fulfilled',
        accent: '#1F7A45',
        softBg: 'linear-gradient(135deg, rgba(240,253,244,0.96) 0%, rgba(236,253,245,0.96) 100%)',
        border: '1px solid rgba(34, 197, 94, 0.2)'
    },
    inventory: {
        title: 'All Inventory',
        description: 'Search and filter the stock table without scrolling through other queues first.',
        badgeSuffix: 'items',
        accent: '#4F46E5',
        softBg: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(244,244,255,0.96) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.18)'
    }
};

const InventoryDashboard = () => {
    const navigate = useNavigate();
    const { isAdmin, canDispatchEmergency, canDispatchHospitalRequest, user } = useAuth();

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inventoryError, setInventoryError] = useState('');

    const [emergencyRequests, setEmergencyRequests] = useState([]);
    const [hospitalRequests, setHospitalRequests] = useState([]);
    const [requestLoadError, setRequestLoadError] = useState('');
    const [sendingForRequest, setSendingForRequest] = useState({});
    const [dispatchLoading, setDispatchLoading] = useState(null);

    const [activeTab, setActiveTab] = useState('emergency');
    const [queueSearch, setQueueSearch] = useState('');
    const [inventorySearch, setInventorySearch] = useState('');
    const [safetyFilter, setSafetyFilter] = useState('ALL');
    const [bloodTypeFilter, setBloodTypeFilter] = useState('ALL');

    const fetchInventory = () => {
        setLoading(true);
        setInventoryError('');
        axios.get('http://localhost:8080/api/inventory')
            .then(res => {
                const all = res.data || [];
                setInventory(all.filter(item => (item.testStatus || '').toUpperCase() !== 'PENDING'));
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching inventory', err);
                setInventory([]);
                setInventoryError('Unable to load inventory.');
                setLoading(false);
            });
    };

    const normalizeEmergencyRequest = (request) => {
        const unitsRequested = Number(request.unitsRequested || 0);
        const unitsFulfilled = Number(request.unitsFulfilled || 0);
        const urgency = String(request.urgency || '').toUpperCase() === 'CRITICAL' ? 'CRITICAL' : 'NORMAL';
        return {
            requestKey: `emergency-${request.id}`,
            id: request.id,
            source: 'emergency',
            hospital: request.hospital || 'Unknown Hospital',
            bloodType: request.bloodType || 'Unknown',
            priorityLabel: urgency,
            statusKey: (request.status || 'OPEN').toUpperCase(),
            statusLabel: (request.status || 'OPEN').toUpperCase(),
            unitsRequested,
            unitsFulfilled,
            remainingUnits: Math.max(0, unitsRequested - unitsFulfilled),
            reason: request.reason || '',
            createdAt: request.createdAt || null,
            adminNotes: request.adminNotes || '',
            urgency
        };
    };

    const normalizeHospitalRequest = (request) => {
        const unitsRequested = Number(request.unitsRequested || 0);
        const unitsFulfilled = Number(request.unitsIssued || 0);
        return {
            requestKey: `hospital-${request.id}`,
            id: request.id,
            source: 'hospital',
            hospital: request.hospitalName || 'Unknown Hospital',
            bloodType: request.bloodType || 'Unknown',
            priorityLabel: 'NORMAL',
            statusKey: (request.status || 'OPEN').toUpperCase(),
            statusLabel: ((request.status || 'OPEN').toUpperCase() === 'ISSUED' ? 'FULFILLED' : (request.status || 'OPEN').toUpperCase()),
            unitsRequested,
            unitsFulfilled,
            remainingUnits: Math.max(0, unitsRequested - unitsFulfilled),
            reason: request.reason || '',
            createdAt: request.createdAt || null,
            adminNotes: request.adminNotes || ''
        };
    };

    const mapRequestDefaults = (requestGroups) => {
        const defaults = {};
        requestGroups.flat().forEach(request => {
            if (request.statusKey === 'FULFILLED' || request.statusKey === 'ISSUED') {
                return;
            }
            defaults[request.requestKey] = String(Math.max(1, request.remainingUnits));
        });
        setSendingForRequest(defaults);
    };

    const fetchRequests = () => {
        setRequestLoadError('');
        Promise.all([
            axios.get('http://localhost:8080/api/emergency/requests/all'),
            axios.get('http://localhost:8080/api/hospital-requests')
        ])
            .then(([emergencyRes, hospitalRes]) => {
                const emergencyData = (emergencyRes.data || []).map(normalizeEmergencyRequest);
                const hospitalData = (hospitalRes.data || []).map(normalizeHospitalRequest);
                setEmergencyRequests(emergencyData);
                setHospitalRequests(hospitalData);
                mapRequestDefaults([emergencyData, hospitalData]);
            })
            .catch(err => {
                console.error('Error fetching requests', err);
                setEmergencyRequests([]);
                setHospitalRequests([]);
                setRequestLoadError('Unable to load request queues.');
            });
    };

    useEffect(() => {
        fetchInventory();
        fetchRequests();
    }, []);

    const getInventoryTone = (units) => {
        if (units <= 5) {
            return {
                label: 'Critical',
                bg: '#FEE2E2',
                border: '1px solid #FCA5A5',
                text: '#B42318',
                badge: 'Emergency Only'
            };
        }
        if (units <= 20) {
            return {
                label: 'Medium',
                bg: '#FEF3C7',
                border: '1px solid #FCD34D',
                text: '#B45309',
                badge: ''
            };
        }
        return {
            label: 'Sufficient',
            bg: '#DCFCE7',
            border: '1px solid #86EFAC',
            text: '#047857',
            badge: ''
        };
    };

    const getSafetyStatus = (item) => {
        const status = String(item.status || '').toUpperCase();
        const safetyFlag = String(item.safetyFlag || '').toUpperCase();
        if (safetyFlag === 'BIO-HAZARD' || status === 'DISCARD' || status === 'BIO-HAZARD') {
            return 'UNSAFE';
        }
        if (safetyFlag === 'SAFE' || status === 'SAFE' || status === 'AVAILABLE') {
            return 'SAFE';
        }
        return 'PENDING';
    };

    const getCurrentState = (item) => {
        const status = String(item.status || '').toUpperCase();
        if (status === 'SAFE') return 'AVAILABLE';
        if (status === 'DISCARD' || status === 'BIO-HAZARD') return 'DISCARDED';
        return status || 'UNKNOWN';
    };

    const handleDispatch = async (request) => {
        const units = parseInt(sendingForRequest[request.requestKey] || '0', 10);
        if (!units || units <= 0) {
            alert('Enter units to dispatch.');
            return;
        }

        setDispatchLoading(request.requestKey);
        try {
            if (request.source === 'emergency') {
                await axios.put(`http://localhost:8080/api/emergency/requests/${request.id}/fulfill`, { units });
            } else {
                await axios.put(`http://localhost:8080/api/hospital-requests/${request.id}/issue`, {
                    units,
                    actingUserId: user?.id
                });
            }
            fetchRequests();
            fetchInventory();
        } catch (err) {
            console.error(err);
            alert(typeof err?.response?.data === 'string' ? err.response.data : 'Failed to dispatch blood.');
        } finally {
            setDispatchLoading(null);
        }
    };

    const inventorySummary = useMemo(() => {
        const grouped = {};
        inventory.forEach(item => {
            if (getSafetyStatus(item) !== 'SAFE') {
                return;
            }
            const bloodType = item.bloodType || 'Unknown';
            grouped[bloodType] = (grouped[bloodType] || 0) + Number(item.quantity || 0);
        });

        return Object.entries(grouped)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([bloodType, units]) => ({ bloodType, units, tone: getInventoryTone(units) }));
    }, [inventory]);

    const emergencyOnlyBloodTypes = useMemo(() => (
        new Set(
            inventorySummary
                .filter(item => item.units <= 5)
                .map(item => String(item.bloodType || '').toUpperCase())
        )
    ), [inventorySummary]);

    const isEmergencyOnlyBloodType = (bloodType) => emergencyOnlyBloodTypes.has(String(bloodType || '').toUpperCase());

    const emergencyActive = useMemo(
        () => ([
            ...emergencyRequests.filter(request => (
                request.statusKey !== 'FULFILLED' &&
                (request.urgency === 'CRITICAL' || isEmergencyOnlyBloodType(request.bloodType))
            )),
            ...hospitalRequests.filter(request => (
                request.statusKey !== 'ISSUED' &&
                request.statusKey !== 'FULFILLED' &&
                isEmergencyOnlyBloodType(request.bloodType)
            ))
        ]).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))),
        [emergencyRequests, hospitalRequests, emergencyOnlyBloodTypes]
    );
    const normalActive = useMemo(
        () => ([
            ...emergencyRequests.filter(request => (
                request.statusKey !== 'FULFILLED' &&
                request.urgency !== 'CRITICAL' &&
                !isEmergencyOnlyBloodType(request.bloodType)
            )),
            ...hospitalRequests.filter(request => (
                request.statusKey !== 'ISSUED' &&
                request.statusKey !== 'FULFILLED' &&
                !isEmergencyOnlyBloodType(request.bloodType)
            ))
        ]).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))),
        [emergencyRequests, hospitalRequests, emergencyOnlyBloodTypes]
    );
    const fulfilledOrders = useMemo(() => ([
        ...emergencyRequests.filter(request => request.statusKey === 'FULFILLED'),
        ...hospitalRequests.filter(request => request.statusKey === 'ISSUED' || request.statusKey === 'FULFILLED')
    ]).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))), [emergencyRequests, hospitalRequests]);

    const queueSearchTerm = queueSearch.trim().toLowerCase();
    const requestMatches = (request) => (
        request.id.toString().toLowerCase().includes(queueSearchTerm) ||
        request.hospital.toLowerCase().includes(queueSearchTerm) ||
        request.bloodType.toLowerCase().includes(queueSearchTerm)
    );

    const filteredEmergency = useMemo(() => emergencyActive.filter(requestMatches), [emergencyActive, queueSearchTerm]);
    const filteredNormal = useMemo(() => normalActive.filter(requestMatches), [normalActive, queueSearchTerm]);
    const filteredFulfilled = useMemo(() => fulfilledOrders.filter(requestMatches), [fulfilledOrders, queueSearchTerm]);

    const inventoryBloodTypes = useMemo(() => (
        Array.from(new Set(inventory.map(item => item.bloodType).filter(Boolean))).sort((a, b) => a.localeCompare(b))
    ), [inventory]);

    const filteredInventory = useMemo(() => {
        const search = inventorySearch.trim().toLowerCase();
        return inventory.filter(item => {
            const safetyStatus = getSafetyStatus(item);
            const bloodType = (item.bloodType || '').toUpperCase();
            const donorName = (item.donorName || item.donor || '').toLowerCase();
            const searchMatches = !search || String(item.id || '').toLowerCase().includes(search) || donorName.includes(search);
            const safetyMatches = safetyFilter === 'ALL' || safetyStatus === safetyFilter;
            const bloodMatches = bloodTypeFilter === 'ALL' || bloodType === bloodTypeFilter;
            return searchMatches && safetyMatches && bloodMatches;
        });
    }, [inventory, inventorySearch, safetyFilter, bloodTypeFilter]);

    const counts = {
        emergency: emergencyActive.length,
        normal: normalActive.length,
        fulfilled: fulfilledOrders.length,
        inventory: inventory.length
    };

    useEffect(() => {
        if (activeTab === 'emergency' && counts.emergency === 0 && counts.normal > 0) {
            setActiveTab('normal');
        }
    }, [activeTab, counts.emergency, counts.normal]);

    const tabs = [
        { key: 'emergency', label: 'Emergency Priority Queue', count: counts.emergency },
        { key: 'normal', label: 'Normal Request Queue', count: counts.normal },
        { key: 'fulfilled', label: 'Fulfilled Orders', count: counts.fulfilled },
        { key: 'inventory', label: 'All Inventory', count: counts.inventory }
    ];

    const currentConfig = TAB_CONFIG[activeTab];

    const renderRequestCard = (request, options = {}) => {
        const canDispatch = request.source === 'emergency' ? canDispatchEmergency : canDispatchHospitalRequest;
        const priorityStyles = request.priorityLabel === 'CRITICAL'
            ? { background: '#FEE2E2', color: '#EF4444' }
            : { background: '#EFF6FF', color: '#2563EB' };
        const statusStyles = options.fulfilled
            ? { background: '#DCFCE7', color: '#15803D' }
            : { background: '#FEE2E2', color: '#B42318' };

        return (
            <div
                key={request.requestKey}
                className="glass-panel"
                style={{
                    padding: '1.25rem',
                    background: options.fulfilled ? 'rgba(240, 253, 244, 0.92)' : 'rgba(255, 255, 255, 0.92)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 420px' }}>
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <span style={{ fontSize: '1rem', fontWeight: '700', color: '#64748B', fontFamily: 'monospace' }}>#{request.id}</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A' }}>{request.hospital}</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F43F5E' }}>{request.bloodType}</span>
                            <span style={{
                                ...priorityStyles,
                                borderRadius: '10px',
                                padding: '0.2rem 0.7rem',
                                fontSize: '0.78rem',
                                fontWeight: '700'
                            }}>
                                {request.priorityLabel}
                            </span>
                            {!options.fulfilled && isEmergencyOnlyBloodType(request.bloodType) && (
                                <span style={{
                                    background: '#B42318',
                                    color: 'white',
                                    borderRadius: '10px',
                                    padding: '0.2rem 0.7rem',
                                    fontSize: '0.78rem',
                                    fontWeight: '700'
                                }}>
                                    LOW STOCK PRIORITY
                                </span>
                            )}
                        </div>
                        <div style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: canDispatch && !options.fulfilled ? '1rem' : 0 }}>
                            Requested: {request.unitsRequested} • Fulfilled: {request.unitsFulfilled}
                            {!options.fulfilled && ` • Remaining: ${request.remainingUnits}`}
                            {request.reason && ` • Reason: ${request.reason}`}
                        </div>
                    </div>
                    <div style={{
                        ...statusStyles,
                        borderRadius: '9999px',
                        padding: '0.4rem 0.9rem',
                        fontSize: '0.8rem',
                        fontWeight: '700'
                    }}>
                        {options.fulfilled ? 'FULFILLED' : request.statusLabel}
                    </div>
                </div>

                {!options.fulfilled && canDispatch && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                            type="number"
                            min="1"
                            max={Math.max(1, request.remainingUnits)}
                            value={sendingForRequest[request.requestKey] || ''}
                            onChange={e => setSendingForRequest(prev => ({ ...prev, [request.requestKey]: e.target.value }))}
                            style={{
                                width: '150px',
                                padding: '1rem',
                                borderRadius: '18px',
                                border: '1px solid rgba(148, 163, 184, 0.35)',
                                fontSize: '1rem',
                                outline: 'none',
                                background: 'rgba(255,255,255,0.94)'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => handleDispatch(request)}
                            disabled={dispatchLoading === request.requestKey}
                            style={{
                                border: 'none',
                                background: 'linear-gradient(135deg, #E11D48 0%, #D90429 100%)',
                                color: 'white',
                                padding: '1rem 1.5rem',
                                borderRadius: '18px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 10px 20px rgba(217, 4, 41, 0.2)'
                            }}
                        >
                            {dispatchLoading === request.requestKey ? 'Dispatching...' : 'Dispatch Units'}
                        </button>
                    </div>
                )}

                {!options.fulfilled && !canDispatch && (
                    <div style={{ color: '#92400E', fontSize: '0.9rem' }}>
                        {request.source === 'emergency'
                            ? 'Only admin users can dispatch emergency-priority requests.'
                            : 'You can view this request but cannot dispatch it.'}
                    </div>
                )}
            </div>
        );
    };

    const renderQueueSection = () => {
        if (activeTab === 'inventory') {
            return (
                <div className="glass-panel" style={{ padding: '1.5rem', background: currentConfig.softBg, border: currentConfig.border }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{currentConfig.title}</h2>
                            <p style={{ color: 'var(--text-muted)' }}>{currentConfig.description}</p>
                        </div>
                        <div style={{
                            background: '#E0E7FF',
                            color: currentConfig.accent,
                            borderRadius: '9999px',
                            padding: '0.5rem 1rem',
                            fontWeight: '700'
                        }}>
                            {counts.inventory} items
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1.6fr) minmax(180px, 0.8fr) minmax(180px, 0.8fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            placeholder="Search by ID or donor name..."
                            value={inventorySearch}
                            onChange={e => setInventorySearch(e.target.value)}
                            style={{
                                padding: '1rem',
                                borderRadius: '14px',
                                border: '1px solid rgba(148, 163, 184, 0.4)',
                                fontSize: '1rem',
                                background: 'rgba(255,255,255,0.94)'
                            }}
                        />
                        <select
                            value={safetyFilter}
                            onChange={e => setSafetyFilter(e.target.value)}
                            style={{
                                padding: '1rem',
                                borderRadius: '14px',
                                border: '1px solid rgba(148, 163, 184, 0.4)',
                                fontSize: '1rem',
                                background: 'rgba(255,255,255,0.94)'
                            }}
                        >
                            <option value="ALL">All Safe Tags</option>
                            <option value="SAFE">Safe</option>
                            <option value="PENDING">Pending</option>
                            <option value="UNSAFE">Unsafe</option>
                        </select>
                        <select
                            value={bloodTypeFilter}
                            onChange={e => setBloodTypeFilter(e.target.value)}
                            style={{
                                padding: '1rem',
                                borderRadius: '14px',
                                border: '1px solid rgba(148, 163, 184, 0.4)',
                                fontSize: '1rem',
                                background: 'rgba(255,255,255,0.94)'
                            }}
                        >
                            <option value="ALL">All Blood Types</option>
                            {inventoryBloodTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '920px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(15, 23, 42, 0.03)' }}>
                                    <th style={{ padding: '1.1rem 1rem', textAlign: 'left' }}>ID</th>
                                    <th style={{ padding: '1.1rem 1rem', textAlign: 'left' }}>Blood Type</th>
                                    <th style={{ padding: '1.1rem 1rem', textAlign: 'left' }}>Quantity</th>
                                    <th style={{ padding: '1.1rem 1rem', textAlign: 'left' }}>Expiry Date</th>
                                    <th style={{ padding: '1.1rem 1rem', textAlign: 'left' }}>Safety Status</th>
                                    <th style={{ padding: '1.1rem 1rem', textAlign: 'left' }}>Current State</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.map(item => {
                                    const safetyStatus = getSafetyStatus(item);
                                    const safetyStyle = safetyStatus === 'SAFE'
                                        ? { background: '#D1FAE5', color: '#047857', border: '1px solid #6EE7B7' }
                                        : safetyStatus === 'UNSAFE'
                                            ? { background: '#FEE2E2', color: '#B42318', border: '1px solid #FCA5A5' }
                                            : { background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' };

                                    return (
                                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.16)' }}>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <div style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#0F172A' }}>#{item.id}</div>
                                                {(item.donorName || item.donor) && (
                                                    <div style={{ fontSize: '0.92rem', color: '#64748B', marginTop: '0.4rem' }}>
                                                        Donor: {item.donorName || item.donor}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem', fontWeight: '700', fontSize: '1.15rem' }}>{item.bloodType}</td>
                                            <td style={{ padding: '1.25rem 1rem', fontWeight: '600' }}>{item.quantity ?? 0}</td>
                                            <td style={{ padding: '1.25rem 1rem', fontWeight: '500' }}>{item.expiryDate || 'N/A'}</td>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <span style={{
                                                    ...safetyStyle,
                                                    borderRadius: '9999px',
                                                    padding: '0.35rem 0.85rem',
                                                    fontSize: '0.82rem',
                                                    fontWeight: '700'
                                                }}>
                                                    {safetyStatus}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem', fontWeight: '700', color: '#1E293B' }}>{getCurrentState(item)}</td>
                                        </tr>
                                    );
                                })}
                                {!loading && filteredInventory.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No inventory items match the current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        const list = activeTab === 'emergency'
            ? filteredEmergency
            : activeTab === 'normal'
                ? filteredNormal
                : filteredFulfilled;

        const badgeColor = activeTab === 'emergency'
            ? { background: '#B42318', color: 'white' }
            : activeTab === 'normal'
                ? { background: '#DBEAFE', color: '#2563EB' }
                : { background: '#DCFCE7', color: '#1F7A45' };

        return (
            <div className="glass-panel" style={{ padding: '1.5rem', background: currentConfig.softBg, border: currentConfig.border }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: activeTab === 'emergency' ? '#991B1B' : 'inherit' }}>
                            {currentConfig.title}
                        </h2>
                        <p style={{ color: activeTab === 'emergency' ? '#C2410C' : 'var(--text-muted)' }}>{currentConfig.description}</p>
                    </div>
                    <div style={{
                        ...badgeColor,
                        borderRadius: '9999px',
                        padding: '0.5rem 1rem',
                        fontWeight: '700'
                    }}>
                        {counts[activeTab]} {currentConfig.badgeSuffix}
                    </div>
                </div>

                <input
                    type="text"
                    placeholder="Search by ID, hospital, blood type..."
                    value={queueSearch}
                    onChange={e => setQueueSearch(e.target.value)}
                    style={{
                        width: '100%',
                        marginBottom: '1rem',
                        padding: '1rem',
                        borderRadius: '14px',
                        border: '1px solid rgba(148, 163, 184, 0.4)',
                        fontSize: '1rem',
                        background: 'rgba(255,255,255,0.94)'
                    }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {list.map(request => renderRequestCard(request, { fulfilled: activeTab === 'fulfilled' }))}
                    {list.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                            {activeTab === 'emergency' && 'No active emergency-priority requests.'}
                            {activeTab === 'normal' && 'No active normal requests.'}
                            {activeTab === 'fulfilled' && 'No fulfilled orders yet.'}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%', position: 'relative', backgroundColor: '#F0F4FF' }}>
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: `linear-gradient(rgba(240, 244, 255, 0.72), rgba(255, 228, 230, 0.72)), url(${inventoryBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />
            <div className="container" style={{ position: 'relative', zIndex: 1, padding: '2rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                style={{
                                    border: '1px solid rgba(148, 163, 184, 0.28)',
                                    background: 'rgba(255,255,255,0.92)',
                                    color: '#1E293B',
                                    borderRadius: '20px',
                                    padding: '0.95rem 1.3rem',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                ← Back
                            </button>
                            <span style={{
                                background: 'rgba(255,255,255,0.9)',
                                color: '#475569',
                                borderRadius: '9999px',
                                padding: '0.6rem 1rem',
                                fontWeight: '700'
                            }}>
                                OPERATIONS
                            </span>
                        </div>
                        <h1 style={{ fontSize: '2rem', lineHeight: 1.05, marginBottom: '0.75rem' }}>Inventory Management</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                            Real-time blood stock monitoring, queue handling, and dispatch control.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            fetchInventory();
                            fetchRequests();
                        }}
                        style={{
                            border: 'none',
                            background: 'linear-gradient(135deg, #E11D48 0%, #D90429 100%)',
                            color: 'white',
                            borderRadius: '20px',
                            padding: '1.2rem 1.6rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 12px 24px rgba(217, 4, 41, 0.22)'
                        }}
                    >
                        Refresh Data
                    </button>
                </div>

                <div className="glass-panel" style={{ padding: '1.1rem', marginBottom: '1.6rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.key;
                            const accent = TAB_CONFIG[tab.key].accent;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    style={{
                                        border: isActive ? `1.5px solid ${accent}` : '1px solid rgba(203, 213, 225, 0.7)',
                                        background: isActive
                                            ? `linear-gradient(135deg, ${accent}12 0%, ${accent}06 100%)`
                                            : 'rgba(255,255,255,0.9)',
                                        color: isActive ? accent : '#1E293B',
                                        borderRadius: '20px',
                                        padding: '1.2rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span>{tab.label}</span>
                                    <span style={{
                                        minWidth: '44px',
                                        height: '34px',
                                        borderRadius: '9999px',
                                        background: isActive ? accent : 'rgba(15,23,42,0.08)',
                                        color: isActive ? 'white' : '#0F172A',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {isAdmin && (
                    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.6rem' }}>
                        <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Inventory Analytics (Admin)</h2>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                            <span style={{ background: '#FEE2E2', color: '#B42318', padding: '0.55rem 0.9rem', borderRadius: '9999px', fontWeight: '700' }}>
                                ≤5 units — Critical
                            </span>
                            <span style={{ background: '#FEF3C7', color: '#B45309', padding: '0.55rem 0.9rem', borderRadius: '9999px', fontWeight: '700' }}>
                                6–20 units — Medium
                            </span>
                            <span style={{ background: '#DCFCE7', color: '#047857', padding: '0.55rem 0.9rem', borderRadius: '9999px', fontWeight: '700' }}>
                                &gt;20 units — Sufficient
                            </span>
                        </div>

                        {inventorySummary.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)' }}>No usable blood units available.</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.9rem' }}>
                                {inventorySummary.map(item => (
                                    <div
                                        key={item.bloodType}
                                        style={{
                                            background: item.tone.bg,
                                            border: item.tone.border,
                                            borderRadius: '18px',
                                            padding: '1rem',
                                            minHeight: '122px',
                                            color: item.tone.text
                                        }}
                                    >
                                        {item.tone.badge && (
                                            <div style={{
                                                display: 'inline-block',
                                                background: '#B42318',
                                                color: 'white',
                                                padding: '0.25rem 0.55rem',
                                                borderRadius: '10px',
                                                fontSize: '0.75rem',
                                                fontWeight: '700',
                                                marginBottom: '0.9rem'
                                            }}>
                                                {item.tone.badge}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.6rem' }}>{item.bloodType}</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.8rem' }}>{item.units} units</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{item.tone.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {requestLoadError && (
                    <div style={{ color: '#B42318', marginBottom: '1rem' }}>{requestLoadError}</div>
                )}
                {inventoryError && (
                    <div style={{ color: '#B42318', marginBottom: '1rem' }}>{inventoryError}</div>
                )}

                {renderQueueSection()}
            </div>
        </div>
    );
};

export default InventoryDashboard;
