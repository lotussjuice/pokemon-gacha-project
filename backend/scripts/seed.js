require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/firebase');
const axios = require('axios');

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

async function seedPokemon() {
  console.log('Iniciando seed de Pokemon...');
  
  try {
    const { data: list } = await axios.get(`${POKEAPI_BASE}/pokemon?limit=1500`);
    const pokemonList = list.results;
    
    console.log(`Encontrados ${pokemonList.length} Pokemon en PokeAPI`);
    
    const BATCH_SIZE = 500;
    let count = 0;

    for (let i = 0; i < pokemonList.length; i += BATCH_SIZE) {
      const batch = pokemonList.slice(i, i + BATCH_SIZE);
      const firestoreBatch = db.batch();

      for (const pokemon of batch) {
        try {
          const { data } = await axios.get(pokemon.url);
          
          const pokemonData = {
            pokedexNumber: data.id,
            name: data.name,
            types: data.types.map(t => t.type.name),
            stats: {
              hp: data.stats[0].base_stat,
              attack: data.stats[1].base_stat,
              defense: data.stats[2].base_stat,
              spAttack: data.stats[3].base_stat,
              spDefense: data.stats[4].base_stat,
              speed: data.stats[5].base_stat
            },
            sprites: {
              front: data.sprites.front_default,
              frontShiny: data.sprites.front_shiny,
              back: data.sprites.back_default,
              backShiny: data.sprites.back_shiny
            },
            height: data.height,
            weight: data.weight,
            abilities: data.abilities.map(a => a.ability.name)
          };

          const docRef = db.collection('pokemon').doc(data.id.toString());
          firestoreBatch.set(docRef, pokemonData);
          count++;

          if (count % 50 === 0) {
            console.log(`Procesados ${count} Pokemon...`);
          }
        } catch (err) {
          console.error(`Error con ${pokemon.name}:`, err.message);
        }
      }

      await firestoreBatch.commit();
      console.log(`Lote enviado (${count}/${pokemonList.length})`);
    }

    console.log(`Seed completado: ${count} Pokemon guardados en Firebase`);
    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
}

async function seedItems() {
  console.log('Iniciando seed de Items...');
  
  try {
    const { data: list } = await axios.get(`${POKEAPI_BASE}/item?limit=100`);
    
    const batch = db.batch();
    let count = 0;

    for (const item of list.results.slice(0, 50)) {
      try {
        const { data } = await axios.get(item.url);
        
        const effectEntries = data.effect_entries || [];
        const englishEffect = effectEntries.find(e => e.language?.name === 'en');
        const effect = englishEffect?.short_effect || effectEntries[0]?.short_effect || 'No effect';
        const effectLong = englishEffect?.effect || effectEntries[0]?.effect || 'No description';

        const itemData = {
          pokeapiId: data.id,
          name: data.name,
          sprite: data.sprites?.default || null,
          category: data.category?.name || 'unknown',
          effect: effect,
          description: effectLong,
          price: Math.floor(Math.random() * 500) + 50
        };

        const docRef = db.collection('items').doc(data.id.toString());
        batch.set(docRef, itemData);
        count++;
      } catch (err) {
        console.error(`Error con item ${item.name}:`, err.message);
      }
    }

    await batch.commit();
    console.log(`Items seed completado: ${count} items guardados`);
    process.exit(0);
  } catch (error) {
    console.error('Error en seed de items:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args[0] === 'items') {
  seedItems();
} else {
  seedPokemon();
}
