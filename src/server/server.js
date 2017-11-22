const express = require('express');
const socketIo = require('socket.io');
const controllers = require('./controllers');
const logger = require('morgan');

const tables = require('./tables');
const pokerEngine = require('../engine');

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
    const getTableId = () => Object.keys(socket.rooms).filter(room => room !== socket.id)[0];

    const findNextPlayer = (seats, playerInTurn) => {
        const seatsCount = seats.length;
        for (let i = (playerInTurn + 1) % seatsCount; i < seatsCount; i += 1, i %= seatsCount) {
            if (seats[i] && seats[i].isPlaying && seats[i].chips > 0) return i;
        }

        return null;
    };

    const findPreviousPlayer = (seats, playerInTurn) => {
        for (let i = playerInTurn - 1 < 0 ? seats.length - 1 : playerInTurn - 1; i >= 0; i -= 1) {
            if (seats[i] && seats[i].isPlaying && seats[i].chips > 0) return i;
            if (i <= 0) i = seats.length;
        }

        return null;
    };

    const startNewDeal = () => {
        const tableId = getTableId();
        const table = tables.getById(tableId);
        const { currentDraw } = table;
        const { seats } = currentDraw;

        if (seats.filter(seat => seat).length > 1 && !currentDraw.hasStarted) {
            currentDraw.hasStarted = true;

            seats.forEach((seat) => {
                if (seat) {
                    seat.isPlaying = true;
                    seat.toCall = 20;
                }
            });

            currentDraw.playerInTurn = findNextPlayer(seats, currentDraw.playerInTurn);
            const bigBlindIndex = findPreviousPlayer(seats, currentDraw.playerInTurn);
            const smallBlindIndex = findPreviousPlayer(seats, bigBlindIndex);
            currentDraw.smallBlind = smallBlindIndex;

            seats[smallBlindIndex].bet = 10;
            seats[smallBlindIndex].chips -= 10;
            seats[smallBlindIndex].playsFor = 10;
            seats[smallBlindIndex].toCall = 10;

            seats[bigBlindIndex].bet = 20;
            seats[bigBlindIndex].chips -= 20;
            seats[bigBlindIndex].playsFor = 20;
            seats[bigBlindIndex].toCall = 0;

            io.to(tableId).emit('getRoom', table);
            io.to(tableId).emit('updatePlayerInTurn', currentDraw.playerInTurn);

            const alreadyGeneratedCards = new Set();
            seats.forEach((seat) => {
                if (seat) {
                    seat.cards = pokerEngine.generateCards(2, alreadyGeneratedCards)
                        .map(card => card.signature);

                    io.to(seat.playerId).emit('updatePlayer', {
                        seatNumber: seat.seatNumber,
                        player: seat,
                    });
                }
            });
        }
    };

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
        const tableId = getTableId();
        const table = tables.getById(tableId);

        // If there is no such table or the seat is taken or the user is already playing on this table
        if (!table ||
            table.currentDraw.seats[player.seatNumber] ||
            tables.getPlayerSeatIndex(tableId, socket.id) !== -1) {
            socket.emit('error', { message: 'You cannot join this seat!' });
            return;
        }

        const newPlayer = tables.addPlayer(tableId, player.seatNumber, player, socket.id);

        io.to(tableId).emit('updatePlayer', {
            seatNumber: newPlayer.seatNumber,
            player: newPlayer,
        });

        io.emit('newTable', tables.toSimpleViewModel(table));

        startNewDeal();
    });

    socket.on('leaveRoom', () => {
        const tableId = getTableId();
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
        io.to(tableId).emit('updatePlayer', {
            seatNumber,
            player: null,
        });

        io.emit('newTable', tables.toSimpleViewModel(table));
    });

    socket.on('actionTaken', (data) => {
        const tableId = getTableId();
        const table = tables.getById(tableId);

        const seatNumber = tables.getPlayerSeatIndex(tableId, socket.id);
        const { currentDraw } = table;

        if (seatNumber === -1) {
            socket.emit('error', { message: 'You are not playing on this table!' });
            return;
        }

        if (currentDraw.playerInTurn !== seatNumber) {
            socket.emit('error', { message: 'You are not in turn!' });
            return;
        }

        const player = currentDraw.seats[seatNumber];

        switch (data.action) {
            case 1: {
                if (player.toCall) {
                    socket.emit('error', { message: 'You cannot check!' });
                    return;
                }

                currentDraw.timesChecked += 1;
                break;
            }
            case 2: {
                if (!player.toCall) {
                    socket.emit('error', { message: 'You cannot call!' });
                    return;
                }

                const amountCallable = player.chips >= player.toCall ? player.toCall : player.chips;

                player.chips -= amountCallable;
                player.toCall -= amountCallable;
                player.playsFor += amountCallable;
                player.bet += amountCallable;

                currentDraw.timesChecked += 1;
                break;
            }
            case 3: {
                const totalBet = data.betAmount + player.toCall;

                if (player.chips < totalBet) {
                    socket.emit('error', { message: 'You cannot raise!' });
                    return;
                }

                currentDraw.seats.forEach((seat) => { if (seat) seat.toCall += data.betAmount; });

                player.chips -= data.betAmount;
                player.bet += data.betAmount;
                player.playsFor += data.betAmount;
                // TODO: fix this
                player.toCall -= (2 * data.betAmount);

                currentDraw.timesChecked = 1;
                break;
            }
            case 4: {
                player.isPlaying = false;
                break;
            }
            default: {
                socket.emit('error', { message: 'Invalid action!' });
                return;
            }
        }

        const playerWithoutCards = { ...player };
        playerWithoutCards.cards = [null, null];

        socket.broadcast.to(tableId).emit('updatePlayer', {
            seatNumber: player.seatNumber,
            player: playerWithoutCards,
        });

        socket.emit('updatePlayer', {
            seatNumber: player.seatNumber,
            player,
        });

        // check if all players has folded
        if (currentDraw.timesChecked !==
            currentDraw.seats.filter(seat => seat && seat.isPlaying && seat.chips > 0).length) {
            currentDraw.playerInTurn = findNextPlayer(currentDraw.seats, currentDraw.playerInTurn);
        } else {
            if (currentDraw.state === 3) {
                io.to(tableId).emit('drawFinished', {
                    winners: [{
                        seatNumber: 0,
                        chipsWon: 0,
                    }],
                });
            }

            const alreadyGeneratedCards = new Set(currentDraw.cards);
            let totalBets = 0;

            currentDraw.seats.forEach((seat) => {
                if (seat) {
                    alreadyGeneratedCards.add(seat.cards[0]);
                    alreadyGeneratedCards.add(seat.cards[1]);
                    totalBets += seat.bet;
                }
            });

            currentDraw.state += 1;
            currentDraw.playerInTurn = findNextPlayer(currentDraw.seats, currentDraw.smallBlind - 1);
            currentDraw.timesChecked = 0;
            currentDraw.totalBets = totalBets;

            const numberOfCardsToGenerate = currentDraw.state === 1 ? 3 : 1;
            currentDraw.cards.push(...pokerEngine.generateCards(numberOfCardsToGenerate, alreadyGeneratedCards).map(card => card.signature));

            io.to(tableId).emit('updateTableState', {
                cards: currentDraw.cards,
                totalBets: currentDraw.totalBets,
            });
        }

        io.to(tableId).emit('updatePlayerInTurn', currentDraw.playerInTurn);

        io.to(currentDraw.seats[currentDraw.playerInTurn].playerId).emit('updatePlayer', {
            seatNumber: currentDraw.playerInTurn,
            player: currentDraw.seats[currentDraw.playerInTurn],
        });
    });
});
