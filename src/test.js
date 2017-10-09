const engine = require('./engine');

const alreadyGeneratedCards = new Set();

const river = engine.generateCards(5, alreadyGeneratedCards);
const hands = new Array(8).fill(0).map(() => engine.generateCards(2, alreadyGeneratedCards));

const rankedHands = engine.rankHands(river, hands);
const winners = engine.determineWinner(rankedHands);

console.log(`River cards:\n${river.map(card => card.signature).join('   ')}\n`);

console.log(`Hands:\n${hands.map(hand => `${hand[0].signature}   ${hand[1].signature}`).join('\n')}\n`);

console.log('Ranked Hands:');
rankedHands.forEach((value, key) => {
    console.log(`Cards - (${key.map(card => card.signature).join('  -  ')})    Rank - ${value.rank}    Best hand - (${value.bestCombination.map(card => card.signature).join('  -  ')})`);
});
console.log();

console.log('Winners:');
winners.forEach((value, key) => {
    console.log(`Cards - (${key.map(card => card.signature).join('  -  ')})    Rank - ${value.rank}    Best hand - (${value.bestCombination.map(card => card.signature).join('  -  ')})`);
});
