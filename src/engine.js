const Card = require('./models/Card').Card;

function setupHandChecker(river) {
    const numbersCards = new Array(15).fill(0).map(() => []);
    const suitsCards = new Array(5).fill(0).map(() => []);
    const cardsSet = new Set();

    const processCards = (cards, expectedCards) => {
        cards.forEach((card) => {
            numbersCards[card.number].push(card);
            suitsCards[card.suit].push(card);
            cardsSet.add(card.signature);
        });

        if (cardsSet.size < expectedCards) {
            throw new Error('Invalid cards');
        }
    };

    const getHighestCards = (numberOfCardsToGet, exceptionNumbers = new Set()) => {
        const highestCards = [];
        let counter = 0;

        while (highestCards.length < numberOfCardsToGet && counter < numbersCards.length) {
            const numberToGet = numbersCards.length - (counter += 1);
            const numberCards = numbersCards[numberToGet];

            if (numberCards.length && !exceptionNumbers.has(numberToGet)) {
                numberCards.forEach((card) => { highestCards.push(card); });
            }
        }

        return highestCards.slice(0, numberOfCardsToGet);
    };

    processCards(river, 5);

    return (hand) => {
        processCards(hand, 7);

        const numbersPositions = numbersCards.map((numberArray, index) =>
            +(numberArray.length || (index === 1 && numbersCards[14].length))).join('');
        const straightPosition = numbersPositions.match(/[1-9]{5,}/);
        const straightCards = !straightPosition ? undefined : numbersCards
            .slice(straightPosition.index, straightPosition[0].length + straightPosition.index);

        const flushCards = suitsCards.filter(suitsArray => suitsArray.length >= 5)[0];
        const flushCardsSignatures = flushCards && new Set(flushCards.map(card => card.signature));

        const intersection = [];
        if (straightCards && flushCards) {
            straightCards.forEach((numberCards) => {
                numberCards.forEach((card) => {
                    if (flushCardsSignatures.has(card.signature)) intersection.push(card);
                });
            });
        }

        const nOfAKind = new Array(5).fill(0).map(() => []);
        numbersCards.forEach(numbersArray => nOfAKind[numbersArray.length].push(numbersArray));

        let rank = 0;
        const bestCombination = [];

        if (intersection.length >= 5) {
            rank = 9;
            bestCombination.push(...intersection.slice(intersection.length - 5).reverse());
        } else if (nOfAKind[4].length) {
            rank = 8;
            bestCombination.push(...nOfAKind[4][0]);
            bestCombination.push(...getHighestCards(1, new Set([bestCombination[0].number])));
        } else if (nOfAKind[3].length === 2) {
            rank = 7;
            bestCombination.push(...nOfAKind[3][1]);
            bestCombination.push(...nOfAKind[3][0].slice(0, 2));
        } else if (nOfAKind[3].length && nOfAKind[2].length) {
            rank = 7;
            bestCombination.push(...nOfAKind[3][0]);
            bestCombination.push(...nOfAKind[2][nOfAKind[2].length - 1]);
        } else if (flushCards) {
            rank = 6;
            bestCombination.push(...flushCards.slice()
                .sort((first, second) => second.number - first.number).slice(0, 5));
        } else if (straightCards) {
            rank = 5;
            bestCombination.push(...straightCards.slice(straightCards.length - 5)
                .map(numberCards => numberCards[0]).reverse());
        } else if (nOfAKind[3].length) {
            rank = 4;
            bestCombination.push(...nOfAKind[3][0]);
            bestCombination.push(...getHighestCards(2, new Set([bestCombination[0].number])));
        } else if (nOfAKind[2].length >= 2) {
            rank = 3;
            bestCombination.push(...nOfAKind[2][nOfAKind[2].length - 1]);
            bestCombination.push(...nOfAKind[2][nOfAKind[2].length - 2]);
            bestCombination.push(...getHighestCards(1,
                new Set([bestCombination[0].number, bestCombination[2].number])));
        } else if (nOfAKind[2].length) {
            rank = 2;
            bestCombination.push(...nOfAKind[2][0]);
            bestCombination.push(...getHighestCards(3, new Set([bestCombination[0].number])));
        } else {
            rank = 1;
            bestCombination.push(...getHighestCards(5));
        }

        hand.forEach((card) => {
            numbersCards[card.number].splice(-1, 1);
            suitsCards[card.suit].splice(-1, 1);
            cardsSet.delete(card.signature);
        });

        return { rank, bestCombination };
    };
}

function determineWinner(river, hands) {
    const bestHands = [];
    let bestRank = 0;

    hands.forEach((hand) => {
        const handRank = setupHandChecker(river, hand);

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
