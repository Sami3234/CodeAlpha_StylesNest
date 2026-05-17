const STORAGE_KEY = 'stylesnest_order_whatsapp_confirm';

export type StoredOrderWhatsApp = {
  orderId: string;
  confirmUrl: string;
  total: number;
};

export function saveOrderWhatsAppConfirm(data: StoredOrderWhatsApp): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function readOrderWhatsAppConfirm(): StoredOrderWhatsApp | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredOrderWhatsApp;
    if (!data?.orderId || !data.confirmUrl) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearOrderWhatsAppConfirm(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
