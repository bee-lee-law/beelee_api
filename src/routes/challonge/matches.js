const express = require('express');
const router = express.Router({ mergeParams: true });
const challongeService = require('../../services/external/challongeService');
const { authMiddleware, requireMode } = require('../../middleware/authMiddleware');

// All match routes require authentication
router.use(authMiddleware);
router.use(requireMode(['user', 'owner']));

/**
 * GET /api/challonge/tournaments/:tournamentId/matches
 * List matches in a tournament
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { tournamentId } = req.params;
    const { state } = req.query;

    const result = await challongeService.listMatches(userId, tournamentId, state);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/challonge/tournaments/:tournamentId/matches/:matchId
 * Get a single match
 */
router.get('/:matchId', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { tournamentId, matchId } = req.params;

    const result = await challongeService.getMatch(userId, tournamentId, matchId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/challonge/tournaments/:tournamentId/matches/:matchId
 * Update a match (report scores)
 */
router.put('/:matchId', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { tournamentId, matchId } = req.params;
    const { scoresCsv, winnerId } = req.body;

    if (!scoresCsv && !winnerId) {
      return res.status(400).json({
        success: false,
        error: { message: 'scoresCsv or winnerId is required' },
      });
    }

    const result = await challongeService.updateMatch(userId, tournamentId, matchId, {
      scoresCsv,
      winnerId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/challonge/tournaments/:tournamentId/matches/:matchId/reopen
 * Reopen a match
 */
router.post('/:matchId/reopen', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { tournamentId, matchId } = req.params;

    const result = await challongeService.reopenMatch(userId, tournamentId, matchId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
