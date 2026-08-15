import type { SceneRenderer } from '../../core/SceneManager';
import { soundManager } from '../../audio/SoundManager';
import { getWeapon } from '../../data/weapons';
import { getChassis } from '../../data/chassis';
import { getWheel } from '../../data/wheels';
import type { AnyPart } from '../../data/types';

const REASON_LABEL: Record<string, string> = {
  ko: 'ノックアウト',
  flipped: '転倒KO',
  timeout: 'タイムアップ判定',
};

function findPart(id: string): AnyPart {
  try {
    return getWeapon(id);
  } catch {
    /* not a weapon */
  }
  try {
    return getChassis(id);
  } catch {
    /* not a chassis */
  }
  return getWheel(id);
}

export const ResultScreen: SceneRenderer = (root, ctx) => {
  const { state } = ctx;
  const battle = state.lastBattle;

  if (!battle) {
    root.innerHTML = `<div class="screen"><p>戦闘記録がありません。</p><button id="btn-garage" class="btn btn-primary">ガレージへ</button></div>`;
    root.querySelector('#btn-garage')!.addEventListener('click', () => ctx.goto('garage'));
    return;
  }

  const isVictory = battle.winner === 'player';
  const isDraw = battle.winner === 'draw';
  const bannerClass = isVictory ? 'victory' : isDraw ? 'draw' : 'defeat';
  const bannerText = isVictory ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT';
  const durationSec = (battle.durationMs / 1000).toFixed(1);
  const allCleared = battle.allCleared;
  const againLabel = allCleared ? 'チャンピオンにもう一度挑む' : isVictory ? '次の敵に挑む' : 'もう一度挑戦';

  root.innerHTML = `
    <div class="screen result-screen">
      <h2 class="result-banner ${bannerClass}">${bannerText}</h2>
      <p class="screen-hint">対戦相手: ${battle.opponentName} / 決着: ${REASON_LABEL[battle.reason]}</p>
      <div class="result-stats">
        <div class="stat-cell"><span class="stat-label">戦闘時間</span><span class="stat-value">${durationSec}秒</span></div>
        <div class="stat-cell"><span class="stat-label">与えたダメージ</span><span class="stat-value">${Math.round(battle.damageDealt)}</span></div>
        <div class="stat-cell"><span class="stat-label">受けたダメージ</span><span class="stat-value">${Math.round(battle.damageTaken)}</span></div>
      </div>
      <div class="reward-panel">
        <h3>報酬</h3>
        ${
          battle.rewardPartIds.length > 0
            ? `<div class="reward-list">${battle.rewardPartIds
                .map((id) => {
                  const part = findPart(id);
                  return `<div class="reward-chip">NEW: ${part.name}</div>`;
                })
                .join('')}</div>`
            : `<p class="screen-hint">${isVictory ? '新しいパーツはありませんでした。' : '勝利すると報酬パーツを獲得できます。'}</p>`
        }
      </div>
      ${allCleared ? `<p class="clear-message">全ての挑戦者を撃破しました!おめでとうございます!</p>` : ''}
      <div class="result-buttons">
        <button id="btn-garage" class="btn">ガレージでマシンを強化</button>
        <button id="btn-again" class="btn btn-primary btn-large">${againLabel}</button>
      </div>
    </div>
  `;

  const garageBtn = root.querySelector<HTMLButtonElement>('#btn-garage')!;
  const againBtn = root.querySelector<HTMLButtonElement>('#btn-again')!;
  const onGarage = () => {
    soundManager.play('ui-click');
    ctx.goto('garage');
  };
  const onAgain = () => {
    soundManager.play('ui-click');
    ctx.goto('prep');
  };
  garageBtn.addEventListener('click', onGarage);
  againBtn.addEventListener('click', onAgain);

  return () => {
    garageBtn.removeEventListener('click', onGarage);
    againBtn.removeEventListener('click', onAgain);
  };
};
