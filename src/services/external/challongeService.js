const axios = require('axios');
const config = require('../../config');
const tokenService = require('../internal/tokenService');
const authService = require('../internal/authService');

class ChallongeService {
  constructor() {
    this.baseUrl = config.challonge.apiBaseUrl;
    this.timeout = 15000;
  }

  /**
   * Get valid access token for a user, refreshing if needed
   * @param {string} userId - Challonge user ID or 'owner'
   * @returns {string} Valid access token
   */
  async getAccessToken(userId) {
    // Check if tokens are expired
    if (await tokenService.areTokensExpired(userId)) {
      // Refresh tokens
      await authService.refreshChallongeTokens(userId);
    }

    const tokens = await tokenService.getTokens(userId);
    if (!tokens) {
      throw new Error('No Challonge tokens available');
    }

    return tokens.accessToken;
  }

  /**
   * Make authenticated request to Challonge API
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {string} userId - User ID for token lookup
   * @param {Object} data - Request body (for POST/PUT)
   * @param {Object} params - Query parameters
   */
  async makeRequest(method, endpoint, userId, data = null, params = {}) {
    const accessToken = await this.getAccessToken(userId);

    const requestConfig = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/json',
      },
      timeout: this.timeout,
      params,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestConfig.data = data;
    }

    try {
      const response = await axios(requestConfig);
      return response.data;
    } catch (error) {
      console.error(
        `Challonge API error (${method} ${endpoint}):`,
        error.response?.data || error.message
      );

      // Handle specific errors
      if (error.response?.status === 401) {
        throw new Error('Challonge authentication failed');
      }
      if (error.response?.status === 404) {
        throw new Error('Resource not found');
      }
      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;
        throw new Error(errors?.[0]?.detail || 'Validation error');
      }

      throw new Error(
        error.response?.data?.errors?.[0]?.detail ||
          `Challonge API error: ${error.message}`
      );
    }
  }

  // ============ Tournament Operations ============

  /**
   * List tournaments
   */
  async listTournaments(userId, options = {}) {
    const params = {
      page: options.page || 1,
      per_page: options.perPage || 25,
    };

    if (options.state) {
      params['filter[state]'] = options.state;
    }

    return this.makeRequest('GET', '/tournaments.json', userId, null, params);
  }

  /**
   * Get a single tournament
   */
  async getTournament(userId, tournamentId, includeParticipants = false, includeMatches = false) {
    const includes = [];
    if (includeParticipants) includes.push('participants');
    if (includeMatches) includes.push('matches');

    const params = includes.length ? { include: includes.join(',') } : {};

    return this.makeRequest(
      'GET',
      `/tournaments/${tournamentId}.json`,
      userId,
      null,
      params
    );
  }

  /**
   * Create a tournament
   */
  async createTournament(userId, tournamentData) {
    const payload = {
      data: {
        type: 'tournaments',
        attributes: {
          name: tournamentData.name,
          tournament_type: tournamentData.tournamentType || 'single elimination',
          description: tournamentData.description || '',
          game_name: tournamentData.gameName || '',
          open_signup: tournamentData.openSignup || false,
          hold_third_place_match: tournamentData.holdThirdPlaceMatch || false,
          pts_for_match_win: tournamentData.ptsForMatchWin || 1.0,
          pts_for_match_tie: tournamentData.ptsForMatchTie || 0.5,
          pts_for_bye: tournamentData.ptsForBye || 1.0,
          swiss_rounds: tournamentData.swissRounds || 0,
          ranked_by: tournamentData.rankedBy || 'match wins',
        },
      },
    };

    return this.makeRequest('POST', '/tournaments.json', userId, payload);
  }

  /**
   * Update a tournament
   */
  async updateTournament(userId, tournamentId, tournamentData) {
    const payload = {
      data: {
        type: 'tournaments',
        id: tournamentId,
        attributes: tournamentData,
      },
    };

    return this.makeRequest(
      'PUT',
      `/tournaments/${tournamentId}.json`,
      userId,
      payload
    );
  }

  /**
   * Delete a tournament
   */
  async deleteTournament(userId, tournamentId) {
    return this.makeRequest(
      'DELETE',
      `/tournaments/${tournamentId}.json`,
      userId
    );
  }

  /**
   * Start a tournament
   */
  async startTournament(userId, tournamentId) {
    return this.makeRequest(
      'POST',
      `/tournaments/${tournamentId}/start.json`,
      userId
    );
  }

  /**
   * Finalize a tournament
   */
  async finalizeTournament(userId, tournamentId) {
    return this.makeRequest(
      'POST',
      `/tournaments/${tournamentId}/finalize.json`,
      userId
    );
  }

  /**
   * Reset a tournament
   */
  async resetTournament(userId, tournamentId) {
    return this.makeRequest(
      'POST',
      `/tournaments/${tournamentId}/reset.json`,
      userId
    );
  }

  // ============ Participant Operations ============

  /**
   * List participants in a tournament
   */
  async listParticipants(userId, tournamentId) {
    return this.makeRequest(
      'GET',
      `/tournaments/${tournamentId}/participants.json`,
      userId
    );
  }

  /**
   * Add a participant to a tournament
   */
  async addParticipant(userId, tournamentId, participantData) {
    const payload = {
      data: {
        type: 'participants',
        attributes: {
          name: participantData.name,
          seed: participantData.seed || null,
          misc: participantData.misc || '',
          email: participantData.email || null,
        },
      },
    };

    return this.makeRequest(
      'POST',
      `/tournaments/${tournamentId}/participants.json`,
      userId,
      payload
    );
  }

  /**
   * Bulk add participants
   */
  async bulkAddParticipants(userId, tournamentId, participants) {
    const payload = {
      data: participants.map((p) => ({
        type: 'participants',
        attributes: {
          name: p.name,
          seed: p.seed || null,
          misc: p.misc || '',
        },
      })),
    };

    return this.makeRequest(
      'POST',
      `/tournaments/${tournamentId}/participants/bulk_add.json`,
      userId,
      payload
    );
  }

  /**
   * Update a participant
   */
  async updateParticipant(userId, tournamentId, participantId, participantData) {
    const payload = {
      data: {
        type: 'participants',
        id: participantId,
        attributes: participantData,
      },
    };

    return this.makeRequest(
      'PUT',
      `/tournaments/${tournamentId}/participants/${participantId}.json`,
      userId,
      payload
    );
  }

  /**
   * Remove a participant
   */
  async removeParticipant(userId, tournamentId, participantId) {
    return this.makeRequest(
      'DELETE',
      `/tournaments/${tournamentId}/participants/${participantId}.json`,
      userId
    );
  }

  /**
   * Randomize seeds
   */
  async randomizeParticipants(userId, tournamentId) {
    return this.makeRequest(
      'POST',
      `/tournaments/${tournamentId}/participants/randomize.json`,
      userId
    );
  }

  // ============ Match Operations ============

  /**
   * List matches in a tournament
   */
  async listMatches(userId, tournamentId, state = null) {
    const params = state ? { 'filter[state]': state } : {};

    return this.makeRequest(
      'GET',
      `/tournaments/${tournamentId}/matches.json`,
      userId,
      null,
      params
    );
  }

  /**
   * Get a single match
   */
  async getMatch(userId, tournamentId, matchId) {
    return this.makeRequest(
      'GET',
      `/tournaments/${tournamentId}/matches/${matchId}.json`,
      userId
    );
  }

  /**
   * Update match (report scores)
   */
  async updateMatch(userId, tournamentId, matchId, matchData) {
    const payload = {
      data: {
        type: 'matches',
        id: matchId,
        attributes: {
          match: {
            scores_csv: matchData.scoresCsv,
            winner_id: matchData.winnerId,
          },
        },
      },
    };

    return this.makeRequest(
      'PUT',
      `/tournaments/${tournamentId}/matches/${matchId}.json`,
      userId,
      payload
    );
  }

  /**
   * Reopen a match
   */
  async reopenMatch(userId, tournamentId, matchId) {
    return this.makeRequest(
      'POST',
      `/tournaments/${tournamentId}/matches/${matchId}/reopen.json`,
      userId
    );
  }
}

module.exports = new ChallongeService();
