import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DonorEligibility from './DonorEligibility';
import axios from 'axios';
import {
    PROVINCES,
    getDefaultLocationSelection,
    getDistrictsByProvince
} from '../constants/locationData';
import loginBackground from '../assets/loginpage.png';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const defaults = getDefaultLocationSelection();
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [formData, setFormData] = useState({
        fullName: '',
        nicNo: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        bloodType: '',
        province: defaults.province,
        district: defaults.district,
        nearestHospital: '',
        isEligible: false
    });

    const provinces = PROVINCES;
    const districts = getDistrictsByProvince(formData.province);
    const [hospitals, setHospitals] = useState([]);

    useEffect(() => {
        if (!formData.province || !formData.district) {
            setHospitals([]);
            return;
        }
        axios.get('http://localhost:8080/api/hospitals', {
            params: {
                province: formData.province,
                district: formData.district
            }
        })
            .then(res => {
                const hospitalNames = (res.data || []).map(item => item.name);
                setHospitals(hospitalNames);
                setFormData(prev => ({
                    ...prev,
                    nearestHospital: hospitalNames.includes(prev.nearestHospital)
                        ? prev.nearestHospital
                        : (hospitalNames[0] || '')
                }));
            })
            .catch(err => {
                console.error('Failed to load hospitals', err);
                setHospitals([]);
                setFormData(prev => ({ ...prev, nearestHospital: '' }));
            });
    }, [formData.province, formData.district]);

    const validateStepOne = () => {
        const nextErrors = {};
        const nicPattern = /^([0-9]{9}[VvXx]|[0-9]{12})$/;
        const phonePattern = /^0\d{9}$/;
        const namePattern = /^[A-Za-z\s]{3,}$/; // letters and spaces, at least 3 chars
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,}$/;

        if (!formData.fullName.trim()) {
            nextErrors.fullName = 'Full name is required.';
        } else if (!namePattern.test(formData.fullName.trim())) {
            nextErrors.fullName = 'Enter a valid full name (letters and spaces only).';
        }

        if (!formData.nicNo.trim()) {
            nextErrors.nicNo = 'NIC No is required.';
        } else if (!nicPattern.test(formData.nicNo.trim())) {
            nextErrors.nicNo = 'Enter a valid NIC No.';
        }

        if (!formData.phoneNumber.trim()) {
            nextErrors.phoneNumber = 'Phone number is required.';
        } else if (!phonePattern.test(formData.phoneNumber.trim())) {
            nextErrors.phoneNumber = 'Enter a valid 10-digit phone number.';
        }

        if (!formData.password.trim()) {
            nextErrors.password = 'Password is required.';
        } else if (formData.password.length < 8) {
            nextErrors.password = 'Password must be at least 8 characters.';
        } else if (!passwordPattern.test(formData.password)) {
            nextErrors.password = 'Password must include uppercase, lowercase, number, and special character.';
        }

        if (!formData.confirmPassword.trim()) {
            nextErrors.confirmPassword = 'Confirm password is required.';
        } else if (formData.password !== formData.confirmPassword) {
            nextErrors.confirmPassword = 'Password and confirm password must match.';
        }

        return nextErrors;
    };

    const handleInfoSubmit = (e) => {
        e.preventDefault();
        const nextErrors = validateStepOne();
        setFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setError('Please correct the highlighted fields.');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleEligibilityComplete = (isEligible, healthData) => {
        // We capture health data here if needed for backend
        if (isEligible) {
            setFormData(prev => ({ 
                ...prev, 
                isEligible: true,
                bloodType: healthData?.bloodType || prev.bloodType 
            }));
            // Add a small delay for UX
            setTimeout(() => setStep(3), 800);
        } else {
            // If not eligible, maybe warn them but let them register as user anyway? 
            // Requirement says "ask eligibility", usually if not eligible, they can't donate but can have account.
            // We'll proceed but mark as ineligible for donation.
            setFormData(prev => ({ ...prev, isEligible: false }));
            //setTimeout(() => setStep(3), 1500);
        }
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Password and confirm password must match.');
            return;
        }

        try {
            await register(formData);
            navigate('/dashboard');
        } catch (error) {
            setError(error?.response?.data?.message || 'Registration failed. Please check your details.');
        }
    };

    return (
        <div className="flex-center" style={{
            minHeight: '100vh',
            width: '100%',
            padding: '2rem 0',
            backgroundImage: `linear-gradient(rgba(240, 244, 255, 0.72), rgba(255, 228, 230, 0.72)), url(${loginBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#F0F4FF'
        }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem' }}>
                <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Join LifeLine</h1>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: step >= 1 ? 'var(--primary)' : '#E2E8F0' }}></div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: step >= 2 ? 'var(--primary)' : '#E2E8F0' }}></div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: step >= 3 ? 'var(--primary)' : '#E2E8F0' }}></div>
                    </div>
                </header>

                {error && (
                    <div style={{
                        background: '#FEF2F2',
                        color: '#DC2626',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleInfoSubmit}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Personal Information</h2>
                        <div className="input-group">
                            <label className="input-label">Full Name</label>
                            <input
                                className="input-field"
                                required
                                value={formData.fullName}
                                onChange={e => {
                                    setFormData({ ...formData, fullName: e.target.value });
                                    setFieldErrors(prev => ({ ...prev, fullName: '' }));
                                }}
                            />
                            {fieldErrors.fullName && (
                                <div style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                                    {fieldErrors.fullName}
                                </div>
                            )}
                        </div>
                        <div className="input-group">
                            <label className="input-label">NIC No</label>
                            <input
                                type="text"
                                className="input-field"
                                required
                                value={formData.nicNo}
                                onChange={e => {
                                    setFormData({ ...formData, nicNo: e.target.value });
                                    setFieldErrors(prev => ({ ...prev, nicNo: '' }));
                                }}
                                placeholder="Enter your NIC number"
                            />
                            {fieldErrors.nicNo && (
                                <div style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                                    {fieldErrors.nicNo}
                                </div>
                            )}
                        </div>
                        <div className="input-group">
                            <label className="input-label">Phone Number</label>
                            <input
                                type="text"
                                className="input-field"
                                required
                                value={formData.phoneNumber}
                                onChange={e => {
                                    setFormData({ ...formData, phoneNumber: e.target.value });
                                    setFieldErrors(prev => ({ ...prev, phoneNumber: '' }));
                                }}
                                placeholder="07XXXXXXXX"
                            />
                            {fieldErrors.phoneNumber && (
                                <div style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                                    {fieldErrors.phoneNumber}
                                </div>
                            )}
                        </div>
                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <input
                                type="password"
                                className="input-field"
                                required
                                value={formData.password}
                                onChange={e => {
                                    setFormData({ ...formData, password: e.target.value });
                                    setFieldErrors(prev => ({ ...prev, password: '', confirmPassword: '' }));
                                }}
                            />
                            {fieldErrors.password && (
                                <div style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                                    {fieldErrors.password}
                                </div>
                            )}
                        </div>
                        <div className="input-group">
                            <label className="input-label">Confirm Password</label>
                            <input
                                type="password"
                                className="input-field"
                                required
                                value={formData.confirmPassword}
                                onChange={e => {
                                    setFormData({ ...formData, confirmPassword: e.target.value });
                                    setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                                }}
                            />
                            {fieldErrors.confirmPassword && (
                                <div style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                                    {fieldErrors.confirmPassword}
                                </div>
                            )}
                        </div>


                        <button className="btn btn-primary" style={{ width: '100%' }}>Next: Check Eligibility</button>
                    </form>
                )}

                {step === 2 && (
                    <div>
                        <DonorEligibility onComplete={handleEligibilityComplete} />
                    </div>
                )}

                {step === 3 && (
                    <form onSubmit={handleFinalSubmit}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Final Step: Location</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            We need your location to find the nearest hospital in case of emergency or donation camps.
                        </p>

                        <div className="input-group">
                            <label className="input-label">Province</label>
                            <select
                                className="input-field"
                                required
                                value={formData.province}
                                onChange={e => {
                                    const province = e.target.value;
                                    const firstDistrict = getDistrictsByProvince(province)[0];
                                    setFormData({
                                        ...formData,
                                        province,
                                        district: firstDistrict,
                                        nearestHospital: ''
                                    });
                                }}
                            >
                                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">District</label>
                            <select
                                className="input-field"
                                required
                                value={formData.district}
                                onChange={e => {
                                    const district = e.target.value;
                                    setFormData({ ...formData, district, nearestHospital: '' });
                                }}
                            >
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Nearest Hospital</label>
                            <select
                                className="input-field"
                                required
                                value={formData.nearestHospital}
                                onChange={e => setFormData({ ...formData, nearestHospital: e.target.value })}
                            >
                                {hospitals.length === 0 && <option value="">No hospitals available</option>}
                                {hospitals.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%' }}>Create Account</button>
                    </form>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    Already have an account? <Link to="/" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
