class Card {
    constructor(number, suit) {
        this.number = number;
        this.suit = suit;
    }

    get signature() {
        return `${this.number}-${this.suit}`;
    }
}

module.exports = { Card };
