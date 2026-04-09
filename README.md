# MediConsult 🏥
### Online Doctor Consultation Platform

A full-stack MERN application that connects patients with doctors for online consultations, real-time chat, appointment booking, and prescription management.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://mediconsult-frontend.vercel.app |
| Backend API | https://mediconsult-backend.onrender.com |
| GitHub Repo | https://github.com/kanihasanjavi/online-consult |

---

## ✨ Features

### Patient Features
- Register and login securely
- Browse and search doctors by specialization
- Book appointments with available doctors
- Real-time chat with doctor during consultation
- View prescriptions after consultation
- Rate and review doctors
- View medical history
- Receive notifications

### Doctor Features
- Register and create professional profile
- Manage appointment requests (confirm/cancel)
- Real-time chat with patients
- Write and send prescriptions
- View patient medical history
- Receive notifications

---

## 🛠️ Tech Stack

### Frontend
- React 19
- React Router v7
- Axios
- Socket.io-client
- CSS3

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.io
- JWT Authentication
- bcryptjs
- node-cron

### Database
- MongoDB Atlas (Cloud)

### Deployment
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js installed
- MongoDB Atlas account

### 1. Clone the repository
```bash
git clone https://github.com/kanihasanjavi/online-consult.git
cd online-consult
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create `.env` file in backend folder:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
```

Run backend:
```bash
npm start
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm start
```

### 4. Open in browser