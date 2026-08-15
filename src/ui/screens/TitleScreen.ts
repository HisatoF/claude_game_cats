import type { SceneRenderer } from '../../core/SceneManager';
import { soundManager } from '../../audio/SoundManager';

export const TitleScreen: SceneRenderer = (root, ctx) => {
  root.innerHTML = `
    <div class="screen title-screen">
      <div class="title-glow"></div>
      <h1 class="game-title">GEAR BOUT</h1>
      <p class="game-subtitle">組み立てて、放て、観戦せよ。</p>
      <p class="game-tagline">自分だけの小型戦闘マシンを組み、物理演算バトルで勝ち抜こう。</p>
      <div class="title-buttons">
        <button id="btn-start" class="btn btn-primary btn-large">ガレージへ</button>
      </div>
      <p class="title-footnote">GEAR BOUT はオリジナル作品です。</p>
    </div>
  `;

  const btn = root.querySelector<HTMLButtonElement>('#btn-start')!;
  const onClick = () => {
    soundManager.play('ui-click');
    ctx.goto('garage');
  };
  btn.addEventListener('click', onClick);

  return () => {
    btn.removeEventListener('click', onClick);
  };
};
