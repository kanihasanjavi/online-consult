const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const verifyToken = require('../middleware/auth');

// GET /api/chat/:appointmentId — get chat history
router.get('/:appointmentId', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ appointmentId: req.params.appointmentId })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching chat history' });
  }
});

module.exports = router;