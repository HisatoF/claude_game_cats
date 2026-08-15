import type { GameState } from './GameState';

export type SceneName = 'title' | 'garage' | 'prep' | 'battle' | 'result';

export interface SceneContext {
  state: GameState;
  goto: (scene: SceneName) => void;
}

export type SceneRenderer = (root: HTMLElement, ctx: SceneContext) => void | (() => void);

export class SceneManager {
  private cleanup: (() => void) | void = undefined;

  constructor(
    private root: HTMLElement,
    private state: GameState,
    private scenes: Record<SceneName, SceneRenderer>,
  ) {}

  goto(name: SceneName): void {
    if (this.cleanup) this.cleanup();
    this.root.innerHTML = '';
    const ctx: SceneContext = { state: this.state, goto: (n) => this.goto(n) };
    this.cleanup = this.scenes[name](this.root, ctx);
  }
}
