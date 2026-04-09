const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/doctorController');
const auth    = require('../middleware/auth');

router.get('/',                    ctrl.getDoctors);
router.get('/user/:userId',        ctrl.getDoctorByUserId);
router.get('/:id',                 ctrl.getDoctorById);
router.post('/',                   auth, ctrl.createDoctor);
router.put('/profile',             auth, ctrl.updateDoctorProfile);
router.put('/availability',        auth, ctrl.setAvailability);

module.exports = router;
