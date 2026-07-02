<template>
  <div class="profile-page">
    <h1 class="page-title">MI PERFIL</h1>

    <div class="card profile-layout">
      <div class="profile-avatar-section">
        <div class="avatar-large" :style="{ background: selectedAvatarColor }">
          <img v-if="form.avatar && !form.avatar.startsWith('color:')" :src="form.avatar" class="avatar-img" @error="e => e.target.style.display='none'" />
          <span v-else class="avatar-letter">{{ auth.user?.username?.[0]?.toUpperCase() || '?' }}</span>
        </div>

        <div class="avatar-section-label">Entrenadores</div>
        <div class="avatar-grid trainer-grid">
          <div 
            v-for="(av, idx) in trainerAvatars" 
            :key="'t'+idx" 
            class="avatar-option trainer-avatar"
            :class="{ selected: form.avatar === av.url }"
            @click="form.avatar = av.url"
          >
            <img :src="av.url" :alt="av.name" @error="e => e.target.parentElement.style.display='none'" />
          </div>
        </div>

        <div class="form-group" style="margin-top:16px;">
          <label>URL de avatar personalizado</label>
          <input v-model="form.avatar" class="input" placeholder="https://..." />
        </div>
      </div>

      <div class="form-group">
        <label>Username</label>
        <input v-model="form.username" class="input" placeholder="Tu nombre de entrenador" />
      </div>

      <div class="form-group">
        <label>Email</label>
        <input v-model="form.email" type="email" class="input" placeholder="correo@ejemplo.com" />
      </div>

      <p class="error" v-if="error">{{ error }}</p>
      <p class="success-msg" v-if="successMsg">{{ successMsg }}</p>

      <button class="btn btn-primary full-width" @click="saveProfile" :disabled="saving">
        {{ saving ? 'Guardando...' : 'Guardar cambios' }}
      </button>
      <div class="endpoint-tag">PUT /users/profile | GET /auth/profile</div>
    </div>

    <div class="card profile-layout" style="margin-top:16px;">
      <h2>Zona de Peligro</h2>
      <p class="danger-text">Reiniciar cuenta elimina todos tus Pokemon, items y combates. Se conserva tu perfil y monedas iniciales.</p>
      <button class="btn btn-danger full-width" @click="resetAccount" :disabled="resetting">
        {{ resetting ? 'Reiniciando...' : 'Reiniciar Cuenta' }}
      </button>
      <div class="endpoint-tag">DELETE /users/reset</div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import api from '../api/axios';

const auth = useAuthStore();
const toast = useToast();
const router = useRouter();

const saving = ref(false);
const resetting = ref(false);
const error = ref('');
const successMsg = ref('');

const trainerAvatars = [
  { name: 'ash', url: 'https://play.pokemonshowdown.com/sprites/trainers/ash.png' },
  { name: 'misty', url: 'https://play.pokemonshowdown.com/sprites/trainers/misty.png' },
  { name: 'brock', url: 'https://play.pokemonshowdown.com/sprites/trainers/brock.png' },
  { name: 'red', url: 'https://play.pokemonshowdown.com/sprites/trainers/red.png' },
  { name: 'blue', url: 'https://play.pokemonshowdown.com/sprites/trainers/blue.png' },
  { name: 'lt-surge', url: 'https://play.pokemonshowdown.com/sprites/trainers/lt-surge.png' },
  { name: 'erika', url: 'https://play.pokemonshowdown.com/sprites/trainers/erika.png' },
  { name: 'koga', url: 'https://play.pokemonshowdown.com/sprites/trainers/koga.png' },
  { name: 'sabrina', url: 'https://play.pokemonshowdown.com/sprites/trainers/sabrina.png' },
  { name: 'blaine', url: 'https://play.pokemonshowdown.com/sprites/trainers/blaine.png' },
  { name: 'giovanni', url: 'https://play.pokemonshowdown.com/sprites/trainers/giovanni.png' },
  { name: 'lorelei', url: 'https://play.pokemonshowdown.com/sprites/trainers/lorelei.png' },
  { name: 'bruno', url: 'https://play.pokemonshowdown.com/sprites/trainers/bruno.png' },
  { name: 'agatha', url: 'https://play.pokemonshowdown.com/sprites/trainers/agatha.png' },
  { name: 'lance', url: 'https://play.pokemonshowdown.com/sprites/trainers/lance.png' },
  { name: 'champion', url: 'https://play.pokemonshowdown.com/sprites/trainers/champion.png' },
  { name: 'may', url: 'https://play.pokemonshowdown.com/sprites/trainers/may.png' },
  { name: 'brendan', url: 'https://play.pokemonshowdown.com/sprites/trainers/brendan.png' },
  { name: 'dawn', url: 'https://play.pokemonshowdown.com/sprites/trainers/dawn.png' },
  { name: 'lucas', url: 'https://play.pokemonshowdown.com/sprites/trainers/lucas.png' },
  { name: 'cynthia', url: 'https://play.pokemonshowdown.com/sprites/trainers/cynthia.png' },
  { name: 'steven', url: 'https://play.pokemonshowdown.com/sprites/trainers/steven.png' },
  { name: 'wallace', url: 'https://play.pokemonshowdown.com/sprites/trainers/wallace.png' },
  { name: 'hilbert', url: 'https://play.pokemonshowdown.com/sprites/trainers/hilbert.png' },
  { name: 'hilda', url: 'https://play.pokemonshowdown.com/sprites/trainers/hilda.png' },
  { name: 'n', url: 'https://play.pokemonshowdown.com/sprites/trainers/n.png' },
  { name: 'iris', url: 'https://play.pokemonshowdown.com/sprites/trainers/iris.png' },
  { name: 'serena', url: 'https://play.pokemonshowdown.com/sprites/trainers/serena.png' },
  { name: 'calem', url: 'https://play.pokemonshowdown.com/sprites/trainers/calem.png' },
  { name: 'leon', url: 'https://play.pokemonshowdown.com/sprites/trainers/leon.png' },
  { name: 'gloria', url: 'https://play.pokemonshowdown.com/sprites/trainers/gloria.png' },
  { name: 'victor', url: 'https://play.pokemonshowdown.com/sprites/trainers/victor.png' },
];

