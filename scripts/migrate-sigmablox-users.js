#!/usr/bin/env node

/**
 * SigmaBlox User Migration Script
 *
 * Exports users from SigmaBlox Ghost CMS database and transforms them
 * to the MC Platform user schema for MongoDB import.
 *
 * Data Sources:
 * - Ghost SQLite database: /Users/paulgarcia/Dev/sigmablox/ghost-data/data/ghost.db
 * - Tables: members, members_labels, labels
 *
 * Usage:
 *   node migrate-sigmablox-users.js
 *   node migrate-sigmablox-users.js --output ./users-export.json
 *   node migrate-sigmablox-users.js --dry-run
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Configuration
const GHOST_DB_PATH = '/Users/paulgarcia/Dev/sigmablox/ghost-data/data/ghost.db';
const DEFAULT_OUTPUT_PATH = path.join(__dirname, 'sigmablox-users-export.json');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const outputIndex = args.indexOf('--output');
const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : DEFAULT_OUTPUT_PATH;

// Label to role mapping
const LABEL_TO_ROLE_MAP = {
  'Admin': 'admin',
  'admin': 'admin',
  'Staff': 'member', // Staff are regular members with special labels
  'staff': 'member',
  'Coach': 'member',
  'coach': 'member',
  'Alumni': 'member',
  'alumni': 'member',
  'founder': 'member',
  'Industry': 'member',
  'industry': 'member',
  'operator': 'member',
  'advisor': 'member',
  'Trusted': 'member',
  'trust': 'member',
  'Trust': 'member',
  'general': 'member',
  'guest': 'member',
  'restricted': 'member',
  'limited': 'member'
};

/**
 * Determines the user role based on their labels
 * Priority: Admin > default member
 */
function determineRole(labels) {
  if (!labels || labels.length === 0) return 'member';

  // Check for admin role
  if (labels.some(label => ['Admin', 'admin'].includes(label))) {
    return 'admin';
  }

  return 'member';
}

/**
 * Extracts capabilities from labels
 * Maps SigmaBlox labels to MC Platform capabilities
 */
function extractCapabilities(labels) {
  if (!labels || labels.length === 0) return [];

  const capabilityMap = {
    'Coach': 'Coaching & Mentorship',
    'coach': 'Coaching & Mentorship',
    'Alumni': 'Program Alumni',
    'alumni': 'Program Alumni',
    'advisor': 'Advisory Services',
    'operator': 'Operations & Execution',
    'founder': 'Company Founding',
    'Industry': 'Industry Expertise',
    'industry': 'Industry Expertise',
    'Staff': 'Program Staff',
    'staff': 'Program Staff',
    'Trusted': 'Trusted Member',
    'trust': 'Trusted Member',
    'Trust': 'Trusted Member'
  };

  const capabilities = labels
    .map(label => capabilityMap[label])
    .filter(Boolean);

  return [...new Set(capabilities)]; // Remove duplicates
}

/**
 * Extracts company name from note field or other metadata
 */
function extractCompany(note, name) {
  // Check if note contains auto-approval info (these are new sign-ups)
  if (note && note.includes('Auto-approved:')) {
    return null;
  }

  // For now, we don't have company data in Ghost members
  // This could be enhanced by cross-referencing with Airtable data
  return null;
}

/**
 * Fetches all members from Ghost database with their labels
 */
function fetchGhostMembers(db) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        m.id,
        m.uuid,
        m.email,
        m.name,
        m.status,
        m.note,
        m.created_at,
        m.updated_at,
        GROUP_CONCAT(l.name, ',') as labels
      FROM members m
      LEFT JOIN members_labels ml ON m.id = ml.member_id
      LEFT JOIN labels l ON ml.label_id = l.id
      GROUP BY m.id
      ORDER BY m.created_at ASC
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Transforms a Ghost member record to MC Platform user schema
 */
