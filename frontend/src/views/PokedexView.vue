<template>
  <div class="pokedex-page">
    <h1 class="page-title">POKEDEX</h1>

    <div class="pokedex-header">
      <input v-model="search" class="input" placeholder="Buscar Pokemon..." />
      <button class="btn btn-primary" @click="openAddModal">
        <Plus :size="14" />
        Agregar Pokemon
      </button>
    </div>

    <div class="pokedex-grid" v-if="filteredPokemon.length">
      <div class="pokedex-card" v-for="p in filteredPokemon" :key="p.id">
        <img :src="getSprite(p)" :alt="p.name" @error="e => e.target.src = defaultSprite" />
        <span class="poke-num">#{{ p.pokedexNumber || p.pokedex_number }}</span>
        <span class="poke-name">{{ p.name }}</span>
        <span class="poke-types">{{ p.types?.join(', ') }}</span>
        <div class="poke-stats">
          <span>HP:{{ getStats(p).hp }}</span>
          <span>ATK:{{ getStats(p).attack }}</span>
          <span>DEF:{{ getStats(p).defense }}</span>
        </div>
        <div class="poke-actions">
          <button class="btn btn-primary btn-sm" @click="openInfoModal(p)" title="Ver info">
            <Eye :size="10" />
          </button>
          <button class="btn btn-danger btn-sm" @click="deletePokemon(p)">
            <Trash2 :size="10" />
          </button>
        </div>
      </div>
    </div>
    <p v-else class="empty-text">No hay Pokemon registrados</p>

    <div class="endpoint-tag">GET /pokemon | POST /pokemon | DELETE /pokemon/:id</div>

    <!-- Info Modal -->
    <div class="modal" v-if="showInfoModal" @click.self="showInfoModal = false">
      <div class="modal-content card info-modal-card">
        <h2>{{ infoPokemon?.name }}</h2>
        <div class="info-header">
          <img :src="getSprite(infoPokemon)" class="info-sprite" @error="e => e.target.src = defaultSprite" />
          <div class="info-basic">
            <p><strong>#{{ infoPokemon?.pokedexNumber || infoPokemon?.pokedex_number }}</strong></p>
            <p>Tipos: {{ infoPokemon?.types?.join(', ') }}</p>
            <p>Altura: {{ infoPokemon?.height || infoPokemon?.height_m }} | Peso: {{ infoPokemon?.weight || infoPokemon?.weight_kg }}</p>
            <p v-if="getAbilities(infoPokemon).length">Habilidades: {{ getAbilities(infoPokemon).join(', ') }}</p>
          </div>
        </div>
        <div class="info-section">
          <h3>Stats Base</h3>
          <div class="info-stats-grid">
            <div class="info-stat" v-for="(val, key) in getStats(infoPokemon)" :key="key">
              <span class="info-stat-label">{{ statLabels[key] || key }}</span>
              <div class="info-stat-bar-bg">
                <div class="info-stat-bar" :style="{ width: Math.min(val / 2.55, 100) + '%' }"></div>
              </div>
              <span class="info-stat-val">{{ val }}</span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="showInfoModal = false">Cerrar</button>
        </div>
        <div class="endpoint-tag">GET /pokemon/:id</div>
      </div>
    </div>

    <!-- Add Modal -->
    <div class="modal" v-if="showAddModal" @click.self="showAddModal = false">
      <div class="modal-content card">
        <h2>Agregar Pokemon</h2>
        <div class="form-row">
          <div class="form-group">
            <label># Pokedex</label>
            <input v-model.number="newPokemon.pokedexNumber" class="input" type="number" @blur="fetchFromPokeAPI" />
          </div>
          <div class="form-group">
            <label>Nombre</label>
            <input v-model="newPokemon.name" class="input" />
          </div>
        </div>
        <div class="form-group">
          <label>Tipos (separados por coma)</label>
          <input v-model="newPokemon.types" class="input" placeholder="fuego, volador" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>HP</label>
            <input v-model.number="newPokemon.stats.hp" class="input" type="number" />
          </div>
          <div class="form-group">
            <label>Ataque</label>
            <input v-model.number="newPokemon.stats.attack" class="input" type="number" />
          </div>
          <div class="form-group">
            <label>Defensa</label>
            <input v-model.number="newPokemon.stats.defense" class="input" type="number" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Ataque Esp.</label>
            <input v-model.number="newPokemon.stats.spAttack" class="input" type="number" />
          </div>
          <div class="form-group">
            <label>Defensa Esp.</label>
            <input v-model.number="newPokemon.stats.spDefense" class="input" type="number" />
          </div>
          <div class="form-group">
            <label>Velocidad</label>
            <input v-model.number="newPokemon.stats.speed" class="input" type="number" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Altura (m)</label>
            <input v-model.number="newPokemon.height" class="input" type="number" />
          </div>
          <div class="form-group">
            <label>Peso (kg)</label>
            <input v-model.number="newPokemon.weight" class="input" type="number" />
          </div>
        </div>
        <div class="form-group">
          <label>Habilidades (separados por coma)</label>
          <input v-model="newPokemon.abilities" class="input" placeholder="overgrow, chlorophyll" />
        </div>
        <p class="hint" v-if="fetching">Buscando en PokeAPI...</p>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="addPokemon" :disabled="adding">Agregar</button>
          <button class="btn" @click="showAddModal = false">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from '../composables/useToast';
