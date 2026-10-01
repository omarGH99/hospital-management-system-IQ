import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthProvider, { useAuth } from './context/AuthContext';
import { Sidebar, Topbar } from './components/shared';
import Login from './pages/Login';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Appointments from './pages/admin/Appointments';
import { Doctors, Patients, Invoices } from './pages/admin/AdminPages';

// Doctor pages
import { DoctorDashboard, DoctorSchedule, DoctorRecords } from './pages/doctor/DoctorPages';

// Patient pages
import { PatientDashboard, PatientAppointments, PatientRecords, PatientPrescriptions, PatientInvoices } from './pages/patient/PatientPages';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

const PAGE_TITLES = {
  dashboard: { admin: 'Dashboard', doctor: 'Doctor Dashboard', receptionist: 'Dashboard', patient: 'My Overview' },
  appointments: { admin: 'Appointments', receptionist: 'Appointments', patient: 'My Appointments' },
  schedule: { doctor: 'My Schedule' },
  doctors: { admin: 'Doctors' },
  patients: { admin: 'Patients', doctor: 'My Patients', receptionist: 'Patients' },
  records: { doctor: 'Medical Records', patient: 'My Records' },
  prescriptions: { patient: 'My Prescriptions' },
  invoices: { admin: 'Invoices', receptionist: 'Invoices', patient: 'My Invoices' },
};

function AppInner() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false); // mobile drawer
  // The current page lives in the URL (/appointments, /doctors, ...) so refresh, back and deep links work
  const page = location.pathname.replace(/^\//, '').split('/')[0] || 'dashboard';
  const setPage = (id) => navigate('/' + id);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Login onLogin={() => navigate('/dashboard')} />;

  const renderPage = () => {
    // ADMIN & RECEPTIONIST
    if (user.role === 'admin' || user.role === 'receptionist') {
      switch (page) {
        case 'dashboard':    return <AdminDashboard setPage={setPage} />;
        case 'appointments': return <Appointments />;
        case 'doctors':      return user.role === 'admin' ? <Doctors /> : null;
        case 'patients':     return <Patients />;
        case 'invoices':     return <Invoices />;
        default:             return <AdminDashboard setPage={setPage} />;
      }
    }

    // DOCTOR
    if (user.role === 'doctor') {
      switch (page) {
        case 'dashboard': return <DoctorDashboard />;
        case 'schedule':  return <DoctorSchedule />;
        case 'patients':  return <Patients />;
        case 'records':   return <DoctorRecords />;
        default:          return <DoctorDashboard />;
      }
    }

    // PATIENT
    if (user.role === 'patient') {
      switch (page) {
        case 'dashboard':     return <PatientDashboard setPage={setPage} />;
        case 'appointments':  return <PatientAppointments />;
        case 'records':       return <PatientRecords />;
        case 'prescriptions': return <PatientPrescriptions />;
        case 'invoices':      return <PatientInvoices />;
        default:              return <PatientDashboard setPage={setPage} />;
      }
    }

    return null;
  };

  const title = PAGE_TITLES[page]?.[user.role] || 'Dashboard';
  const subtitle = { admin: 'Riverside General Hospital', doctor: 'Doctor Portal', receptionist: 'Reception Desk', patient: 'Patient Portal' }[user.role];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {navOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setNavOpen(false)} />}
      <Sidebar page={page} setPage={setPage} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar title={title} subtitle={subtitle} onMenu={() => setNavOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </QueryClientProvider>
  );
}
