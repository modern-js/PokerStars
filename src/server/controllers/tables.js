const express = require('express');
const tables = require('../tables');

const router = express.Router();

router.get('/', (req, res) => {
    res.json(tables.list().map(table => tables.toSimpleViewModel(table)));
});

router.get('/:id', (req, res) => {
    const table = tables.getById(req.params.id);

    if (!table) {
        return res.status(404).send();
    }

    const response = { ...table };
    response.currentDraw.seats.forEach((seat) => {
        if (seat) {
            seat.cards[0] = null;
            seat.cards[1] = null;
        }
    });

    return res.status(200).send(response);
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
        return res.status(404).send();
    }

    if (table.currentDraw.seats[req.body.seatNumber]) {
        return res.status(400).statusMessage('This place is already occupied!').send();
    }

    const newPlayer = {
        playerName: req.body.playerName,
        seatNumber: req.body.seatNumber,
        cards: [null, null],
        chips: 1000,
    };

    tables.addPlayer(table.id, req.body.seatNumber, newPlayer);

    req.app.get('io').emit(table.id, newPlayer);
    return res.status(200).send();
});

module.exports = router;
