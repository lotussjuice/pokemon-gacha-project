<template>
  <div class="toast-container">
    <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">
      {{ t.message }}
    </div>
  </div>

  <div class="app-layout" v-if="auth.isLoggedIn">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="user-info">
          <img :src="auth.user?.avatar" alt="avatar" class="avatar" @error="e => e.target.src = defaultAvatar" />
          <span class="username">{{ auth.user?.username }}</span>
        </div>
        <div class="coins">
          <CircleDollarSign :size="16" />
          <span>{{ auth.coins }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item">
          <Home :size="16" />
          <span>Lobby</span>
        </router-link>
        <router-link to="/gacha" class="nav-item">
          <Dices :size="16" />
          <span>Gacha</span>
        </router-link>
        <router-link to="/collection" class="nav-item">
          <Box :size="16" />
          <span>Coleccion</span>
        </router-link>
        <router-link to="/pokedex" class="nav-item">
          <BookOpen :size="16" />
          <span>Pokedex</span>
        </router-link>
        <router-link to="/team" class="nav-item">
          <Users :size="16" />
          <span>Equipo</span>
        </router-link>
        <router-link to="/direct" class="nav-item">
          <Crosshair :size="16" />
          <span>Captura Directa</span>
        </router-link>
        <router-link to="/combat" class="nav-item">
          <Swords :size="16" />
          <span>Combate</span>
        </router-link>
        <router-link to="/shop" class="nav-item">
          <ShoppingCart :size="16" />
          <span>Tienda</span>
        </router-link>
        <router-link to="/trades" class="nav-item">
          <ArrowLeftRight :size="16" />
          <span>Intercambios</span>
        </router-link>
      </nav>

      <router-link to="/profile" class="nav-item" style="margin-bottom:4px;">
        <User :size="16" />
        <span>Perfil</span>
      </router-link>

      <button class="logout-btn" @click="handleLogout">
        <LogOut :size="14" />
        <span>Salir</span>
      </button>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>

  <div v-else>
    <router-view />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useToast } from './composables/useToast';
import { Home, Dices, Box, Swords, ShoppingCart, ArrowLeftRight, LogOut, User, CircleDollarSign, BookOpen, Users, Crosshair } from 'lucide-vue-next';

const auth = useAuthStore();
const router = useRouter();
const { toasts } = useToast();
const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23FE3233" width="100" height="100" rx="50"/><text x="50" y="65" text-anchor="middle" fill="white" font-size="48" font-family="sans-serif">?</text></svg>';

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>