import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    name: 'Lobby',
    component: () => import('../views/LobbyView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/gacha',
    name: 'Gacha',
    component: () => import('../views/GachaView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/collection',
    name: 'Collection',
    component: () => import('../views/CollectionView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/combat',
    name: 'Combat',
    component: () => import('../views/CombatView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/shop',
    name: 'Shop',
    component: () => import('../views/ShopView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/trades',
    name: 'Trades',
    component: () => import('../views/TradeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pokedex',
    name: 'Pokedex',
    component: () => import('../views/PokedexView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/team',
    name: 'Team',
    component: () => import('../views/TeamView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/direct',
    name: 'DirectCapture',
    component: () => import('../views/DirectCaptureView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  
  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.meta.guest && token) {
    next('/');
  } else {
    next();
  }
});

export default router;