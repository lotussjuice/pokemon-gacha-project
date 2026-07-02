import { reactive } from 'vue';

const toasts = reactive([]);
let nextId = 0;

export function useToast() {
  function show(message, type = 'info', duration = 3000) {
    const id = nextId++;
    toasts.push({ id, message, type });
    setTimeout(() => {
      const idx = toasts.findIndex(t => t.id === id);
      if (idx !== -1) toasts.splice(idx, 1);
    }, duration);
  }

  function success(message) { show(message, 'success'); }
  function error(message) { show(message, 'error', 4000); }
  function info(message) { show(message, 'info'); }

  return { toasts, show, success, error, info };
}
