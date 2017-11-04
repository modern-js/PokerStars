const express = require('express');
const tables = require('../tables');

const router = express.Router();

router.get('/', (req, res) => {
    res.json(tables.list());
});

router.get('/:id', (req, res) => {
    const table = tables.getById(req.params.id);

    if (!table) {
        res.status(404);
    }

    res.send(table);
});

router.post('/', (req, res) => {
    const table = {
        name: req.body.name,
        password: req.body.password,
        isLocked: req.body.password !== '',
        players: [],
    };

    const newTable = tables.add(table);
    const message = { message: 'added successfully' };

    res.json(message);
    req.app.get('io').emit('newTable', newTable);
});

module.exports = router;
