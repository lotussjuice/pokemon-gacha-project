const db = require('../config/firebase');
const evolvesMapping = require('../data/evolutions');

const pokemonController = {
    // 1. GET: Lista de pokemones
    obtenerPokedex: async (req, res) => {
        try {
            const snapshot = await db.collection('pokemon').get();
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener la Pokedex", details: error.message });
        }
    },

    // 2. GET: Obtener un pokemon aleatorio
    obtenerAleatorio: async (req, res) => {
        try {
            const pokedexRef = db.collection('pokemon');
            const snapshot = await pokedexRef.get();
            if (snapshot.empty) return res.status(404).json({ error: "Pokedex vacía" });
            
            const randomIndex = Math.floor(Math.random() * snapshot.size);
            const randomDoc = snapshot.docs[randomIndex];
            
            res.status(200).json({ id: randomDoc.id, ...randomDoc.data() });
        } catch (error) {
            res.status(500).json({ error: "Error al generar pokemon aleatorio" });
        }
    },

    // 3. POST: Capturar pokemon
    capturarPokemon: async (req, res) => {
        try {
            const { userId, pokemonId, pokemonName, isShiny } = req.body;
            // Validación: Verificar que vengan los datos mínimos
            if (!userId || !pokemonId || !pokemonName) {
                return res.status(400).json({ error: "Faltan datos requeridos (userId, pokemonId, pokemonName)" });
            }

            const pokemonDoc = await db.collection('pokemon').doc(pokemonId.toString()).get();
            if (!pokemonDoc.exists) {
                return res.status(404).json({ error: "El Pokémon que intentas capturar no existe en la Pokedex." });
            }

            const nuevaCaptura = {
                userId,
                pokemonId,
                pokemonName,
                isShiny: Boolean(isShiny), 
                capturedAt: new Date(),
                nickname: pokemonName 
            };

            const docRef = await db.collection('captures').add(nuevaCaptura);
            res.status(201).json({ mensaje: "¡Capturado!", id: docRef.id,
                    captura: { id: docRef.id, ...nuevaCaptura }
            });
        } catch (error) {
            res.status(500).json({ error: "Error en la captura" });
        }
    },

    // 4. POST: Añadir un pokemon (A la Pokedex maestra)
    crearPokemonMaster: async (req, res) => {
        try {
            const nuevoPokemon = req.body;
            if (!nuevoPokemon.name || !nuevoPokemon.pokedex_number) {
                return res.status(400).json({ error: "Nombre y número de pokedex son obligatorios" });
            }

            const docId = nuevoPokemon.pokedex_number.toString();
            const docRef = db.collection('pokemon').doc(docId);
            
            const doc = await docRef.get();
            if (doc.exists) {
                return res.status(409).json({ error: `El Pokémon con el número ${docId} ya existe en la Pokedex.` });
            }

            await docRef.set(nuevoPokemon);
            res.status(201).json({ mensaje: "Pokemon añadido a la Pokedex maestra", id: docId ,
                    pokemon: { id: docId, ...nuevoPokemon }
            });
        } catch (error) {
            res.status(500).json({ error: "Error al crear pokemon maestro" });
        }
    },

    // 5. PUT: Cambiar información de un pokemon (Reemplazo total)
    actualizarPokemonMaster: async (req, res) => {
        try {
            const { id } = req.params;
            const newData = req.body;

            const requiredFields = [
                'name', 'pokedex_number', 'types', 'stats', 
                'generation', 'abilities', 'height_m', 'weight_kg'

            ];

            const missingFields = requiredFields.filter(field => newData[field] === undefined);

            if (missingFields.length > 0) {
                return res.status(400).json({ 
                    error: "Falta información requerida para un reemplazo total (PUT).",
                    missing_fields: missingFields,
                    required_fields: requiredFields
                });
            }

            const docRef = db.collection('pokemon').doc(id);
            const doc = await docRef.get();
            
            if (!doc.exists) {
                return res.status(404).json({ error: "El Pokémon que intentas reemplazar no existe" });
            }

            await docRef.set(newData);
            res.status(200).json({ mensaje: "Registro del Pokémon reemplazado totalmente" , pokemon: { id, ...newData }});
        } catch (error) {
            res.status(500).json({ error: "Error al reemplazar maestro", details: error.message });
        }
    },

    // 6. PUT: Cambiar info de usuario 
    actualizarUsuario: async (req, res) => {
        try {
            const { id } = req.params;
            const newData = req.body;

            if (!newData.username || !newData.email || !newData.contrasena) {
                return res.status(400).json({ error: "Para reemplazar el usuario (PUT), debes proveer username, email y contrasena." });
            }

            const docRef = db.collection('users').doc(id);
            const doc = await docRef.get();
            if (!doc.exists) return res.status(404).json({ error: "Usuario no encontrado" });


            newData.createdAt = doc.data().createdAt || new Date();

            await docRef.set(newData); // Reemplazo total
            res.status(200).json({ mensaje: "Informacion del usuario actualizada.", usuario: { id, ...newData } });
        } catch (error) {
            res.status(500).json({ error: "Error al actualizar usuario" });
        }
    },

    // 7. PATCH: Editar apodo 
    editarApodo: async (req, res) => {
        try {
            const { id } = req.params; 
            const { nickname } = req.body;
            
            if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
                return res.status(400).json({ error: "El apodo es requerido y no puede estar vacío" });
            }

            const docRef = db.collection('captures').doc(id);
            const doc = await docRef.get();
            if (!doc.exists) return res.status(404).json({ error: "La captura no existe" });

            await docRef.update({ nickname: nickname.trim() }); 
            res.status(200).json({ mensaje: "Apodo actualizado", captura: { id, nickname: nickname.trim() } });
        } catch (error) {
            res.status(500).json({ error: "Error al editar apodo" });
        }
    },

    // 8. PATCH: Editar una stat dinámica 
    // Todo Revisar si debería ser dirigido al registro del pokemon!
    editarStat: async (req, res) => {
        try {
            const { id } = req.params;
            const { statName, value } = req.body; 

            const statsValidas = ['attack', 'defense', 'hp', 'speed', 'sp_attack', 'sp_defense'];
            if (!statsValidas.includes(statName)) {
                return res.status(400).json({ error: `La estadística '${statName}' no es válida.` });
            }

            if (isNaN(value) || value < 0) {
                return res.status(400).json({ error: "El valor debe ser un número positivo." });
            }

            const docRef = db.collection('captures').doc(id);
            const doc = await docRef.get();
            if (!doc.exists) return res.status(404).json({ error: "La captura no existe" });

            const updatePath = `stats.${statName}`;
            const updateData = {};
            updateData[updatePath] = Number(value);

            await docRef.update(updateData);
            res.status(200).json({ mensaje: `Estadística ${statName} actualizada a ${value}`, captura: { id, stats: { ...doc.data().stats, [statName]: Number(value) } } });
        } catch (error) {
            res.status(500).json({ error: "Error al editar stat dinámica", details: error.message });
        }
    },

    // 9. DELETE: Borrar captura
    borrarCaptura: async (req, res) => {
        try {
            const { id } = req.params;
            const docRef = db.collection('captures').doc(id);
            const doc = await docRef.get();
            
            if (!doc.exists) return res.status(404).json({ error: "La captura no existe o ya fue liberada" });

            await docRef.delete();
            res.status(200).json({ mensaje: "Pokemon liberado del PC" });
        } catch (error) {
            res.status(500).json({ error: "Error al eliminar captura" });
        }
    },

    // 10. DELETE: Eliminar pokemon
    eliminarPokemonMaster: async (req, res) => {
        try {
            const { id } = req.params;
            const docRef = db.collection('pokemon').doc(id);
            const doc = await docRef.get();
            
            // VALIDACIÓN
            if (!doc.exists) {
                return res.status(404).json({ error: "El Pokémon que intentas eliminar no existe en la Pokedex." });
            }

            await docRef.delete();
            res.status(200).json({ mensaje: `Pokemon ID ${id} extinguido de la Pokedex` });
        } catch (error) {
            res.status(500).json({ error: "Error al eliminar de la Pokedex" });
        }
    },

    // 11. EXTRA: Crear Usuario
    crearUsuario: async (req, res) => {
        try {
            const { username, email, contrasena } = req.body;
            if (!username || !email || !contrasena) {
                return res.status(400).json({ error: "Username, email y contraseña son obligatorios" });
            }

            const emailCheck = await db.collection('users').where('email', '==', email).get();
            if (!emailCheck.empty) {
                return res.status(409).json({ error: "El correo electrónico ya está registrado." });
            }

            const nuevoUsuario = {
                username,
                email,
                contrasena, 
                createdAt: new Date()
            };

            const docRef = await db.collection('users').add(nuevoUsuario);
            res.status(201).json({ mensaje: "Usuario creado en el sistema", id: docRef.id });
        } catch (error) {
            res.status(500).json({ error: "Error al crear usuario", details: error.message });
        }
    },

    // 12. PUT: Evolucionar Pokémon capturado
    evolucionarPokemon: async (req, res) => {
        try {
            const { id } = req.params;
            const { userId, targetEvolution } = req.body;

            if (!userId) {
                return res.status(400).json({ error: "userId es requerido" });
            }

            const captureRef = db.collection('captures').doc(id);
            const capture = await captureRef.get();
            if (!capture.exists) {
                return res.status(404).json({ error: "La captura no existe" });
            }

            const captureData = capture.data();
            if (captureData.userId !== userId) {
                return res.status(403).json({ error: "Esta captura no te pertenece" });
            }

            const evolvesTo = evolvesMapping[captureData.pokemonId.toString()] || [];

            if (evolvesTo.length === 0) {
                return res.status(400).json({ error: `${captureData.pokemonName} no puede evolucionar más` });
            }

            let targetId;
            if (evolvesTo.length === 1) {
                targetId = evolvesTo[0];
            } else {
                if (!targetEvolution) {
                    return res.status(400).json({
                        error: `${captureData.pokemonName} puede evolucionar a múltiples formas. Especifica targetEvolution`,
                        options: evolvesTo
                    });
                }
                if (!evolvesTo.includes(targetEvolution.toString())) {
                    return res.status(400).json({ error: "Evolución inválida" });
                }
                targetId = targetEvolution.toString();
            }

            const targetRef = db.collection('pokemon').doc(targetId);
            const target = await targetRef.get();
            if (!target.exists) {
                return res.status(404).json({ error: "El Pokémon evolucionado no existe en la Pokedex" });
            }

            const targetData = target.data();

            const updateData = {
                pokemonId: targetId,
                pokemonName: targetData.name,
                evolvedAt: new Date(),
                stats: targetData.stats
            };

            await captureRef.update(updateData);

            res.status(200).json({
                mensaje: `${captureData.pokemonName} evolucionó a ${targetData.name}`,
                captura: { id, ...captureData, ...updateData }
            });
        } catch (error) {
            res.status(500).json({ error: "Error al evolucionar", details: error.message });
        }
    },

    // 13. GET: Obtener capturas por usuario
    obtenerCapturas: async (req, res) => {
        try {
            const { userId } = req.query;
            if (!userId) {
                return res.status(400).json({ error: "userId es requerido como query param" });
            }

            const snapshot = await db.collection('captures').where('userId', '==', userId).get();
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener capturas", details: error.message });
        }
    },

    // 14. GET: Obtener equipo de un usuario
    obtenerEquipo: async (req, res) => {
        try {
            const { userId } = req.params;
            const userRef = db.collection('users').doc(userId);
            const user = await userRef.get();
            if (!user.exists) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            res.status(200).json({ equipo: user.data().team || [] });
        } catch (error) {
            res.status(500).json({ error: "Error al obtener equipo", details: error.message });
        }
    },

    // 15. PUT: Elegir equipo (hasta 6 Pokémon del usuario)
    elegirEquipo: async (req, res) => {
        try {
            const { userId } = req.params;
            const { pokemonIds } = req.body;

            if (!Array.isArray(pokemonIds)) {
                return res.status(400).json({ error: "pokemonIds debe ser un array" });
            }

            if (pokemonIds.length > 6) {
                return res.status(400).json({ error: "El equipo máximo es de 6 Pokémon" });
            }

            const userRef = db.collection('users').doc(userId);
            const user = await userRef.get();
            if (!user.exists) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            for (const captureId of pokemonIds) {
                const captureRef = db.collection('captures').doc(captureId);
                const capture = await captureRef.get();
                if (!capture.exists) {
                    return res.status(404).json({ error: `La captura ${captureId} no existe` });
                }
                if (capture.data().userId !== userId) {
                    return res.status(403).json({ error: `La captura ${captureId} no te pertenece` });
                }
            }

            await userRef.update({ team: pokemonIds });

            res.status(200).json({
                mensaje: "Equipo actualizado",
                equipo: pokemonIds
            });
        } catch (error) {
            res.status(500).json({ error: "Error al elegir equipo" });
        }
    },

    // 16. PATCH: Cambiar naturaleza de un Pokémon capturado
    cambiarNaturaleza: async (req, res) => {
        try {
            const { id } = req.params;
            const { userId, nature } = req.body;

            if (!userId || !nature) {
                return res.status(400).json({ error: "userId y nature son requeridos" });
            }

            const captureRef = db.collection('captures').doc(id);
            const capture = await captureRef.get();
            if (!capture.exists) {
                return res.status(404).json({ error: "La captura no existe" });
            }

            const captureData = capture.data();
            if (captureData.userId !== userId) {
                return res.status(403).json({ error: "Esta captura no te pertenece" });
            }

            const natureLower = nature.toLowerCase().trim();
            const natureMap = {
                hardy: { increase: null, decrease: null },
                lonely: { increase: 'attack', decrease: 'defense' },
                brave: { increase: 'attack', decrease: 'speed' },
                adamant: { increase: 'attack', decrease: 'sp_attack' },
                naughty: { increase: 'attack', decrease: 'sp_defense' },
                bold: { increase: 'defense', decrease: 'attack' },
                docile: { increase: null, decrease: null },
                relaxed: { increase: 'defense', decrease: 'speed' },
                impish: { increase: 'defense', decrease: 'sp_attack' },
                lax: { increase: 'defense', decrease: 'sp_defense' },
                timid: { increase: 'speed', decrease: 'attack' },
                hasty: { increase: 'speed', decrease: 'defense' },
                serious: { increase: null, decrease: null },
                jolly: { increase: 'speed', decrease: 'sp_attack' },
                naive: { increase: 'speed', decrease: 'sp_defense' },
                modest: { increase: 'sp_attack', decrease: 'attack' },
                mild: { increase: 'sp_attack', decrease: 'defense' },
                quiet: { increase: 'sp_attack', decrease: 'speed' },
                bashful: { increase: null, decrease: null },
                rash: { increase: 'sp_attack', decrease: 'sp_defense' },
                calm: { increase: 'sp_defense', decrease: 'attack' },
                gentle: { increase: 'sp_defense', decrease: 'defense' },
                sassy: { increase: 'sp_defense', decrease: 'speed' },
                careful: { increase: 'sp_defense', decrease: 'sp_attack' },
                quirky: { increase: null, decrease: null }
            };

            const natureData = natureMap[natureLower];
            if (!natureData) {
                return res.status(400).json({
                    error: `Naturaleza '${nature}' no válida`,
                    validNatures: Object.keys(natureMap)
                });
            }

            const pokemonRef = db.collection('pokemon').doc(captureData.pokemonId.toString());
            const pokemon = await pokemonRef.get();
            if (!pokemon.exists) {
                return res.status(404).json({ error: "El Pokémon no existe en la Pokedex" });
            }

            const baseStats = pokemon.data().stats;
            const newStats = { hp: baseStats.hp };

            const statKeys = ['attack', 'defense', 'sp_attack', 'sp_defense', 'speed'];
            for (const stat of statKeys) {
                let val = baseStats[stat];
                if (natureData.increase === stat) val = Math.floor(val * 1.1);
                if (natureData.decrease === stat) val = Math.floor(val * 0.9);
                newStats[stat] = val;
            }

            await captureRef.update({ nature: natureLower, stats: newStats });

            res.status(200).json({
                mensaje: `Naturaleza cambiada a ${natureLower}`,
                captura: { id, ...captureData, nature: natureLower, stats: newStats }
            });
        } catch (error) {
            res.status(500).json({ error: "Error al cambiar naturaleza", details: error.message });
        }
    },

    // 17. PATCH: Cambiar sprite (shiny/regular) de un Pokémon capturado
    cambiarSprite: async (req, res) => {
        try {
            const { id } = req.params;
            const { userId, isShiny } = req.body;

            if (!userId || typeof isShiny !== 'boolean') {
                return res.status(400).json({ error: "userId y isShiny (boolean) son requeridos" });
            }

            const captureRef = db.collection('captures').doc(id);
            const capture = await captureRef.get();
            if (!capture.exists) {
                return res.status(404).json({ error: "La captura no existe" });
            }

            const captureData = capture.data();
            if (captureData.userId !== userId) {
                return res.status(403).json({ error: "Esta captura no te pertenece" });
            }

            await captureRef.update({ isShiny });

            res.status(200).json({
                mensaje: isShiny ? "Sprite cambiado a shiny" : "Sprite cambiado a regular",
                captura: { id, ...captureData, isShiny }
            });
        } catch (error) {
            res.status(500).json({ error: "Error al cambiar sprite", details: error.message });
        }
    }
};

module.exports = pokemonController;