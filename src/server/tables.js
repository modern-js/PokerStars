const uuid = require('uuid');

const tables = new Map();

module.exports = {
    add(table) {
        table.id = uuid.v4();
        table.currentDraw = {
            seats: new Array(8).fill(null),
            hasStarted: false,
            playerInTurn: 0,
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
            player.status = 3;
        }

        tables.get(id).currentDraw.seats[seatNumber] = player;
        return player;
    },
    getPlayerSeatIndex(tableId, playerId) {
        const tableSeats = tables.get(tableId).currentDraw.seats;
        const seatIndex = tableSeats.findIndex(seat => seat && seat.playerId === playerId);
        return seatIndex;
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
