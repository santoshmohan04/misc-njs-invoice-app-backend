const express = require('express');
const router = express.Router();

const reportingController = require('../controllers/reportingController');

router.use('/', reportingController);

module.exports = router;
