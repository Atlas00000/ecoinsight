const mongoose = require('mongoose');

const esgReportSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    index: true,
  },
  year: {
    type: Number,
    required: true,
    index: true,
  },
  reportType: {
    type: String,
    required: true,
    enum: ['annual', 'quarterly', 'sustainability', 'esg'],
  },
  metrics: {
    environmental: {
      carbonEmissions: Number,
      energyConsumption: Number,
      waterUsage: Number,
      wasteGenerated: Number,
    },
    social: {
      employeeCount: Number,
      diversityScore: Number,
      safetyIncidents: Number,
      communityInvestment: Number,
    },
    governance: {
      boardDiversity: Number,
      executiveCompensation: Number,
      regulatoryCompliance: Number,
      riskManagement: Number,
    },
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
  },
  source: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound index for company and year queries
esgReportSchema.index({ company: 1, year: 1, reportType: 1 });

module.exports = mongoose.model('ESGReport', esgReportSchema);
