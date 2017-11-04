const express = require('express');
const tables = require('../tables');

const router = express.Router();

router.get('/', (req, res) => {
    res.json(tables.list());
});

router.get('/:id', (req, res) => {
    res.send(tables.getById(req.params.id));
});

router.post('/', (req, res) => {
    const table = {
        name: req.body.name,
        password: req.body.password,
        isLocked: req.body.password !== '',
        players: [],
    };

    tables.add(table);
    const message = { message: 'added successfully' };
    res.json(message);
});

module.exports = router;
