const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

require('./models/User');
require('./models/Doctor');
require('./models/Appointment');
require('./models/Prescription');
require('./models/MedicalHistory');
require('./models/Message');
require('./models/Notification');
require('./jobs/cronJobs');

const Message      = require('./models/Message');
const Appointment  = require('./models/Appointment');
const Notification = require('./models/Notification');

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/doctors',       require('./routes/doctors'));
app.use('/api/appointments',  require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/medicalhistory',require('./routes/medicalhistory'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat',          require('./routes/chat'));

app.get('/', (req, res) => res.json({ message: 'MediConsult API is running ✅' }));

// ─── Socket.io — track room occupancy for absent-party alerts ───
const roomOccupants = {};  // { appointmentId: Set<socketId> }
const socketInfo    = {};  // { socketId: { appointmentId, userId, userName, role } }
const absentTimers  = {};  // { appointmentId: TimeoutRef }

io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  socket.on('join_room', async ({ appointmentId, userId, userName, role }) => {
    socket.join(appointmentId);
    if (!roomOccupants[appointmentId]) roomOccupants[appointmentId] = new Set();
    roomOccupants[appointmentId].add(socket.id);
    socketInfo[socket.id] = { appointmentId, userId, userName, role };

    const count = roomOccupants[appointmentId].size;

    if (count >= 2) {
      // Both parties present — cancel absent timer, notify room
      if (absentTimers[appointmentId]) {
        clearTimeout(absentTimers[appointmentId]);
        delete absentTimers[appointmentId];
      }
      io.to(appointmentId).emit('other_arrived', { userName, role });
    } else {
      // Only 1 person — start 2-min timer then fire absent alert
      absentTimers[appointmentId] = setTimeout(async () => {
        if ((roomOccupants[appointmentId]?.size || 0) < 2) {
          io.to(appointmentId).emit('other_absent', {
            message: `The other party hasn't joined yet. They have been notified.`
          });
          try {
            const appt = await Appointment.findById(appointmentId)
              .populate('patientId', '_id name')
              .populate({ path:'doctorId', populate:{ path:'userId', select:'_id name' } });
            if (appt) {
              const patientId    = appt.patientId._id.toString();
              const doctorUserId = appt.doctorId.userId._id.toString();
              const absentId     = userId === patientId ? doctorUserId : patientId;
              const presentName  = userId === patientId ? appt.patientId.name : `Dr. ${appt.doctorId.userId.name}`;
              await Notification.create({
                userId: absentId,
                title: '⚠️ Appointment Started',
                message: `${presentName} is waiting for you in the consultation room at ${appt.timeSlot}.`,
                type: 'reminder'
              });
            }
          } catch (err) { console.error('Absent notification error:', err.message); }
        }
      }, 2 * 60 * 1000);
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const { appointmentId, senderId, senderName, senderRole, message, type = 'text', fileName = null } = data;
      const newMessage = await Message.create({ appointmentId, senderId, senderName, senderRole, message, type, fileName });
      io.to(appointmentId).emit('receive_message', newMessage);
    } catch (error) { console.error('Socket message error:', error.message); }
  });

  socket.on('typing', (data) => socket.to(data.appointmentId).emit('user_typing', data));

  socket.on('end_session', async (data) => {
    try {
      const { appointmentId, endedBy } = data;
      await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' });
      const appt = await Appointment.findById(appointmentId)
        .populate('patientId', '_id name')
        .populate({ path:'doctorId', populate:{ path:'userId', select:'_id name' } });
      if (appt) {
        await Notification.create({ userId: appt.patientId._id, title: '✅ Consultation Ended',
          message: `Your consultation with Dr. ${appt.doctorId.userId.name} has ended. Check prescriptions for any medicines.`, type: 'appointment' });
        await Notification.create({ userId: appt.doctorId.userId._id, title: '✅ Consultation Ended',
          message: `Consultation with ${appt.patientId.name} has been completed successfully.`, type: 'appointment' });
      }
      io.to(appointmentId).emit('session_ended', { appointmentId, endedBy, endedAt: new Date() });
    } catch (error) { console.error('End session error:', error.message); }
  });

  socket.on('disconnect', () => {
    const info = socketInfo[socket.id];
    if (info) {
      const { appointmentId } = info;
      roomOccupants[appointmentId]?.delete(socket.id);
      if ((roomOccupants[appointmentId]?.size || 0) === 0) {
        delete roomOccupants[appointmentId];
        if (absentTimers[appointmentId]) { clearTimeout(absentTimers[appointmentId]); delete absentTimers[appointmentId]; }
      }
      delete socketInfo[socket.id];
    }
    console.log(`❌ Disconnected: ${socket.id}`);
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT, () => console.log(`✅ Server on http://localhost:${process.env.PORT}`));
  })
  .catch((err) => { console.error('❌ MongoDB error:', err.message); process.exit(1); });
