<template>
  <div class="collection-page">
    <h1 class="page-title">MI COLECCION</h1>

    <div class="collection-header">
      <span class="total">Total: {{ captures.length }} Pokemon</span>
    </div>

    <div class="captures-grid" v-if="captures.length">
      <div class="capture-card" v-for="c in captures" :key="c.id" :class="{ shiny: c.isShiny }">
        <div class="capture-sprite">
          <img :src="c.sprite" :alt="c.pokemonName" @error="e => e.target.src = defaultSprite" />
          <Sparkles v-if="c.isShiny" :size="12" class="shiny-icon" />
        </div>
        <div class="capture-info">
          <p class="nickname">{{ c.nickname || c.pokemonName }}</p>
          <p class="pokemon-name">#{{ c.pokemonId }} {{ c.pokemonName }}</p>
          <p class="level">Lv.{{ c.level }} | {{ c.nature }}</p>
          <div class="types">
            <span class="type-badge" v-for="t in c.types" :key="t">{{ t }}</span>
          </div>
          <div class="stats-row">
            <span>HP:{{ c.stats?.hp }}</span>
            <span>ATK:{{ c.stats?.attack }}</span>
            <span>DEF:{{ c.stats?.defense }}</span>
            <span>SPD:{{ c.stats?.speed }}</span>
          </div>
          <div class="moves-row" v-if="c.moves?.length">
            <span class="move-badge" v-for="m in c.moves" :key="m">{{ m }}</span>
          </div>
        </div>
        <div class="capture-actions">
          <button class="btn btn-primary btn-sm" @click="openInfoModal(c)" title="Ver info completa">
            <Eye :size="12" />
          </button>
          <button class="btn btn-primary btn-sm" @click="openEditModal(c, 'nickname')" title="Editar apodo">
            <Pencil :size="12" />
          </button>
          <button class="btn btn-primary btn-sm" @click="openEditModal(c, 'stat')" title="Editar stat">
            <BarChart3 :size="12" />
          </button>
          <button class="btn btn-primary btn-sm" @click="openEditModal(c, 'moves')" title="Editar movimientos">
            <Swords :size="12" />
          </button>
          <button class="btn btn-primary btn-sm" @click="openEditModal(c, 'nature')" title="Cambiar naturaleza">
            <Leaf :size="12" />
          </button>
          <button class="btn btn-primary btn-sm" @click="openEditModal(c, 'sprite')" title="Cambiar sprite">
            <Image :size="12" />
          </button>
          <button 
            class="btn btn-primary btn-sm" 
            @click="evolvePokemon(c)" 
            v-if="c.canEvolve"
            title="Evolucionar"
          >
            <ArrowUp :size="12" />
          </button>
          <button class="btn btn-danger btn-sm" @click="releasePokemon(c)" title="Liberar">
            <Trash2 :size="12" />
          </button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>No tienes Pokemon capturados</p>
      <router-link to="/gacha" class="btn btn-primary">Ir al Gacha</router-link>
    </div>

    <div class="endpoint-tag" style="text-align:center;">PATCH /captures/:id/nickname | PATCH /captures/:id/stat | PATCH /captures/:id/moves | PATCH /captures/:id/nature | PATCH /captures/:id/sprite | PUT /captures/:id/evolve | DELETE /captures/:id</div>

    <!-- Info Modal -->
    <div class="modal" v-if="editMode === 'info'" @click.self="closeModal">
      <div class="modal-content card info-modal-card">
        <h2>{{ infoCapture?.nickname || infoCapture?.pokemonName }}</h2>
        <div class="info-header">
          <img :src="infoCapture?.sprite" class="info-sprite" @error="e => e.target.src = defaultSprite" />
          <div class="info-basic">
            <p><strong>#{{ infoCapture?.pokemonId }}</strong> {{ infoCapture?.pokemonName }}</p>
            <p>Nivel: <span class="gold">{{ infoCapture?.level }}</span></p>
            <p>Naturaleza: <span class="gold">{{ infoCapture?.nature }}</span></p>
            <p>Shiny: {{ infoCapture?.isShiny ? '✨ Sí' : 'No' }}</p>
            <div class="types" style="margin-top:4px;">
              <span class="type-badge" v-for="t in (infoCapture?.types || [])" :key="t">{{ t }}</span>
            </div>
          </div>
        </div>
        <div class="info-section">
          <h3>Stats</h3>
          <div class="info-stats-grid">
            <div class="info-stat" v-for="(val, key) in (infoCapture?.stats || {})" :key="key">
              <span class="info-stat-label">{{ statLabels[key] || key }}</span>
              <div class="info-stat-bar-bg">
                <div class="info-stat-bar" :style="{ width: Math.min(val / 2.55, 100) + '%' }"></div>
              </div>
              <span class="info-stat-val">{{ val }}</span>
            </div>
          </div>
        </div>
        <div class="info-section" v-if="infoCapture?.ivs">
          <h3>IVs</h3>
          <div class="info-ivs">
            <span v-for="(val, key) in infoCapture.ivs" :key="key" class="iv-badge">{{ key }}: {{ val }}</span>
          </div>
        </div>
        <div class="info-section" v-if="infoCapture?.moves?.length">
          <h3>Movimientos</h3>
          <div class="info-moves">
            <span class="move-badge" v-for="m in infoCapture.moves" :key="m">{{ m }}</span>
          </div>
        </div>
        <div class="info-section">
          <p class="small">Captura ID: {{ infoCapture?.id }}</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="closeModal">Cerrar</button>
        </div>
        <div class="endpoint-tag">GET /captures/:id</div>
      </div>
    </div>

    <!-- Edit Nickname Modal -->
    <div class="modal" v-if="editMode === 'nickname'" @click.self="closeModal">
      <div class="modal-content card">
        <h2>Editar Apodo</h2>
        <input v-model="editData.nickname" class="input" placeholder="Nuevo apodo" />
        <div class="modal-actions">
          <button class="btn btn-primary" @click="saveNickname">Guardar</button>
          <button class="btn" @click="closeModal">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Edit Stat Modal -->
    <div class="modal" v-if="editMode === 'stat'" @click.self="closeModal">
      <div class="modal-content card">
        <h2>Editar Stat</h2>
        <div class="form-group">
          <label>Stat</label>
          <select v-model="editData.statName" class="input">
            <option value="hp">HP</option>
            <option value="attack">Ataque</option>
            <option value="defense">Defensa</option>
            <option value="spAttack">Ataque Esp.</option>
            <option value="spDefense">Defensa Esp.</option>
            <option value="speed">Velocidad</option>
          </select>
        </div>
        <div class="form-group">
          <label>Valor (actual: {{ editData.currentStatValue }})</label>
          <input v-model.number="editData.statValue" class="input" type="number" min="1" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="saveStat">Guardar</button>
          <button class="btn" @click="closeModal">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Edit Moves Modal -->
    <div class="modal" v-if="editMode === 'moves'" @click.self="closeModal">
      <div class="modal-content card">
        <h2>Editar Movimientos</h2>
        <p class="hint" v-if="loadingMoves">Cargando movimientos de PokeAPI...</p>
        <div class="form-group" v-if="availableMoves.length">
          <label>Movimientos disponibles ({{ editData.moves.length }}/4)</label>
          <div class="moves-select">
            <label v-for="m in availableMoves" :key="m.name" class="move-option">
              <input 
                type="checkbox" 
                :value="m.name" 
                v-model="editData.moves" 
                :disabled="!editData.moves.includes(m.name) && editData.moves.length >= 4"
              />
              <span>{{ m.name }}</span>
            </label>
          </div>
        </div>
        <div class="selected-moves" v-if="editData.moves.length">
          <span class="move-badge removable" v-for="m in editData.moves" :key="m" @click="removeMove(m)">
            {{ m }} <span class="move-remove">✕</span>
          </span>
        </div>
        <p class="hint">Selecciona hasta 4 movimientos. Haz click en un move para quitarlo.</p>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="saveMoves" :disabled="editData.moves.length === 0">Guardar</button>
          <button class="btn" @click="closeModal">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Edit Nature Modal -->
    <div class="modal" v-if="editMode === 'nature'" @click.self="closeModal">
      <div class="modal-content card">
        <h2>Cambiar Naturaleza</h2>
        <div class="form-group">
          <label>Naturaleza</label>
          <select v-model="editData.nature" class="input">
            <option v-for="n in natures" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="saveNature">Guardar</button>
          <button class="btn" @click="closeModal">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Edit Sprite Modal -->
    <div class="modal" v-if="editMode === 'sprite'" @click.self="closeModal">
      <div class="modal-content card">
        <h2>Cambiar Sprite</h2>
        <div class="form-group">
          <label>URL del sprite</label>
          <input v-model="editData.sprite" class="input" placeholder="https://..." />
        </div>
        <div class="sprite-preview" v-if="editData.sprite">
          <img :src="editData.sprite" @error="e => e.target.style.display='none'" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="saveSprite">Guardar</button>
          <button class="btn" @click="closeModal">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Pencil, ArrowUp, Trash2, Sparkles, BarChart3, Leaf, Image, Swords, Eye } from 'lucide-vue-next';
