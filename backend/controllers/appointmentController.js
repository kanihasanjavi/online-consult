const Appointment = require('../models/Appointment');
const Doctor      = require('../models/Doctor');
const { notify, notifyBoth } = require('../middleware/notifyHelper');

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const dayName = (date) => DAY_NAMES[new Date(date).getDay()];

exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'date query param required (YYYY-MM-DD)' });
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    const selectedDay = dayName(date);
    const dayConfig   = doctor.availability.find(a => a.day === selectedDay);
    if (!dayConfig || !dayConfig.slots.length)
      return res.json({ availableSlots: [], message: `Doctor not available on ${selectedDay}` });
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(date); endOfDay.setHours(23, 59, 59, 999);
    const booked = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    }).select('timeSlot');
    const bookedSlots = new Set(booked.map(b => b.timeSlot));
    const now = new Date();
    const availableSlots = dayConfig.slots.map(s => s.time).filter(slotTime => {
      if (bookedSlots.has(slotTime)) return false;
      const [time, meridiem] = slotTime.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (meridiem === 'PM' && h !== 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      const slotDate = new Date(date);
      slotDate.setHours(h, m, 0, 0);
      return slotDate > now;
    });
    res.json({ availableSlots, day: selectedDay });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getDoctorSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(date); endOfDay.setHours(23, 59, 59, 999);
    const appointments = await Appointment.find({ doctorId, date: { $gte: startOfDay, $lte: endOfDay } })
      .populate('patientId', 'name phone').sort({ date: 1 });
    res.json(appointments);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot, type, reason, paymentType } = req.body;
    const patientId = req.user.id;
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(date); endOfDay.setHours(23, 59, 59, 999);
    const slotTaken = await Appointment.findOne({ doctorId, timeSlot, date: { $gte: startOfDay, $lte: endOfDay }, status: { $in: ['pending','confirmed'] } });
    if (slotTaken) return res.status(400).json({ message: 'This slot is already booked. Please choose another.' });
    const appointment = await Appointment.create({ patientId, doctorId, date, timeSlot, type, reason, paymentType });
    const doctor = await Doctor.findById(doctorId).populate('userId', 'name');
    await notify(doctor.userId._id, '🔔 New Appointment Request',
      `New appointment request from ${req.user.name} on ${new Date(date).toDateString()} at ${timeSlot}`, 'appointment');
    res.status(201).json({ message: 'Appointment booked', appointment });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;
    const appt = await Appointment.findById(id)
      .populate('patientId', 'name _id')
      .populate({ path:'doctorId', populate:{ path:'userId', select:'name _id' } });
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    appt.status = status;
    if (cancellationReason) appt.cancellationReason = cancellationReason;
    if (status === 'cancelled') appt.cancelledBy = 'doctor';
    await appt.save();
    if (status === 'confirmed') {
      await notify(appt.patientId._id, '✅ Appointment Confirmed!',
        `Your appointment with Dr. ${appt.doctorId.userId.name} on ${new Date(appt.date).toDateString()} at ${appt.timeSlot} is confirmed. Please complete payment to proceed.`, 'confirmation');
    }
    if (status === 'cancelled') {
      await notify(appt.patientId._id, '❌ Appointment Rejected',
        `Your appointment on ${new Date(appt.date).toDateString()} at ${appt.timeSlot} was rejected. ${cancellationReason ? 'Reason: ' + cancellationReason : ''}`, 'cancellation');
    }
    if (status === 'completed') {
      await notify(appt.patientId._id, '🎉 Consultation Completed',
        `Your consultation with Dr. ${appt.doctorId.userId.name} is marked as completed.`, 'appointment');
      await notify(appt.doctorId.userId._id, '🎉 Session Completed',
        `Consultation with ${appt.patientId.name} marked as completed.`, 'appointment');
    }
    res.json({ message: 'Status updated', appointment: appt });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    const appt = await Appointment.findById(id)
      .populate('patientId', 'name _id')
      .populate({ path:'doctorId', populate:{ path:'userId', select:'name _id' } });
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    appt.status = 'cancelled';
    appt.cancelledBy = 'patient';
    appt.cancellationReason = cancellationReason || 'Cancelled by patient';
    await appt.save();
    await notify(appt.doctorId.userId._id, '❌ Appointment Cancelled',
      `${appt.patientId.name} cancelled their appointment on ${new Date(appt.date).toDateString()} at ${appt.timeSlot}.`, 'cancellation');
    await notify(appt.patientId._id, '❌ Appointment Cancelled',
      `Your appointment on ${new Date(appt.date).toDateString()} at ${appt.timeSlot} has been cancelled.`, 'cancellation');
    res.json({ message: 'Appointment cancelled', appointment: appt });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, newTimeSlot } = req.body;
    const appt = await Appointment.findById(id)
      .populate('patientId', 'name _id')
      .populate({ path:'doctorId', populate:{ path:'userId', select:'name _id' } });
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    const startOfDay = new Date(newDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(newDate); endOfDay.setHours(23, 59, 59, 999);
    const slotTaken = await Appointment.findOne({
      doctorId: appt.doctorId._id, timeSlot: newTimeSlot,
      date: { $gte: startOfDay, $lte: endOfDay }, status: { $in: ['pending','confirmed'] }, _id: { $ne: id }
    });
    if (slotTaken) return res.status(400).json({ message: 'New slot already booked. Choose another.' });
    appt.rescheduledFrom = appt.date;
    appt.date = newDate; appt.timeSlot = newTimeSlot; appt.status = 'pending';
    await appt.save();
    await notify(appt.doctorId.userId._id, '🔄 Appointment Rescheduled',
      `${appt.patientId.name} rescheduled to ${new Date(newDate).toDateString()} at ${newTimeSlot}. Please confirm again.`, 'reschedule');
    await notify(appt.patientId._id, '🔄 Appointment Rescheduled',
      `Your appointment has been rescheduled to ${new Date(newDate).toDateString()} at ${newTimeSlot}. Awaiting doctor confirmation.`, 'reschedule');
    res.json({ message: 'Appointment rescheduled', appointment: appt });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.params.userId })
      .populate({ path:'doctorId', populate:{ path:'userId', select:'name email' } }).sort({ date: -1 });
    res.json(appointments);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'name email phone _id').sort({ date: -1 });
    res.json(appointments);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.payAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate('patientId', 'name _id')
      .populate({ path:'doctorId', populate:{ path:'userId', select:'name _id' } });
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    appt.paymentDone = true;
    await appt.save();
    await notify(appt.patientId._id, '💳 Payment Confirmed',
      `Your payment for the appointment with Dr. ${appt.doctorId.userId.name} on ${new Date(appt.date).toDateString()} at ${appt.timeSlot} was successful.`, 'payment');
    await notify(appt.doctorId.userId._id, '💳 Payment Received',
      `Payment received from ${appt.patientId.name} for appointment on ${new Date(appt.date).toDateString()} at ${appt.timeSlot}.`, 'payment');
    res.json({ message: 'Payment recorded', appointment: appt });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.checkChatAccess = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate('patientId', 'name _id')
      .populate({ path:'doctorId', populate:{ path:'userId', select:'name _id' } });
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    // Already expired in DB
    if (appt.status === 'expired') return res.json({ allowed: false, reason: 'This appointment has expired. You can reschedule.', expired: true });
    if (appt.status !== 'confirmed') return res.json({ allowed: false, reason: 'Appointment not confirmed' });

    const [time, meridiem] = appt.timeSlot.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    const apptDateTime = new Date(appt.date);
    apptDateTime.setHours(h, m, 0, 0);

    const now       = new Date();
    const openTime  = new Date(apptDateTime.getTime() - 10 * 60 * 1000);
    const closeTime = new Date(apptDateTime.getTime() + 30 * 60 * 1000);

    if (now < openTime) return res.json({ allowed: false, reason: `Chat opens at ${appt.timeSlot} (10 min before allowed)`, opensAt: openTime });

    if (now > closeTime) {
      // Window ended — auto-expire in DB right now (don't wait for cron)
      appt.status = 'expired';
      await appt.save();
      // Notify both parties
      await notify(appt.patientId._id, '⌛ Appointment Expired',
        `Your appointment on ${new Date(appt.date).toDateString()} at ${appt.timeSlot} has expired. You can reschedule from your dashboard.`, 'appointment');
      await notify(appt.doctorId.userId._id, '⌛ Appointment Expired',
        `Appointment with ${appt.patientId.name} on ${new Date(appt.date).toDateString()} at ${appt.timeSlot} has expired.`, 'appointment');
      return res.json({ allowed: false, reason: 'Consultation window has ended. Appointment marked as expired.', expired: true });
    }

    res.json({ allowed: true, opensAt: openTime, closesAt: closeTime });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─────────────────────────────────────────────
