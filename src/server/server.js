const express = require('express');
const socketIo = require('socket.io');
const logger = require('morgan');

const tables = require('./services/tables');
const pokerEngine = require('./poker/engine');

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
app.use(express.static('dist'));

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
            currentDraw.totalBets = 30;
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

            io.to(tableId).emit('getRoom', { table, statusCode: 200 });
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
        if (table.name.length < 5 || table.name.length > 20) {
            socket.emit('validationError', { message: 'Table name must be between 5 and 20 chars!' });
            return;
        }

        const newTable = tables.add(table);

        io.emit('newTable', {
            tableId: newTable.id,
            table: tables.toSimpleViewModel(newTable),
        });
    });

    socket.on('getRoom', (req) => {
        let table = tables.getById(req.id);
        let statusCode;

        if (!table) {
            statusCode = 404;
        } else if (table.password !== req.password) {
            statusCode = 401;
            table = null;
        } else {
            statusCode = 200;
            table = { ...table };
            table.currentDraw.seats.forEach((seat) => {
                if (seat) {
                    seat.cards[0] = null;
                    seat.cards[1] = null;
                }
            });

            socket.join(req.id);
        }

        socket.emit('getRoom', {
            table,
            statusCode,
        });
    });

    socket.on('newPlayer', (player) => {
        const tableId = getTableId();
        const table = tables.getById(tableId);

        if (!table ||
            table.currentDraw.seats[player.seatNumber] ||
            tables.getPlayerSeatIndex(tableId, socket.id) !== -1) {
            socket.emit('validationError', { message: 'You cannot join this seat!' });
            return;
        }

        if (player.playerName.length < 4 || player.playerName.length > 10) {
            socket.emit('validationError', { message: 'Player name must be between 4 and 10 chars!' });
            return;
        }

        const newPlayer = tables.addPlayer(tableId, player.seatNumber, player, socket.id);

        socket.emit('joinSuccessful', player.seatNumber);

        io.to(tableId).emit('updatePlayer', {
            seatNumber: newPlayer.seatNumber,
            player: newPlayer,
        });

        io.emit('newTable', {
            tableId: table.id,
            table: tables.toSimpleViewModel(table),
        });

        startNewDeal();
    });

    socket.on('leaveRoom', () => {
        const tableId = getTableId();
        const table = tables.getById(tableId);

        if (!table) {
            socket.emit('validationError', { message: 'There is no such table!' });
            return;
        }

        const seatNumber = tables.getPlayerSeatIndex(tableId, socket.id);

        if (seatNumber === -1) {
            socket.emit('validationError', { message: 'You are not playing on this table!' });
            return;
        }

        tables.addPlayer(tableId, seatNumber, null);
        socket.leave(tableId);

        const playersInRoom = table.currentDraw.seats.filter(seat => seat);
        if (playersInRoom.length === 0) {
            tables.remove(tableId);
            io.emit('newTable', { tableId, table: null });
            io.to(tableId).emit('getRoom', { table: null, statusCode: 404 });
        } else {
            io.to(tableId).emit('updatePlayer', { seatNumber, player: null });
            io.emit('newTable', { tableId, table: tables.toSimpleViewModel(table) });
        }
    });

    socket.on('actionTaken', (data) => {
        const tableId = getTableId();
        const table = tables.getById(tableId);
        const seatNumber = tables.getPlayerSeatIndex(tableId, socket.id);
        const { currentDraw } = table;

        if (seatNumber === -1) {
            socket.emit('validationError', { message: 'You are not playing on this table!' });
            return;
        }

        if (currentDraw.playerInTurn !== seatNumber) {
            socket.emit('validationError', { message: 'You are not in turn!' });
            return;
        }

        const player = currentDraw.seats[seatNumber];

        switch (data.action) {
            case 1: {
                if (player.toCall) {
                    socket.emit('validationError', { message: 'You cannot check!' });
                    return;
                }

                currentDraw.timesChecked += 1;
                break;
            }
            case 2: {
                if (!player.toCall) {
                    socket.emit('validationError', { message: 'You cannot call!' });
                    return;
                }

                const amountCallable = player.chips >= player.toCall ? player.toCall : player.chips;

                player.chips -= amountCallable;
                player.toCall -= amountCallable;
                player.playsFor += amountCallable;
                player.bet += amountCallable;

                currentDraw.totalBets += amountCallable;
                currentDraw.timesChecked += 1;
                break;
            }
            case 3: {
                if (player.chips < data.betAmount || player.toCall >= data.betAmount) {
                    socket.emit('validationError', { message: 'You cannot raise!' });
                    return;
                }

                player.chips -= data.betAmount;
                player.bet += data.betAmount;
                player.playsFor += data.betAmount;
                player.toCall = 0;

                currentDraw.totalBets += data.betAmount;
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

                const activePlayersWithChips = currentDraw.seats
                    .filter(seat => seat && seat.isPlaying && seat.chips > 0);

                const contributeAmount = player.playsFor / activePlayersWithChips.length;

                activePlayersWithChips.forEach((activePlayer) => {
                    activePlayer.playsFor += contributeAmount;
                });

                break;
            }
            default: {
                socket.emit('validationError', { message: 'Invalid action!' });
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
                winner.chips += winner.playsFor;

                currentDraw.isActive = false;
                currentDraw.seats.forEach((seat) => {
                    if (seat && seat.chips === 0) {
                        tables.addPlayer(tableId, seat.seatNumber, null);
                    }
                });

                io.emit('newTable', {
                    tableId: table.id,
                    table: tables.toSimpleViewModel(table),
                });

                io.to(tableId).emit('updatePlayerInTurn', -1);

                io.to(tableId).emit('drawFinished', [{
                    seatNumber: winner.seatNumber,
                    chipsWon: currentDraw.totalBets,
                }]);

                setTimeout(() => { startNewDeal(table); }, 5000);
            } else if (currentDraw.state === 3) {
                const river = currentDraw.cards;
                const playersHands = currentDraw.seats
                    .filter(seat => seat)
                    .map(seat => seat.cards);

                const rankedHands = pokerEngine.rankHands(river, playersHands);

                const winners = [];
                rankedHands.forEach((similarRankedHands) => {
                    const winningPlayers = similarRankedHands
                        .map(hand => ({ player: activePlayers[hand.index], hand }))
                        .filter(p => p.player.playsFor > 0)
                        .sort((first, second) => first.player.playsFor - second.player.playsFor);

                    let totalChipsWon = 0;

                    winningPlayers.forEach((winningPlayer, index) => {
                        const divideBetween = winningPlayers.length - index;
                        const winnerPlaysFor = winningPlayer.player.playsFor / divideBetween;

                        activePlayers.forEach((activePlayer) => {
                            const chipsWon = Math.min(winnerPlaysFor, activePlayer.playsFor);

                            totalChipsWon += chipsWon;
                            activePlayer.playsFor -= chipsWon;
                        });

                        winningPlayer.player.chips += totalChipsWon;

                        winners.push({
                            seatNumber: winningPlayer.player.seatNumber,
                            chipsWon: totalChipsWon,
                            winningHand: winningPlayer.hand.bestCombination
                                .map(card => card.signature),
                            winningHandRank: winningPlayer.hand.rank,
                        });
                    });
                });

                currentDraw.isActive = false;
                currentDraw.seats.forEach((seat) => {
                    if (seat && seat.chips === 0) {
                        tables.addPlayer(tableId, seat.seatNumber, null);
                    }
                });

                io.emit('newTable', {
                    tableId: table.id,
                    table: tables.toSimpleViewModel(table),
                });

                io.to(tableId).emit('updatePlayerInTurn', -1);

                io.to(tableId).emit('drawFinished', winners);

                activePlayers.forEach((activePlayer) => {
                    io.to(tableId).emit('updatePlayer', {
                        seatNumber: activePlayer.seatNumber,
                        player: activePlayer,
                    });
                });

                setTimeout(() => { startNewDeal(table); }, 5000);
            } else {
                const alreadyGeneratedCards = new Set(currentDraw.cards);

                currentDraw.seats.forEach((seat) => {
                    if (seat) {
                        alreadyGeneratedCards.add(seat.cards[0]);
                        alreadyGeneratedCards.add(seat.cards[1]);
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
            }

            io.to(tableId).emit('updateTableState', {
                cards: currentDraw.cards,
                totalBets: currentDraw.totalBets,
                updatePlayersBets: true,
            });
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
