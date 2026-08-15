# GEAR BOUT (ギアバウト)

小型戦闘マシンを組み立て、物理演算による自動バトルを観戦するオリジナルゲームです。
CATS: Crash Arena Turbo Stars の「組み立てて戦わせる」というゲーム体験をコンセプトの参考にしていますが、
ゲーム名・キャラクター・パーツ名・UI・アート・数値等はすべてオリジナルです。

## 遊び方

1. ガレージで車体・車輪・武器を選んでマシンを組み立てる
2. BATTLE PREPARATION で相手を確認する
3. BATTLE で物理演算による自動戦闘を観戦する
4. 勝利すると新しいパーツを獲得し、マシンを強化してより強い敵に挑む

## 技術スタック

- [Vite](https://vitejs.dev/) + TypeScript
- [Matter.js](https://brm.io/matter-js/) (2D物理演算)
- Canvas 2D によるバトル描画
- WebAudio API による効果音合成(外部音声アセット不要)

フレームワークを使わず、DOM操作 + Canvas による軽量なシーン構成にしています。

## セットアップ

```bash
npm install
npm run dev       # 開発サーバー起動 (http://localhost:5173)
npm run build     # 本番ビルド
npm run typecheck # 型チェックのみ
```

## ディレクトリ構成

```
src/
  core/         GameState, SceneManager, ステータス計算
  data/         パーツ・敵データ(データ駆動設計)
  entities/     Machine(バトル中のマシンの実体)
  systems/      PhysicsSystem, CombatSystem, AISystem, RewardSystem
  battle/       BattleSimulator(物理+戦闘ループ), BattleRenderer(描画)
  ui/screens/   Title, Garage, BattlePrep, Battle, Result の各画面
  audio/        SoundManager(WebAudio合成SFX)
```

パーツ(車体・車輪・武器)や敵編成は `src/data/` にデータとして定義されており、
コードを変更せずに追加・調整できます。

## 物理システムについて

各マシンは Matter.js の複合ボディとして構築されます。車体パーツと武器パーツを
1つの剛体として結合しているため、武器の重量や搭載位置が実際の重心・慣性に影響し、
「武器を高い位置に積みすぎると転倒しやすくなる」といった駆け引きが自然に生まれます。
車輪は車体にピン拘束で接続され、モーターで角速度を制御することで走行します。
