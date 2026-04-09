const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const verifyToken = require('../middleware/auth');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, role, phone,
      bloodGroup, age, gender, city, country,
      specialization, experience, fees, bio, availability
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user — pre save hook will hash password automatically
    const user = new User({
      name,
      email,
      password,
      role,
      phone: phone || '',
      bloodGroup: bloodGroup || '',
      age: age || null,
      gender: gender || '',
      city: city || '',
      country: country || '',
    });

    await user.save();

    // If doctor, create doctor profile too
    if (role === 'doctor') {
      await Doctor.create({
        userId: user._id,
        specialization: specialization || '',
        experience: experience || 0,
        fees: fees || 0,
        bio: bio || '',
        availability: availability || [],
        rating: 4.0,
        isAvailable: true,
      });
    }

    // Welcome notification
    await Notification.create({
      userId: user._id,
      title: 'Welcome to MediConsult! 🎉',
      message: `Hello ${name}, your account has been created successfully.`,
      type: 'appointment',
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        age: user.age,
        gender: user.gender,
        city: user.city,
        country: user.country,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare password directly with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        age: user.age,
        gender: user.gender,
        city: user.city,
        country: user.country,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me — protected
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/profile — update patient profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, bloodGroup, age, gender, city, country } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, bloodGroup, age, gender, city, country },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

module.exports = router;