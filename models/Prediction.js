const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true, lowercase: true },
  riskLevel: { type: String, required: true },
  riskCode: { type: Number, required: true },
  confidence: { type: Number, required: true },
  studyHours: { type: Number, default: 0 },
  attendance: { type: Number, default: 0 },
  assignmentCompletion: { type: Number, default: 0 },
  recommendations: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Prediction', predictionSchema);