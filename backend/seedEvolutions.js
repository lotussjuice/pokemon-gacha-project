const db = require('./config/firebase');
const evolvesTo = require('./data/evolutions');

const seedEvolutions = async () => {
  try {
    const snapshot = await db.collection('pokemon').get();
    console.log(`Pokémon en DB: ${snapshot.size}`);

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      const pokedexNumber = doc.id;
      const evoData = evolvesTo[pokedexNumber];

      if (evoData !== undefined) {
        batch.update(doc.ref, { evolves_to: evoData });
        count++;
      } else {
        batch.update(doc.ref, { evolves_to: [] });
        count++;
      }
    });

    await batch.commit();
    console.log(`✅ ${count} pokémon actualizados con datos de evolución`);
    process.exit(0);
  } catch (error) {
    console.error("Error al seedear evoluciones:", error);
    process.exit(1);
  }
};

seedEvolutions();
