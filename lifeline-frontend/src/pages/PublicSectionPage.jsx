import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import heroImage from '../assets/loginpage.png';
import { publicNavItems, publicSectionPages } from './publicSections';
import './PublicDetails.css';
import axios from 'axios';

function PublicSectionPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const page = publicSectionPages[location.pathname] || publicSectionPages['/about-us'];

    return (
        <div className="public-details-page">
            <header className="public-navbar">
                <div className="public-navbar-inner">
                    <div className="public-logo" onClick={() => navigate('/details')} role="button" tabIndex={0}>
                        <div className="public-logo-copy">
                            <strong>LifeLine</strong>
                            <span>Blood Donation &amp; Management System</span>
                        </div>
                    </div>

                    <nav className="public-nav-links">
                        {publicNavItems.map((item) => (
                            <Link key={item.path} to={item.path} className="public-nav-item">
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="public-navbar-actions">
                        <Link to="/register" className="btn btn-primary public-primary-link">
                            Register
                        </Link>
                    </div>
                </div>
            </header>

            <main className="public-details-content">
                <section
                    className="public-hero-banner public-hero-banner-small"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.24), rgba(255, 248, 248, 0.34)), url(${heroImage})`
                    }}
                >
                    <div className="public-hero-overlay">
                        <div className="public-hero-panel public-hero-panel-compact">
                            <span className="public-section-tag">{page.eyebrow}</span>
                            <h1>{page.title}</h1>
                            <div className="public-hero-divider" />
                            <p>{page.intro}</p>
                        </div>
                    </div>
                </section>

                <section className="public-grid public-grid-single">
                    {page.blocks.map((block) => (
                        <article key={block.title} className="public-card public-soft-card">
                            <h3>{block.title}</h3>
                            <p>{block.text}</p>
                        </article>
                    ))}
                </section>

                {location.pathname === '/events-news' && (
                    <EventsCamps />
                )}

                <section className="public-lower-grid">
                    <article className="public-card public-feature-card">
                        <h3>Ready To Continue?</h3>
                        <ul className="public-list">
                            <li>Go back to the public details homepage for the full overview.</li>
                            <li>Register if you are new to LifeLine.</li>
                            <li>Sign in when you are ready to continue your donor journey.</li>
                        </ul>
                    </article>

                    <article className="public-card public-soft-card">
                        <h3>Quick Actions</h3>
                        <div className="public-link-list">
                            <Link to="/details" className="public-resource-link">
                                Open main details page
                            </Link>
                            <Link to="/register" className="public-resource-link">
                                Go to register page
                            </Link>
                            <button type="button" className="public-resource-link public-link-button" onClick={() => navigate('/login')}>
                                Back to login page
                            </button>
                        </div>
                    </article>
                </section>
            </main>
        </div>
    );
}

function EventsCamps() {
    const [camps, setCamps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/camps');
                if (!mounted) return;
                const list = (res.data || []).filter(c => (c.campStatus || '').toUpperCase() !== 'ENDED');
                setCamps(list);
            } catch (err) {
                console.error('Failed to load camps for Events page', err);
                setCamps([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    return (
        <section style={{ marginTop: '1.5rem' }}>
            <h2 style={{ marginBottom: '0.75rem', textAlign: 'center' }}>Upcoming Donation Camps</h2>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <input
                    type="search"
                    aria-label="Search camps"
                    placeholder="Search by camp name or location..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '720px',
                        padding: '0.6rem 0.9rem',
                        borderRadius: '999px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
                        outline: 'none'
                    }}
                />
            </div>

            <div className="public-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {loading && (
                    <div style={{ gridColumn: '1/-1', color: 'var(--text-muted)' }}>Loading camps...</div>
                )}

                {!loading && camps.length === 0 && (
                    <div style={{ gridColumn: '1/-1', color: 'var(--text-muted)' }}>No upcoming camps found.</div>
                )}

                {(() => {
                    const q = String(query || '').trim().toLowerCase();
                    const visible = q
                        ? (camps || []).filter(c => {
                            const name = String(c.name || '').toLowerCase();
                            const loc = String(c.location || '').toLowerCase();
                            const district = String(c.district || '').toLowerCase();
                            const province = String(c.province || '').toLowerCase();
                            return name.includes(q) || loc.includes(q) || district.includes(q) || province.includes(q);
                        })
                        : (camps || []);
                    return visible.map((camp) => (
                    <article key={camp.id} className="public-card public-soft-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                <h3 style={{ margin: 0 }}>{camp.name}</h3>
                                <span style={{ ...getStatusStylePlaceholder(camp.campStatus), padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>{camp.campStatus || 'UPCOMING'}</span>
                            </div>

                            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                📍 {camp.location || (camp.district ? `${camp.district}, ${camp.province}` : '')}
                            </div>

                            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                📅 {formatCampDate(camp.date)}
                            </div>

                            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                ⏰ {camp.startTime || camp.time || 'TBD'} - {camp.endTime || 'TBD'}
                            </div>
                        </div>

                        {/* removed 'View Details' button for read-only public listing */}
                    </article>
                    ));
                })()}
            </div>
        </section>
    );
}

// small helpers local to this file
function formatCampDate(d) {
    if (!d) return 'TBD';
    try {
        const parsed = new Date(d);
        if (!isNaN(parsed)) return parsed.toLocaleDateString();
    } catch (e) {}
    return String(d);
}

function getStatusStylePlaceholder(status) {
    const s = (status || '').toUpperCase();
    if (s === 'ONGOING') return { background: '#ECFDF5', color: '#059669' };
    if (s === 'ENDED') return { background: '#FEF2F2', color: '#B91C1C' };
    return { background: '#FEF3C7', color: '#B45309' };
}

export default PublicSectionPage;
