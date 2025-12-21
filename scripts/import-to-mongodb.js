#!/usr/bin/env node

/**
 * MongoDB Import Script for Migrated SigmaBlox Users
 *
 * Imports transformed user records into MongoDB.
 * Handles duplicates by email and provides detailed import statistics.
 *
 * Usage:
 *   node import-to-mongodb.js --file ./sigmablox-users-export.json
 *   node import-to-mongodb.js --file ./export.json --dry-run
 *   node import-to-mongodb.js --file ./export.json --uri "mongodb://localhost:27017" --db "mc_platform"
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

const fileIndex = args.indexOf('--file');
const uriIndex = args.indexOf('--uri');
const dbIndex = args.indexOf('--db');
const collectionIndex = args.indexOf('--collection');

if (fileIndex === -1) {
  console.error('Error: --file argument is required');
  console.error('Usage: node import-to-mongodb.js --file <path-to-export.json>');
  process.exit(1);
}

const filePath = args[fileIndex + 1];
const mongoUri = uriIndex !== -1 ? args[uriIndex + 1] : process.env.MONGODB_URI;
const dbName = dbIndex !== -1 ? args[dbIndex + 1] : process.env.MONGODB_DB_NAME || 'mc_platform';
const collectionName = collectionIndex !== -1 ? args[collectionIndex + 1] : 'users';

/**
 * Main import function
 */
async function importUsers() {
  console.log('MongoDB Import Script');
  console.log('====================\n');

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    process.exit(1);
  }

  // Check MongoDB URI
  if (!mongoUri) {
    console.error('Error: MongoDB URI not provided');
    console.error('Set MONGODB_URI environment variable or use --uri flag');
    process.exit(1);
  }

  console.log(`Import file: ${filePath}`);
  console.log(`MongoDB URI: ${mongoUri.replace(/\/\/.*:.*@/, '//***:***@')}`);
  console.log(`Database: ${dbName}`);
  console.log(`Collection: ${collectionName}`);
  console.log(`Dry run: ${isDryRun ? 'YES' : 'NO'}\n`);

  // Read and parse JSON file
  console.log('Reading export file...');
  let users;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    users = JSON.parse(fileContent);
    console.log(`Loaded ${users.length} users from file\n`);
  } catch (error) {
    console.error('Error reading/parsing file:', error.message);
    process.exit(1);
  }

  if (isDryRun) {
    console.log('DRY RUN - No database operations will be performed\n');
    console.log('Users to be imported:');
    console.log('--------------------');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    console.log(`\nTotal: ${users.length} users`);
    return;
  }

  // Import MongoDB client
  let MongoClient;
  try {
    const mongodb = require('mongodb');
    MongoClient = mongodb.MongoClient;
  } catch (error) {
    console.error('Error: MongoDB module not found');
    console.error('Install it with: npm install mongodb');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully\n');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Import statistics
    const stats = {
      total: users.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      duplicates: []
    };

    console.log('Importing users...');
    console.log('------------------\n');

    for (const user of users) {
      try {
        // Check if user already exists by email
        const existingUser = await collection.findOne({ email: user.email });

        if (existingUser) {
          // Check if this is from a previous migration
          if (existingUser.migratedFrom === 'sigmablox') {
            // Update existing migrated user
            const updateResult = await collection.updateOne(
              { email: user.email },
              {
                $set: {
                  ...user,
                  updatedAt: new Date(),
                  lastMigrationUpdate: new Date()
                }
              }
            );

            if (updateResult.modifiedCount > 0) {
              stats.updated++;
              console.log(`✓ Updated: ${user.email}`);
            } else {
              stats.skipped++;
              console.log(`- Skipped (no changes): ${user.email}`);
            }
          } else {
            // User exists but not from migration - skip to avoid overwriting
            stats.duplicates.push({
              email: user.email,
              reason: 'User already exists (not from migration)'
            });
            console.log(`⚠ Duplicate: ${user.email} (user already exists)`);
          }
        } else {
          // Insert new user
          const insertResult = await collection.insertOne({
            ...user,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          if (insertResult.insertedId) {
            stats.inserted++;
            console.log(`✓ Inserted: ${user.email}`);
          }
        }
      } catch (error) {
        stats.errors.push({
          email: user.email,
          error: error.message
        });
        console.error(`✗ Error: ${user.email} - ${error.message}`);
      }
    }

    console.log('\n\nImport Complete!');
    console.log('================\n');
    console.log('Statistics:');
    console.log(`  Total users in file: ${stats.total}`);
    console.log(`  Inserted: ${stats.inserted}`);
    console.log(`  Updated: ${stats.updated}`);
    console.log(`  Skipped: ${stats.skipped}`);
    console.log(`  Duplicates: ${stats.duplicates.length}`);
    console.log(`  Errors: ${stats.errors.length}`);

    if (stats.duplicates.length > 0) {
      console.log('\nDuplicate Users:');
      stats.duplicates.forEach(dup => {
        console.log(`  - ${dup.email}: ${dup.reason}`);
      });
    }

    if (stats.errors.length > 0) {
      console.log('\nErrors:');
      stats.errors.forEach(err => {
        console.log(`  - ${err.email}: ${err.error}`);
      });
    }

    // Save import report
    const reportPath = filePath.replace('.json', '-import-report.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify({
        importDate: new Date().toISOString(),
        sourceFile: filePath,
        database: dbName,
        collection: collectionName,
        ...stats
      }, null, 2),
      'utf8'
    );
    console.log(`\nImport report saved to: ${reportPath}`);

    // Verify import
    const importedCount = await collection.countDocuments({ migratedFrom: 'sigmablox' });
    console.log(`\nVerification: ${importedCount} users from SigmaBlox in database`);

  } catch (error) {
    console.error('\nError during import:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

// Run import
importUsers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
