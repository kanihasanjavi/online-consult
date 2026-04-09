const Doctor = require('../models/Doctor');

// GET /api/doctors
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('userId', 'name email phone');
    res.json(doctors);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/doctors/:id
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email phone');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/doctors/user/:userId
exports.getDoctorByUserId = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.params.userId }).populate('userId', 'name email phone');
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    res.json(doctor);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// POST /api/doctors  — create profile
exports.createDoctor = async (req, res) => {
  try {
    const { specialization, experience, fees, bio, availability } = req.body;
    const existing = await Doctor.findOne({ userId: req.user.id });
    if (existing) return res.status(400).json({ message: 'Doctor profile already exists' });
    const doctor = await Doctor.create({ userId: req.user.id, specialization, experience, fees, bio, availability: availability || [] });
    res.status(201).json(doctor);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PUT /api/doctors/profile  — update profile + availability
exports.updateDoctorProfile = async (req, res) => {
  try {
    const { specialization, experience, fees, bio, availability } = req.body;
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user.id },
      { specialization, experience, fees, bio, ...(availability !== undefined && { availability }) },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');
    res.json(doctor);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PUT /api/doctors/:id/availability  — set availability days + time slots
exports.setAvailability = async (req, res) => {
  try {
    /*
      Body format:
      {
        availability: [
          { day: "Monday",    slots: [{ time: "10:00 AM" }, { time: "11:00 AM" }] },
          { day: "Thursday",  slots: [{ time: "7:00 PM"  }, { time: "8:00 PM"  }] }
        ]
      }
    */
    const { availability } = req.body;
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user.id },
      { availability },
      { new: true }
    );
    res.json({ message: 'Availability updated', doctor });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
