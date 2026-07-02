import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api/axios';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  const token = ref(localStorage.getItem('token') || null);

  const isLoggedIn = computed(() => !!token.value);
  const coins = computed(() => user.value?.coins || 0);

  function setAuth(userData, tokenStr) {
    user.value = userData;
    token.value = tokenStr;
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenStr);
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  function updateCoins(newCoins) {
    if (user.value) {
      user.value.coins = newCoins;
      localStorage.setItem('user', JSON.stringify(user.value));
    }
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    setAuth(data.user, data.token);
    return data;
  }

  async function register(username, email, password) {
    const { data } = await api.post('/auth/register', { username, email, password });
    setAuth(data.user, data.token);
    return data;
  }

  async function fetchProfile() {
    const { data } = await api.get('/auth/profile');
    user.value = data;
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  }

  return { user, token, isLoggedIn, coins, login, register, logout, updateCoins, fetchProfile, setAuth };
});
