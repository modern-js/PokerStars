const Card = require('./models/Card').Card;

function createDeck() {
    const deck = [];
    for (let i = 2; i < 15; i += 1) {
        for (let j = 0; j < 4; j += 1) {
            deck.push(new Card(i, j));
        }
    }

    return deck;
}

const deck = createDeck();
const numberOfCards = 52;

function getHandRank(river, hand) {
    return 5;
}

function determineWinner(river, ...hands) {
    const bestHands = [];
    let bestRank = 0;

    hands.forEach((hand) => {
        const handRank = getHandRank(river, hand);

        if (handRank > bestRank) {
            bestRank = handRank;
            bestHands.splice(0, bestHands.length, hand);
        } else if (handRank === bestRank) {
            bestHands.push(hand);
        }
    });

    if (bestHands.length === 1) {
        return bestHands[0];
    }

    return 0;
}

function generateCards(numberOfCardsToGenerate, alreadyGeneratedCards) {
    if (numberOfCardsToGenerate + alreadyGeneratedCards.size > numberOfCards) {
        throw new Error(`You cannot generate more than ${numberOfCards} cards`);
    }

    const generatedCards = [];
    while (generatedCards.length !== numberOfCardsToGenerate) {
        const generatedCard = deck[Math.floor(Math.random() * numberOfCards)];
        const generatedCardSignature = generatedCard.signature;

        if (!alreadyGeneratedCards.has(generatedCardSignature)) {
            generatedCards.push(generatedCard);
            alreadyGeneratedCards.add(generatedCardSignature);
        }
    }

    return generatedCards;
}

module.exports = { determineWinner, generateCards };
