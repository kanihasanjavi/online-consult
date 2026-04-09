const Notification = require('../models/Notification');

// GET /api/notifications/:userId
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PUT /api/notifications/read/:userId  — mark all read
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId, isRead: false }, { isRead: true });
    res.json({ message: 'All marked as read' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PUT /api/notifications/:id/read  — mark one read
exports.markOneRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
