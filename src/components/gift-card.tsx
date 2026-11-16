import { BRAND_NAME } from "@/components/brand";
import { locale, useI18n } from "@/i18n";

export type Gift = {
  code: string;
  from_name: string;
  to_name: string;
  message: string;
  expires_at: string;
};

export const giftUrl = (code: string) => `https://tubodaenorden.com/regalo/${code}`;

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat(locale(), { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

/** La tarjeta tal como se ve en la web. */
export function GiftCard({ gift }: { gift: Gift }) {
  const { t } = useI18n();
  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] bg-panel p-8 text-center shadow-[0_24px_60px_-30px_rgba(120,60,70,0.45)] ring-1 ring-clay/50 sm:p-10">
      {/* Lazo: una cinta vertical y otra horizontal que se cruzan arriba */}
      <span className="pointer-events-none absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 bg-clay/35" aria-hidden />
      <span className="pointer-events-none absolute inset-x-0 top-16 h-5 bg-clay/35" aria-hidden />
      <div className="relative mx-auto grid size-16 place-items-center rounded-full bg-background text-3xl ring-4 ring-clay">🎁</div>

      <div className="relative mt-6 rounded-2xl bg-panel/95 px-2 py-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-clay-ink">{t("Tarjeta regalo")}</p>
        <p className="mt-2 font-brand text-4xl leading-none">{BRAND_NAME}</p>
        <p className="mt-6 font-display text-3xl leading-tight">{t("Para {name}", { name: gift.to_name })}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("De parte de {name}", { name: gift.from_name })}</p>
        {gift.message && (
          <p className="mx-auto mt-5 max-w-xs whitespace-pre-line font-display text-lg italic leading-snug">“{gift.message}”</p>
        )}
        <p className="mt-6 text-sm">{t("El plan completo para organizar vuestra boda.")}</p>
        <p className="mt-5 inline-block rounded-xl border border-dashed border-clay-ink/50 bg-background px-4 py-2 font-mono text-sm tracking-[0.12em]">
          {gift.code}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("Válida hasta el {date} · un solo uso", { date: fmtDate(gift.expires_at) })}
        </p>
      </div>
    </div>
  );
}

/**
 * Dibuja la tarjeta en una imagen PNG de 1080 × 1350 (formato vertical, bueno para imprimir o mandar por WhatsApp)
 * y la descarga.
 */
export async function downloadGiftCard(gift: Gift, t: (k: string, v?: Record<string, string | number>) => string) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d");
  if (!c) return;
  try {
    await Promise.all([
      document.fonts.load('64px "Hurricane"'),
      document.fonts.load('600 64px "Cormorant Garamond"'),
      document.fonts.load('italic 40px "Cormorant Garamond"'),
      document.fonts.load('28px "JetBrains Mono"'),
      document.fonts.load('28px "Inter"'),
    ]);
  } catch {
    /* si no cargan, se usan las de sistema */
  }

  const cream = "#f6efe0";
  const paper = "#fcf8ef";
  const ink = "#2e2620";
  const muted = "#7a6f68";
  const clay = "#ecbcc0";
  const clayInk = "#a8506a";

  c.fillStyle = cream;
  c.fillRect(0, 0, W, H);
  // Tarjeta
  const r = 56;
  const x = 70;
  const y = 70;
  const w = W - 140;
  const h = H - 140;
  c.fillStyle = paper;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
  c.strokeStyle = clay;
  c.lineWidth = 4;
  c.stroke();
  // Lazo
  c.save();
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.clip();
  c.fillStyle = "rgba(236,188,192,0.45)";
  c.fillRect(W / 2 - 18, y, 36, h);
  c.fillRect(x, 230, w, 36);
  c.restore();
  // Círculo con el regalo
  c.fillStyle = cream;
  c.beginPath();
  c.arc(W / 2, 248, 70, 0, Math.PI * 2);
  c.fill();
  c.lineWidth = 10;
  c.strokeStyle = clay;
  c.stroke();
  c.font = '64px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("🎁", W / 2, 252);

  // Fondo para los textos (que la cinta no los tape)
  c.fillStyle = "rgba(252,248,239,0.94)";
  c.beginPath();
  c.roundRect(150, 360, W - 300, 860, 40);
  c.fill();

  const center = (text: string, yy: number, font: string, color: string) => {
    c.font = font;
    c.fillStyle = color;
    c.fillText(text, W / 2, yy);
  };
  const wrap = (text: string, yy: number, font: string, color: string, maxW: number, lh: number, maxLines = 4) => {
    c.font = font;
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (c.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach((l, i) => center(l, yy + i * lh, font, color));
    return Math.min(lines.length, maxLines) * lh;
  };

  c.letterSpacing = "8px";
  center(t("Tarjeta regalo").toUpperCase(), 420, '24px "JetBrains Mono", monospace', clayInk);
  c.letterSpacing = "0px";
  center(BRAND_NAME, 510, '96px "Hurricane", cursive', ink);
  let yy = 640;
  yy += wrap(t("Para {name}", { name: gift.to_name }), yy, '600 64px "Cormorant Garamond", serif', ink, 760, 72, 2);
  center(t("De parte de {name}", { name: gift.from_name }), yy + 10, '30px "Inter", sans-serif', muted);
  yy += 80;
  if (gift.message) yy += wrap(`“${gift.message}”`, yy + 20, 'italic 40px "Cormorant Garamond", serif', ink, 740, 50, 4) + 30;
  center(t("El plan completo para organizar vuestra boda."), Math.max(yy + 30, 960), '30px "Inter", sans-serif', ink);

  // Código
  const codeY = 1070;
  c.setLineDash([10, 8]);
  c.strokeStyle = clayInk;
  c.lineWidth = 2;
  c.beginPath();
  c.roundRect(W / 2 - 250, codeY - 42, 500, 84, 22);
  c.stroke();
  c.setLineDash([]);
  center(gift.code, codeY, '600 36px "JetBrains Mono", monospace', ink);
  center(t("Válida hasta el {date} · un solo uso", { date: fmtDate(gift.expires_at) }), 1150, '24px "Inter", sans-serif', muted);
  center(`tubodaenorden.com/regalo/${gift.code}`, 1190, '24px "JetBrains Mono", monospace', clayInk);

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `regalo-tu-boda-en-orden-${gift.code}.png`;
  a.click();
}
