<template>
  <div class="direct-capture-page">
    <h1 class="page-title">CAPTURA DIRECTA</h1>

    <div class="card" style="max-width: 500px; margin: 0 auto; text-align: center;">
      <h2 style="margin-bottom: 16px;">Buscar y Capturar</h2>
      <p style="margin-bottom: 24px; font-size: 13px; color: var(--text-muted);">
        Ingresa el nombre de un Pokemon para buscarlo en la PokeAPI y añadirlo directamente a tu coleccion.
      </p>

      <div class="form-group autocomplete-wrapper" style="text-align: left;">
        <input 
          v-model="directCaptureName" 
          class="input" 
          placeholder="Ej: pikachu, charizard, bulbasaur..." 
          @input="onSearch"
          @focus="showDropdown = true"
          @blur="hideDropdown"
          @keyup.enter="captureDirect"
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

      <button 
        class="btn btn-primary" 
        style="width: 100%; margin-top: 12px; height: 44px; display: flex; justify-content: center; align-items: center; gap: 8px;"
        @click="captureDirect" 
        :disabled="!directCaptureName || capturingDirect"
      >
        <Crosshair :size="18" />
        {{ capturingDirect ? 'Buscando y capturando...' : 'Capturar Pokemon' }}
      </button>

      <div class="endpoint-tag" style="margin-top: 24px;">POST /captures/direct | GET /pokemon/pokeapi-search</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useToast } from '../composables/useToast';
import { Crosshair } from 'lucide-vue-next';
import api from '../api/axios';

const toast = useToast();
const directCaptureName = ref('');
const capturingDirect = ref(false);

const searchResults = ref([]);
const showDropdown = ref(false);
let searchTimeout = null;

async function onSearch() {
  clearTimeout(searchTimeout);
  const q = directCaptureName.value.trim();
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
  directCaptureName.value = pokemon.name;
  showDropdown.value = false;
  searchResults.value = [];
}

function hideDropdown() {
  setTimeout(() => {
    showDropdown.value = false;
  }, 150);
}

async function captureDirect() {
  if (!directCaptureName.value.trim()) return;
  
  capturingDirect.value = true;
  showDropdown.value = false;
  try {
    const { data } = await api.post('/captures/direct', { pokemonName: directCaptureName.value });
    toast.success(`¡${data.capture.pokemonName} ha sido capturado!`);
    directCaptureName.value = '';
    searchResults.value = [];
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al capturar directamente');
  } finally {
    capturingDirect.value = false;
  }
}
</script>

<style scoped>
.direct-capture-page {
  padding-bottom: 40px;
}
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
