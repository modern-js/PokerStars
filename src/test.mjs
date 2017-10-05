import { generateCards } from './engine';

const alreadyGenerated = new Set();

for (let i = 0; i < 26; i += 1) {
    console.log(generateCards(2, alreadyGenerated));
}
