const uuid = require('uuid');

const tables = new Map();

module.exports = {
    add(table) {
        table.id = uuid.v4();
        table.currentDraw = {
            seats: new Array(8).fill(null),
            isActive: false,
            playerInTurn: -1,
            smallBlind: -1,
            timesChecked: 0,
            state: 0,
            totalBets: 0,
            cards: [],
        };

        tables.set(table.id, table);

        return table;
    },
    remove(id) {
        tables.delete(id);
    },
    list() {
        return Array.from(tables.values());
    },
    getById(id) {
        return tables.get(id);
    },
    addPlayer(id, seatNumber, player, playerId) {
        if (player) {
            player.playerId = playerId;
            player.cards = [null, null];
            player.chips = 1000;
            player.bet = 0;
            player.toCall = 0;
            player.playsFor = 0;
            player.isPlaying = false;
        }

        tables.get(id).currentDraw.seats[seatNumber] = player;
        return player;
    },
    getPlayerSeatIndex(tableId, playerId) {
        const tableSeats = tables.get(tableId).currentDraw.seats;
        return tableSeats.findIndex(seat => seat && seat.playerId === playerId);
    },
    toSimpleViewModel(table) {
        return {
            id: table.id,
            name: table.name,
            isLocked: table.password !== '',
            players: table.currentDraw.seats.filter(seat => seat).map(seat => ({
                playerName: seat.playerName,
                playerId: seat.playerId,
            })),
        };
    },
};
