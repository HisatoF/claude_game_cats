import Matter from 'matter-js';
import type { MachineBuild } from '../data/types';
import { getChassis } from '../data/chassis';
import { getWheel } from '../data/wheels';
import { getWeapon } from '../data/weapons';
import { ARENA_WIDTH, buildMachine, createArena, driveWheels } from '../systems/PhysicsSystem';
import { decideMovement } from '../systems/AISystem';
import { drainEvents, resolveAttacks, updateCooldowns, updateFlipState } from '../systems/CombatSystem';
import { Machine, type MachineCombatEvent } from '../entities/Machine';

const { Engine, World } = Matter;

export const BATTLE_TIME_LIMIT_MS = 60_000;

export type BattleWinner = 'player' | 'cpu' | 'draw';

export interface BattleResult {
  winner: BattleWinner;
  reason: 'ko' | 'flipped' | 'timeout';
  durationMs: number;
  playerDamageDealt: number;
  playerDamageTaken: number;
}

export interface BattleFrameEvent {
  side: 'player' | 'cpu';
  event: MachineCombatEvent;
}

export class BattleSimulator {
  readonly engine: Matter.Engine;
  readonly player: Machine;
  readonly cpu: Machine;
  readonly playerAggressiveness: number;
  readonly cpuAggressiveness: number;

  elapsedMs = 0;
  result: BattleResult | null = null;

  constructor(params: {
    playerBuild: MachineBuild;
    cpuBuild: MachineBuild;
    cpuAggressiveness: number;
    playerAggressiveness?: number;
    playerName?: string;
    cpuName?: string;
  }) {
    this.engine = Engine.create();
    this.engine.gravity.y = 1;
    createArena(this.engine.world);

    this.player = this.spawn('player', params.playerBuild, ARENA_WIDTH * 0.22, params.playerName ?? 'あなたのマシン');
    this.cpu = this.spawn('cpu', params.cpuBuild, ARENA_WIDTH * 0.78, params.cpuName ?? 'CPUマシン');

    this.playerAggressiveness = params.playerAggressiveness ?? 0.6;
    this.cpuAggressiveness = params.cpuAggressiveness;
  }

  private spawn(side: 'player' | 'cpu', build: MachineBuild, spawnX: number, name: string): Machine {
    const chassisPart = getChassis(build.chassisId);
    const wheelPart = getWheel(build.wheelId);
    const weaponParts = build.weaponIds.map((id) => getWeapon(id));
    return buildMachine({
      world: this.engine.world,
      side,
      name,
      chassisPart,
      wheelPart,
      weaponParts,
      spawnX,
    });
  }

  /** 1フレーム進める。戻り値は今フレームで発生したイベント一覧。 */
  step(deltaMs: number): BattleFrameEvent[] {
    if (this.result) return [];

    const clamped = Math.min(deltaMs, 34);
    this.elapsedMs += clamped;

    updateCooldowns(this.player, clamped);
    updateCooldowns(this.cpu, clamped);

    const playerMove = decideMovement(this.player, this.cpu, this.playerAggressiveness);
    const cpuMove = decideMovement(this.cpu, this.player, this.cpuAggressiveness);
    driveWheels(this.player, playerMove, clamped);
    driveWheels(this.cpu, cpuMove, clamped);

    resolveAttacks(this.player, this.cpu);
    resolveAttacks(this.cpu, this.player);

    Engine.update(this.engine, clamped);

    updateFlipState(this.player, clamped);
    updateFlipState(this.cpu, clamped);

    const events: BattleFrameEvent[] = [
      ...drainEvents(this.player).map((event) => ({ side: 'player' as const, event })),
      ...drainEvents(this.cpu).map((event) => ({ side: 'cpu' as const, event })),
    ];

    this.evaluateEnd();

    return events;
  }

  private evaluateEnd(): void {
    if (this.result) return;

    if (this.cpu.isDestroyed || this.player.isDestroyed) {
      const playerLost = this.player.isDestroyed;
      const cpuLost = this.cpu.isDestroyed;
      let winner: BattleWinner = 'draw';
      if (playerLost && !cpuLost) winner = 'cpu';
      else if (cpuLost && !playerLost) winner = 'player';

      const reason = (playerLost ? this.player.destroyedReason : this.cpu.destroyedReason) ?? 'ko';
      this.finish(winner, reason);
      return;
    }

    if (this.elapsedMs >= BATTLE_TIME_LIMIT_MS) {
      const playerRatio = this.player.hp / this.player.maxHp;
      const cpuRatio = this.cpu.hp / this.cpu.maxHp;
      let winner: BattleWinner = 'draw';
      if (playerRatio > cpuRatio) winner = 'player';
      else if (cpuRatio > playerRatio) winner = 'cpu';
      this.finish(winner, 'timeout');
    }
  }

  private finish(winner: BattleWinner, reason: BattleResult['reason']): void {
    this.result = {
      winner,
      reason,
      durationMs: this.elapsedMs,
      playerDamageDealt: this.player.damageDealt,
      playerDamageTaken: this.player.damageTaken,
    };
  }

  destroy(): void {
    World.clear(this.engine.world, false);
    Engine.clear(this.engine);
  }
}
