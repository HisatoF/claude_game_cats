import type { ChassisPart, WeaponPart, WheelPart } from '../data/types';

const SIDE_BODY = '#3fd4e0';
const SIDE_ACCENT = '#0b5560';

/** ガレージ画面等で使う静止状態のマシンプレビュー描画(物理演算なし) */
export function drawMachinePreview(
  canvas: HTMLCanvasElement,
  chassisPart: ChassisPart,
  wheelPart: WheelPart,
  weaponParts: (WeaponPart | null)[],
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const scale = Math.min((w * 0.6) / chassisPart.size.width, (h * 0.5) / chassisPart.size.height, 2.6);
  const cx = w / 2;
  const groundY = h * 0.72;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.moveTo(w * 0.1, groundY + wheelPart.radius * scale);
  ctx.lineTo(w * 0.9, groundY + wheelPart.radius * scale);
  ctx.stroke();

  ctx.translate(cx, groundY);
  ctx.scale(scale, scale);

  // 車輪
  ctx.fillStyle = '#1a1a24';
  for (const mount of chassisPart.wheelMounts) {
    ctx.beginPath();
    ctx.arc(mount.x, mount.y, wheelPart.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = SIDE_ACCENT;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 車体
  const cw = chassisPart.size.width;
  const ch = chassisPart.size.height;
  const grad = ctx.createLinearGradient(0, -ch / 2, 0, ch / 2);
  grad.addColorStop(0, SIDE_BODY);
  grad.addColorStop(1, SIDE_ACCENT);
  ctx.fillStyle = grad;
  ctx.beginPath();
  const r = 4;
  ctx.moveTo(-cw / 2 + r, -ch / 2);
  ctx.arcTo(cw / 2, -ch / 2, cw / 2, ch / 2, r);
  ctx.arcTo(cw / 2, ch / 2, -cw / 2, ch / 2, r);
  ctx.arcTo(-cw / 2, ch / 2, -cw / 2, -ch / 2, r);
  ctx.arcTo(-cw / 2, -ch / 2, cw / 2, -ch / 2, r);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffffaa';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffffcc';
  ctx.beginPath();
  ctx.ellipse(cw / 2 - 10, -ch * 0.1, cw * 0.14, ch * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // 武器
  chassisPart.weaponMounts.forEach((mount, i) => {
    const weapon = weaponParts[i];
    if (!weapon) return;
    ctx.save();
    ctx.translate(mount.x, mount.y);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = SIDE_ACCENT;
    ctx.lineWidth = 1.5;
    if (weapon.kind === 'melee') {
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -7);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (weapon.kind === 'forward') {
      ctx.fillRect(-3, -4, 16, 8);
      ctx.strokeRect(-3, -4, 16, 8);
    } else if (weapon.kind === 'upward') {
      ctx.fillRect(-5, -16, 10, 16);
      ctx.strokeRect(-5, -16, 10, 16);
    } else if (weapon.kind === 'area') {
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });

  ctx.restore();
}
