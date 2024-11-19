
const fs = require('fs');
const readline = require('readline');
const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');

// Example: Bitcoin address you want to check against
const targetAddress = 'bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2';

// Random shuffle function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Generate Bitcoin address from seed phrase
const checkSeed = async (seedPhrase) => {
    try {
        if (!bip39.validateMnemonic(seedPhrase)) {
            console.log(`Invalid seed phrase: ${seedPhrase}`);
            return null;
        }

        // Generate the seed from the mnemonic
        const seed = bip39.mnemonicToSeedSync(seedPhrase);
        const root = bitcoin.bip32.fromSeed(seed);

        // Derive the first Bitcoin address (for simplicity, using the first path m/44'/0'/0'/0/0)
        const address = bitcoin.payments.p2pkh({ pubkey: root.derivePath("m/44'/0'/0'/0/0").publicKey }).address;

        return address;
    } catch (error) {
        console.error(`Error generating address from seed phrase: ${error}`);
        return null;
    }
};

// Function to check all seed phrases and positions in random order
const checkAllSeeds = async (seedPhrases) => {
    let foundPositions = Array(12).fill(false); // To track found positions
    let attempts = 0;
    let completed = 0;
    let matchedWords = Array(12).fill(null); // To track the correct word at each position

    // Start checking each seed phrase
    for (let seedIndex = 0; seedIndex < seedPhrases.length; seedIndex++) {
        const seedPhrase = seedPhrases[seedIndex];
        console.log(`Checking seed phrase: ${seedIndex + 1}/${seedPhrases.length}`);

        // Shuffle the positions to randomize checking
        const positions = [...Array(12).keys()];
        shuffleArray(positions);

        for (let i = 0; i < 12; i++) {
            const position = positions[i];

            // Skip positions that are already found
            if (foundPositions[position]) continue;

            // Test the seed phrase and check if the address matches
            const address = await checkSeed(seedPhrase);

            if (address === targetAddress) {
                // If it matches, mark this position as found
                foundPositions[position] = true;
                matchedWords[position] = seedPhrase.split(" ")[position]; // Store matched word in position
                completed++;

                console.log(`Match found for position ${position + 1}: ${matchedWords[position]}`);
            }

            // Provide a status update
            console.log(`Progress: ${completed}/12 positions found. Current seed: ${seedPhrase}`);

            // If all positions are found, exit
            if (completed === 12) {
                console.log('All positions matched!');
                console.log('Final matched words:', matchedWords);
                return;
            }
        }
    }

    console.log('Completed checking all seed phrases.');
};

// Function to read seed phrases from a file
const readSeedPhrasesFromFile = async (filePath) => {
    return new Promise((resolve, reject) => {
        const seedPhrases = [];
        const rl = readline.createInterface({
            input: fs.createReadStream(filePath),
            output: process.stdout,
            terminal: false,
        });

        rl.on('line', (line) => {
            seedPhrases.push(line.trim());
        });

        rl.on('close', () => {
            resolve(seedPhrases);
        });

        rl.on('error', (error) => {
            reject(error);
        });
    });
};

// Main function to load seed phrases and start checking
const main = async () => {
    const filePath = '/home/userland/checker.js/seed_phrases.txt'; // Replace with the path to your .txt file containing seed phrases

    try {
        console.log(`Reading seed phrases from: ${filePath}`);
        const seedPhrases = await readSeedPhrasesFromFile(filePath);

if (seedPhrases.length === 0) {
            console.error('The seed phrase file is empty or not formatted correctly.');
            return;
        }

        console.log(`Loaded ${seedPhrases.length} seed phrases. Starting the matching process...`);
        await checkAllSeeds(seedPhrases);
    } catch (error) {
        console.error(`Error reading seed phrases from file: ${error}`);
    }
};

// Start the script
main();