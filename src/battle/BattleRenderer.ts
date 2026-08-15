import type { Machine, MachineCombatEvent } from '../entities/Machine';
import { ARENA_HEIGHT, ARENA_WIDTH, GROUND_Y } from '../systems/PhysicsSystem';
import type { BattleFrameEvent, BattleSimulator } from './BattleSimulator';

interface Effect {
  x: number;
  y: number;
  createdAt: number;
  ttl: number;
  kind: 'hit' | 'ko' | 'fire' | 'flip';
  color: string;
}

const SIDE_COLOR: Record<'player' | 'cpu', { body: string; accent: string }> = {
  player: { body: '#3fd4e0', accent: '#0b5560' },
  cpu: { body: '#ff8a4c', accent: '#7a3110' },
};

export class BattleRenderer {
  private ctx: CanvasRenderingContext2D;
  private effects: Effect[] = [];

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = ARENA_WIDTH;
    canvas.height = ARENA_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context not available');
    this.ctx = ctx;
  }

  pushEvents(events: BattleFrameEvent[], now: number): void {
    for (const { side, event } of events) {
      this.addEffect(side, event, now);
    }
  }

  private addEffect(side: 'player' | 'cpu', event: MachineCombatEvent, now: number): void {
    if (event.type === 'hit') {
      this.effects.push({ x: event.x, y: event.y, createdAt: now, ttl: 260, kind: 'hit', color: '#fff35c' });
    } else if (event.type === 'ko') {
      this.effects.push({
        x: side === 'player' ? ARENA_WIDTH * 0.22 : ARENA_WIDTH * 0.78,
        y: GROUND_Y - 60,
        createdAt: now,
        ttl: 900,
        kind: 'ko',
        color: '#ff4c4c',
      });
    }
  }

  render(sim: BattleSimulator, now: number): void {
    const { ctx } = this;
    this.drawBackground();
    this.drawArena();
    this.drawMachine(sim.player, now);
    this.drawMachine(sim.cpu, now);
    this.drawEffects(now);
    this.drawHud(sim);
    ctx.restore?.();
  }

  private drawBackground(): void {
    const { ctx } = this;
    const grad = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
    grad.addColorStop(0, '#1b1042');
    grad.addColorStop(1, '#3a1f66');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < ARENA_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GROUND_Y);
      ctx.stroke();
    }
  }

  private drawArena(): void {
    const { ctx } = this;
    ctx.fillStyle = '#241247';
    ctx.fillRect(0, GROUND_Y, ARENA_WIDTH, ARENA_HEIGHT - GROUND_Y);

    const grad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 14);
    grad.addColorStop(0, '#ff5fd1');
    grad.addColorStop(1, '#3a1f66');
    ctx.fillStyle = grad;
    ctx.fillRect(0, GROUND_Y, ARENA_WIDTH, 6);

    ctx.strokeStyle = 'rgba(63,212,224,0.6)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, ARENA_WIDTH - 4, ARENA_HEIGHT - 4);
  }

  private drawMachine(machine: Machine, now: number): void {
    const { ctx } = this;
    if (machine.isDestroyed && machine.destroyedReason === 'ko') {
      // KO後も残骸として少し描画するが半透明に
      ctx.globalAlpha = 0.4;
    }
    const colors = SIDE_COLOR[machine.side];
    const facing = machine.side === 'player' ? 1 : -1;

    // 車輪
    for (const wheel of machine.wheelBodies) {
      ctx.save();
      ctx.translate(wheel.position.x, wheel.position.y);
      ctx.rotate(wheel.angle);
      ctx.fillStyle = '#1a1a24';
      ctx.beginPath();
      ctx.arc(0, 0, machine.wheelPart.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = '#ffffff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(machine.wheelPart.radius - 2, 0);
      ctx.stroke();
      ctx.restore();
    }

    // 車体
    ctx.save();
    ctx.translate(machine.chassisBody.position.x, machine.chassisBody.position.y);
    ctx.rotate(machine.chassisBody.angle);
    const w = machine.chassisPart.size.width;
    const h = machine.chassisPart.size.height;
    const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    grad.addColorStop(0, colors.body);
    grad.addColorStop(1, colors.accent);
    ctx.fillStyle = grad;
    roundedRect(ctx, -w / 2, -h / 2, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = '#ffffffaa';
    ctx.lineWidth = 2;
    ctx.stroke();

    // コックピット(進行方向を示す)
    ctx.fillStyle = '#ffffffcc';
    ctx.beginPath();
    ctx.ellipse((w / 2 - 10) * facing, -h * 0.1, w * 0.14, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 武器
    for (const weapon of machine.weapons) {
      const pos = machine.weaponWorldPosition(weapon.mount);
      this.drawWeaponIcon(pos, weapon.part.kind, machine.chassisBody.angle, facing, colors, weapon.cooldownRemaining, now);
    }

    ctx.globalAlpha = 1;

    // 転倒警告
    if (machine.flippedTimer > 400) {
      ctx.fillStyle = '#ff4c4c';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('転倒中!', machine.chassisBody.position.x, machine.chassisBody.position.y - 50);
    }
  }

  private drawWeaponIcon(
    pos: { x: number; y: number },
    kind: string,
    bodyAngle: number,
    facing: number,
    colors: { body: string; accent: string },
    cooldownRemaining: number,
    now: number,
  ): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(bodyAngle);
    const ready = cooldownRemaining <= 0;
    ctx.fillStyle = ready ? '#ffffff' : 'rgba(255,255,255,0.35)';
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;

    if (kind === 'melee') {
      ctx.beginPath();
      ctx.moveTo(6 * facing, 0);
      ctx.lineTo(-6 * facing, -8);
      ctx.lineTo(-6 * facing, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (kind === 'forward') {
      ctx.fillRect(-4, -4, 14 * facing, 8);
      ctx.strokeRect(-4, -4, 14 * facing, 8);
    } else if (kind === 'upward') {
      ctx.fillRect(-5, -14, 10, 14);
      ctx.strokeRect(-5, -14, 10, 14);
    } else if (kind === 'area') {
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    void now;
  }

  private drawEffects(now: number): void {
    const { ctx } = this;
    this.effects = this.effects.filter((e) => now - e.createdAt < e.ttl);
    for (const e of this.effects) {
      const t = (now - e.createdAt) / e.ttl;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = e.kind === 'ko' ? 4 : 3;
      ctx.beginPath();
      const radius = e.kind === 'ko' ? 20 + t * 60 : 6 + t * 26;
      ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawHud(sim: BattleSimulator): void {
    this.drawHpBar(sim.player, 24, 20, 'left');
    this.drawHpBar(sim.cpu, ARENA_WIDTH - 24, 20, 'right');

    const { ctx } = this;
    const remainingSec = Math.max(0, Math.ceil((60_000 - sim.elapsedMs) / 1000));
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(remainingSec), ARENA_WIDTH / 2, 34);
  }

  private drawHpBar(machine: Machine, x: number, y: number, align: 'left' | 'right'): void {
    const { ctx } = this;
    const barWidth = 260;
    const ratio = Math.max(0, machine.hp / machine.maxHp);
    const originX = align === 'left' ? x : x - barWidth;

    ctx.textAlign = align;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(machine.name, align === 'left' ? x : x, y - 6);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(originX, y, barWidth, 14);

    const hue = ratio > 0.5 ? 140 : ratio > 0.2 ? 45 : 0;
    ctx.fillStyle = `hsl(${hue}, 85%, 55%)`;
    const fillWidth = barWidth * ratio;
    ctx.fillRect(align === 'left' ? originX : originX + (barWidth - fillWidth), y, fillWidth, 14);

    ctx.strokeStyle = '#ffffffaa';
    ctx.lineWidth = 2;
    ctx.strokeRect(originX, y, barWidth, 14);
  }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
