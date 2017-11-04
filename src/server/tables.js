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
};
