import type { SceneRenderer } from '../../core/SceneManager';
import { BattleSimulator } from '../../battle/BattleSimulator';
import { BattleRenderer } from '../../battle/BattleRenderer';
import { soundManager, soundForWeaponKind } from '../../audio/SoundManager';
import { grantVictoryRewards } from '../../systems/RewardSystem';

export const BattleScreen: SceneRenderer = (root, ctx) => {
  const { state } = ctx;
  const opponent = state.currentOpponent();

  root.innerHTML = `
    <div class="screen battle-screen">
      <div class="battle-canvas-wrap">
        <canvas id="battle-canvas"></canvas>
        <div id="ready-overlay" class="ready-overlay">READY</div>
      </div>
    </div>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>('#battle-canvas')!;
  const overlay = root.querySelector<HTMLElement>('#ready-overlay')!;

  const sim = new BattleSimulator({
    playerBuild: state.build,
    cpuBuild: opponent.build,
    cpuAggressiveness: opponent.aggressiveness,
    playerName: 'あなたのマシン',
    cpuName: opponent.name,
  });
  const renderer = new BattleRenderer(canvas);

  let rafId = 0;
  let started = false;
  let lastTime = performance.now();
  let finishedAt: number | null = null;
  let navigated = false;
  const timers: number[] = [];

  soundManager.play('battle-start');

  timers.push(
    window.setTimeout(() => {
      overlay.textContent = 'FIGHT!';
      timers.push(
        window.setTimeout(() => {
          overlay.classList.add('hidden');
          started = true;
        }, 500),
      );
    }, 700),
  );

  function handleResult(): void {
    const result = sim.result;
    if (!result) return;
    let rewardIds: string[] = [];
    let allCleared = false;
    if (result.winner === 'player') {
      soundManager.play('victory');
      const outcome = grantVictoryRewards(state, opponent);
      rewardIds = outcome.newlyUnlocked;
      state.wins += 1;
      // 倒した相手がロースター最後の1体だったかどうかは、opponentIndexを
      // 進める前に判定する必要がある(進めた後だと「次の相手」基準の判定に
      // なってしまい、最終ボス撃破の1戦前で誤ってクリア扱いになる)。
      allCleared = !state.hasNextOpponent();
      state.advanceOpponent();
    } else {
      soundManager.play('defeat');
    }
    state.lastBattle = {
      winner: result.winner,
      reason: result.reason,
      durationMs: result.durationMs,
      damageDealt: result.playerDamageDealt,
      damageTaken: result.playerDamageTaken,
      rewardPartIds: rewardIds,
      opponentName: opponent.name,
      allCleared,
    };
    timers.push(
      window.setTimeout(() => {
        navigated = true;
        ctx.goto('result');
      }, 1600),
    );
  }

  function loop(now: number): void {
    const dt = now - lastTime;
    lastTime = now;

    if (started && !sim.result) {
      const events = sim.step(dt);
      for (const { event } of events) {
        if (event.type === 'attack-fire') soundManager.play(soundForWeaponKind(event.kind));
        if (event.type === 'hit') soundManager.play('hit');
        if (event.type === 'ko') soundManager.play('explosion');
      }
      renderer.pushEvents(events, now);
    }

    renderer.render(sim, now);

    if (sim.result && finishedAt === null) {
      finishedAt = now;
      handleResult();
    }

    if (!navigated) {
      rafId = requestAnimationFrame(loop);
    }
  }
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId);
    timers.forEach((t) => window.clearTimeout(t));
    sim.destroy();
  };
};
