<template>
  <div class="team-page">
    <h1 class="page-title">MI EQUIPO</h1>

    <div class="team-layout">
      <div class="team-section card">
        <h2>Equipo Actual ({{ team.length }}/6)</h2>
        <div class="team-slots">
          <div v-for="(c, idx) in team" :key="c.id" class="team-slot filled">
            <img :src="c.sprite" :alt="c.pokemonName" @error="e => e.target.src = defaultSprite" />
            <span>{{ c.nickname || c.pokemonName }}</span>
            <span class="small">Lv.{{ c.level }}</span>
            <button class="btn btn-danger btn-sm" @click="removeFromTeam(c.id)">
              <X :size="10" />
            </button>
          </div>
          <div v-for="n in (6 - team.length)" :key="'empty'+n" class="team-slot empty">
            <span class="empty-label">Vacio</span>
          </div>
        </div>
        <button class="btn btn-primary" @click="saveTeam" :disabled="saving">
          Guardar Equipo
        </button>
        <div class="endpoint-tag">GET /captures/team | PUT /captures/team</div>
      </div>

      <div class="available-section card">
        <h2>Tus Pokemon ({{ available.length }})</h2>
        <div class="available-grid" v-if="available.length">
          <div class="available-card" v-for="c in available" :key="c.id" @click="addToTeam(c)" :class="{ 'in-team': teamIds.includes(c.id) }">
            <img :src="c.sprite" :alt="c.pokemonName" @error="e => e.target.src = defaultSprite" />
            <span>{{ c.nickname || c.pokemonName }}</span>
            <span class="small">Lv.{{ c.level }}</span>
          </div>
        </div>
        <p v-else class="empty-text">No tienes Pokemon</p>
        <div class="endpoint-tag">GET /captures/my</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from '../composables/useToast';
import { X } from 'lucide-vue-next';
import api from '../api/axios';

const toast = useToast();
const team = ref([]);
const allCaptures = ref([]);
const saving = ref(false);
const defaultSprite = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%23333" width="96" height="96" rx="8"/><text x="48" y="56" text-anchor="middle" fill="%23666" font-size="14">?</text></svg>';

const teamIds = computed(() => team.value.map(c => c.id));
const available = computed(() => allCaptures.value.filter(c => !teamIds.value.includes(c.id)));

onMounted(async () => {
  const [teamRes, allRes] = await Promise.all([
    api.get('/captures/team'),
    api.get('/captures/my')
  ]);
  team.value = teamRes.data;
  allCaptures.value = allRes.data;
});

function addToTeam(c) {
  if (teamIds.value.includes(c.id)) return;
  if (team.value.length >= 6) {
    toast.error('Equipo lleno. Quita uno primero.');
    return;
  }
  team.value.push(c);
}

function removeFromTeam(id) {
  team.value = team.value.filter(c => c.id !== id);
}

async function saveTeam() {
  saving.value = true;
  try {
    await api.put('/captures/team', { teamIds: teamIds.value });
    toast.success('Equipo actualizado');
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al guardar');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.team-layout { display: flex; flex-direction: column; gap: 16px; }
.team-slots { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 12px; }
.team-slot { background: rgba(0,0,0,0.2); border: 2px dashed rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; min-height: 100px; }
.team-slot.filled { border-style: solid; border-color: var(--border); }
.team-slot img { width: 48px; height: 48px; image-rendering: pixelated; }
.team-slot span { font-size: 11px; }
.empty-label { color: var(--text-muted); font-size: 11px; }
.available-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; margin-top: 12px; }
.available-card { text-align: center; padding: 8px; border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.available-card:hover { border-color: var(--accent); background: rgba(254, 50, 51, 0.1); }
.available-card img { width: 48px; height: 48px; image-rendering: pixelated; }
.available-card span { font-size: 11px; display: block; }
</style>