import axios from 'axios';

const API = axios.create({ baseURL: 'https://mediconsult-backend.onrender.com/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('mediconsult_token');
  if (token) config.headers.authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──
export const registerUser  = (data) => API.post('/auth/register', data);
export const loginUser     = (data) => API.post('/auth/login', data);
export const getMyProfile  = ()     => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);

// ── Doctors ──
export const getDoctors          = ()       => API.get('/doctors');
export const getDoctorById       = (id)     => API.get(`/doctors/${id}`);
export const getDoctorByUserId   = (userId) => API.get(`/doctors/user/${userId}`);
export const createDoctorProfile = (data)   => API.post('/doctors', data);
export const updateDoctorProfile = (data)   => API.put('/doctors/profile', data);
export const setDoctorAvailability = (data) => API.put('/doctors/availability', data);

// ── Appointments ──
export const bookAppointment         = (data)       => API.post('/appointments', data);
export const getMyAppointments       = (userId)     => API.get(`/appointments/${userId}`);
export const getDoctorAppointments   = (doctorId)   => API.get(`/appointments/doctor/${doctorId}`);
export const updateAppointmentStatus = (id, data)   => API.put(`/appointments/${id}/status`, data);
export const cancelAppointment       = (id, data)   => API.put(`/appointments/${id}/cancel`, data);
export const rescheduleAppointment   = (id, data)   => API.put(`/appointments/${id}/reschedule`, data);
export const payAppointment          = (id)         => API.put(`/appointments/${id}/pay`);
export const getAvailableSlots       = (docId, date)=> API.get(`/appointments/slots/${docId}?date=${date}`);
export const getDoctorSchedule       = (docId, date)=> API.get(`/appointments/doctor/${docId}/schedule?date=${date}`);
export const checkChatAccess         = (id)         => API.get(`/appointments/${id}/chat-access`);
export const rateAppointment          = (id, data)   => API.put(`/appointments/${id}/rate`, data);

// ── Prescriptions ──
export const createPrescription    = (data)      => API.post('/prescriptions', data);
export const getMyPrescriptions    = (patientId) => API.get(`/prescriptions/${patientId}`);
export const getApptPrescription   = (apptId)    => API.get(`/prescriptions/check/${apptId}`);

// ── Medical History ──
export const getMedicalHistory    = (patientId) => API.get(`/medicalhistory/${patientId}`);
export const addMedicalHistory    = (data)      => API.post('/medicalhistory', data);
export const updateMedicalHistory = (id, data)  => API.put(`/medicalhistory/${id}`, data);
export const deleteMedicalHistory = (id)        => API.delete(`/medicalhistory/${id}`);

// ── Notifications ──
export const getNotifications      = (userId) => API.get(`/notifications/${userId}`);
export const markNotificationsRead = (userId) => API.put(`/notifications/read/${userId}`);

// ── Chat ──
export const getChatHistory = (appointmentId) => API.get(`/chat/${appointmentId}`);