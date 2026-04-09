import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home            from './pages/Home';
import Register        from './pages/Register';
import Login           from './pages/Login';
import DoctorList      from './pages/DoctorList';
import DoctorViewProfile from './pages/DoctorViewProfile';
import BookAppointment from './pages/BookAppointment';
import Payment         from './pages/Payment';
import Chat            from './pages/Chat';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard  from './pages/DoctorDashboard';
import PatientProfile   from './pages/patientProfile';
import DoctorProfile    from './pages/DoctorProfile';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"                                          element={<Home />} />
          <Route path="/register"                                  element={<Register />} />
          <Route path="/login"                                     element={<Login />} />
          <Route path="/doctors"                                   element={<DoctorList />} />
          <Route path="/doctor/:id"                                element={<DoctorViewProfile />} />
          <Route path="/book/:doctorId"                            element={<BookAppointment />} />
          <Route path="/payment/:appointmentId/:doctorId/:amount"  element={<Payment />} />
          <Route path="/chat/:appointmentId"                       element={<Chat />} />
          <Route path="/dashboard/patient"                         element={<PatientDashboard />} />
          <Route path="/dashboard/doctor"                          element={<DoctorDashboard />} />
          <Route path="/profile/patient"                           element={<PatientProfile />} />
          <Route path="/profile/doctor"                            element={<DoctorProfile />} />
          <Route path="*"                                          element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
