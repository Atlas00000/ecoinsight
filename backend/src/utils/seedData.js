const ClimateData = require('../models/ClimateData');
const ESGReport = require('../models/ESGReport');
const logger = require('./logger');

const seedClimateData = async () => {
  try {
    const sampleClimateData = [
      {
        location: 'New York',
        dataType: 'weather',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        value: 15.5,
        unit: 'celsius',
        source: 'OpenWeatherMap',
        metadata: { humidity: 65, pressure: 1013 },
      },
      {
        location: 'New York',
        dataType: 'air_quality',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        value: 45,
        unit: 'AQI',
        source: 'EPA',
        metadata: { pm25: 12, pm10: 25 },
      },
      {
        location: 'Los Angeles',
        dataType: 'weather',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        value: 22.0,
        unit: 'celsius',
        source: 'OpenWeatherMap',
        metadata: { humidity: 45, pressure: 1015 },
      },
      {
        location: 'Los Angeles',
        dataType: 'air_quality',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        value: 78,
        unit: 'AQI',
        source: 'EPA',
        metadata: { pm25: 25, pm10: 45 },
      },
    ];

    await ClimateData.insertMany(sampleClimateData);
    logger.info('✅ Climate data seeded successfully');
  } catch (error) {
    logger.error('Error seeding climate data:', error);
  }
};

const seedESGData = async () => {
  try {
    const sampleESGData = [
      {
        company: 'TechCorp Inc',
        year: 2023,
        reportType: 'annual',
        metrics: {
          environmental: {
            carbonEmissions: 12500,
            energyConsumption: 45000,
            waterUsage: 8000,
            wasteGenerated: 1200,
          },
          social: {
            employeeCount: 2500,
            diversityScore: 85,
            safetyIncidents: 2,
            communityInvestment: 500000,
          },
          governance: {
            boardDiversity: 60,
            executiveCompensation: 1200000,
            regulatoryCompliance: 98,
            riskManagement: 92,
          },
        },
        score: 87,
        source: 'Company Report',
        verified: true,
      },
      {
        company: 'GreenEnergy Ltd',
        year: 2023,
        reportType: 'annual',
        metrics: {
          environmental: {
            carbonEmissions: 2500,
            energyConsumption: 15000,
            waterUsage: 3000,
            wasteGenerated: 400,
          },
          social: {
            employeeCount: 800,
            diversityScore: 90,
            safetyIncidents: 0,
            communityInvestment: 750000,
          },
          governance: {
            boardDiversity: 70,
            executiveCompensation: 800000,
            regulatoryCompliance: 100,
            riskManagement: 95,
          },
        },
        score: 94,
        source: 'Company Report',
        verified: true,
      },
    ];

    await ESGReport.insertMany(sampleESGData);
    logger.info('✅ ESG data seeded successfully');
  } catch (error) {
    logger.error('Error seeding ESG data:', error);
  }
};

const seedAllData = async () => {
  try {
    logger.info('🌱 Starting data seeding...');
    
    // Clear existing data
    await ClimateData.deleteMany({});
    await ESGReport.deleteMany({});
    
    // Seed new data
    await seedClimateData();
    await seedESGData();
    
    logger.info('✅ All data seeded successfully');
  } catch (error) {
    logger.error('Error seeding data:', error);
  }
};

module.exports = {
  seedAllData,
  seedClimateData,
  seedESGData,
};