function transformUser(member) {
  const labels = member.labels ? member.labels.split(',') : [];
  const role = determineRole(labels);
  const capabilities = extractCapabilities(labels);
  const company = extractCompany(member.note, member.name);

  return {
    email: member.email,
    name: member.name || '',
    role: role,
    profile: {
      company: company,
      website: null,
      capabilities: capabilities,
      missionAreas: [],
      clearances: [],
      trlLevel: null,
      gpcReady: false
    },
    // Preserve original Ghost data for reference
    sourceMetadata: {
      ghostId: member.id,
      ghostUuid: member.uuid,
      ghostStatus: member.status,
      ghostLabels: labels,
      ghostNote: member.note,
      originalCreatedAt: member.created_at,
      originalUpdatedAt: member.updated_at
    },
    migratedFrom: 'sigmablox',
    migratedAt: new Date().toISOString()
  };
}

/**
 * Main migration function
 */
async function migrateUsers() {
  console.log('SigmaBlox User Migration Script');
  console.log('================================\n');

  // Check if Ghost database exists
  if (!fs.existsSync(GHOST_DB_PATH)) {
    console.error(`Error: Ghost database not found at ${GHOST_DB_PATH}`);
    process.exit(1);
  }

  console.log(`Reading from: ${GHOST_DB_PATH}`);
  console.log(`Output file: ${outputPath}`);
  console.log(`Dry run: ${isDryRun ? 'YES' : 'NO'}\n`);

  // Open Ghost database
  const db = new sqlite3.Database(GHOST_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      process.exit(1);
    }
  });

  try {
    // Fetch all members
    console.log('Fetching members from Ghost database...');
    const members = await fetchGhostMembers(db);
    console.log(`Found ${members.length} members\n`);

    // Transform members
    console.log('Transforming members to MC Platform schema...');
    const transformedUsers = members.map(transformUser);

    // Statistics
    const stats = {
      total: transformedUsers.length,
      admins: transformedUsers.filter(u => u.role === 'admin').length,
      members: transformedUsers.filter(u => u.role === 'member').length,
      withCapabilities: transformedUsers.filter(u => u.profile.capabilities.length > 0).length,
      withCompany: transformedUsers.filter(u => u.profile.company).length
    };

    console.log('\nMigration Statistics:');
    console.log('---------------------');
    console.log(`Total users: ${stats.total}`);
    console.log(`Admins: ${stats.admins}`);
    console.log(`Members: ${stats.members}`);
    console.log(`Users with capabilities: ${stats.withCapabilities}`);
    console.log(`Users with company: ${stats.withCompany}`);

    // Sample output
    console.log('\nSample User Records:');
    console.log('-------------------');
    transformedUsers.slice(0, 3).forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Capabilities: ${user.profile.capabilities.join(', ') || 'None'}`);
      console.log(`   Labels: ${user.sourceMetadata.ghostLabels.join(', ') || 'None'}`);
    });

    if (!isDryRun) {
      // Write to output file
      console.log(`\n\nWriting ${transformedUsers.length} users to ${outputPath}...`);
      fs.writeFileSync(
        outputPath,
        JSON.stringify(transformedUsers, null, 2),
        'utf8'
      );
      console.log('Export complete!');

      // Also create a stats file
      const statsPath = outputPath.replace('.json', '-stats.json');
      fs.writeFileSync(
        statsPath,
        JSON.stringify({
          exportDate: new Date().toISOString(),
          source: 'sigmablox-ghost',
          sourceDatabase: GHOST_DB_PATH,
          ...stats,
          sampleUsers: transformedUsers.slice(0, 5)
        }, null, 2),
        'utf8'
      );
      console.log(`Stats saved to: ${statsPath}`);
    } else {
      console.log('\n\nDry run complete - no files written');
    }

    // Close database
    db.close();

  } catch (error) {
    console.error('\nError during migration:', error);
    db.close();
    process.exit(1);
  }
}

// Run migration
migrateUsers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