import { useToast } from '../composables/useToast';
import api from '../api/axios';

const toast = useToast();
const captures = ref([]);
const editMode = ref(null);
const editingCapture = ref(null);
const infoCapture = ref(null);
const availableMoves = ref([]);
const loadingMoves = ref(false);
const defaultSprite = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%23333" width="96" height="96" rx="8"/><text x="48" y="60" text-anchor="middle" fill="%23666" font-size="36">?</text></svg>';

const statLabels = {
  hp: 'HP', attack: 'ATK', defense: 'DEF',
  spAttack: 'SP.ATK', spDefense: 'SP.DEF', speed: 'SPD'
};

const natures = [
  'adamant', 'bashful', 'bold', 'brave', 'calm', 'careful', 'docile', 'gentle',
  'hardy', 'hasty', 'impish', 'jolly', 'lax', 'lonely', 'mild', 'modest',
  'naive', 'naughty', 'quiet', 'quirky', 'rash', 'relaxed', 'sassy', 'serious', 'timid'
];

const editData = ref({
  nickname: '',
  statName: 'attack',
  statValue: 0,
  currentStatValue: 0,
  moves: [],
  nature: '',
  sprite: ''
});

onMounted(async () => {
  await loadCaptures();
});

async function loadCaptures() {
  const { data } = await api.get('/captures/my');
  const withEvolution = await Promise.all(
    data.map(async (c) => {
      try {
        const { data: evoData } = await api.get(`/pokemon/${c.pokemonId}/evolution`);
        return { ...c, canEvolve: !!evoData.evolvesTo };
      } catch {
        return { ...c, canEvolve: false };
      }
    })
  );
  captures.value = withEvolution;
}

