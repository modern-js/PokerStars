const express = require('express');
const tables = require('../tables');

const router = express.Router();

router.get('/', (req, res) => {
    res.json(tables.list().map(table => tables.toSimpleViewModel(table)));
});

router.get('/:id', (req, res) => {
    const table = tables.getById(req.params.id);

    if (!table) {
        res.status(404).send();
    } else {
        const response = { ...table.currentDraw };
        response.seats.forEach((seat) => { if (seat) seat.cards = null; });

        res.send(response);
    }
});

router.post('/', (req, res) => {
    const table = {
        name: req.body.name,
        password: req.body.password,
        currentDraw: {
            seats: new Array(8).fill(null),
        },
    };

    const newTable = tables.add(table);
    const message = { message: 'added successfully' };

    res.json(message);
    req.app.get('io').emit('newTable', tables.toSimpleViewModel(newTable));
});

router.put('/:id/addPlayer', (req, res) => {
    const table = tables.getById(req.params.id);

    if (!table) {
        res.status(404);
    }

    if (table.currentDraw.seats[req.body.seatNumber]) {
        res.status(400).statusMessage('This place is already occupied!');
    }

    const newPlayer = {
        playerName: req.body.playerName,
        seat: req.body.seatNumber,
        cards: [null, null],
        chips: 1000,
    };

    tables.addPlayer(req.params.id, req.body.seatNumber, newPlayer);
});

module.exports = router;
