const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  doctorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date:       { type: Date, required: true },
  timeSlot:   { type: String, required: true },   // "10:00 AM"
  type:       { type: String, enum: ['chat','video'], default: 'chat' },
  reason:     { type: String },
  status:     { type: String, enum: ['pending','confirmed','completed','cancelled','expired'], default: 'pending' },
  cancelledBy:{ type: String, enum: ['patient','doctor',null], default: null },
  cancellationReason: { type: String },
  paymentDone:  { type: Boolean, default: false },
  paymentType:  { type: String, enum: ['prepaid','afterconsultation'], default: 'afterconsultation' },
  rescheduledFrom: { type: Date },   // original date before reschedule
  reminderSent1Day: { type: Boolean, default: false },
  reminderSent1Hour:{ type: Boolean, default: false },
  // Rating fields
  rating:       { type: Number, min: 1, max: 5, default: null },
  ratingComment:{ type: String, default: '' },
  ratedAt:      { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
