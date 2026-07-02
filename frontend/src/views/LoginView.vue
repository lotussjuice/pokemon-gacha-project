<template>
  <div class="login-page">
    <div class="login-box">
      <div class="logo">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Pokeball" style="width:48px;height:48px;image-rendering:pixelated;" />
        <h1>POKEMON GACHA</h1>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" class="input" placeholder="correo@ejemplo.com" required />
        </div>
        <div class="form-group" v-if="isRegister">
          <label>Username</label>
          <input v-model="form.username" type="text" class="input" placeholder="Tu nombre de entrenador" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" class="input" placeholder="Contraseña" required />
        </div>

        <p class="error" v-if="error">{{ error }}</p>

        <button type="submit" class="btn btn-primary full-width" :disabled="loading">
          {{ loading ? 'Cargando...' : (isRegister ? 'Registrarse' : 'Iniciar Sesion') }}
        </button>
        <div class="endpoint-tag">{{ isRegister ? 'POST /auth/register' : 'POST /auth/login' }}</div>
      </form>

      <p class="toggle-text">
        {{ isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?' }}
        <a href="#" @click.prevent="isRegister = !isRegister">
          {{ isRegister ? 'Iniciar Sesion' : 'Registrarse' }}
        </a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';

const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const isRegister = ref(false);
const loading = ref(false);
const error = ref('');

const form = reactive({
  username: '',
  email: '',
  password: ''
});

async function handleSubmit() {
  loading.value = true;
  error.value = '';

  try {
    if (isRegister.value) {
      await auth.register(form.username, form.email, form.password);
      toast.success('¡Cuenta creada! Bienvenido');
    } else {
      await auth.login(form.email, form.password);
      toast.success('Sesion iniciada');
    }
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al conectar con el servidor';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}
</script>
