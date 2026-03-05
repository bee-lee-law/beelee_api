/**
 * One-time script to seed owner Challonge tokens into DynamoDB.
 * Run this after completing the OAuth flow as yourself (the owner).
 *
 * Usage:
 *   node scripts/seedOwnerTokens.js <challonge_user_id>
 *
 * Your Challonge user ID can be found in the beelee_oauth_tokens table
 * from the OAuth flow you just completed.
 */

require('dotenv').config();
const tokenService = require('../src/services/internal/tokenService');
const dynamoService = require('../src/services/aws/dynamoService');

async function seedOwnerTokens(sourceUserId) {
  console.log(`Fetching tokens for user: ${sourceUserId}`);

  // Get the existing tokens stored under your Challonge user ID
  const tokens = await tokenService.getTokens(sourceUserId);

  if (!tokens) {
    console.error('No tokens found for user ID:', sourceUserId);
    console.error('Make sure you have completed the OAuth flow first.');
    process.exit(1);
  }

  console.log('Tokens found. Storing as owner...');

  // Store the same tokens under the 'owner' user ID
  await tokenService.storeTokens('owner', {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresAt
      ? Math.floor((tokens.expiresAt - Date.now()) / 1000)
      : null,
    scopes: tokens.scopes,
  });

  console.log('Owner tokens seeded successfully.');
  console.log('You can now log in with owner mode using your password.');
  process.exit(0);
}

const userId = process.argv[2];

if (!userId) {
  console.error('Usage: node scripts/seedOwnerTokens.js <challonge_user_id>');
  console.error('Find your Challonge user ID in the beelee_oauth_tokens DynamoDB table.');
  process.exit(1);
}

seedOwnerTokens(userId).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
