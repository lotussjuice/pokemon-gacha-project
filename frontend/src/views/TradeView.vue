<template>
  <div class="trade-page">
    <h1 class="page-title">INTERCAMBIOS</h1>

    <div class="trade-section card">
      <h2>Crear intercambio</h2>
      <p class="small">Ofrece uno de tus Pokemon a otro jugador</p>
      <div class="trade-form">
        <div class="form-group">
          <label>Captura a ofrecer</label>
          <select class="input" v-model="newTrade.offeredCaptureId">
            <option value="">Selecciona un Pokemon</option>
            <option v-for="c in myCaptures" :key="c.id" :value="c.id">
              {{ c.nickname || c.pokemonName }} (Lv.{{ c.level }})
            </option>
          </select>
        </div>
        <div class="form-group autocomplete-wrapper">
          <label>Pokemon que buscas</label>
          <input 
            class="input" 
            v-model="searchQuery" 
            placeholder="Escribe un nombre..."
            @input="onSearch"
            @focus="showDropdown = true"
            @blur="hideDropdown"
            autocomplete="off"
          />
          <div class="autocomplete-dropdown" v-if="showDropdown && searchResults.length">
            <div 
              class="autocomplete-item"
              v-for="p in searchResults" 
              :key="p.pokedexNumber"
              @mousedown.prevent="selectPokemon(p)"
            >
              <img 
                :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokedexNumber}.png`" 
                class="autocomplete-sprite"
              />
              <span class="autocomplete-name">{{ p.name }}</span>
              <span class="autocomplete-id">#{{ p.pokedexNumber }}</span>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" @click="createTrade" :disabled="!newTrade.offeredCaptureId || !newTrade.wantedPokemonName">
          <ArrowLeftRight :size="14" />
          Publicar intercambio
        </button>
        <div class="endpoint-tag">POST /trades</div>
      </div>
    </div>

    <div class="trade-section card">
      <h2>Intercambios disponibles</h2>
      <div class="trades-list" v-if="availableTrades.length">
        <div class="trade-card" v-for="t in availableTrades" :key="t.id">
          <div class="trade-offer">
            <img :src="t.capture?.sprite" :alt="t.capture?.pokemonName" class="trade-sprite" @error="e => e.target.src = defaultSprite" />
            <span class="trade-pokemon-name">{{ t.capture?.nickname || t.capture?.pokemonName }}</span>
            <span class="small">Lv.{{ t.capture?.level }}</span>
          </div>
          <div class="trade-arrow">
            <ArrowLeftRight :size="16" />
          </div>
          <div class="trade-request">
            <span class="trade-wants">Busca: {{ t.wantedPokemonName }}</span>
            <span class="trade-author">por {{ t.creatorUsername }}</span>
          </div>
          <div class="trade-accept">
            <select class="input" v-model="acceptCaptureId[t.id]" style="max-width:140px;font-size:12px;">
              <option value="">Tu Pokemon</option>
              <option v-for="c in getMatchingCaptures(t.wantedPokemonName)" :key="c.id" :value="c.id">
                {{ c.nickname || c.pokemonName }}
              </option>
            </select>
            <button class="btn btn-primary btn-sm" @click="acceptTrade(t)" :disabled="!acceptCaptureId[t.id]">
              Aceptar
            </button>
          </div>
        </div>
      </div>
      <p v-else class="empty-text">No hay intercambios disponibles</p>
      <div class="endpoint-tag">GET /trades | POST /trades/:id/accept</div>
    </div>

    <div class="trade-section card">
      <h2>Mis intercambios</h2>
      <div class="trades-list" v-if="myTrades.length">
        <div class="trade-card" v-for="t in myTrades" :key="t.id">
          <div class="trade-offer">
            <img :src="t.capture?.sprite" :alt="t.capture?.pokemonName" class="trade-sprite" @error="e => e.target.src = defaultSprite" />
            <span class="trade-pokemon-name">{{ t.capture?.nickname || t.capture?.pokemonName }}</span>
          </div>
          <div class="trade-arrow">
            <ArrowLeftRight :size="16" />
          </div>
          <div class="trade-request">
            <span class="trade-wants">Busca: {{ t.wantedPokemonName }}</span>
            <span class="small">Estado: {{ t.status }}</span>
          </div>
          <button class="btn btn-danger btn-sm" @click="cancelTrade(t)" v-if="t.status === 'pending'">
            Cancelar
          </button>
        </div>
      </div>
      <p v-else class="empty-text">No has publicado intercambios</p>
      <div class="endpoint-tag">GET /trades | POST /trades/:id/cancel</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import { ArrowLeftRight } from 'lucide-vue-next';
import api from '../api/axios';

const auth = useAuthStore();
const toast = useToast();
const myCaptures = ref([]);
const availableTrades = ref([]);
const myTrades = ref([]);
const newTrade = ref({ offeredCaptureId: '', wantedPokemonName: '' });
const acceptCaptureId = ref({});
const defaultSprite = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%23333" width="96" height="96" rx="8"/><text x="48" y="60" text-anchor="middle" fill="%23666" font-size="36">?</text></svg>';

const searchQuery = ref('');
const searchResults = ref([]);
const showDropdown = ref(false);
let searchTimeout = null;

onMounted(async () => {
  await loadTrades();
});

async function onSearch() {
  clearTimeout(searchTimeout);
  const q = searchQuery.value.trim();
  if (!q) {
    searchResults.value = [];
    return;
  }
  searchTimeout = setTimeout(async () => {
    try {
      const { data } = await api.get(`/pokemon/pokeapi-search?q=${encodeURIComponent(q)}`);
      searchResults.value = data;
    } catch {
      searchResults.value = [];
    }
  }, 200);
}

function selectPokemon(pokemon) {
  newTrade.value.wantedPokemonName = pokemon.name;
  searchQuery.value = pokemon.name;
  showDropdown.value = false;
  searchResults.value = [];
}

function hideDropdown() {
  setTimeout(() => {
    showDropdown.value = false;
  }, 150);
}

async function loadTrades() {
  const [capturesRes, tradesRes] = await Promise.all([
    api.get('/captures/my'),
    api.get('/trades')
  ]);
  myCaptures.value = capturesRes.data;
  availableTrades.value = tradesRes.data.filter(t => t.creatorId !== auth.user?.id && t.status === 'pending');
  myTrades.value = tradesRes.data.filter(t => t.creatorId === auth.user?.id);
}

function getMatchingCaptures(wantedName) {
  if (!wantedName) return [];
  const wanted = wantedName.toLowerCase();
  return myCaptures.value.filter(c => 
    c.pokemonName?.toLowerCase() === wanted
  );
}

async function createTrade() {
  try {
    await api.post('/trades', newTrade.value);
    newTrade.value = { offeredCaptureId: '', wantedPokemonName: '' };
    searchQuery.value = '';
    toast.success('Intercambio publicado');
    await loadTrades();
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al crear intercambio');
  }
}

async function acceptTrade(trade) {
  try {
    const responderCaptureId = acceptCaptureId.value[trade.id];
    if (!responderCaptureId) return toast.error('Selecciona un Pokemon para intercambiar');
    await api.post(`/trades/${trade.id}/accept`, { responderCaptureId });
    acceptCaptureId.value[trade.id] = '';
    toast.success('Intercambio completado!');
    await loadTrades();
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al aceptar intercambio');
  }
}

async function cancelTrade(trade) {
  try {
    await api.post(`/trades/${trade.id}/cancel`);
    toast.success('Intercambio cancelado');
    await loadTrades();
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al cancelar intercambio');
  }
}
</script>

<style scoped>
.autocomplete-wrapper {
  position: relative;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 240px;
  overflow-y: auto;
  z-index: 50;
}

.autocomplete-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  transition: background 0.15s;
}

.autocomplete-item:hover {
  background: rgba(254, 50, 51, 0.15);
}

.autocomplete-sprite {
  width: 28px;
  height: 28px;
  image-rendering: pixelated;
}

.autocomplete-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
}

.autocomplete-id {
  font-size: 11px;
  color: var(--text-muted);
  font-family: monospace;
}
</style>
