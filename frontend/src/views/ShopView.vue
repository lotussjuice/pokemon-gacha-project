<template>
  <div class="shop-page">
    <h1 class="page-title">TIENDA</h1>

    <div class="shop-layout">
      <div class="items-grid card">
        <h2>Items Disponibles</h2>
        <div class="items-list" v-if="items.length">
          <div class="item-card" v-for="item in items" :key="item.id">
            <img :src="item.sprite" :alt="item.name" v-if="item.sprite" class="item-sprite" @error="e => e.target.src = defaultSprite" />
            <Package v-else :size="20" />
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-category">{{ item.category }}</span>
            </div>
            <span class="item-effect">{{ item.effect }}</span>
            <div class="item-action">
              <span class="price">
                <CircleDollarSign :size="12" />
                {{ item.price }}
              </span>
              <button class="btn btn-primary btn-sm" @click="buyItem(item)" :disabled="auth.coins < item.price">
                Comprar
              </button>
            </div>
          </div>
        </div>
        <p v-else>No hay items disponibles</p>
        <div class="endpoint-tag">POST /items/buy</div>
      </div>

      <div class="inventory card">
        <h2>Mi Inventario</h2>
        <div v-if="myItems.length">
          <div class="inv-item" v-for="ui in myItems" :key="ui.id">
            <img :src="getItemSprite(ui.itemId)" :alt="getItemName(ui.itemId)" class="inv-sprite" @error="e => e.target.src = defaultSprite" />
            <span class="inv-name">{{ getItemName(ui.itemId) }}</span>
            <span class="inv-qty">x{{ ui.quantity }}</span>
            <button class="btn btn-danger btn-sm" @click="sellItem(ui)">
              Vender
            </button>
          </div>
        </div>
        <p v-else>Inventario vacio</p>
        <div class="endpoint-tag">GET /items/my | DELETE /items/sell/:id</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import { Package, CircleDollarSign } from 'lucide-vue-next';
import api from '../api/axios';

const auth = useAuthStore();
const toast = useToast();
const items = ref([]);
const myItems = ref([]);
const defaultSprite = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%23333" width="96" height="96" rx="8"/><text x="48" y="56" text-anchor="middle" fill="%23666" font-size="14">?</text></svg>';

onMounted(async () => {
  const [itemsRes, myItemsRes] = await Promise.all([
    api.get('/items'),
    api.get('/items/my')
  ]);
  items.value = itemsRes.data;
  myItems.value = myItemsRes.data;
});

function getItemName(itemId) {
  const item = items.value.find(i => i.id === itemId);
  return item?.name || itemId;
}

function getItemSprite(itemId) {
  const item = items.value.find(i => i.id === itemId);
  return item?.sprite || defaultSprite;
}

async function buyItem(item) {
  try {
    const { data } = await api.post('/items/buy', { itemId: item.id });
    auth.updateCoins(data.remainingCoins);
    const myItemsRes = await api.get('/items/my');
    myItems.value = myItemsRes.data;
    toast.success(`Compraste ${item.name}`);
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al comprar');
  }
}

async function sellItem(ui) {
  try {
    const { data } = await api.delete(`/items/sell/${ui.id}`);
    auth.updateCoins(auth.coins + data.earned);
    const myItemsRes = await api.get('/items/my');
    myItems.value = myItemsRes.data;
    toast.success(`Vendido! +${data.earned} monedas`);
  } catch (e) {
    toast.error(e.response?.data?.error || 'Error al vender');
  }
}
</script>

<style scoped>
.items-list { display: flex; flex-direction: column; gap: 0; }
.item-card { display: flex; gap: 10px; align-items: center; padding: 8px 4px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
.item-sprite { width: 28px; height: 28px; flex-shrink: 0; }
.item-info { display: flex; flex-direction: column; min-width: 90px; }
.item-name { font-weight: 600; text-transform: capitalize; font-size: 12px; }
.item-category { font-size: 10px; color: var(--text-muted); text-transform: capitalize; }
.item-effect { flex: 1; font-size: 11px; color: var(--text-muted); line-height: 1.3; }
.item-action { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.price { display: flex; align-items: center; gap: 3px; font-size: 12px; color: var(--gold); font-weight: 700; }
.inv-item { display: flex; align-items: center; gap: 8px; padding: 8px 4px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
.inv-sprite { width: 24px; height: 24px; flex-shrink: 0; }
.inv-name { flex: 1; text-transform: capitalize; }
.inv-qty { font-family: var(--font-title); font-size: 9px; color: var(--gold); min-width: 30px; text-align: right; }
</style>