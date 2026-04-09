const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/notificationController');
const auth    = require('../middleware/auth');

router.get('/:userId',          auth, ctrl.getNotifications);
router.put('/read/:userId',     auth, ctrl.markAllRead);
router.put('/:id/read',         auth, ctrl.markOneRead);

module.exports = router;
