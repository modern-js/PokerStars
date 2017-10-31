const express = require('express');
const tables = require('./tables');

const router = express.Router();

router.use('/tables', tables);

module.exports = router;