async function openInfoModal(capture) {
  try {
    const { data } = await api.get(`/captures/${capture.id}`);
    infoCapture.value = data;
  } catch {
    infoCapture.value = capture;
  }
  editMode.value = 'info';
}

function openEditModal(capture, mode) {
  editingCapture.value = capture;
  editMode.value = mode;

  if (mode === 'nickname') {
    editData.value.nickname = capture.nickname || capture.pokemonName;
  } else if (mode === 'stat') {
    editData.value.statName = 'hp';
    editData.value.statValue = capture.stats?.hp || 50;
    editData.value.currentStatValue = capture.stats?.hp || 50;
  } else if (mode === 'moves') {
    editData.value.moves = [...(capture.moves || [])];
    loadMoves(capture.pokemonId);
  } else if (mode === 'nature') {
    editData.value.nature = capture.nature || 'hardy';
  } else if (mode === 'sprite') {
    editData.value.sprite = capture.sprite || '';
  }
}

// Watch for stat dropdown changes to update the displayed base value
watch(() => editData.value.statName, (newStat) => {
  if (editingCapture.value && editMode.value === 'stat') {
    const statMap = {
      hp: editingCapture.value.stats?.hp,
      attack: editingCapture.value.stats?.attack,
      defense: editingCapture.value.stats?.defense,
      spAttack: editingCapture.value.stats?.spAttack,
      spDefense: editingCapture.value.stats?.spDefense,
      speed: editingCapture.value.stats?.speed
    };
    const val = statMap[newStat] || 50;
    editData.value.currentStatValue = val;
    editData.value.statValue = val;
  }
});

async function loadMoves(pokemonId) {
  loadingMoves.value = true;
  availableMoves.value = [];
  try {
    const { data } = await api.get(`/pokemon/${pokemonId}/moves`);
    availableMoves.value = data;
  } catch {
    toast.error('Error al cargar movimientos');
  } finally {
    loadingMoves.value = false;
  }
}

function removeMove(moveName) {
  editData.value.moves = editData.value.moves.filter(m => m !== moveName);
}

function closeModal() {
  editMode.value = null;
  editingCapture.value = null;
  infoCapture.value = null;
  availableMoves.value = [];
}

async function saveNickname() {
  if (!editData.value.nickname.trim()) return;
  try {
    await api.patch(`/captures/${editingCapture.value.id}/nickname`, { nickname: editData.value.nickname });
    toast.success('Apodo actualizado');
    closeModal();
    await loadCaptures();
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al actualizar apodo');
  }
}

