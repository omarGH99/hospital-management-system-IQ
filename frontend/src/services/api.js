import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
  register: (data) => api.post('/auth/register', data),
};

// ── Appointments ──────────────────────────────────────────
export const appointmentApi = {
  list:         (params) => api.get('/appointments', { params }),
  stats:        ()       => api.get('/appointments/stats'),
  get:          (id)     => api.get(`/appointments/${id}`),
  create:       (data)   => api.post('/appointments', data),
  updateStatus: (id, data) => api.patch(`/appointments/${id}/status`, data),
  slots:        (doctorId, date) => api.get(`/doctors/${doctorId}/slots`, { params: { date } }),
};

// ── Doctors ───────────────────────────────────────────────
export const doctorApi = {
  list:      (params) => api.get('/doctors', { params }),
  get:       (id)     => api.get(`/doctors/${id}`),
  create:    (data)   => api.post('/doctors', data),
  update:    (id, data) => api.put(`/doctors/${id}`, data),
  dashboard: ()       => api.get('/doctor/dashboard'),
};

// ── Departments ───────────────────────────────────────────
export const departmentApi = {
  list: () => api.get('/departments'),
};

// ── Patients ──────────────────────────────────────────────
export const patientApi = {
  list:    (params) => api.get('/patients', { params }),
  get:     (id)     => api.get(`/patients/${id}`),
  history: (id)     => api.get(`/patients/${id}/history`),
};

// ── Medical Records ───────────────────────────────────────
export const recordApi = {
  list:   (params) => api.get('/medical-records', { params }),
  create: (data) => api.post('/medical-records', data),
  get:    (id)   => api.get(`/medical-records/${id}`),
};

// ── Prescriptions ─────────────────────────────────────────
export const prescriptionApi = {
  create:      (data) => api.post('/prescriptions', data),
  downloadPdf: (id)   => api.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' }),
};

// ── Invoices ──────────────────────────────────────────────
export const invoiceApi = {
  list:        (params) => api.get('/invoices', { params }),
  markPaid:    (id, data) => api.patch(`/invoices/${id}/pay`, data),
  downloadPdf: (id)   => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

// ── Admin ─────────────────────────────────────────────────
export const adminApi = {
  stats: () => api.get('/dashboard/stats'),
};

export default api;
