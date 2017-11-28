class Card {
    constructor(value) {
        if (typeof value === 'string') {
            const cardParts = value.split('-');

            this.number = Number.parseInt(cardParts[0], 10);
            this.suit = Number.parseInt(cardParts[1], 10);
        } else if (value instanceof Card) {
            this.number = value.number;
            this.suit = value.suit;
        }
    }

    get signature() {
        return `${this.number}-${this.suit}`;
    }
}

module.exports = { Card };
