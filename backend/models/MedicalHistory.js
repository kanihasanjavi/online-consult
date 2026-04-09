const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    condition: {
      type: String,
      required: [true, 'Condition name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    diagnosedDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);