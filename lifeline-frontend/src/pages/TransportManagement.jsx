import React from 'react';
import { useNavigate } from 'react-router-dom';

const featureCards = [
    {
        title: 'Vehicle Management',
        description: 'Register blood bank ambulances, hospital vehicles, drivers, and live availability.',
        accent: '#DC2626'
    },
    {
        title: 'Delivery Tracking',
        description: 'Track approved blood requests from vehicle assignment through delivery completion.',
        accent: '#2563EB'
    },
    {
        title: 'Smart Allocation',
        description: 'Choose the nearest hospital with available stock to reduce distance and wastage.',
        accent: '#10B981'
    },
    {
        title: 'Live Route Map',
        description: 'Show the assigned route, moving vehicle marker, ETA, and GPS history.',
        accent: '#7C3AED'
    },
    {
        title: 'Transport Analytics',
        description: 'Monitor monthly distance, fuel estimate, delayed deliveries, and inter-district transfers.',
        accent: '#F59E0B'
    },
    {
        title: 'Advanced Controls',
        description: 'Add OTP verification, emergency priority, geofencing, and cold-chain monitoring.',
        accent: '#0F766E'
    }
];

const buildSteps = [
    'Add backend entities: Vehicle, Delivery, GpsTracking, RouteHistory, TransportAnalytics.',
    'Add REST APIs and auto-create delivery orders after request approval.',
    'Add React pages for vehicles, live map, tracking dashboard, and analytics.',
    'Integrate OSRM or Google Routes API for shortest route and ETA.',
    'Enable Spring WebSocket updates for live vehicle movement.'
];

const TransportManagement = () => {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '2rem 1rem 3rem' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <section
                    className="glass-panel"
                    style={{
                        padding: '2rem',
                        marginBottom: '1.5rem',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,246,255,0.9) 100%)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ maxWidth: '780px' }}>
                            <div style={{ color: '#2563EB', fontWeight: '800', marginBottom: '0.8rem' }}>
                                BLOOD TRANSPORTATION & SMART ROUTE MANAGEMENT
                            </div>
                            <h1 style={{ fontSize: '2.4rem', marginBottom: '0.75rem', color: '#0F172A' }}>
                                Transport Operations Hub
                            </h1>
                            <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.6 }}>
                                This is the local entry page for the new transportation module. It is now visible in your app,
                                but the full backend logic, live GPS map, route engine, and analytics APIs still need to be implemented.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                style={{
                                    border: '1px solid rgba(148, 163, 184, 0.25)',
                                    background: 'white',
                                    color: '#0F172A',
                                    borderRadius: '16px',
                                    padding: '0.9rem 1.15rem',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Back to Dashboard
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/emergency')}
                                style={{
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                    color: 'white',
                                    borderRadius: '16px',
                                    padding: '0.9rem 1.15rem',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Open Requests
                            </button>
                        </div>
                    </div>
                </section>

                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {featureCards.map(card => (
                        <div key={card.title} className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.92)' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: card.accent, marginBottom: '0.9rem' }} />
                            <div style={{ fontWeight: '800', color: '#0F172A', marginBottom: '0.45rem' }}>{card.title}</div>
                            <div style={{ color: '#64748B', lineHeight: 1.5 }}>{card.description}</div>
                        </div>
                    ))}
                </section>

                <section className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.92)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#0F172A' }}>What Is Working Right Now</h2>
                    <div style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1rem' }}>
                        You can now see this transport module locally in the UI. This page is the visible placeholder entry point for the system we planned.
                    </div>

                    <h3 style={{ fontSize: '1rem', marginBottom: '0.6rem', color: '#0F172A' }}>Next Build Steps</h3>
                    <div style={{ display: 'grid', gap: '0.7rem' }}>
                        {buildSteps.map(step => (
                            <div key={step} style={{ padding: '0.9rem 1rem', borderRadius: '14px', background: '#F8FAFC', color: '#475569' }}>
                                {step}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TransportManagement;
