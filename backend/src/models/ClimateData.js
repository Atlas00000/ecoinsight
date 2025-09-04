const mongoose = require('mongoose');

const climateDataSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    index: true,
  },
  dataType: {
    type: String,
    required: true,
    enum: ['weather', 'air_quality', 'emissions', 'temperature'],
    index: true,
  },
  timestamp: {
    type: Date,
    required: true,
    index: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Compound index for efficient time-series queries
climateDataSchema.index({ location: 1, dataType: 1, timestamp: -1 });

module.exports = mongoose.model('ClimateData', climateDataSchema);
