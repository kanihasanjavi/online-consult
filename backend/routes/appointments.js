// ── routes/appointments.js ──────────────────────────────────────
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/appointmentController');
const auth    = require('../middleware/auth');

router.get('/slots/:doctorId',                  ctrl.getAvailableSlots);
router.get('/doctor/:doctorId/schedule',        ctrl.getDoctorSchedule);
router.get('/doctor/:doctorId',                 ctrl.getDoctorAppointments);
router.get('/:userId',                          ctrl.getMyAppointments);
router.get('/:id/chat-access',                  auth, ctrl.checkChatAccess);
router.post('/',                                auth, ctrl.bookAppointment);
router.put('/:id/status',                       auth, ctrl.updateStatus);
router.put('/:id/cancel',                       auth, ctrl.cancelAppointment);
router.put('/:id/reschedule',                   auth, ctrl.rescheduleAppointment);
router.put('/:id/pay',                          auth, ctrl.payAppointment);
router.put('/:id/rate',                         auth, ctrl.rateAppointment);

module.exports = router;
