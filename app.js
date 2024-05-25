const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(session({
    secret: 'your-secret-key', 
    resave: false,
    saveUninitialized: true,
}));

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to initialize guess counts
app.use((req, res, next) => {
    if (!req.session.correctGuesses) {
        req.session.correctGuesses = 0;
    }
    if (!req.session.incorrectGuesses) {
        req.session.incorrectGuesses = 0;
    }
    next();
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/game', async (req, res) => {
    try {
        const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=1000');
        const pokemonList = response.data.results;
        const randomPokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];

        const pokemonData = await axios.get(randomPokemon.url);
        const speciesData = await axios.get(pokemonData.data.species.url);
        const habitat = speciesData.data.habitat ? speciesData.data.habitat.name : 'unknown';
        const types = pokemonData.data.types.map(type => type.type.name);
        const abilities = pokemonData.data.abilities.map(ability => ability.ability.name);
        const evolutionChainData = await axios.get(speciesData.data.evolution_chain.url);
        const ancestor = evolutionChainData.data.chain.species.name;

        res.render('game', {
            pokemon: pokemonData.data,
            types,
            habitat,
            abilities,
            ancestor,
            backgroundImage: habitat === 'unknown' || habitat === 'rough-terrain' || habitat === 'rare' ? `${types[0]}.jpeg` : `${habitat}.jpeg`,
            correctGuesses: req.session.correctGuesses,
            incorrectGuesses: req.session.incorrectGuesses,
        });
    } catch (error) {
        res.render('game', { error: 'Failed to load Pokémon data.' });
    }
});

app.post('/guess', (req, res) => {
    const guessedName = req.body.guess.trim().toLowerCase();
    const actualName = req.body.name.trim().toLowerCase();

    if (guessedName === actualName) {
        req.session.correctGuesses += 1;
    } else {
        req.session.incorrectGuesses += 1;
    }

    res.redirect('/game');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
