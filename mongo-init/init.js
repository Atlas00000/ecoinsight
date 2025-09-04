// MongoDB initialization script for EcoInsight
db = db.getSiblingDB('ecoinsight');

// Create collections
db.createCollection('users');
db.createCollection('esg_reports');
db.createCollection('climate_data');
db.createCollection('sustainability_metrics');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.esg_reports.createIndex({ "company": 1, "year": 1 });
db.climate_data.createIndex({ "location": 1, "timestamp": 1 });
db.sustainability_metrics.createIndex({ "metric_type": 1, "date": 1 });

print('✅ EcoInsight MongoDB initialized successfully');
