#!/usr/bin/env node

/**
 * Migration Script: localStorage Settings to Database
 *
 * This script migrates project and user settings from localStorage
 * to the database by adding default settings to all projects and users.
 *
 * Run: node scripts/migrate-settings-to-db.js
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/fmea-data.json');

// Default settings based on SAE J1739 standard
const defaultProjectSettings = {
  riskMatrix: {
    matrixSize: 12, // User's preference from local
    scaleType: '1-10',
    detBaseline: 5,
    preset: 'SAE J1739',
  },
  thresholds: [
    { id: 1, label: 'Low', min: 1, max: 69, color: 'green' },
    { id: 2, label: 'Medium', min: 70, max: 99, color: 'yellow' },
    { id: 3, label: 'High', min: 100, max: 150, color: 'orange' },
    { id: 4, label: 'Critical', min: 151, max: 1000, color: 'red' },
  ],
  standards: ['SAE J1739'],
  descriptions: {
    severity: {
      1: 'No effect',
      2: 'Very minor',
      3: 'Minor',
      4: 'Very low',
      5: 'Low',
      6: 'Moderate',
      7: 'High',
      8: 'Very high',
      9: 'Hazardous',
      10: 'Catastrophic',
    },
    occurrence: {
      1: 'Very rare',
      2: 'Rare',
      3: 'Unlikely',
      4: 'Low',
      5: 'Moderate',
      6: 'Moderately high',
      7: 'High',
      8: 'Very high',
      9: 'Extremely high',
      10: 'Certain',
    },
    detection: {
      1: 'Certain detection',
      2: 'Very high',
      3: 'High',
      4: 'Moderately high',
      5: 'Moderate',
      6: 'Low',
      7: 'Very low',
      8: 'Remote',
      9: 'Very remote',
      10: 'Cannot detect',
    },
  },
};

const defaultUserPreferences = {
  onboarding_completed: false,
  theme: 'system',
};

function readDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Database file not found: ${DB_PATH}`);
    process.exit(1);
  }

  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

function writeDatabase(db) {
  // Create backup first
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(__dirname, '../data/backups', `pre-migration-${timestamp}.json`);

  // Ensure backup directory exists
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Write backup
  fs.writeFileSync(backupPath, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`📦 Backup created: ${backupPath}`);

  // Write updated database
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function migrateProjects(db) {
  if (!db.projects || !Array.isArray(db.projects)) {
    console.log('⚠️  No projects found in database');
    return 0;
  }

  let migratedCount = 0;

  db.projects = db.projects.map(project => {
    // Skip if project already has settings
    if (project.settings) {
      console.log(`⏭️  Skipping project "${project.name}" - already has settings`);
      return project;
    }

    // Add default settings
    const updatedProject = {
      ...project,
      settings: defaultProjectSettings,
      updated_at: new Date().toISOString(),
    };

    console.log(`✅ Migrated project "${project.name}"`);
    migratedCount++;

    return updatedProject;
  });

  return migratedCount;
}

function migrateUsers(db) {
  if (!db.users || !Array.isArray(db.users)) {
    console.log('⚠️  No users found in database');
    return 0;
  }

  let migratedCount = 0;

  db.users = db.users.map(user => {
    // Skip if user already has preferences
    if (user.preferences) {
      console.log(`⏭️  Skipping user "${user.email}" - already has preferences`);
      return user;
    }

    // Add default preferences
    const updatedUser = {
      ...user,
      preferences: defaultUserPreferences,
    };

    console.log(`✅ Migrated user "${user.email}"`);
    migratedCount++;

    return updatedUser;
  });

  return migratedCount;
}

function main() {
  console.log('🔄 Starting migration: localStorage → Database');
  console.log('================================================\n');

  try {
    // Read database
    console.log('📖 Reading database...');
    const db = readDatabase();

    // Migrate projects
    console.log('\n📊 Migrating projects...');
    const projectsCount = migrateProjects(db);

    // Migrate users
    console.log('\n👤 Migrating users...');
    const usersCount = migrateUsers(db);

    // Write updated database
    console.log('\n💾 Writing updated database...');
    writeDatabase(db);

    // Summary
    console.log('\n================================================');
    console.log('✅ Migration completed successfully!');
    console.log(`📊 Projects migrated: ${projectsCount}`);
    console.log(`👤 Users migrated: ${usersCount}`);
    console.log('\nNext steps:');
    console.log('1. Review the changes in data/fmea-data.json');
    console.log('2. Test locally before deploying');
    console.log('3. Sync to production using ./scripts/sync-db-to-production.sh');
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run migration
main();
