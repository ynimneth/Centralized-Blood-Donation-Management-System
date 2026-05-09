import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    PROVINCES,
    getDefaultLocationSelection,
    getDistrictsByProvince
} from '../constants/locationData';
import campsBackground from '../assets/camps.jpg';

const CampMap = () => {
    // Used to navigate back to previous page
    const navigate = useNavigate();

    // Get admin status from authentication context
    const { isAdmin } = useAuth();

    // Default province and district values for new form
    const defaults = getDefaultLocationSelection();

    // This object is used to reset the camp form
    const emptyCampForm = {
        name: '',
        province: defaults.province,
        district: defaults.district,
        nearestHospital: '',
        location: '',
        date: '',
        startTime: '',
        endTime: '',
        googleMapLink: '',
        interestCount: 0
    };

    // Store all camp records loaded from backend
    const [camps, setCamps] = useState([]);

    // Track loading state while fetching camps
    const [loading, setLoading] = useState(true);

    // Control add/edit modal visibility
    const [showModal, setShowModal] = useState(false);

    // Check whether form is in edit mode or create mode
    const [isEditMode, setIsEditMode] = useState(false);

    // Store selected camp ID when editing
    const [editingCampId, setEditingCampId] = useState(null);

    // Store form input values for creating/updating camp
    const [newCamp, setNewCamp] = useState(emptyCampForm);

    // Store hospitals loaded based on selected province and district
    const [hospitals, setHospitals] = useState([]);

    // Store selected camp for View Details popup
    const [selectedCamp, setSelectedCamp] = useState(null);

    // Prevent multiple interest submissions
    const [interestSubmitting, setInterestSubmitting] = useState(false);

    // Store search text for camp filtering
    const [searchTerm, setSearchTerm] = useState('');

    // Store validation errors
    const [formErrors, setFormErrors] = useState({});

    // Province list from constants file
    const provinces = PROVINCES;

    // District list changes depending on selected province
    const districts = getDistrictsByProvince(newCamp.province);

    const today = new Date();
    const minCampDate = new Date(today);
    const maxCampDate = new Date(today);
    maxCampDate.setDate(maxCampDate.getDate() + 7);

    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const minCampDateValue = formatDateForInput(minCampDate);
    const maxCampDateValue = formatDateForInput(maxCampDate);

    // Load hospitals whenever province or district changes in form
    useEffect(() => {
        if (!newCamp.province || !newCamp.district) {
            setHospitals([]);
            return;
        }

        axios.get('http://localhost:8080/api/hospitals', {
            params: {
                province: newCamp.province,
                district: newCamp.district
            }
        })
            .then(res => {
                const list = (res.data || []).map(item => item.name);
                setHospitals(list);

                // If current hospital is not valid, automatically set first available hospital
                setNewCamp(prev => ({
                    ...prev,
                    nearestHospital: list.includes(prev.nearestHospital)
                        ? prev.nearestHospital
                        : (prev.nearestHospital || list[0] || '')
                }));
            })
            .catch(err => {
                console.error('Error loading hospitals', err);
                setHospitals([]);
            });
    }, [newCamp.province, newCamp.district]);

    // Fetch all camps from backend
    const fetchCamps = () => {
        setLoading(true);

        axios.get('http://localhost:8080/api/camps')
            .then(res => {
                setCamps(res.data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching camps', err);
                setLoading(false);
            });
    };

    // Fetch camps once when component loads
    useEffect(() => {
        fetchCamps();
    }, []);

    // Validation helpers
    const validateCampName = (name) => {
        const value = name.trim();

        if (!value) return 'Camp Name is required.';
        if (value.length < 3) return 'Camp Name must be at least 3 characters.';
        if (value.length > 80) return 'Camp Name must be less than 80 characters.';
        if (!/[A-Za-z]/.test(value)) return 'Camp Name must contain letters.';
        if (!/^[A-Za-z0-9\s&().,'-]+$/.test(value)) {
            return 'Camp Name contains invalid characters.';
        }
        if (/^\d+$/.test(value)) return 'Camp Name cannot be only numbers.';
        return '';
    };

    const validateLocation = (location) => {
        const value = location.trim();

        if (!value) return 'Location is required.';
        if (value.length < 3) return 'Location must be at least 3 characters.';
        if (value.length > 120) return 'Location must be less than 120 characters.';
        if (!/[A-Za-z]/.test(value)) return 'Location must contain a city name or address.';
        if (!/^[A-Za-z0-9\s,./#()-]+$/.test(value)) {
            return 'Location contains invalid characters.';
        }

        // Looks like either an address (number/comma/slash) or a place/city name with at least one word
        const looksLikeAddress = /\d/.test(value) || /[,/#-]/.test(value);
        const looksLikePlaceName = /^[A-Za-z\s.-]+(?:\s+[A-Za-z\s.-]+)*$/.test(value);

        if (!looksLikeAddress && !looksLikePlaceName) {
            return 'Enter a valid address or city name.';
        }

        return '';
    };

    const validateGoogleMapLink = (link) => {
        const value = link.trim();

        if (!value) return '';

        try {
            const url = new URL(value);
            const host = url.hostname.toLowerCase();

            const isGoogleMapsHost =
                host.includes('google.com') ||
                host.includes('maps.google.com') ||
                host.includes('goo.gl');

            const isMapsPath =
                url.pathname.toLowerCase().includes('/maps') ||
                url.search.toLowerCase().includes('maps') ||
                url.href.toLowerCase().includes('google.com/maps') ||
                url.href.toLowerCase().includes('maps.google.com');

            if (!isGoogleMapsHost || !isMapsPath) {
                return 'Enter a valid Google Maps link.';
            }

            return '';
        } catch {
            return 'Enter a valid URL.';
        }
    };

    const validateInterestCount = (count) => {
        const value = String(count).trim();

        if (value === '') return 'Interested Count is required.';
        if (!/^\d+$/.test(value)) return 'Interested Count must be a whole positive number.';

        const num = Number(value);

        if (num < 0) return 'Interested Count cannot be negative.';
        if (num > 250) return 'Interested Count must be between 0 and 250.';
        return '';
    };

    const validateCampDate = (date) => {
        const value = String(date || '').trim();

        if (!value) return 'Date is required.';
        if (value < minCampDateValue || value > maxCampDateValue) {
            return 'Date must be within the next 7 days.';
        }
        return '';
    };

    const validateForm = () => {
        const errors = {
            name: validateCampName(newCamp.name),
            location: validateLocation(newCamp.location),
            googleMapLink: validateGoogleMapLink(newCamp.googleMapLink),
            interestCount: validateInterestCount(newCamp.interestCount),
            date: validateCampDate(newCamp.date)
        };

        setFormErrors(errors);
        return !Object.values(errors).some(Boolean);
    };

    // Reset form and edit state
    const resetForm = () => {
        setNewCamp(emptyCampForm);
        setIsEditMode(false);
        setEditingCampId(null);
        setFormErrors({});
    };

    // Open modal for creating a new camp
    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    // Open modal for editing an existing camp
    const openEditModal = (camp) => {
        setIsEditMode(true);
        setEditingCampId(camp.id);

        // Fill form with existing camp values
        setNewCamp({
            name: camp.name || '',
            province: camp.province || defaults.province,
            district: camp.district || defaults.district,
            nearestHospital: camp.nearestHospital || '',
            location: camp.location || '',
            date: camp.date || '',
            startTime: camp.startTime || camp.time || '',
            endTime: camp.endTime || '',
            googleMapLink: camp.googleMapLink || '',
            interestCount: camp.interestCount ?? 0
        });

        setFormErrors({});

        // Close details modal before opening edit form
        setSelectedCamp(null);
        setShowModal(true);
    };

    // Close modal and clear form
    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    // Handle both create and update form submission
    const handleCreateOrUpdateCamp = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Prepare request payload
        const payload = {
            ...newCamp,
            name: newCamp.name.trim(),
            location: newCamp.location.trim(),
            googleMapLink: newCamp.googleMapLink.trim(),
            interestCount: Number(newCamp.interestCount) || 0
        };

        try {
            if (isEditMode && editingCampId) {
                // Update existing camp
                await axios.put(`http://localhost:8080/api/camps/${editingCampId}`, payload);
                alert('Camp Updated Successfully!');
            } else {
                // Create new camp
                await axios.post('http://localhost:8080/api/camps/create', payload);
                alert('Camp Created Successfully!');
            }

            // Close form and refresh camp list
            closeModal();
            fetchCamps();
        } catch (error) {
            console.error(error);
            alert(isEditMode ? 'Failed to update camp' : 'Failed to create camp');
        }
    };

    // Delete selected camp
    const handleDeleteCamp = async (campId) => {
        if (!window.confirm('Delete this camp event?')) return;

        try {
            await axios.delete(`http://localhost:8080/api/camps/${campId}`);
            setSelectedCamp(null);
            fetchCamps();
        } catch (error) {
            console.error(error);
            alert('Failed to delete camp');
        }
    };

    // Register interest for donor side
    const handleInterest = async (campId) => {
        if (interestSubmitting) return;

        setInterestSubmitting(true);

        try {
            const res = await axios.post(`http://localhost:8080/api/camps/${campId}/interest`);

            // Update the specific camp in local state
            setCamps(prev => prev.map(c => (c.id === campId ? res.data : c)));

            // If selected camp is open in modal, update it too
            if (selectedCamp && selectedCamp.id === campId) {
                setSelectedCamp(res.data);
            }
        } catch (error) {
            console.error(error);
            alert('Unable to register interest.');
        } finally {
            setInterestSubmitting(false);
        }
    };

    // Return different badge color based on camp status
    const getStatusStyle = (status) => {
        if (status === 'ONGOING') {
            return { background: '#DCFCE7', color: '#166534' };
        }
        if (status === 'ENDED') {
            return { background: '#F3F4F6', color: '#374151' };
        }
        return { background: '#FEE2E2', color: '#9F1239' };
    };

    // Filter camps by name or location, then sort by date/time
    const filteredAndSortedCamps = useMemo(() => {
        const filtered = camps.filter(camp => {
            const keyword = searchTerm.trim().toLowerCase();

            // If no search text, return all camps
            if (!keyword) return true;

            const campName = (camp.name || '').toLowerCase();
            const campLocation = (camp.location || '').toLowerCase();

            // Match by camp name or location
            return campName.includes(keyword) || campLocation.includes(keyword);
        });

        // Sort filtered camps by date and time
        return [...filtered].sort((a, b) => {
            const aDate = new Date(`${a.date}T${a.startTime || a.time || '00:00'}`).getTime();
            const bDate = new Date(`${b.date}T${b.startTime || b.time || '00:00'}`).getTime();
            return aDate - bDate;
        });
    }, [camps, searchTerm]);

    return (
        <div style={{ minHeight: '100vh', width: '100%', position: 'relative', backgroundColor: '#F0F4FF' }}>
            <style>{`
                .camp-page-container {
                    position: relative;
                    z-index: 1;
                    padding: 2rem 1rem;
                }

                .camp-page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                }

                .camp-header-actions {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .camp-search-box {
                    margin-top: 1rem;
                    width: 100%;
                    max-width: 420px;
                }

                .camp-search-input {
                    width: 100%;
                    padding: 0.85rem 1rem;
                    border: 1px solid #D1D5DB;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    outline: none;
                    box-sizing: border-box;
                    background: rgba(255, 255, 255, 0.92);
                }

                .camp-search-input:focus {
                    border-color: #e11d48;
                    box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.12);
                }

                .camp-list-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                }

                .camp-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                }

                .camp-modal {
                    background: white;
                    width: 100%;
                    max-width: 500px;
                    max-height: 85vh;
                    overflow-y: auto;
                    padding: 1.25rem 1.25rem 1rem;
                    border-radius: 18px;
                    animation: fadeInUp 0.3s ease-out;
                }

                .camp-details-modal {
                    background: white;
                    width: 100%;
                    max-width: 560px;
                    padding: 2rem;
                    border-radius: 18px;
                    animation: fadeInUp 0.3s ease-out;
                }

                .camp-modal-title {
                    margin-bottom: 1rem;
                    font-size: 1.4rem;
                    font-weight: 700;
                }

                .camp-form-grid-3 {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.75rem;
                }

                .camp-form-actions {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 1.25rem;
                    position: sticky;
                    bottom: 0;
                    background: white;
                    padding-top: 0.75rem;
                }

                .camp-form-actions button {
                    flex: 1;
                }

                .camp-details-actions {
                    display: flex;
                    gap: 1rem;
                }

                .camp-details-actions button {
                    flex: 1;
                }

                .camp-modal .input-group {
                    margin-bottom: 0.85rem;
                }

                .camp-modal .input-label {
                    display: block;
                    margin-bottom: 0.35rem;
                    font-weight: 600;
                    font-size: 0.95rem;
                }

                .camp-modal .input-field {
                    width: 100%;
                    padding: 0.75rem 0.9rem;
                    border: 1px solid #D1D5DB;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    outline: none;
                    box-sizing: border-box;
                }

                .camp-modal .input-field:focus {
                    border-color: #e11d48;
                    box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.12);
                }

                @media (max-width: 768px) {
                    .camp-page-container {
                        padding: 1.25rem 0.75rem;
                    }

                    .camp-page-header {
                        align-items: flex-start;
                    }

                    .camp-header-actions {
                        width: 100%;
                    }

                    .camp-header-actions button {
                        flex: 1;
                    }

                    .camp-search-box {
                        max-width: 100%;
                    }

                    .camp-list-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }

                    .camp-modal {
                        max-width: 95%;
                        max-height: 88vh;
                        padding: 1rem;
                    }

                    .camp-details-modal {
                        max-width: 95%;
                        padding: 1rem;
                    }

                    .camp-form-grid-3 {
                        grid-template-columns: 1fr;
                        gap: 0.5rem;
                    }

                    .camp-form-actions,
                    .camp-details-actions {
                        flex-direction: column;
                    }

                    .camp-form-actions button,
                    .camp-details-actions button {
                        width: 100%;
                    }
                }
            `}</style>

            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: `linear-gradient(rgba(240, 244, 255, 0.72), rgba(255, 228, 230, 0.72)), url(${campsBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />

            <div className="container camp-page-container">
                <div className="camp-page-header">
                    <div style={{ flex: 1, minWidth: '280px' }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Donation Camps</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Find a donation event near you</p>

                           <div className="camp-search-box">
                            <input
                                type="text"
                                className="camp-search-input"
                                placeholder="Search by camp name or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                    </div>
                    
                    <div className="camp-header-actions">
                        {isAdmin && (
                            <button className="btn btn-primary" onClick={openCreateModal}>
                                + Add New Camp
                            </button>
                        )}

                        <button
                            className="btn"
                            style={{ border: '1px solid #E2E8F0' }}
                            onClick={() => navigate(-1)}
                        >
                            Back
                        </button>

                    </div>
                    
                </div>

                <div className="camp-list-grid">
                    {filteredAndSortedCamps.map(camp => (
                        <div
                            key={camp.id}
                            className="glass-panel"
                            style={{
                                padding: '0',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div
                                style={{
                                    height: '8px',
                                    width: '100%',
                                    background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)'
                                }}
                            />
                            <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'start',
                                        marginBottom: '1rem',
                                        gap: '1rem'
                                    }}
                                >
                                    <h3 style={{ fontSize: '1.25rem' }}>{camp.name}</h3>
                                    <div
                                        style={{
                                            ...getStatusStyle(camp.campStatus),
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {camp.campStatus || 'UPCOMING'}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span>📍</span>
                                    <span>{camp.location} ({camp.district}, {camp.province})</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span>📅</span>
                                    <span>{new Date(camp.date).toLocaleDateString()}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                                    <span>⏰</span>
                                    <span>{camp.startTime || camp.time || 'TBD'} - {camp.endTime || 'TBD'}</span>
                                </div>

                                {isAdmin && (
                                    <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>
                                        Interested: {camp.interestCount || 0}
                                    </div>
                                )}

                                <div style={{ marginTop: 'auto' }}>
                                    <button
                                        className="btn"
                                        style={{
                                            width: '100%',
                                            background: '#FFF1F2',
                                            color: 'var(--primary)',
                                            fontWeight: '600'
                                        }}
                                        onClick={() => setSelectedCamp(camp)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredAndSortedCamps.length === 0 && !loading && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No matching camps found.
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="camp-modal-overlay">
                        <div className="glass-panel camp-modal">
                            <h2 className="camp-modal-title">
                                {isEditMode ? 'Edit Donation Camp' : 'Add New Donation Camp'}
                            </h2>

                            <form onSubmit={handleCreateOrUpdateCamp}>
                                <div className="input-group">
                                    <label className="input-label">Camp Name</label>
                                    <input
                                        className="input-field"
                                        required
                                        maxLength={80}
                                        value={newCamp.name}
                                        onChange={e => {
                                            const value = e.target.value;
                                            setNewCamp({ ...newCamp, name: value });
                                            setFormErrors(prev => ({
                                                ...prev,
                                                name: validateCampName(value)
                                            }));
                                        }}
                                        onBlur={() =>
                                            setFormErrors(prev => ({
                                                ...prev,
                                                name: validateCampName(newCamp.name)
                                            }))
                                        }
                                    />
                                    {formErrors.name && (
                                        <small style={{ color: '#DC2626', display: 'block', marginTop: '0.35rem' }}>
                                            {formErrors.name}
                                        </small>
                                    )}
                                </div>
                                
                                <div className="input-group">
                                    <label className="input-label">Province</label>
                                    <select
                                        className="input-field"
                                        value={newCamp.province}
                                        onChange={e => {
                                            const province = e.target.value;
                                            const firstDistrict = getDistrictsByProvince(province)[0];
                                            setNewCamp({
                                                ...newCamp,
                                                province,
                                                district: firstDistrict,
                                                nearestHospital: ''
                                            });
                                        }}
                                    >
                                        {provinces.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">District</label>
                                    <select
                                        className="input-field"
                                        value={newCamp.district}
                                        onChange={e => {
                                            const district = e.target.value;
                                            setNewCamp({ ...newCamp, district, nearestHospital: '' });
                                        }}
                                    >
                                        {districts.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Nearest Hospital</label>
                                    <select
                                        className="input-field"
                                        value={newCamp.nearestHospital}
                                        onChange={e => setNewCamp({ ...newCamp, nearestHospital: e.target.value })}
                                    >
                                        {hospitals.length === 0 && <option value="">No hospitals available</option>}
                                        {hospitals.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Location</label>
                                    <input
                                        className="input-field"
                                        required
                                        maxLength={120}
                                        value={newCamp.location}
                                        onChange={e => {
                                            const value = e.target.value;
                                            setNewCamp({ ...newCamp, location: value });
                                            setFormErrors(prev => ({
                                                ...prev,
                                                location: validateLocation(value)
                                            }));
                                        }}
                                        onBlur={() =>
                                            setFormErrors(prev => ({
                                                ...prev,
                                                location: validateLocation(newCamp.location)
                                            }))
                                        }
                                    />
                                    {formErrors.location && (
                                        <small style={{ color: '#DC2626', display: 'block', marginTop: '0.35rem' }}>
                                            {formErrors.location}
                                        </small>
                                    )}
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Google Location Link</label>
                                    <input
                                        className="input-field"
                                        placeholder="https://maps.google.com/..."
                                        value={newCamp.googleMapLink}
                                        onChange={e => {
                                            const value = e.target.value;

                                            setNewCamp({ ...newCamp, googleMapLink: value });

                                            const pattern = /^(https?:\/\/)?(www\.)?(google\.com\/maps\/(place|search|@)|maps\.google\.com\/|goo\.gl\/maps\/).+/;

                                            setFormErrors(prev => ({
                                                ...prev,
                                                googleMapLink: !value
                                                    ? "Google Maps link is required"
                                                    : !pattern.test(value)
                                                        ? "Please enter a valid Google Maps location link"
                                                        : ""
                                            }));
                                        }}
                                        onBlur={() => {
                                            const value = newCamp.googleMapLink;

                                            const pattern = /^(https?:\/\/)?(www\.)?(google\.com\/maps\/(place|search|@)|maps\.google\.com\/|goo\.gl\/maps\/).+/;

                                            setFormErrors(prev => ({
                                                ...prev,
                                                googleMapLink: !value
                                                    ? "Google Maps link is required"
                                                    : !pattern.test(value)
                                                        ? "Please enter a valid Google Maps location link"
                                                        : ""
                                            }));
                                        }}
                                    />
                                    {formErrors.googleMapLink && (
                                        <small style={{ color: '#DC2626', display: 'block', marginTop: '0.35rem' }}>
                                            {formErrors.googleMapLink}
                                        </small>
                                    )}
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Interested Count</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="250"
                                        step="1"
                                        className="input-field"
                                        value={newCamp.interestCount}
                                        onChange={e => {
                                            const value = e.target.value;
                                            setNewCamp({
                                                ...newCamp,
                                                interestCount: value
                                            });
                                            setFormErrors(prev => ({
                                                ...prev,
                                                interestCount: validateInterestCount(value)
                                            }));
                                        }}
                                        onBlur={() =>
                                            setFormErrors(prev => ({
                                                ...prev,
                                                interestCount: validateInterestCount(newCamp.interestCount)
                                            }))
                                        }
                                    />
                                    {formErrors.interestCount && (
                                        <small style={{ color: '#DC2626', display: 'block', marginTop: '0.35rem' }}>
                                            {formErrors.interestCount}
                                        </small>
                                    )}
                                </div>

                                <div className="camp-form-grid-3">
                                    <div className="input-group">
                                        <label className="input-label">Date</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            required
                                            value={newCamp.date}
                                            min={minCampDateValue}
                                            max={maxCampDateValue}
                                            onChange={e => {
                                                const value = e.target.value;
                                                setNewCamp({ ...newCamp, date: value });
                                                setFormErrors(prev => ({
                                                    ...prev,
                                                    date: validateCampDate(value)
                                                }));
                                            }}
                                            onBlur={() =>
                                                setFormErrors(prev => ({
                                                    ...prev,
                                                    date: validateCampDate(newCamp.date)
                                                }))
                                            }
                                        />
                                        {formErrors.date && (
                                            <small style={{ color: '#DC2626', display: 'block', marginTop: '0.35rem' }}>
                                                {formErrors.date}
                                            </small>
                                        )}
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Start Time</label>
                                        <input
                                            type="time"
                                            className="input-field"
                                            required
                                            value={newCamp.startTime}
                                            onChange={e => setNewCamp({ ...newCamp, startTime: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">End Time</label>
                                        <input
                                            type="time"
                                            className="input-field"
                                            required
                                            value={newCamp.endTime}
                                            onChange={e => setNewCamp({ ...newCamp, endTime: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="camp-form-actions">
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={closeModal}
                                        style={{ border: '1px solid #E2E8F0' }}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {isEditMode ? 'Update Camp' : 'Create Camp'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {selectedCamp && (
                    <div className="camp-modal-overlay">
                        <div className="glass-panel camp-details-modal">
                            <h2 style={{ marginBottom: '1rem' }}>{selectedCamp.name}</h2>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                    marginBottom: '1.5rem',
                                    color: 'var(--secondary)'
                                }}
                            >
                                <div>📍 {selectedCamp.location} ({selectedCamp.district}, {selectedCamp.province})</div>
                                <div>🏥 Nearest: {selectedCamp.nearestHospital || 'N/A'}</div>
                                <div>📅 {new Date(selectedCamp.date).toLocaleDateString()}</div>
                                <div>⏰ {selectedCamp.startTime || selectedCamp.time || 'TBD'} - {selectedCamp.endTime || 'TBD'}</div>
                                <div>Interested: {selectedCamp.interestCount || 0}</div>
                                <a
                                    href={
                                        selectedCamp.googleMapLink ||
                                        (selectedCamp.lat && selectedCamp.lng
                                            ? `https://www.google.com/maps?q=${selectedCamp.lat},${selectedCamp.lng}`
                                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCamp.location)}`)
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        color: 'var(--primary)',
                                        textDecoration: 'none',
                                        fontWeight: '600'
                                    }}
                                >
                                    Open in Google Maps
                                </a>
                            </div>

                            <div className="camp-details-actions">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setSelectedCamp(null)}
                                    style={{ border: '1px solid #E2E8F0' }}
                                >
                                    Close
                                </button>

                                {isAdmin && (
                                    <button
                                        type="button"
                                        className="btn"
                                        style={{ background: '#E0F2FE', color: '#0369A1' }}
                                        onClick={() => openEditModal(selectedCamp)}
                                    >
                                        Edit Camp
                                    </button>
                                )}

                                {isAdmin ? (
                                    <button
                                        type="button"
                                        className="btn"
                                        style={{ background: '#FEE2E2', color: '#B91C1C' }}
                                        onClick={() => handleDeleteCamp(selectedCamp.id)}
                                    >
                                        Delete Camp
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => handleInterest(selectedCamp.id)}
                                        disabled={interestSubmitting}
                                    >
                                        {interestSubmitting ? 'Submitting...' : "I'm Interested"}
                                    </button>  
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampMap;
