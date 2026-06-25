const db = require('./config/firebase');
const fs = require('fs');
const csv = require('csv-parser');

const cargarPokedex = async () => {
    const pokemones = [];

    fs.createReadStream('pokemon.csv')
        .pipe(csv())
        .on('data', (row) => {
            pokemones.push({
                name: row.name,
                pokedex_number: parseInt(row.pokedex_number),
                types: [row.type1, row.type2].filter(t => t !== ""), // Array de tipos
                height_m: parseFloat(row.height_m) || 0,
                weight_kg: parseFloat(row.weight_kg) || 0,
                abilities: row.abilities.replace(/'/g, '"'), // Limpieza básica de strings
                stats: {
                    hp: parseInt(row.hp),
                    attack: parseInt(row.attack),
                    defense: parseInt(row.defense),
                    sp_attack: parseInt(row.sp_attack),
                    sp_defense: parseInt(row.sp_defense),
                    speed: parseInt(row.speed)
                },
                generation: parseInt(row.generation)
            });
        })
        .on('end', async () => {
            console.log(`CSV leído. Procesando ${pokemones.length} pokemones...`);
            
            // 3. Carga por lotes (Batch) para optimizar
            const chunkArray = (arr, size) => {
                const chunks = [];
                for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
                return chunks;
            };

            const batches = chunkArray(pokemones, 500); // Lotes de 500 (límite de Firestore)

            for (const batchData of batches) {
                const batch = db.batch();
                batchData.forEach(poke => {
                    // Usamos el pokedex_number como ID del documento para evitar duplicados
                    const docRef = db.collection('pokemon').doc(poke.pokedex_number.toString());
                    batch.set(docRef, poke);
                });
                await batch.commit();
                console.log("Lote de 500 enviado correctamente...");
            }

            console.log("¡Carga completa exitosa!");
            process.exit(0);
        });
};

cargarPokedex();