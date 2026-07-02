# Pokemon Gacha System

Sistema gacha de Pokemon con combate automatico, intercambio y tienda. Backend en Node.js con Firebase, frontend en Vue 3.

## Stack

| Capa | Tecnologia |
|------|------------|
| Backend | Node.js + Express |
| Base de datos | Firebase Firestore |
| Auth | JWT + bcryptjs |
| Frontend | Vue 3 + Vite |
| Estado | Pinia |
| Rutas | Vue Router |
| Icons | Lucide Vue |
| Testing | Bruno (API Client) |
| Container | Docker + Docker Compose |

## Instalacion

### 1. Configurar Firebase

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Firestore
3. Descargar `key.json` y copiarlo a `backend/key.json`

### 2. Variables de entorno

```bash
# backend/.env
PORT=3000
JWT_SECRET=tu-secreto-seguro-aqui
```

### 3. Seed de Pokemon

```bash
cd backend
npm install

# Cargar todos los Pokemon (~1025)
npm run seed

# Cargar items
npm run seed items
```

### 4. Ejecutar con Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

### 5. Ejecutar sin Docker

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## API Endpoints (1ra Entrega)

### GET

| Ruta | Descripcion |
|------|-------------|
| `GET /api/pokemon` | Lista de Pokemon (paginado) |
| `GET /api/pokemon/random` | Pokemon aleatorio |
| `GET /api/items` | Lista de items |
| `GET /api/items/:id` | Detalle de item |
| `GET /api/coins/balance` | Obtener Pokecoins |

### POST

| Ruta | Descripcion |
|------|-------------|
| `POST /api/gacha/pull` | Capturar Pokemon (gacha) |
| `POST /api/pokemon` | Anadir Pokemon a la Pokedex |
| `POST /api/trades` | Intercambiar Pokemon |
| `POST /api/combat/start` | Nuevo combate |

### PUT

| Ruta | Descripcion |
|------|-------------|
| `PUT /api/captures/:id/evolve` | Evolucionar Pokemon |
| `PUT /api/captures/team` | Actualizar equipo |
| `PUT /api/users/profile` | Cambiar info de usuario |

### PATCH

| Ruta | Descripcion |
|------|-------------|
| `PATCH /api/captures/:id/nickname` | Editar nombre a Pokemon |
| `PATCH /api/captures/:id/stat` | Editar ataque de Pokemon |
| `PATCH /api/captures/:id/sprite` | Cambiar sprite (imagen) |
| `PATCH /api/captures/:id/nature` | Cambiar naturaleza |

### DELETE

| Ruta | Descripcion |
|------|-------------|
| `DELETE /api/captures/:id` | Borrar captura |
| `DELETE /api/pokemon/:id` | Eliminar Pokemon (sacar del habitat) |
| `DELETE /api/items/sell` | Vender item |
| `POST /api/users/reset` | Reiniciar cuenta |

## Auth

| Ruta | Descripcion |
|------|-------------|
| `POST /api/auth/register` | Registro |
| `POST /api/auth/login` | Login |
| `GET /api/auth/profile` | Ver perfil |

## Sistema de Nivel

- Victoria otorga XP basado en el nivel del Pokemon salvaje
- XP necesaria: `level * level * 5`
- Al subir de nivel, las stats suben proporcionalmente
- Nivel maximo: 100

### Formula de stats por nivel

```
stat = floor(baseStat * level / 50) + bonus
```

Donde `baseStat` son los stats originales de PokeAPI.

## Combate

- Automatico basado en stats
- El Pokemon salvaje aparece con nivel similar al tuyo
- Victoria: 50-150 monedas + XP + 10% chance item drop
- Derrota: sin recompensa

## Colecciones Firebase

| Coleccion | Descripcion |
|-----------|-------------|
| `users` | Usuarios (username, email, coins, team, dailyClaimAt) |
| `pokemon` | Pokedex maestra (stats base, tipos, sprites) |
| `captures` | Pokemon capturados (nivel, IVs, nature, stats actuales) |
| `items` | Items del juego |
| `user_items` | Inventario de usuario |
| `combats` | Historial de combates |
| `trades` | Intercambios activos |

## Testing con Bruno

1. Instalar Bruno: https://www.usebruno.com/
2. Abrir Bruno
3. Importar carpeta `bruno/` del proyecto
4. Ejecutar `auth/Login` primero (guarda token)
5. Resto de endpoints usan el token automaticamente

### Variables automaticas

- `token`: JWT token
- `captureId`: ID de captura
- `pokemonId`: ID de Pokemon
- `itemId`: ID de item
- `tradeId`: ID de intercambio

## Assets

| Tipo | Fuente |
|------|--------|
| Pokemon sprites | PokeAPI (`/sprites/pokemon/{id}.png`) |
| Item sprites | PokeAPI (`/sprites/items/{name}.png`) |

## Licencia

Proyecto academico - UBB 2026
