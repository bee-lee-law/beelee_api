const express = require('express');
const router = express.Router();

const tournamentRoutes = require('./tournaments');
const participantRoutes = require('./participants');
const matchRoutes = require('./matches');

// Mount tournament routes
router.use('/tournaments', tournamentRoutes);

// Mount nested participant routes under tournaments
router.use('/tournaments/:tournamentId/participants', participantRoutes);

// Mount nested match routes under tournaments
router.use('/tournaments/:tournamentId/matches', matchRoutes);

module.exports = router;
