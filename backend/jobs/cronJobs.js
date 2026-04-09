const cron        = require('node-cron');
const Appointment = require('../models/Appointment');
const { notify }  = require('../middleware/notifyHelper');

function getApptDateTime(appt) {
  if (!appt.timeSlot || !appt.date) return null;
  const parts = appt.timeSlot.split(' ');
  if (parts.length < 2) return null;
  const [time, meridiem] = parts;
  const timeParts = time.split(':');
  if (timeParts.length < 2) return null;
  let [h, m] = timeParts.map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  const dt = new Date(appt.date);
  dt.setHours(h, m, 0, 0);
  return dt;
}

// JOB 1 — Every hour: 1-day reminder
cron.schedule('0 * * * *', async () => {
  try {
    const now   = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const appointments = await Appointment.find({
      status: 'confirmed', reminderSent1Day: false, date: { $gte: now, $lte: in25h }
    })
    .populate('patientId', 'name _id')
    .populate({ path:'doctorId', populate:{ path:'userId', select:'name _id' } });

    for (const appt of appointments) {
      const apptDT = getApptDateTime(appt);
      if (!apptDT) continue;
      if (apptDT >= now && apptDT <= in24h) {
        await notify(appt.patientId._id, '⏰ Appointment Reminder',
          `Reminder: You have an appointment tomorrow at ${appt.timeSlot}.`, 'reminder');
        await notify(appt.doctorId.userId._id, '⏰ Appointment Reminder',
          `Patient ${appt.patientId.name} — tomorrow at ${appt.timeSlot}`, 'reminder');
        await Appointment.updateOne({ _id: appt._id }, { $set: { reminderSent1Day: true } });
      }
    }
  } catch (e) { console.error('Cron 1-day reminder error:', e.message); }
});

// JOB 2 — Every 5 min: 1-hour reminder
cron.schedule('*/5 * * * *', async () => {
  try {
    const now   = new Date();
    const in60m = new Date(now.getTime() + 60 * 60 * 1000);
    const in65m = new Date(now.getTime() + 65 * 60 * 1000);
    const appointments = await Appointment.find({
      status: 'confirmed', reminderSent1Hour: false, date: { $gte: now, $lte: in65m }
    })
    .populate('patientId', 'name _id')
    .populate({ path:'doctorId', populate:{ path:'userId', select:'name _id' } });

    for (const appt of appointments) {
      const apptDT = getApptDateTime(appt);
      if (!apptDT) continue;
      if (apptDT >= now && apptDT <= in60m) {
        await notify(appt.patientId._id, '⏰ Starting Soon',
          `Your appointment starts in about 1 hour at ${appt.timeSlot}.`, 'reminder');
        await notify(appt.doctorId.userId._id, '⏰ Starting Soon',
          `Appointment with ${appt.patientId.name} starts in about 1 hour at ${appt.timeSlot}.`, 'reminder');
        await Appointment.updateOne({ _id: appt._id }, { $set: { reminderSent1Hour: true } });
      }
    }
  } catch (e) { console.error('Cron 1-hour reminder error:', e.message); }
});

// JOB 3 — Every 5 min: expire appointments + notify both parties
cron.schedule('*/5 * * * *', async () => {
  try {
    const now          = new Date();
    const expireWindow = new Date(now.getTime() - 40 * 60 * 1000);
    const toExpire = await Appointment.find({ status: { $in: ['pending', 'confirmed'] } })
      .populate('patientId', 'name _id')
      .populate({ path:'doctorId', populate:{ path:'userId', select:'name _id' } });

    for (const appt of toExpire) {
      const apptDT = getApptDateTime(appt);
      if (!apptDT) continue;
      if (apptDT < expireWindow) {
        await Appointment.updateOne({ _id: appt._id }, { $set: { status: 'expired' } });
        await notify(appt.patientId._id, '⌛ Appointment Expired',
          `Your appointment on ${new Date(appt.date).toDateString()} at ${appt.timeSlot} has expired. You can reschedule from your dashboard.`,
          'appointment');
        await notify(appt.doctorId.userId._id, '⌛ Appointment Expired',
          `Appointment with ${appt.patientId.name} on ${new Date(appt.date).toDateString()} at ${appt.timeSlot} has expired.`,
          'appointment');
      }
    }
  } catch (e) { console.error('Cron expire error:', e.message); }
});