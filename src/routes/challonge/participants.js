const express = require('express');
const router = express.Router({ mergeParams: true });
const challongeService = require('../../services/external/challongeService');
const { authMiddleware, requireMode } = require('../../middleware/authMiddleware');

// All participant routes require authentication
router.use(authMiddleware);
router.use(requireMode(['user', 'owner']));

/**
 * GET /api/challonge/tournaments/:tournamentId/participants
 * List participants in a tournament
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { tournamentId } = req.params;

    const result = await challongeService.listParticipants(userId, tournamentId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/challonge/tournaments/:tournamentId/participants
 * Add a participant to a tournament
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { tournamentId } = req.params;
    const participantData = req.body;

    if (!participantData.name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Participant name is required' },
      });
    }

    const result = await challongeService.addParticipant(
      userId,
      tournamentId,
      participantData
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/challonge/tournaments/:tournamentId/participants/bulk
 * Bulk add participants to a tournament
 */
router.post('/bulk', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { tournamentId } = req.params;
    const { participants } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Participants array is required' },
      });
    }

    // Validate each participant has a name
    for (const p of participants) {
      if (!p.name) {
        return res.status(400).json({
          success: false,
          error: { message: 'Each participant must have a name' },
        });
      }
    }

    const result = await challongeService.bulkAddParticipants(
      userId,
      tournamentId,
      participants
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/challonge/tournaments/:tournamentId/participants/:participantId
 * Update a participant
 */
router.put('/:participantId', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { tournamentId, participantId } = req.params;
    const participantData = req.body;

    const result = await challongeService.updateParticipant(
      userId,
      tournamentId,
      participantId,
      participantData
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
 * DELETE /api/challonge/tournaments/:tournamentId/participants/:participantId
 * Remove a participant from a tournament
 */
router.delete('/:participantId', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { tournamentId, participantId } = req.params;

    await challongeService.removeParticipant(userId, tournamentId, participantId);

    res.json({
      success: true,
      data: { message: 'Participant removed' },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/challonge/tournaments/:tournamentId/participants/randomize
 * Randomize participant seeds
 */
router.post('/randomize', async (req, res, next) => {
  try {
    const userId = req.user.challongeUserId;
    const { tournamentId } = req.params;

    const result = await challongeService.randomizeParticipants(userId, tournamentId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