async function saveStat() {
  try {
    await api.patch(`/captures/${editingCapture.value.id}/stat`, {
      statName: editData.value.statName,
      value: editData.value.statValue
    });
    toast.success(`${editData.value.statName} actualizado a ${editData.value.statValue}`);
    closeModal();
    await loadCaptures();
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al editar stat');
  }
}

async function saveMoves() {
  try {
    await api.patch(`/captures/${editingCapture.value.id}/moves`, { moves: editData.value.moves });
    toast.success('Movimientos actualizados');
    closeModal();
    await loadCaptures();
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al actualizar movimientos');
  }
}

async function saveNature() {
  try {
    await api.patch(`/captures/${editingCapture.value.id}/nature`, { nature: editData.value.nature });
    toast.success('Naturaleza actualizada');
    closeModal();
    await loadCaptures();
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al cambiar naturaleza');
  }
}

async function saveSprite() {
  try {
    await api.patch(`/captures/${editingCapture.value.id}/sprite`, { sprite: editData.value.sprite });
    toast.success('Sprite actualizado');
    closeModal();
    await loadCaptures();
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al cambiar sprite');
  }
}

async function evolvePokemon(capture) {
  if (!confirm(`¿Evolucionar ${capture.pokemonName}?`)) return;
  try {
    const { data } = await api.put(`/captures/${capture.id}/evolve`);
    toast.success(data.message);
    await loadCaptures();
  } catch (e) {
    toast.error(e.response?.data?.error || 'No se puede evolucionar');
  }
}

async function releasePokemon(capture) {
  if (!confirm(`¿Liberar ${capture.nickname || capture.pokemonName}?`)) return;
  try {
    await api.delete(`/captures/${capture.id}`);
    toast.success(`${capture.pokemonName} fue liberado`);
    await loadCaptures();
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al liberar');
  }
}
</script>

<style scoped>
.stats-row { display: flex; gap: 6px; font-size: 10px; color: var(--text-muted); margin-top: 4px; flex-wrap: wrap; }
.moves-row { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }
.move-badge { font-size: 9px; background: rgba(6, 212, 242, 0.15); color: var(--blue); padding: 2px 6px; border-radius: 3px; text-transform: capitalize; }
.sprite-preview { text-align: center; margin: 12px 0; }
.sprite-preview img { width: 64px; height: 64px; image-rendering: pixelated; }
.capture-actions { display: flex; flex-direction: column; gap: 3px; }
.moves-select { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.move-option { display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; text-transform: capitalize; }
.move-option input { accent-color: var(--accent); }
.move-option input:disabled { opacity: 0.3; cursor: not-allowed; }
.selected-moves { display: flex; gap: 4px; flex-wrap: wrap; margin: 8px 0; }
.move-badge.removable { cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s; }
.move-badge.removable:hover { background: rgba(254, 50, 51, 0.25); color: var(--accent); }
.move-remove { font-size: 10px; opacity: 0.6; }
.move-badge.removable:hover .move-remove { opacity: 1; }
.hint { font-size: 11px; color: var(--text-muted); margin: 4px 0; }

/* Info Modal */
.info-modal-card { max-width: 480px; }
.info-header { display: flex; gap: 16px; align-items: flex-start; margin: 12px 0; }
.info-sprite { width: 80px; height: 80px; image-rendering: pixelated; border: 2px solid var(--border); border-radius: 8px; background: rgba(0,0,0,0.2); }
.info-basic p { font-size: 13px; margin-bottom: 2px; }
.info-section { margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); }
.info-section h3 { margin-bottom: 8px; }
.info-stats-grid { display: flex; flex-direction: column; gap: 5px; }
.info-stat { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.info-stat-label { width: 50px; font-weight: 600; color: var(--text-muted); font-size: 10px; }
.info-stat-bar-bg { flex: 1; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
.info-stat-bar { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.3s; }
.info-stat-val { width: 30px; text-align: right; font-family: var(--font-title); font-size: 9px; color: var(--gold); }
.info-ivs { display: flex; gap: 6px; flex-wrap: wrap; }
.iv-badge { font-size: 10px; background: rgba(141, 198, 62, 0.12); color: var(--gold); padding: 2px 6px; border-radius: 3px; text-transform: uppercase; }
.info-moves { display: flex; gap: 4px; flex-wrap: wrap; }
</style>