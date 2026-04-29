const db = require('../config/firebase');

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
            res.status(201).json({ mensaje: "¡Capturado!", id: docRef.id });
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
            res.status(201).json({ mensaje: "Pokemon añadido a la Pokedex maestra", id: docId });
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
            res.status(200).json({ mensaje: "Registro del Pokémon reemplazado totalmente" });
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
            res.status(200).json({ mensaje: "Informacion del usuario actualizada." });
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
            res.status(200).json({ mensaje: "Apodo actualizado" });
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
            res.status(200).json({ mensaje: `Estadística ${statName} actualizada a ${value}` });
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
    }
};

module.exports = pokemonController;