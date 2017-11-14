const express = require('express');
const socketIo = require('socket.io');
const controllers = require('./controllers');
const logger = require('morgan');

const tables = require('./tables');

const app = express();
const server = app.listen(6701, () => {
    console.log('Listening on port 6701');
});

const io = socketIo(server);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
    next();
});

app.use(logger('tiny'));
app.use(express.json());
app.use(express.static('dist'));
app.use('/api', controllers);
app.set('io', io);

io.on('connection', (socket) => {
    socket.on('getTables', () => {
        socket.emit('getTables', tables.list().map(table => tables.toSimpleViewModel(table)));
    });

    socket.on('newTable', (table) => {
        const newTable = tables.add(table);

        io.emit('newTable', tables.toSimpleViewModel(newTable));
    });

    socket.on('getRoom', (tableId) => {
        let table = tables.getById(tableId);

        if (table) {
            table = { ...table };
            table.currentDraw.seats.forEach((seat) => {
                if (seat) {
                    seat.cards[0] = null;
                    seat.cards[1] = null;
                }
            });

            socket.join(tableId);
        }

        socket.emit('getRoom', table);
    });

    socket.on('newPlayer', (player) => {
        const tableId = Object.keys(socket.rooms).filter(room => room !== socket.id)[0];
        const table = tables.getById(tableId);

        // If there is no such table or the seat is taken or the user is already playing on this table
        if (!table ||
            table.currentDraw.seats[player.seatNumber] ||
            tables.getPlayerSeatIndex(tableId, socket.id) !== -1) {
            socket.emit('error', { message: 'You cannot join this seat!' });
            return;
        }

        const newPlayer = tables.addPlayer(tableId, player.seatNumber, player, socket.id);

        io.to(tableId).emit('newPlayer', {
            seatNumber: newPlayer.seatNumber,
            player: newPlayer,
        });

        io.emit('newTable', tables.toSimpleViewModel(table));
    });

    socket.on('leaveRoom', () => {
        const tableId = Object.keys(socket.rooms).filter(room => room !== socket.id)[0];
        const table = tables.getById(tableId);

        if (!table) {
            socket.emit('error', { message: 'There is no such table!' });
            return;
        }

        const seatNumber = tables.getPlayerSeatIndex(tableId, socket.id);

        if (seatNumber === -1) {
            socket.emit('error', { message: 'You are not playing on this table!' });
            return;
        }

        tables.addPlayer(tableId, seatNumber, null);
        socket.leave(tableId);
        io.to(tableId).emit('newPlayer', {
            seatNumber,
            player: null,
        });

        io.emit('newTable', tables.toSimpleViewModel(table));
    });
});
