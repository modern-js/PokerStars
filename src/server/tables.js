const uuid = require('uuid');

const tables = new Map();

module.exports = {
    add(table) {
        table.id = uuid.v4();
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
    addPlayer(id, seatNumber, player) {
        tables.get(id).currentDraw.seats[seatNumber] = player;
    },
    toSimpleViewModel(table) {
        return {
            id: table.id,
            name: table.name,
            isLocked: table.password !== '',
            players: table.currentDraw.seats.filter(seat => seat).map(seat => seat.playerName),
        };
    },
};
