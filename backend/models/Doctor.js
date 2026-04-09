const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  time: { type: String, required: true }  // "10:00 AM", "11:00 AM"
}, { _id: false });

const AvailabilitySchema = new mongoose.Schema({
  day:   { type: String, required: true },  // "Monday", "Tuesday"
  slots: [SlotSchema]
}, { _id: false });

const DoctorSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String },
  experience:     { type: Number, default: 0 },
  fees:           { type: Number, default: 0 },
  bio:            { type: String },
  rating:         { type: Number, default: 4.5 },
  isAvailable:    { type: Boolean, default: true },
  availability:   [AvailabilitySchema],   // days + slots per day
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);
