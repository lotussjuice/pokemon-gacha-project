<template>
  <div class="combat-page">
    <h1 class="page-title">COMBATE</h1>

    <div class="combat-layout">
      <div class="combat-select card" v-if="!fighting">
        <h2>Selecciona tu Pokemon</h2>
        <div class="select-grid" v-if="team.length">
          <div class="select-card" v-for="c in team" :key="c.id" @click="selectedCapture = c" :class="{ active: selectedCapture?.id === c.id }">
            <img :src="getSprite(c.sprite, c.pokemonId)" :alt="c.pokemonName" @error="e => e.target.src = defaultSprite" />
            <p>{{ c.nickname || c.pokemonName }}</p>
            <p class="small">Lv.{{ c.level }}</p>
          </div>
        </div>
        <p v-else>No tienes equipo. <router-link to="/team">Armalo aqui</router-link></p>

        <button class="btn btn-primary" @click="startFight" :disabled="!selectedCapture">
          <Swords :size="14" />
          Luchar!
        </button>
        <div class="endpoint-tag">GET /captures/team | POST /combat/start</div>
      </div>

      <div class="combat-arena card" v-else>
        <div class="fighters">
          <div class="fighter">
            <img :src="getSprite(combatLog.playerPokemon.sprite, combatLog.playerPokemon.pokemonId)" :alt="combatLog.playerPokemon.name" @error="e => e.target.src = defaultSprite" />
            <p>{{ combatLog.playerPokemon.name }}</p>
            <span class="small">Lv.{{ combatLog.playerPokemon.level }}</span>
            <div class="hp-bar">
              <div class="hp-fill" :style="{ width: combatLog.playerHP + '%' }"></div>
            </div>
            <span class="hp-text">{{ combatLog.playerHP }}%</span>
          </div>
          <div class="vs">
            <Zap :size="24" />
          </div>
          <div class="fighter enemy">
            <img :src="getSprite(combatLog.enemyPokemon.sprite, combatLog.enemyPokemon.pokemonId)" :alt="combatLog.enemyPokemon.name" @error="e => e.target.src = defaultSprite" />
            <p>{{ combatLog.enemyPokemon.name }}</p>
            <span class="small">Lv.{{ combatLog.enemyPokemon.level }}</span>
            <div class="hp-bar">
              <div class="hp-fill enemy-hp" :style="{ width: combatLog.wildHP + '%' }"></div>
            </div>
            <span class="hp-text">{{ combatLog.wildHP }}%</span>
          </div>
        </div>

        <div class="battle-log" ref="logRef">
          <p v-for="(msg, i) in combatLog.log" :key="i" :class="{ 'level-up-msg': msg.includes('subio a') }">{{ msg }}</p>
        </div>

        <div class="battle-result" v-if="combatLog.result">
          <h2 :class="combatLog.result">
            <Trophy v-if="combatLog.result === 'victory'" :size="20" />
            <Skull v-else :size="20" />
            {{ combatLog.result === 'victory' ? 'VICTORIA!' : 'DERROTA' }}
          </h2>
          <div class="result-details">
            <p v-if="combatLog.reward">+{{ combatLog.reward }} monedas</p>
            <p v-if="combatLog.levelUp" class="level-up-text">
              Lv.{{ combatLog.levelUp.from }} → Lv.{{ combatLog.levelUp.to }}
            </p>
            <p v-if="combatLog.itemDrop">Item: {{ combatLog.itemDrop }}</p>
          </div>
          <button class="btn btn-primary" @click="resetCombat">Volver</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Swords, Zap, Trophy, Skull } from 'lucide-vue-next';
import { useToast } from '../composables/useToast';
import api from '../api/axios';

const toast = useToast();
const team = ref([]);
const selectedCapture = ref(null);
const fighting = ref(false);
const logRef = ref(null);
const defaultSprite = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%23333" width="96" height="96" rx="8"/><text x="48" y="60" text-anchor="middle" fill="%23666" font-size="36">?</text></svg>';
const combatLog = ref({
  playerPokemon: { name: '', sprite: '', level: 1, pokemonId: 0 },
  enemyPokemon: { name: '', sprite: '', level: 1, pokemonId: 0 },
  playerHP: 100,
  wildHP: 100,
  result: null,
  reward: 0,
  itemDrop: null,
  levelUp: null,
  log: []
});

function getSprite(sprite, pokemonId) {
  if (sprite && sprite !== '') return sprite;
  if (pokemonId) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
  return defaultSprite;
}

onMounted(async () => {
  const { data } = await api.get('/captures/team');
  team.value = data;
});

async function startFight() {
  if (!selectedCapture.value) return;
  fighting.value = true;

  try {
    const { data } = await api.post('/combat/start', { captureId: selectedCapture.value.id });
    
    // Reset state for animation
    combatLog.value = {
      playerPokemon: data.playerPokemon,
      enemyPokemon: data.enemyPokemon,
      playerHP: 100,
      wildHP: 100,
      result: null,
      reward: 0,
      itemDrop: null,
      levelUp: null,
      log: []
    };

    // Animate log entries
    for (const msg of data.log) {
      await new Promise(resolve => setTimeout(resolve, 800));
      combatLog.value.log.push(msg);
      // Auto-scroll
      if (logRef.value) {
        logRef.value.scrollTop = logRef.value.scrollHeight;
      }
    }

    // Finalize state
    await new Promise(resolve => setTimeout(resolve, 500));
    combatLog.value.playerHP = data.playerHP;
    combatLog.value.wildHP = data.wildHP;
    combatLog.value.result = data.result;
    combatLog.value.reward = data.reward;
    combatLog.value.itemDrop = data.itemDrop;
    combatLog.value.levelUp = data.levelUp;

    if (data.levelUp) {
      toast.success(`¡Victoria! ${selectedCapture.value.pokemonName} subio a Lv.${data.levelUp.to}! +${data.reward} monedas`);
    } else if (data.result === 'victory') {
      toast.success(`¡Victoria! +${data.reward} monedas`);
    } else {
      toast.error('Derrota...');
    }
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error en el combate');
    fighting.value = false;
  }
}

function resetCombat() {
  fighting.value = false;
  selectedCapture.value = null;
  combatLog.value = {
    playerPokemon: { name: '', sprite: '', level: 1, pokemonId: 0 },
    enemyPokemon: { name: '', sprite: '', level: 1, pokemonId: 0 },
    playerHP: 100,
    wildHP: 100,
    result: null,
    reward: 0,
    itemDrop: null,
    levelUp: null,
    log: []
  };
}
</script>

<style scoped>
.level-up-msg { color: var(--gold); font-weight: 600; }
.level-up-text { color: var(--gold); font-family: var(--font-title); font-size: 11px; margin-top: 4px; }
.result-details { margin-bottom: 12px; }
.result-details p { font-size: 13px; margin-bottom: 2px; }
</style>