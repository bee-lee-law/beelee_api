const express = require('express');
const router = express.Router();
const challongeService = require('../../services/external/challongeService');
const { authMiddleware, requireMode } = require('../../middleware/authMiddleware');

// All tournament routes require authentication
router.use(authMiddleware);

// Only user and owner modes can access Challonge API
router.use(requireMode(['user', 'owner']));

/**
 * GET /api/challonge/tournaments
 * List tournaments
 */
router.get('/', async (req, res, next) => {
  try {
    const { page, per_page, state } = req.query;
    const userId = req.user.challongeUserId;

    const result = await challongeService.listTournaments(userId, {
      page: parseInt(page) || 1,
      perPage: parseInt(per_page) || 25,
      state,
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
 * POST /api/challonge/tournaments
 * Create a tournament
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const tournamentData = req.body;

    if (!tournamentData.name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Tournament name is required' },
      });
    }

    const result = await challongeService.createTournament(userId, tournamentData);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/challonge/tournaments/:id
 * Get a single tournament
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { id } = req.params;
    const { include_participants, include_matches } = req.query;

    const result = await challongeService.getTournament(
      userId,
      id,
      include_participants === 'true',
      include_matches === 'true'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/challonge/tournaments/:id
 * Update a tournament
 */
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { id } = req.params;
    const tournamentData = req.body;

    const result = await challongeService.updateTournament(userId, id, tournamentData);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/challonge/tournaments/:id
 * Delete a tournament
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { id } = req.params;

    await challongeService.deleteTournament(userId, id);

    res.json({
      success: true,
      data: { message: 'Tournament deleted' },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/challonge/tournaments/:id/start
 * Start a tournament
 */
router.post('/:id/start', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { id } = req.params;

    const result = await challongeService.startTournament(userId, id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/challonge/tournaments/:id/finalize
 * Finalize a tournament
 */
router.post('/:id/finalize', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { id } = req.params;

    const result = await challongeService.finalizeTournament(userId, id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/challonge/tournaments/:id/reset
 * Reset a tournament
 */
router.post('/:id/reset', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { id } = req.params;

    const result = await challongeService.resetTournament(userId, id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
