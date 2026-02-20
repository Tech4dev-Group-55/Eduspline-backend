const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['corporate_learning_and_development', 'certificate_body', 'edtech', 'others'],
    required: true
  },
  estimatedLearners: {
    type: String,
    enum: ['100-500', '501-1000', 'above_1000'],
    required: true
  },
  country: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Institution', institutionSchema);