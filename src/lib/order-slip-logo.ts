/** Packing slip logo — primary transparent wordmark in /public */
export const SLIP_LOGO_SRC = '/StylesNest_Transparent.png';
export const SLIP_LOGO_FALLBACK = '/StylesNest_logo.png';

export type SlipLogoAsset = {
  dataUrl: string;
  widthPx: number;
  heightPx: number;
};

let cachedLogoAsset: SlipLogoAsset | null | undefined;

function resolveLogoUrl(src: string): string {
  if (typeof window === 'undefined') return src;
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return `${window.location.origin}${src}`;
}

function loadImageAsset(src: string): Promise<SlipLogoAsset | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const widthPx = img.naturalWidth;
      const heightPx = img.naturalHeight;
      if (!widthPx || !heightPx) {
        resolve(null);
        return;
      }
      try {
        const canvas = document.createElement('canvas');
        canvas.width = widthPx;
        canvas.height = heightPx;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          widthPx,
          heightPx,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = resolveLogoUrl(src);
  });
}

/** Fit logo inside max box (mm) while keeping aspect ratio. */
export function fitSlipLogoMm(
  widthPx: number,
  heightPx: number,
  maxWidthMm: number,
  maxHeightMm: number,
): { widthMm: number; heightMm: number } {
  if (widthPx <= 0 || heightPx <= 0) {
    return { widthMm: maxWidthMm, heightMm: Math.min(maxHeightMm, maxWidthMm * 0.35) };
  }
  const ratio = widthPx / heightPx;
  let widthMm = maxWidthMm;
  let heightMm = widthMm / ratio;
  if (heightMm > maxHeightMm) {
    heightMm = maxHeightMm;
    widthMm = heightMm * ratio;
  }
  return { widthMm, heightMm };
}

/** Cached logo for jsPDF / print (browser only). */
export async function getSlipLogoAsset(): Promise<SlipLogoAsset | null> {
  if (cachedLogoAsset !== undefined) return cachedLogoAsset;
  for (const src of [SLIP_LOGO_SRC, SLIP_LOGO_FALLBACK]) {
    const asset = await loadImageAsset(src);
    if (asset) {
      cachedLogoAsset = asset;
      return asset;
    }
  }
  cachedLogoAsset = null;
  return null;
}

export function slipLogoImgHtml(): string {
  const primary = escapeAttr(SLIP_LOGO_SRC);
  const fallback = escapeAttr(SLIP_LOGO_FALLBACK);
  return `<img class="slip-logo" src="${primary}" alt="StylesNest" onerror="if(this.dataset.fallback!=='1'){this.dataset.fallback='1';this.src='${fallback}';}" />`;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