import { Plus, Trash2, Eye } from 'lucide-vue-next';
import api from '../api/axios';

const toast = useToast();
const pokemon = ref([]);
const search = ref('');
const showAddModal = ref(false);
const showInfoModal = ref(false);
const infoPokemon = ref(null);
const adding = ref(false);
const fetching = ref(false);
const defaultSprite = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%23333" width="96" height="96" rx="8"/><text x="48" y="56" text-anchor="middle" fill="%23666" font-size="14">?</text></svg>';

const statLabels = {
  hp: 'HP', attack: 'ATK', defense: 'DEF',
  spAttack: 'SP.ATK', spDefense: 'SP.DEF', speed: 'SPD'
};

const newPokemon = ref({
  pokedexNumber: null,
  name: '',
  types: '',
  stats: { hp: 50, attack: 50, defense: 50, spAttack: 50, spDefense: 50, speed: 50 },
  height: 0,
  weight: 0,
  abilities: ''
});

const filteredPokemon = computed(() => {
  if (!search.value) return pokemon.value;
  const q = search.value.toLowerCase();
  return pokemon.value.filter(p =>
    p.name.toLowerCase().includes(q) || String(p.pokedexNumber).includes(q)
  );
});

onMounted(async () => {
  const { data } = await api.get('/pokemon?limit=1000');
  pokemon.value = data.data || [];
});

