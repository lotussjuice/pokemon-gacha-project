<template>
  <div class="lobby">
    <h1 class="page-title">LOBBY</h1>

    <div class="stats-row">
      <div class="stat-card">
        <CircleDollarSign :size="32" class="stat-icon" />
        <span class="stat-value">{{ auth.coins }}</span>
        <span class="stat-label">Monedas</span>
        <div class="endpoint-tag">GET /coins/balance</div>
      </div>
      <div class="stat-card">
        <Box :size="32" class="stat-icon" />
        <span class="stat-value">{{ capturesCount }}</span>
        <span class="stat-label">Pokemon</span>
        <div class="endpoint-tag">GET /captures/my</div>
      </div>
      <div class="stat-card">
        <Swords :size="32" class="stat-icon" />
        <span class="stat-value">{{ combatsCount }}</span>
        <span class="stat-label">Combates</span>
        <div class="endpoint-tag">GET /combat/history</div>
      </div>
    </div>

    <div class="card daily-card">
      <h2>Daily Claim</h2>
      <p class="daily-text">Reclama 500 monedas gratis cada dia</p>
      <button 
        class="btn btn-gold" 
        @click="claimDaily" 
        :disabled="dailyCooldown > 0 || loading"
      >
        <Gift :size="14" />
        {{ dailyCooldown > 0 ? `Vuelve en ${dailyCooldown}h` : 'Reclamar 500' }}
      </button>
      <p class="daily-message" v-if="dailyMessage">{{ dailyMessage }}</p>
      <div class="endpoint-tag">POST /coins/daily</div>
    </div>

    <div class="card">
      <h2>Ultimas capturas</h2>
      <div class="recent-captures" v-if="recentCaptures.length">
        <div class="capture-mini" v-for="c in recentCaptures.slice(0, 5)" :key="c.id">
          <img :src="c.sprite" :alt="c.pokemonName" @error="e => e.target.src = defaultSprite" />
          <span>{{ c.nickname || c.pokemonName }}</span>
        </div>
      </div>
      <p v-else class="empty-text">Aun no tienes capturas. Ve al Gacha!</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import { Box, Swords, Gift, CircleDollarSign } from 'lucide-vue-next';
import api from '../api/axios';

const auth = useAuthStore();
const toast = useToast();
const capturesCount = ref(0);
const combatsCount = ref(0);
const recentCaptures = ref([]);
const dailyCooldown = ref(0);
const dailyMessage = ref('');
const loading = ref(false);
const defaultSprite = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%23333" width="96" height="96" rx="8"/><text x="48" y="60" text-anchor="middle" fill="%23666" font-size="36">?</text></svg>';

onMounted(async () => {
  try {
    const [capturesRes, combatsRes, profileRes] = await Promise.all([
      api.get('/captures/my'),
      api.get('/combat/history'),
      api.get('/auth/profile')
    ]);

    capturesCount.value = capturesRes.data.length;
    combatsCount.value = combatsRes.data.length;
    recentCaptures.value = capturesRes.data;

    auth.updateCoins(profileRes.data.coins);

    if (profileRes.data.dailyClaimAt) {
      const lastClaim = new Date(profileRes.data.dailyClaimAt);
      const hoursSince = (Date.now() - lastClaim) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        dailyCooldown.value = Math.ceil(24 - hoursSince);
      }
    }
  } catch (e) {
    console.error(e);
  }
});

async function claimDaily() {
  loading.value = true;
  dailyMessage.value = '';
  try {
    const { data } = await api.post('/coins/daily');
    dailyMessage.value = data.message;
    auth.updateCoins(data.coins);
    dailyCooldown.value = 24;
    toast.success('+500 monedas reclamadas');
  } catch (e) {
    dailyMessage.value = e.response?.data?.error || 'Error';
    toast.error(dailyMessage.value);
  } finally {
    loading.value = false;
  }
}
</script>
