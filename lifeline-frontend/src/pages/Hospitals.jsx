import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import hospitalsBackground from '../assets/hospitals.jpg';
import { PROVINCES, getDefaultLocationSelection, getDistrictsByProvince } from '../constants/locationData';

const Hospitals = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const defaults = getDefaultLocationSelection();
    const initialHospitalState = {
        name: '',
        province: defaults.province,
        district: defaults.district,
        address: '',
        contactNumber: ''
    };

    const [hospitals, setHospitals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newHospital, setNewHospital] = useState(initialHospitalState);
    const [formErrors, setFormErrors] = useState({});

    const districts = useMemo(() => getDistrictsByProvince(newHospital.province), [newHospital.province]);

    const filteredHospitals = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return hospitals;

        return hospitals.filter((hospital) => {
            const haystack = [
                hospital.name,
                hospital.district,
                hospital.province,
                hospital.address,
                hospital.contactNumber
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [hospitals, searchTerm]);

    const fetchHospitals = () => {
        setLoading(true);
        axios.get('http://localhost:8080/api/hospitals')
            .then(res => {
                setHospitals(res.data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading hospitals', err);
                setHospitals([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchHospitals();
    }, []);

    const validateHospitalField = (field, value) => {
        const trimmedValue = String(value || '').trim();

        if (field === 'name') {
            if (!trimmedValue) return 'Hospital name is required.';
            if (trimmedValue.length < 3) return 'Hospital name must be at least 3 characters.';
            if (!/^[A-Za-z\s]+$/.test(trimmedValue)) {
                return 'Hospital name can only contain letters and spaces.';
            }
        }

        if (field === 'address') {
            if (!trimmedValue) return 'Address is required.';
            if (trimmedValue.length < 8) return 'Address must be at least 8 characters.';
            if (!/[A-Za-z]/.test(trimmedValue) || !/\d/.test(trimmedValue)) {
                return 'Address must include both letters and numbers.';
            }
            if (!/^[A-Za-z0-9\s,/-]+$/.test(trimmedValue)) {
                return 'Address contains invalid characters.';
            }
        }

        if (field === 'contactNumber') {
            if (!trimmedValue) return 'Contact number is required.';
            if (!/^[0-9+\-\s()]+$/.test(trimmedValue)) {
                return 'Contact number can only contain digits and phone symbols.';
            }

            const digitsOnly = trimmedValue.replace(/\D/g, '');
            if (digitsOnly.length < 9 || digitsOnly.length > 12) {
                return 'Contact number must contain 9 to 12 digits.';
            }
        }

        return '';
    };

    const validateHospitalForm = () => {
        const nextErrors = {
            name: validateHospitalField('name', newHospital.name),
            address: validateHospitalField('address', newHospital.address),
            contactNumber: validateHospitalField('contactNumber', newHospital.contactNumber)
        };

        setFormErrors(nextErrors);
        return !Object.values(nextErrors).some(Boolean);
    };

    const handleFieldChange = (field, value) => {
        setNewHospital(prev => ({ ...prev, [field]: value }));
        setFormErrors(prev => ({
            ...prev,
            [field]: validateHospitalField(field, value)
        }));
    };

    const closeModal = () => {
        setShowModal(false);
        setNewHospital(initialHospitalState);
        setFormErrors({});
    };

    const handleCreateHospital = async (e) => {
        e.preventDefault();
        if (!validateHospitalForm()) {
            return;
        }

        try {
            await axios.post('http://localhost:8080/api/hospitals', {
                ...newHospital,
                name: newHospital.name.trim(),
                address: newHospital.address.trim(),
                contactNumber: newHospital.contactNumber.trim()
            });
            closeModal();
            fetchHospitals();
            alert('Hospital added successfully.');
        } catch (error) {
            console.error(error);
            const msg = error?.response?.data?.message;
            alert(msg || 'Failed to create hospital.');
        }
    };

    const handleDeleteHospital = async (hospitalId) => {
        if (!window.confirm('Delete this hospital?')) return;
        try {
            await axios.delete(`http://localhost:8080/api/hospitals/${hospitalId}`);
            fetchHospitals();
        } catch (error) {
            console.error(error);
            alert('Failed to delete hospital.');
        }
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%', position: 'relative', backgroundColor: '#F0F4FF' }}>
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: `linear-gradient(rgba(240, 244, 255, 0.72), rgba(255, 228, 230, 0.72)), url(${hospitalsBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />
            <div className="container" style={{ position: 'relative', zIndex: 1, padding: '2rem 1rem' }}>
                <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>Hospitals</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage hospitals used in requests and bookings</p>
                        <input
                            className="input-field"
                            type="text"
                            placeholder="Search hospital"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ marginTop: '0.75rem', maxWidth: '360px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {isAdmin && (
                            <button className="btn btn-primary" onClick={() => {
                                setShowModal(true);
                                setFormErrors({});
                            }}>+ Add New Hospital</button>
                        )}
                        <button className="btn" style={{ border: '1px solid #E2E8F0' }} onClick={() => navigate(-1)}>Back</button>
                    </div>
                </header>

                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    {loading && <div style={{ color: 'var(--text-muted)' }}>Loading hospitals...</div>}
                    {!loading && hospitals.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No hospitals found.</div>}
                    {!loading && hospitals.length > 0 && filteredHospitals.length === 0 && (
                        <div style={{ color: 'var(--text-muted)' }}>No hospitals match your search.</div>
                    )}

                    {!loading && filteredHospitals.length > 0 && (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {filteredHospitals.map(hospital => (
                                <div key={hospital.id} className="glass-panel" style={{ padding: '0.9rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{hospital.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                {hospital.district}, {hospital.province}
                                            </div>
                                            {hospital.address && (
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{hospital.address}</div>
                                            )}
                                            {hospital.contactNumber && (
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Contact: {hospital.contactNumber}</div>
                                            )}
                                        </div>
                                        {isAdmin && (
                                            <button
                                                className="btn"
                                                style={{ border: '1px solid #FCA5A5', color: '#B91C1C' }}
                                                onClick={() => handleDeleteHospital(hospital.id)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ background: 'white', padding: '2rem', width: '100%', maxWidth: '560px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Add New Hospital</h2>
                        <form onSubmit={handleCreateHospital}>
                            <div className="input-group">
                                <label className="input-label">Hospital Name</label>
                                <input
                                    className="input-field"
                                    required
                                    value={newHospital.name}
                                    onChange={e => handleFieldChange('name', e.target.value)}
                                    onBlur={e => handleFieldChange('name', e.target.value)}
                                />
                                {formErrors.name && <div style={{ color: '#B91C1C', fontSize: '0.875rem', marginTop: '0.35rem' }}>{formErrors.name}</div>}
                            </div>
                            <div className="input-group">
                                <label className="input-label">Province</label>
                                <select
                                    className="input-field"
                                    value={newHospital.province}
                                    onChange={e => {
                                        const province = e.target.value;
                                        const firstDistrict = getDistrictsByProvince(province)[0] || '';
                                        setNewHospital({ ...newHospital, province, district: firstDistrict });
                                    }}
                                >
                                    {PROVINCES.map(province => <option key={province} value={province}>{province}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">District</label>
                                <select
                                    className="input-field"
                                    value={newHospital.district}
                                    onChange={e => setNewHospital({ ...newHospital, district: e.target.value })}
                                >
                                    {districts.map(district => <option key={district} value={district}>{district}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Address</label>
                                <input
                                    className="input-field"
                                    required
                                    value={newHospital.address}
                                    onChange={e => handleFieldChange('address', e.target.value)}
                                    onBlur={e => handleFieldChange('address', e.target.value)}
                                />
                                {formErrors.address && <div style={{ color: '#B91C1C', fontSize: '0.875rem', marginTop: '0.35rem' }}>{formErrors.address}</div>}
                            </div>
                            <div className="input-group">
                                <label className="input-label">Contact Number</label>
                                <input
                                    className="input-field"
                                    required
                                    value={newHospital.contactNumber}
                                    onChange={e => handleFieldChange('contactNumber', e.target.value)}
                                    onBlur={e => handleFieldChange('contactNumber', e.target.value)}
                                    placeholder="e.g. 011-2691111"
                                />
                                {formErrors.contactNumber && <div style={{ color: '#B91C1C', fontSize: '0.875rem', marginTop: '0.35rem' }}>{formErrors.contactNumber}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Hospital</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Hospitals;
