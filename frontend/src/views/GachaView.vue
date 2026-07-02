<template>
  <div class="gacha-page">
    <h1 class="page-title">GACHA MACHINE</h1>

    <div class="gacha-container">
      <div class="machine">
        <div class="machine-top">
          <div class="slots">
            <div class="slot"></div>
            <div class="slot"></div>
          </div>
          <div class="machine-label">POKEMON GACHA</div>
        </div>

        <div class="screen" :class="{ 'screen-pull': pulling }">
          <div v-if="pulling" class="pulling-animation">
            <Zap :size="32" class="pokeball-spin" />
            <p>Abriendo...</p>
          </div>
          <div v-else-if="result" class="result-display" :class="{ shiny: result.capture?.isShiny }">
            <img :src="result.capture?.sprite" :alt="result.capture?.pokemonName" class="result-sprite" @error="e => e.target.src = defaultSprite" />
            <p class="result-name">{{ result.capture?.pokemonName?.toUpperCase() }}</p>
            <p class="result-info">
              <span v-if="result.capture?.isShiny" class="shiny-badge">
                <Sparkles :size="10" /> SHINY
              </span>
              <span>Lv.{{ result.capture?.level }}</span>
              <span>{{ result.capture?.nature }}</span>
            </p>
            <p class="result-message">{{ result.message }}</p>
          </div>
          <div v-else class="idle-screen">
            <p>PRESS START</p>
            <Circle :size="48" style="color:#0f380f;margin-top:8px;" />
          </div>
        </div>

        <div class="machine-controls">
          <div class="dpad">
            <div class="dpad-h"></div>
            <div class="dpad-v"></div>
          </div>
          <div class="buttons">
            <button class="btn btn-b" @click="doPull(false)" :disabled="pulling || auth.coins < 100">B</button>
            <button class="btn btn-a" @click="doPull(true)" :disabled="pulling || auth.coins < 500">A</button>
          </div>
          <div class="endpoint-tag">POST /gacha/pull</div>
        </div>
      </div>

      <div class="gacha-info">
        <div class="cost-card card">
          <h3>Costos</h3>
          <p>Boton B: <span class="gold">100</span> monedas</p>
          <p>Boton A: <span class="gold">500</span> monedas (Premium)</p>
        </div>

        <div class="cost-card card">
          <h3>Tu saldo</h3>
          <p class="balance">
            <CircleDollarSign :size="18" />
            {{ auth.coins }}
          </p>
        </div>

        <div class="cost-card card" v-if="result?.capture">
          <h3>Ultimo resultado</h3>
          <p>Shiny: {{ result.capture.isShiny ? 'Si' : 'No' }}</p>
          <p>Nature: {{ result.capture.nature }}</p>
          <p>IVs: {{ Object.values(result.capture.ivs).join('/') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import { Zap, Sparkles, CircleDollarSign, Circle } from 'lucide-vue-next';
import api from '../api/axios';
const auth = useAuthStore();
const toast = useToast();
const pulling = ref(false);
const result = ref(null);
const defaultSprite = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%23333" width="96" height="96" rx="8"/><text x="48" y="60" text-anchor="middle" fill="%23666" font-size="36">?</text></svg>';

async function doPull(premium) {
  if (auth.coins < (premium ? 500 : 100)) {
    toast.error('Monedas insuficientes');
    return;
  }

  pulling.value = true;
  result.value = null;

  try {
    const { data } = await api.post('/gacha/pull', { premium });
    result.value = data;
    auth.updateCoins(data.remainingCoins);
    toast.success(data.message);
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al tirar gacha');
  } finally {
    pulling.value = false;
  }
}
</script>
