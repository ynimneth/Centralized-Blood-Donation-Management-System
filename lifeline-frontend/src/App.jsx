import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InventoryDashboard from './pages/InventoryDashboard';
import DonorDashboard from './pages/DonorDashboard';
import BookAppointment from './pages/BookAppointment';
import Appointments from './pages/Appointments';
import CampMap from './pages/CampMap';
import EmergencyRequests from './pages/EmergencyRequests';
import EmergencyAlerts from './pages/EmergencyAlerts';
import LabDashboard from './pages/LabDashboard';
import Hospitals from './pages/Hospitals';
import CredentialManagement from './pages/CredentialManagement';
import PublicDetails from './pages/PublicDetails';
import PublicSectionPage from './pages/PublicSectionPage';
import TransportManagement from './pages/TransportManagement';
import Chatbot from './components/Chatbot';
import './App.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<PublicDetails />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/details" element={<PublicDetails />} />
                    <Route path="/about-us" element={<PublicSectionPage />} />
                    <Route path="/services" element={<PublicSectionPage />} />
                    <Route path="/events-news" element={<PublicSectionPage />} />
                    <Route path="/publications" element={<PublicSectionPage />} />
                    <Route path="/for-donors" element={<PublicSectionPage />} />
                    <Route path="/contact-us" element={<PublicSectionPage />} />
                    <Route path="/more" element={<PublicSectionPage />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/inventory" element={
                        <ProtectedRoute roles={['ADMIN', 'LAB']}>
                            <InventoryDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/lab" element={
                        <ProtectedRoute roles={['ADMIN', 'LAB']}>
                            <LabDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/donors" element={
                        <ProtectedRoute>
                            <DonorDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/appointments/book" element={
                        <ProtectedRoute>
                            <BookAppointment />
                        </ProtectedRoute>
                    } />
                    <Route path="/appointments" element={
                        <ProtectedRoute>
                            <Appointments />
                        </ProtectedRoute>
                    } />

                    <Route path="/camps" element={
                        <ProtectedRoute>
                            <CampMap />
                        </ProtectedRoute>
                    } />

                    <Route path="/emergency" element={
                        <ProtectedRoute roles={['ADMIN', 'HOSPITAL']}>
                            <EmergencyRequests />
                        </ProtectedRoute>
                    } />

                    <Route path="/emergency/alerts" element={
                        <ProtectedRoute>
                            <EmergencyAlerts />
                        </ProtectedRoute>
                    } />

                    <Route path="/hospital-requests" element={
                        <ProtectedRoute roles={['ADMIN', 'HOSPITAL']}>
                            <EmergencyRequests />
                        </ProtectedRoute>
                    } />

                    <Route path="/hospitals" element={
                        <ProtectedRoute roles={['ADMIN']}>
                            <Hospitals />
                        </ProtectedRoute>
                    } />

                    <Route path="/transport" element={
                        <ProtectedRoute roles={['ADMIN', 'HOSPITAL']}>
                            <TransportManagement />
                        </ProtectedRoute>
                    } />

                    <Route path="/credentials" element={
                        <ProtectedRoute roles={['ADMIN']}>
                            <CredentialManagement />
                        </ProtectedRoute>
                    } />
                </Routes>
                <Chatbot />
            </Router>
        </AuthProvider>
    );
}

export default App;
