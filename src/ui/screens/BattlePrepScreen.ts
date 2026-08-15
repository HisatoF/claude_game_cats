import type { SceneRenderer } from '../../core/SceneManager';
import { soundManager } from '../../audio/SoundManager';
import { getChassis } from '../../data/chassis';
import { getWheel } from '../../data/wheels';
import { getWeapon } from '../../data/weapons';
import { drawMachinePreview } from '../machinePreview';
import { computeBuildStats } from '../../core/buildStats';

export const BattlePrepScreen: SceneRenderer = (root, ctx) => {
  const { state } = ctx;
  const opponent = state.currentOpponent();

  root.innerHTML = `
    <div class="screen prep-screen">
      <h2 class="screen-title">BATTLE PREPARATION</h2>
      <p class="screen-hint">第${state.opponentIndex + 1}戦: ${opponent.name}</p>
      <div class="vs-panel">
        <div class="vs-side">
          <h3>あなたのマシン</h3>
          <canvas id="player-canvas" width="300" height="200"></canvas>
          <div id="player-stats" class="mini-stats"></div>
        </div>
        <div class="vs-mark">VS</div>
        <div class="vs-side">
          <h3>${opponent.name}</h3>
          <canvas id="cpu-canvas" width="300" height="200"></canvas>
          <div id="cpu-stats" class="mini-stats"></div>
          <p class="opponent-desc">${opponent.description}</p>
        </div>
      </div>
      <div class="prep-buttons">
        <button id="btn-back" class="btn">ガレージへ戻る</button>
        <button id="btn-fight" class="btn btn-primary btn-large">BATTLE&nbsp;開始</button>
      </div>
    </div>
  `;

  const playerCanvas = root.querySelector<HTMLCanvasElement>('#player-canvas')!;
  const cpuCanvas = root.querySelector<HTMLCanvasElement>('#cpu-canvas')!;

  const pChassis = getChassis(state.build.chassisId);
  const pWheel = getWheel(state.build.wheelId);
  const pWeapons = pChassis.weaponMounts.map((_, i) => (state.build.weaponIds[i] ? getWeapon(state.build.weaponIds[i]) : null));
  drawMachinePreview(playerCanvas, pChassis, pWheel, pWeapons);

  const cChassis = getChassis(opponent.build.chassisId);
  const cWheel = getWheel(opponent.build.wheelId);
  const cWeapons = cChassis.weaponMounts.map((_, i) => (opponent.build.weaponIds[i] ? getWeapon(opponent.build.weaponIds[i]) : null));
  drawMachinePreview(cpuCanvas, cChassis, cWheel, cWeapons);

  const pStats = computeBuildStats(state.build);
  const cStats = computeBuildStats(opponent.build);
  root.querySelector('#player-stats')!.innerHTML = statsHtml(pStats);
  root.querySelector('#cpu-stats')!.innerHTML = statsHtml(cStats);

  function statsHtml(s: ReturnType<typeof computeBuildStats>): string {
    return `
      <span>HP ${Math.round(s.hp)}</span>
      <span>ATK ${Math.round(s.attack)}</span>
      <span>DEF ${s.defensePct}%</span>
      <span>重量 ${Math.round(s.weight)}</span>
    `;
  }

  const backBtn = root.querySelector<HTMLButtonElement>('#btn-back')!;
  const fightBtn = root.querySelector<HTMLButtonElement>('#btn-fight')!;
  const onBack = () => {
    soundManager.play('ui-click');
    ctx.goto('garage');
  };
  const onFight = () => {
    soundManager.play('ui-click');
    ctx.goto('battle');
  };
  backBtn.addEventListener('click', onBack);
  fightBtn.addEventListener('click', onFight);

  return () => {
    backBtn.removeEventListener('click', onBack);
    fightBtn.removeEventListener('click', onFight);
  };
};
