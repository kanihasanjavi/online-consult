const Notification = require('../models/Notification');

/**
 * Create a notification for one user.
 */
const notify = async (userId, title, message, type = 'system') => {
  try {
    await Notification.create({ userId, title, message, type });
  } catch (e) {
    console.error('Notification error:', e.message);
  }
};

/**
 * Notify both patient and doctor.
 */
const notifyBoth = async (patientId, doctorUserId, title, message, type = 'system') => {
  await Promise.all([
    notify(patientId,   title, message, type),
    notify(doctorUserId, title, message, type),
  ]);
};

module.exports = { notify, notifyBoth };