// PUT /api/appointments/:id/rate  (patient rates doctor)
// ─────────────────────────────────────────────
exports.rateAppointment = async (req, res) => {
  try {
    const { rating, ratingComment } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const appt = await Appointment.findById(req.params.id)
      .populate('patientId', 'name _id')
      .populate({ path:'doctorId', populate:{ path:'userId', select:'name _id' } });

    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (appt.status !== 'completed')
      return res.status(400).json({ message: 'Can only rate completed appointments' });
    if (appt.rating)
      return res.status(400).json({ message: 'You have already rated this appointment' });

    // Save rating on appointment
    appt.rating = rating;
    appt.ratingComment = ratingComment || '';
    appt.ratedAt = new Date();
    await appt.save();

    // Recalculate doctor's average rating from all rated appointments
    const ratedAppts = await Appointment.find({
      doctorId: appt.doctorId._id,
      rating: { $ne: null }
    });
    const avgRating = ratedAppts.reduce((sum, a) => sum + a.rating, 0) / ratedAppts.length;
    await Doctor.findByIdAndUpdate(appt.doctorId._id, { rating: Math.round(avgRating * 10) / 10 });

    // Notify doctor
    await notify(appt.doctorId.userId._id, '⭐ New Rating Received',
      `${appt.patientId.name} rated your consultation ${rating}/5 stars. ${ratingComment ? '"' + ratingComment + '"' : ''}`,
      'appointment');

    res.json({ message: 'Rating submitted successfully', rating: appt.rating });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
