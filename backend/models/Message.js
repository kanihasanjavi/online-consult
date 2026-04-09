const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      enum: ['patient', 'doctor'],
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message cannot be empty'],
      trim: true,
    },
    type:   { type: String,
       default: 'text' 
    },  // 'text' or 'image'
    fileName: { type: String,
      default: null  
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);