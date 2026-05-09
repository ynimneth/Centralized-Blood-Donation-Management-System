import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import labBackground from '../assets/lab.png';

const FILTERS = [
    { key: 'ALL', label: 'ALL' },
    { key: 'PENDING', label: 'PENDING' },
    { key: 'SAFE', label: 'SAFE' },
    { key: 'BIO-HAZARD', label: 'BIO-HAZARD' }
];

const LabDashboard = () => {
    const navigate = useNavigate();
    const [bags, setBags] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [activeTestBagId, setActiveTestBagId] = useState(null);
    const [testForm, setTestForm] = useState({
        hiv: false,
        hep: false,
        malaria: false,
        reason: ''
    });
    const [labResultsByBag, setLabResultsByBag] = useState({});
    const [historyLoadingBagId, setHistoryLoadingBagId] = useState(null);
    const [expandedHistory, setExpandedHistory] = useState({});

    // Pull the latest inventory so the lab queue stays in sync with collection updates.
    const fetchBags = () => {
        setLoading(true);
        axios.get('http://localhost:8080/api/inventory')
            .then(res => {
                setBags(res.data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching inventory', err);
                setBags([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchBags();
    }, []);

    // Normalize backend status fields into the three dashboard buckets used by the UI.
    const getLabBucket = (bag) => {
        const testStatus = String(bag.testStatus || '').toUpperCase();
        const safetyFlag = String(bag.safetyFlag || '').toUpperCase();

        if (testStatus === 'PENDING') return 'PENDING';
        if (testStatus === 'TESTED_UNSAFE' || safetyFlag === 'BIO-HAZARD') return 'BIO-HAZARD';
        if (testStatus === 'TESTED_SAFE' || safetyFlag === 'SAFE') return 'SAFE';
        return 'PENDING';
    };

    // Show the newest collected bags first so technicians see the latest work at the top.
    const sortedBags = useMemo(() => {
        return [...bags].sort((a, b) => {
            const ta = a.collectedAt ? new Date(a.collectedAt).getTime() : 0;
            const tb = b.collectedAt ? new Date(b.collectedAt).getTime() : 0;
            return tb - ta;
        });
    }, [bags]);

    // Drive the summary cards from the same categorized bag list used by the table.
    const summary = useMemo(() => {
        return sortedBags.reduce((acc, bag) => {
            const bucket = getLabBucket(bag);
            acc.pending += bucket === 'PENDING' ? 1 : 0;
            acc.safe += bucket === 'SAFE' ? 1 : 0;
            acc.bioHazard += bucket === 'BIO-HAZARD' ? 1 : 0;
            return acc;
        }, { pending: 0, safe: 0, bioHazard: 0 });
    }, [sortedBags]);

    // Apply both the status tabs and free-text search before rendering the queue.
    const filteredBags = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return sortedBags.filter(bag => {
            const bucket = getLabBucket(bag);
            const filterMatch = activeFilter === 'ALL' || bucket === activeFilter;
            if (!filterMatch) {
                return false;
            }

            if (!query) {
                return true;
            }

            const haystack = [
                `bag ${bag.id}`,
                bag.bloodType,
                bag.donorName,
                bag.testStatus,
                bag.safetyFlag
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [sortedBags, searchTerm, activeFilter]);

    const resetTestForm = () => {
        setTestForm({
            hiv: false,
            hep: false,
            malaria: false,
            reason: ''
        });
    };

    // The side panel always opens with a clean form so previous test input does not leak across bags.
    const openTestPanel = (bagId) => {
        setActiveTestBagId(bagId);
        resetTestForm();
    };

    const closeTestPanel = () => {
        setActiveTestBagId(null);
        resetTestForm();
    };

    // History is fetched on demand to avoid loading every bag's lab records up front.
    const fetchLabHistory = async (bagId) => {
        setHistoryLoadingBagId(bagId);
        try {
            const res = await axios.get(`http://localhost:8080/api/inventory/${bagId}/lab-results`);
            setLabResultsByBag(prev => ({ ...prev, [bagId]: res.data || [] }));
        } catch (err) {
            console.error('Failed to fetch lab history', err);
            setLabResultsByBag(prev => ({ ...prev, [bagId]: [] }));
        } finally {
            setHistoryLoadingBagId(null);
        }
    };

    // Expanders reuse cached history after the first fetch for a smoother review flow.
    const toggleHistory = async (bagId) => {
        const nextExpanded = !expandedHistory[bagId];
        setExpandedHistory(prev => ({ ...prev, [bagId]: nextExpanded }));
        if (nextExpanded && !labResultsByBag[bagId]) {
            await fetchLabHistory(bagId);
        }
    };

    // Positive markers require a reason before the result is sent to the backend.
    const handleSubmitTestResult = async (bagId) => {
        const hasPositive = testForm.hiv || testForm.hep || testForm.malaria;
        const trimmedReason = (testForm.reason || '').trim();

        if (hasPositive && !trimmedReason) {
            alert('Please provide a reason for a positive result.');
            return;
        }

        setProcessingId(bagId);
        try {
            await axios.put(`http://localhost:8080/api/inventory/${bagId}/test`, {
                hiv: testForm.hiv,
                hep: testForm.hep,
                malaria: testForm.malaria,
                reason: trimmedReason
            });
            closeTestPanel();
            fetchBags();
            fetchLabHistory(bagId);
        } catch (err) {
            console.error(err);
            alert('Failed to update lab result.');
        } finally {
            setProcessingId(null);
        }
    };

    const renderBadge = (bag) => {
        const bucket = getLabBucket(bag);
        if (bucket === 'PENDING') {
            return { label: 'PENDING', bg: '#DBEAFE', color: '#2563EB', border: '#93C5FD' };
        }
        if (bucket === 'SAFE') {
            return { label: 'SAFE', bg: '#DCFCE7', color: '#059669', border: '#86EFAC' };
        }
        return { label: 'BIO-HAZARD', bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' };
    };

    // Generate a print-friendly standalone label document for the selected blood bag.
    const buildLabelMarkup = (bag) => {
        const bloodType = bag.bloodType || 'UNKNOWN';
        const donorName = bag.donorName || 'Unknown Donor';
        const collectedAt = bag.collectedAt ? new Date(bag.collectedAt).toLocaleString() : 'Unknown';
        const bagStatus = renderBadge(bag).label;
        const barcodeValue = String(bag.id || '000000').replace(/[^0-9A-Za-z]/g, '').slice(-14) || '000000';
        const barcodeBars = barcodeValue
            .split('')
            .map((char, index) => {
                const width = (char.charCodeAt(0) % 4) + 1;
                const height = index % 2 === 0 ? 34 : 28;
                return `<span style="display:inline-block;width:${width}px;height:${height}px;background:#111827;margin-right:1px;"></span>`;
            })
            .join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Print Label - Bag #${bag.id}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 24px;
            font-family: Arial, sans-serif;
            background: #f8fafc;
            color: #0f172a;
        }
        .sheet {
            width: 100%;
            display: flex;
            justify-content: center;
        }
        .label {
            width: 320px;
            border: 2px solid #111827;
            background: #ffffff;
            padding: 14px;
        }
        .title {
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            margin-bottom: 10px;
        }
        .blood-type {
            border: 2px solid #111827;
            text-align: center;
            font-size: 30px;
            font-weight: 700;
            padding: 8px 0;
            margin-bottom: 8px;
        }
        .row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            border: 1px solid #111827;
            padding: 6px 8px;
            font-size: 11px;
            margin-bottom: 6px;
        }
        .meta {
            border: 1px solid #111827;
            padding: 8px;
            font-size: 10px;
            line-height: 1.45;
            margin-bottom: 8px;
            word-break: break-word;
        }
        .meta strong {
            display: inline-block;
            min-width: 72px;
        }
        .barcode {
            border: 1px solid #111827;
            padding: 8px 8px 6px;
            text-align: center;
        }
        .barcode-number {
            font-size: 10px;
            letter-spacing: 0.18em;
            margin-top: 4px;
        }
        @media print {
            body {
                background: #ffffff;
                padding: 0;
            }
            .label {
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="label">
            <div class="title">LIFELINE BLOOD BAG LABEL</div>
            <div class="blood-type">${bloodType}</div>
            <div class="row">
                <span><strong>Bag ID</strong></span>
                <span>#${bag.id}</span>
            </div>
            <div class="row">
                <span><strong>Status</strong></span>
                <span>${bagStatus}</span>
            </div>
            <div class="meta">
                <div><strong>Donor</strong>${donorName}</div>
                <div><strong>Collected</strong>${collectedAt}</div>
                <div><strong>Quantity</strong>${bag.quantity ?? 0} unit(s)</div>
                <div><strong>Expiry</strong>${bag.expiryDate || 'N/A'}</div>
            </div>
            <div class="barcode">
                <div>${barcodeBars}</div>
                <div class="barcode-number">${barcodeValue}</div>
            </div>
        </div>
    </div>
</body>
</html>`;
    };

    // Open a temporary browser window so the label can be printed with native print controls.
    const handlePrintLabel = (bag) => {
        const printWindow = window.open('', '_blank', 'width=520,height=720');
        if (!printWindow) {
            alert('Unable to open print window. Please allow pop-ups for this page.');
            return;
        }

        printWindow.document.open();
        printWindow.document.write(buildLabelMarkup(bag));
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => {
            printWindow.print();
        };
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#F0F4FF', position: 'relative' }}>
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: `linear-gradient(rgba(240, 244, 255, 0.72), rgba(255, 228, 230, 0.72)), url(${labBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />
            <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '2rem', paddingBottom: '2rem' }}>
                <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ color: '#2563EB' }}>⚗</span>
                            <span>Lab Dashboard</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                            Completed donations arrive here first for lab screening before entering inventory.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={fetchBags}
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
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            style={{
                                border: '1px solid rgba(148, 163, 184, 0.28)',
                                background: 'rgba(255,255,255,0.92)',
                                color: '#1E293B',
                                borderRadius: '20px',
                                padding: '1.2rem 1.5rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            ← Back
                        </button>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
                    <div className="glass-panel" style={{ padding: '1.8rem', borderLeft: '5px solid #3B82F6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '68px',
                                height: '68px',
                                borderRadius: '22px',
                                background: '#EFF6FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#3B82F6',
                                fontSize: '2rem'
                            }}>
                                ◔
                            </div>
                            <div>
                                <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1E3A8A' }}>{summary.pending}</div>
                                <div style={{ color: '#64748B', fontSize: '1.05rem' }}>Pending Tests</div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.8rem', borderLeft: '5px solid #10B981' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '68px',
                                height: '68px',
                                borderRadius: '22px',
                                background: '#ECFDF5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#10B981',
                                fontSize: '2rem'
                            }}>
                                ✓
                            </div>
                            <div>
                                <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#065F46' }}>{summary.safe}</div>
                                <div style={{ color: '#64748B', fontSize: '1.05rem' }}>Safe Blood</div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.8rem', borderLeft: '5px solid #EF4444' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '68px',
                                height: '68px',
                                borderRadius: '22px',
                                background: '#FEF2F2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#EF4444',
                                fontSize: '2rem'
                            }}>
                                ☣
                            </div>
                            <div>
                                <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#991B1B' }}>{summary.bioHazard}</div>
                                <div style={{ color: '#64748B', fontSize: '1.05rem' }}>Bio-Hazard Discards</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{
                        border: '1px solid rgba(148, 163, 184, 0.35)',
                        borderRadius: '18px',
                        background: 'rgba(255,255,255,0.9)',
                        padding: '0.95rem 1.1rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <span style={{ color: '#64748B', fontSize: '1.4rem' }}>○</span>
                        <input
                            type="text"
                            placeholder="Search Bag ID, blood type, donor name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                width: '100%',
                                fontSize: '1rem',
                                color: '#1E293B'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {FILTERS.map(filter => {
                                const isActive = activeFilter === filter.key;
                                return (
                                    <button
                                        key={filter.key}
                                        type="button"
                                        onClick={() => setActiveFilter(filter.key)}
                                        style={{
                                            border: 'none',
                                            borderBottom: isActive ? '3px solid #3B82F6' : '3px solid transparent',
                                            background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                                            color: isActive ? '#1E40AF' : '#64748B',
                                            borderRadius: '12px 12px 0 0',
                                            padding: '0.8rem 1rem',
                                            fontWeight: '700',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {filter.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ color: '#64748B', fontSize: '0.95rem' }}>{filteredBags.length} bags found</div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.2)', paddingTop: '1.5rem', minHeight: '220px' }}>
                        {loading && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '160px', color: '#64748B', fontSize: '1.05rem' }}>
                                Loading lab queue...
                            </div>
                        )}

                        {!loading && filteredBags.length === 0 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '160px', color: '#64748B', fontSize: '1.05rem' }}>
                                No bags found for this filter.
                            </div>
                        )}

                        {!loading && filteredBags.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {filteredBags.map((bag) => {
                                    const badge = renderBadge(bag);
                                    const bucket = getLabBucket(bag);

                                    return (
                                        <div key={bag.id} className="glass-panel" style={{ padding: '1.2rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                                <div>
                                                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
                                                        <span style={{ fontWeight: '700', color: '#1E293B' }}>Bag #{bag.id}</span>
                                                        <span style={{ fontWeight: '700', color: '#2563EB' }}>{bag.bloodType || 'Unknown'}</span>
                                                        <span style={{
                                                            background: badge.bg,
                                                            color: badge.color,
                                                            border: `1px solid ${badge.border}`,
                                                            borderRadius: '9999px',
                                                            padding: '0.2rem 0.7rem',
                                                            fontSize: '0.78rem',
                                                            fontWeight: '700'
                                                        }}>
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                    <div style={{ color: '#64748B', fontSize: '0.95rem' }}>
                                                        Donor: {bag.donorName || 'Unknown'} • Collected: {bag.collectedAt ? new Date(bag.collectedAt).toLocaleString() : 'Unknown'}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    {bucket === 'PENDING' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openTestPanel(bag.id)}
                                                            disabled={processingId === bag.id}
                                                            style={{
                                                                border: '1px solid #BFDBFE',
                                                                background: '#EFF6FF',
                                                                color: '#1D4ED8',
                                                                borderRadius: '14px',
                                                                padding: '0.8rem 1rem',
                                                                fontWeight: '700',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {processingId === bag.id ? 'Processing...' : 'Run Test'}
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePrintLabel(bag)}
                                                        style={{
                                                            border: `1px solid ${bucket === 'BIO-HAZARD' ? '#FCA5A5' : '#6EE7B7'}`,
                                                            background: bucket === 'BIO-HAZARD' ? '#FFF1F2' : '#ECFDF5',
                                                            color: bucket === 'BIO-HAZARD' ? '#B42318' : '#047857',
                                                            borderRadius: '14px',
                                                            padding: '0.8rem 1rem',
                                                            fontWeight: '700',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Print Label
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleHistory(bag.id)}
                                                        style={{
                                                            border: '1px solid #E2E8F0',
                                                            background: 'white',
                                                            color: '#334155',
                                                            borderRadius: '14px',
                                                            padding: '0.8rem 1rem',
                                                            fontWeight: '700',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {expandedHistory[bag.id] ? 'Hide History' : 'View History'}
                                                    </button>
                                                </div>
                                            </div>

                                            {activeTestBagId === bag.id && (
                                                <div style={{ marginTop: '1rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                                                    <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem' }}>Record Lab Markers</div>
                                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                                        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={testForm.hiv}
                                                                onChange={(e) => setTestForm(prev => ({ ...prev, hiv: e.target.checked }))}
                                                            />
                                                            HIV Positive
                                                        </label>
                                                        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={testForm.hep}
                                                                onChange={(e) => setTestForm(prev => ({ ...prev, hep: e.target.checked }))}
                                                            />
                                                            Hepatitis Positive
                                                        </label>
                                                        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={testForm.malaria}
                                                                onChange={(e) => setTestForm(prev => ({ ...prev, malaria: e.target.checked }))}
                                                            />
                                                            Malaria Positive
                                                        </label>
                                                    </div>
                                                    <textarea
                                                        rows={2}
                                                        placeholder="Reason (required if any marker is positive)"
                                                        value={testForm.reason}
                                                        onChange={(e) => setTestForm(prev => ({ ...prev, reason: e.target.value }))}
                                                        style={{
                                                            width: '100%',
                                                            borderRadius: '12px',
                                                            border: '1px solid #CBD5E1',
                                                            padding: '0.8rem',
                                                            resize: 'vertical',
                                                            marginBottom: '0.75rem'
                                                        }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                                        <button
                                                            type="button"
                                                            disabled={processingId === bag.id}
                                                            onClick={() => handleSubmitTestResult(bag.id)}
                                                            style={{
                                                                border: 'none',
                                                                background: 'linear-gradient(135deg, #E11D48 0%, #D90429 100%)',
                                                                color: 'white',
                                                                borderRadius: '14px',
                                                                padding: '0.85rem 1.1rem',
                                                                fontWeight: '700',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {processingId === bag.id ? 'Saving...' : 'Save Result'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={closeTestPanel}
                                                            style={{
                                                                border: '1px solid #E2E8F0',
                                                                background: 'white',
                                                                color: '#334155',
                                                                borderRadius: '14px',
                                                                padding: '0.85rem 1.1rem',
                                                                fontWeight: '700',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {expandedHistory[bag.id] && (
                                                <div style={{ marginTop: '1rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                                                    {historyLoadingBagId === bag.id && (
                                                        <div style={{ color: '#64748B' }}>Loading history...</div>
                                                    )}
                                                    {historyLoadingBagId !== bag.id && (!labResultsByBag[bag.id] || labResultsByBag[bag.id].length === 0) && (
                                                        <div style={{ color: '#64748B' }}>No lab test history for this bag.</div>
                                                    )}
                                                    {historyLoadingBagId !== bag.id && labResultsByBag[bag.id] && labResultsByBag[bag.id].length > 0 && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                                            {labResultsByBag[bag.id].map((row) => (
                                                                <div key={row.id} style={{ fontSize: '0.88rem', color: '#334155', background: '#F8FAFC', borderRadius: '12px', padding: '0.75rem 0.8rem' }}>
                                                                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                                                                        {row.overallResult} • {row.testedAt ? new Date(row.testedAt).toLocaleString() : 'Unknown time'}
                                                                    </div>
                                                                    <div>
                                                                        HIV: {row.hivPositive ? 'Positive' : 'Negative'} | HEP: {row.hepPositive ? 'Positive' : 'Negative'} | MAL: {row.malariaPositive ? 'Positive' : 'Negative'}
                                                                    </div>
                                                                    {row.reason && <div>Reason: {row.reason}</div>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabDashboard;
