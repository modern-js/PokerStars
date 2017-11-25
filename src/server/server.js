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

    // TODO: use another method -> filter by the if statement and the get the seatNumber from the properties
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

        if (seats.filter(seat => seat).length > 1 && !currentDraw.isActive) {
            seats.forEach((seat) => {
                if (seat) {
                    seat.isPlaying = true;
                    seat.toCall = 20;
                    seat.bet = 0;
                    seat.cards = [null, null];
                    seat.playsFor = 0;
                }
            });

            const playerInTurn = findNextPlayer(seats, currentDraw.playerInTurn);
            const bigBlindIndex = findPreviousPlayer(seats, playerInTurn);
            const smallBlindIndex = findPreviousPlayer(seats, bigBlindIndex);

            currentDraw.playerInTurn = playerInTurn;
            currentDraw.smallBlind = smallBlindIndex;
            currentDraw.timesChecked = 0;
            currentDraw.state = 0;
            currentDraw.totalBets = 0;
            currentDraw.cards = [];
            currentDraw.isActive = true;

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
                if (player.chips < data.betAmount || player.toCall >= data.betAmount) {
                    socket.emit('error', { message: 'You cannot raise!' });
                    return;
                }

                player.chips -= data.betAmount;
                player.bet += data.betAmount;
                player.playsFor += data.betAmount;
                player.toCall = 0;

                currentDraw.timesChecked = 1;
                currentDraw.seats.forEach((seat) => {
                    if (seat) {
                        seat.toCall = player.bet - seat.bet;
                    }
                });

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

        const activePlayersWithChips = currentDraw.seats
            .filter(seat => seat && seat.isPlaying && seat.chips > 0);

        if (currentDraw.timesChecked !== activePlayersWithChips.length) {
            currentDraw.playerInTurn = findNextPlayer(currentDraw.seats, currentDraw.playerInTurn);
        } else {
            // check if all players except 1 are all in
            const activePlayers = currentDraw.seats.filter(seat => seat && seat.isPlaying);

            if (activePlayers.length === 1) {
                const winner = activePlayers[0];
                winner.chips += (currentDraw.totalBets + winner.bet);

                currentDraw.isActive = false;
                currentDraw.seats.forEach((seat) => {
                    if (seat) {
                        if (seat.chips === 0) {
                            tables.addPlayer(tableId, seat.seatNumber, null);
                        }
                    }
                });

                io.emit('newTable', tables.toSimpleViewModel(table));

                io.to(tableId).emit('drawFinished', {
                    winners: [{
                        seatNumber: winner.seatNumber,
                        chipsWon: currentDraw.totalBets,
                    }],
                });

                startNewDeal(table);
            } else if (currentDraw.state === 3) {
                // show the cards
            } else {
                const alreadyGeneratedCards = new Set(currentDraw.cards);

                currentDraw.seats.forEach((seat) => {
                    if (seat) {
                        alreadyGeneratedCards.add(seat.cards[0]);
                        alreadyGeneratedCards.add(seat.cards[1]);
                        currentDraw.totalBets += seat.bet;
                        seat.bet = 0;
                    }
                });

                currentDraw.state += 1;
                currentDraw.playerInTurn =
                    findNextPlayer(currentDraw.seats, currentDraw.smallBlind - 1);
                currentDraw.timesChecked = 0;

                const numberOfCardsToGenerate = currentDraw.state === 1 ? 3 : 1;
                const generatedCards = pokerEngine
                    .generateCards(numberOfCardsToGenerate, alreadyGeneratedCards)
                    .map(card => card.signature);

                currentDraw.cards.push(...generatedCards);

                io.to(tableId).emit('updateTableState', {
                    cards: currentDraw.cards,
                    totalBets: currentDraw.totalBets,
                    updatePlayersBets: true,
                });
            }
        }

        if (currentDraw.isActive) {
            const playerInTurn = currentDraw.seats[currentDraw.playerInTurn];

            io.to(playerInTurn.playerId).emit('updatePlayer', {
                seatNumber: playerInTurn.seatNumber,
                player: playerInTurn,
            });
            io.to(tableId).emit('updatePlayerInTurn', playerInTurn.seatNumber);
        }
    });
});