const selectedAvatarColor = computed(() => {
  return '#FE3233';
});

const form = reactive({
  username: '',
  email: '',
  avatar: ''
});

onMounted(async () => {
  try {
    const { data } = await api.get('/auth/profile');
    form.username = data.username || '';
    form.email = data.email || '';
    form.avatar = data.avatar || '';
  } catch (e) {
    console.error(e);
  }
});

async function saveProfile() {
  saving.value = true;
  error.value = '';
  successMsg.value = '';

  try {
    const updates = {};
    if (form.username !== auth.user?.username) updates.username = form.username;
    if (form.email !== auth.user?.email) updates.email = form.email;
    if (form.avatar !== auth.user?.avatar) updates.avatar = form.avatar;

    if (Object.keys(updates).length === 0) {
      successMsg.value = 'No hay cambios para guardar';
      saving.value = false;
      return;
    }

    const { data } = await api.put('/users/profile', updates);
    auth.setAuth({ ...auth.user, ...data }, auth.token);
    successMsg.value = 'Perfil actualizado';
    toast.success('Perfil actualizado correctamente');
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al guardar';
    toast.error(error.value);
  } finally {
    saving.value = false;
  }
}

async function resetAccount() {
  if (!confirm('¿Estás seguro? Se eliminaran todos tus Pokemon, items y combates.')) return;
  resetting.value = true;
  try {
    const { data } = await api.delete('/users/reset');
    auth.updateCoins(data.coins);
    toast.success('Cuenta reiniciada. Se conserva tu perfil.');
    router.push('/');
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al reiniciar');
  } finally {
    resetting.value = false;
  }
}
</script>

<style scoped>
.success-msg { color: var(--gold); font-size: 13px; margin: 8px 0; }
.danger-text { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.5; }

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.avatar-letter {
  font-family: var(--font-title);
  font-size: 28px;
  color: white;
  text-shadow: 2px 2px 0px rgba(0,0,0,0.5);
}

.avatar-section-label {
  font-family: var(--font-title);
  font-size: 8px;
  color: var(--text-muted);
  text-align: center;
  margin: 12px 0 6px;
  letter-spacing: 1px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
  justify-items: center;
}

.avatar-option {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.trainer-avatar {
  background: rgba(0,0,0,0.3);
}

.trainer-avatar img {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}

.avatar-option:hover {
  transform: scale(1.1);
  border-color: rgba(255,255,255,0.3);
}

.avatar-option.selected {
  border-color: white;
  transform: scale(1.15);
  box-shadow: 0 0 12px rgba(254, 50, 51, 0.5);
}

.avatar-initial {
  font-family: var(--font-title);
  font-size: 14px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}
</style>