const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const config = require('../../config');

class DynamoService {
  constructor() {
    const clientConfig = {
      region: config.aws.region,
    };

    // Only add credentials if they're provided (allows for IAM role auth in production)
    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }

    const client = new DynamoDBClient(clientConfig);
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tablePrefix = config.aws.dynamoTablePrefix;
  }

  /**
   * Get full table name with prefix
   */
  tableName(name) {
    return `${this.tablePrefix}${name}`;
  }

  // ============ Session Operations ============

  /**
   * Create a new session
   */
  async createSession(session) {
    const command = new PutCommand({
      TableName: this.tableName('sessions'),
      Item: {
        ...session,
        created_at: Date.now(),
      },
    });

    await this.docClient.send(command);
    return session;
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId) {
    const command = new GetCommand({
      TableName: this.tableName('sessions'),
      Key: { session_id: sessionId },
    });

    const response = await this.docClient.send(command);
    return response.Item || null;
  }

  /**
   * Update session last_accessed timestamp
   */
  async touchSession(sessionId) {
    const command = new UpdateCommand({
      TableName: this.tableName('sessions'),
      Key: { session_id: sessionId },
      UpdateExpression: 'SET last_accessed = :now',
      ExpressionAttributeValues: {
        ':now': Date.now(),
      },
    });

    await this.docClient.send(command);
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId) {
    const command = new DeleteCommand({
      TableName: this.tableName('sessions'),
      Key: { session_id: sessionId },
    });

    await this.docClient.send(command);
  }

  // ============ OAuth Token Operations ============

  /**
   * Store OAuth tokens for a user
   */
  async storeOAuthTokens(userId, tokens) {
    const command = new PutCommand({
      TableName: this.tableName('oauth_tokens'),
      Item: {
        user_id: userId,
        ...tokens,
        updated_at: Date.now(),
      },
    });

    await this.docClient.send(command);
  }

  /**
   * Get OAuth tokens for a user
   */
  async getOAuthTokens(userId) {
    const command = new GetCommand({
      TableName: this.tableName('oauth_tokens'),
      Key: { user_id: userId },
    });

    const response = await this.docClient.send(command);
    return response.Item || null;
  }

  /**
   * Update OAuth tokens (e.g., after refresh)
   */
  async updateOAuthTokens(userId, tokens) {
    const command = new UpdateCommand({
      TableName: this.tableName('oauth_tokens'),
      Key: { user_id: userId },
      UpdateExpression:
        'SET access_token_encrypted = :access, refresh_token_encrypted = :refresh, token_iv = :iv, expires_at = :expires, updated_at = :now',
      ExpressionAttributeValues: {
        ':access': tokens.access_token_encrypted,
        ':refresh': tokens.refresh_token_encrypted,
        ':iv': tokens.token_iv,
        ':expires': tokens.expires_at,
        ':now': Date.now(),
      },
    });

    await this.docClient.send(command);
  }

  /**
   * Delete OAuth tokens for a user
   */
  async deleteOAuthTokens(userId) {
    const command = new DeleteCommand({
      TableName: this.tableName('oauth_tokens'),
      Key: { user_id: userId },
    });

    await this.docClient.send(command);
  }
}

module.exports = new DynamoService();
