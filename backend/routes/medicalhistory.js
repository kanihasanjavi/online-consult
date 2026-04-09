const express = require('express');
const router = express.Router();
const MedicalHistory = require('../models/MedicalHistory');
const verifyToken = require('../middleware/auth');

// POST /api/medicalhistory — add condition
router.post('/', verifyToken, async (req, res) => {
  try {
    const { patientId, condition, description, diagnosedDate } = req.body;

    const entry = await MedicalHistory.create({
      patientId,
      condition,
      description: description || '',
      diagnosedDate: diagnosedDate || null,
    });

    res.status(201).json({ message: 'Medical history added', entry });
  } catch (error) {
    res.status(500).json({ message: 'Server error adding medical history' });
  }
});

// GET /api/medicalhistory/:patientId — get history
router.get('/:patientId', verifyToken, async (req, res) => {
  try {
    const history = await MedicalHistory.find({ patientId: req.params.patientId })
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching medical history' });
  }
});

// PUT /api/medicalhistory/:id — edit condition
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { condition, description, diagnosedDate } = req.body;

    const entry = await MedicalHistory.findByIdAndUpdate(
      req.params.id,
      { condition, description, diagnosedDate },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json({ message: 'Medical history updated', entry });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating medical history' });
  }
});

// DELETE /api/medicalhistory/:id — delete condition
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const entry = await MedicalHistory.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json({ message: 'Medical history deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting medical history' });
  }
});

module.exports = router;