function getSprite(p) {
  if (!p) return defaultSprite;
  if (p.sprites?.front && p.sprites.front !== '') return p.sprites.front;
  const num = p.pokedexNumber || p.pokedex_number || p.id;
  if (num && !isNaN(num)) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${num}.png`;
  return defaultSprite;
}

function getAbilities(p) {
  if (!p || !p.abilities) return [];
  if (Array.isArray(p.abilities)) return p.abilities;
  try {
    return JSON.parse(p.abilities);
  } catch {
    return typeof p.abilities === 'string' ? p.abilities.split(',') : [];
  }
}

function getStats(p) {
  if (!p || !p.stats) return {};
  const s = p.stats;
  return {
    hp: s.hp || 0,
    attack: s.attack || 0,
    defense: s.defense || 0,
    spAttack: s.spAttack || s.sp_attack || 0,
    spDefense: s.spDefense || s.sp_defense || 0,
    speed: s.speed || 0
  };
}

function openInfoModal(p) {
  infoPokemon.value = p;
  showInfoModal.value = true;
}

function openAddModal() {
  newPokemon.value = {
    pokedexNumber: null,
    name: '',
    types: '',
    stats: { hp: 50, attack: 50, defense: 50, spAttack: 50, spDefense: 50, speed: 50 },
    height: 0,
    weight: 0,
    abilities: ''
  };
  showAddModal.value = true;
}

async function fetchFromPokeAPI() {
  if (!newPokemon.value.pokedexNumber) return;
  fetching.value = true;
  try {
    const { data } = await api.get(`/pokemon/${newPokemon.value.pokedexNumber}`);
    if (data) {
      newPokemon.value.name = data.name || '';
      newPokemon.value.types = data.types?.join(', ') || '';
      newPokemon.value.stats = data.stats || newPokemon.value.stats;
      newPokemon.value.height = data.height || 0;
      newPokemon.value.weight = data.weight || 0;
      newPokemon.value.abilities = data.abilities?.join(', ') || '';
      toast.success(`${data.name} cargado desde PokeAPI`);
    }
  } catch {
    toast.info('No encontrado en PokeAPI, ingresa datos manualmente');
  } finally {
    fetching.value = false;
  }
}

async function addPokemon() {
  adding.value = true;
  try {
    const payload = {
      pokedexNumber: newPokemon.value.pokedexNumber,
      name: newPokemon.value.name,
      types: newPokemon.value.types ? newPokemon.value.types.split(',').map(t => t.trim()) : [],
      stats: newPokemon.value.stats,
      height: newPokemon.value.height,
      weight: newPokemon.value.weight,
      abilities: newPokemon.value.abilities ? newPokemon.value.abilities.split(',').map(a => a.trim()) : []
    };
    await api.post('/pokemon', payload);
    const { data } = await api.get('/pokemon?limit=1000');
    pokemon.value = data.data || [];
    showAddModal.value = false;
    toast.success('Pokemon agregado a la Pokedex');
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al agregar');
  } finally {
    adding.value = false;
  }
}

async function deletePokemon(p) {
  if (!confirm(`¿Eliminar ${p.name} de la Pokedex?`)) return;
  try {
    await api.delete(`/pokemon/${p.id}`);
    pokemon.value = pokemon.value.filter(x => x.id !== p.id);
    toast.success(`${p.name} eliminado de la Pokedex`);
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al eliminar');
  }
}
</script>

<style scoped>
.pokedex-header { display: flex; gap: 12px; margin-bottom: 16px; }
.pokedex-header .input { flex: 1; }
.pokedex-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
.pokedex-card { background: var(--bg-card); border: 2px solid var(--border); border-radius: 8px; padding: 10px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.pokedex-card img { width: 56px; height: 56px; image-rendering: pixelated; }
.poke-num { font-size: 10px; color: var(--text-muted); }
.poke-name { font-size: 12px; font-weight: 600; text-transform: capitalize; }
.poke-types { font-size: 10px; color: var(--blue); text-transform: capitalize; }
.poke-stats { display: flex; gap: 6px; font-size: 9px; color: var(--text-muted); }
.poke-actions { display: flex; gap: 4px; margin-top: 4px; }
.form-row { display: flex; gap: 10px; }
.form-row .form-group { flex: 1; }
.hint { font-size: 11px; color: var(--blue); margin: 4px 0; }

/* Info Modal */
.info-modal-card { max-width: 480px; }
.info-header { display: flex; gap: 16px; align-items: flex-start; margin: 12px 0; }
.info-sprite { width: 80px; height: 80px; image-rendering: pixelated; border: 2px solid var(--border); border-radius: 8px; background: rgba(0,0,0,0.2); }
.info-basic p { font-size: 13px; margin-bottom: 2px; text-transform: capitalize; }
.info-section { margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); }
.info-section h3 { margin-bottom: 8px; }
.info-stats-grid { display: flex; flex-direction: column; gap: 5px; }
.info-stat { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.info-stat-label { width: 50px; font-weight: 600; color: var(--text-muted); font-size: 10px; }
.info-stat-bar-bg { flex: 1; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
.info-stat-bar { height: 100%; background: var(--accent); border-radius: 4px; }
.info-stat-val { width: 30px; text-align: right; font-family: var(--font-title); font-size: 9px; color: var(--gold); }
</style>