const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const verifyToken = require('../middleware/auth');

// POST /api/prescriptions — doctor creates prescription
router.post('/', verifyToken, async (req, res) => {
  try {
    const { appointmentId, patientId, medicines, notes } = req.body;

    // Validate required fields
    if (!appointmentId) return res.status(400).json({ message: 'appointmentId is required' });
    if (!medicines || medicines.length === 0) return res.status(400).json({ message: 'At least one medicine is required' });

    // Find doctor profile from JWT token
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    // Check if prescription already sent for this appointment
    const existing = await Prescription.findOne({ appointmentId });
    if (existing) return res.status(400).json({ message: 'Prescription already sent for this appointment', alreadySent: true });

    // If patientId not provided in body, get it from the appointment
    let finalPatientId = patientId;
    if (!finalPatientId) {
      const appt = await Appointment.findById(appointmentId);
      if (!appt) return res.status(404).json({ message: 'Appointment not found' });
      finalPatientId = appt.patientId;
    }

    if (!finalPatientId) return res.status(400).json({ message: 'Patient not found for this appointment' });

    // Filter out empty medicines
    const validMedicines = medicines.filter(m => m.name && m.name.trim());
    if (validMedicines.length === 0) return res.status(400).json({ message: 'At least one medicine name is required' });

    const prescription = await Prescription.create({
      appointmentId,
      doctorId: doctor._id,
      patientId: finalPatientId,
      medicines: validMedicines,
      notes: notes || '',
    });

    // Notify patient
    await Notification.create({
      userId: finalPatientId,
      title: 'Prescription Ready 💊',
      message: 'Your doctor has sent you a new prescription. Check your prescriptions tab.',
      type: 'prescription',
    });

    res.status(201).json({ message: 'Prescription created successfully', prescription });
  } catch (error) {
    console.error('Prescription error:', error.message);
    res.status(500).json({ message: error.message || 'Server error creating prescription' });
  }
});

// GET /api/prescriptions/:patientId — get patient prescriptions
router.get('/:patientId', verifyToken, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching prescriptions' });
  }
});

// GET /api/prescriptions/check/:appointmentId — check if prescription already sent
router.get('/check/:appointmentId', verifyToken, async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ appointmentId: req.params.appointmentId });
    res.json({ exists: !!prescription, prescription: prescription || null });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
