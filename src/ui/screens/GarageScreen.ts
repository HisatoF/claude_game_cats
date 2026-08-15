import type { SceneRenderer } from '../../core/SceneManager';
import { soundManager } from '../../audio/SoundManager';
import { CHASSIS_LIST, getChassis } from '../../data/chassis';
import { WHEEL_LIST, getWheel } from '../../data/wheels';
import { WEAPON_LIST, getWeapon } from '../../data/weapons';
import type { AnyPart, PartCategory } from '../../data/types';
import { drawMachinePreview } from '../machinePreview';
import { computeBuildStats } from '../../core/buildStats';

const RARITY_LABEL: Record<string, string> = { common: 'COMMON', rare: 'RARE', epic: 'EPIC' };

export const GarageScreen: SceneRenderer = (root, ctx) => {
  const { state } = ctx;
  let activeTab: PartCategory = 'chassis';

  root.innerHTML = `
    <div class="screen garage-screen">
      <header class="garage-header">
        <div>
          <h2 class="screen-title">GARAGE</h2>
          <p class="screen-hint">パーツを選んでマシンを組み立てよう</p>
        </div>
        <button id="btn-battle" class="btn btn-primary btn-large">BATTLE&nbsp;▶</button>
      </header>
      <div class="garage-body">
        <div class="preview-panel">
          <canvas id="preview-canvas" width="360" height="240"></canvas>
          <div class="stats-panel" id="stats-panel"></div>
        </div>
        <div class="parts-panel">
          <div class="tabs" id="tabs">
            <button data-tab="chassis" class="tab-btn">車体 CHASSIS</button>
            <button data-tab="wheel" class="tab-btn">車輪 WHEEL</button>
            <button data-tab="weapon" class="tab-btn">武器 WEAPON</button>
          </div>
          <div class="equipped-weapons" id="equipped-weapons"></div>
          <div class="parts-list" id="parts-list"></div>
        </div>
      </div>
    </div>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>('#preview-canvas')!;
  const statsPanel = root.querySelector<HTMLElement>('#stats-panel')!;
  const partsList = root.querySelector<HTMLElement>('#parts-list')!;
  const equippedWeaponsEl = root.querySelector<HTMLElement>('#equipped-weapons')!;
  const tabsEl = root.querySelector<HTMLElement>('#tabs')!;
  const battleBtn = root.querySelector<HTMLButtonElement>('#btn-battle')!;

  function renderPreview(): void {
    const chassis = getChassis(state.build.chassisId);
    const wheel = getWheel(state.build.wheelId);
    const weapons = chassis.weaponMounts.map((_, i) => {
      const id = state.build.weaponIds[i];
      return id ? getWeapon(id) : null;
    });
    drawMachinePreview(canvas, chassis, wheel, weapons);
  }

  function renderStats(): void {
    const s = computeBuildStats(state.build);
    statsPanel.innerHTML = `
      <div class="stat-grid">
        <div class="stat-cell"><span class="stat-label">HP</span><span class="stat-value">${Math.round(s.hp)}</span></div>
        <div class="stat-cell"><span class="stat-label">ATK</span><span class="stat-value">${Math.round(s.attack)}</span></div>
        <div class="stat-cell"><span class="stat-label">DEF</span><span class="stat-value">${s.defensePct}%</span></div>
        <div class="stat-cell"><span class="stat-label">重量</span><span class="stat-value">${Math.round(s.weight)}</span></div>
        <div class="stat-cell"><span class="stat-label">速度</span><span class="stat-value">${s.speed.toFixed(1)}</span></div>
        <div class="stat-cell"><span class="stat-label">グリップ</span><span class="stat-value">${Math.round(s.grip * 100)}%</span></div>
      </div>
      <div class="stability-bar">
        <span class="stat-label">安定性</span>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.round(s.stability * 100)}%; background:${
          s.stability < 0.35 ? '#ff4c4c' : s.stability < 0.6 ? '#ffb347' : '#4cd137'
        }"></div></div>
      </div>
      ${s.warning ? `<p class="warning-text">${s.warning}</p>` : ''}
    `;
  }

  function renderEquippedWeapons(): void {
    const chassis = getChassis(state.build.chassisId);
    equippedWeaponsEl.innerHTML = `<p class="section-label">装備中の武器スロット (${state.build.weaponIds.length}/${chassis.weaponMounts.length})</p>`;
    const list = document.createElement('div');
    list.className = 'slot-list';
    chassis.weaponMounts.forEach((_, i) => {
      const id = state.build.weaponIds[i];
      const slot = document.createElement('div');
      slot.className = 'slot-chip' + (id ? '' : ' slot-empty');
      if (id) {
        const w = getWeapon(id);
        slot.innerHTML = `<span>${w.name}</span><button class="slot-remove" data-idx="${i}">✕</button>`;
      } else {
        slot.textContent = '空きスロット';
      }
      list.appendChild(slot);
    });
    equippedWeaponsEl.appendChild(list);

    equippedWeaponsEl.querySelectorAll<HTMLButtonElement>('.slot-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        state.build.weaponIds.splice(idx, 1);
        soundManager.play('ui-click');
        renderAll();
      });
    });
  }

  function isEquipped(part: AnyPart): boolean {
    if (part.category === 'chassis') return state.build.chassisId === part.id;
    if (part.category === 'wheel') return state.build.wheelId === part.id;
    return state.build.weaponIds.includes(part.id);
  }

  function selectPart(part: AnyPart): void {
    if (!state.isUnlocked(part.id)) return;
    soundManager.play('ui-click');

    if (part.category === 'chassis') {
      state.build.chassisId = part.id;
      const maxSlots = part.weaponMounts.length;
      if (state.build.weaponIds.length > maxSlots) {
        state.build.weaponIds = state.build.weaponIds.slice(0, maxSlots);
      }
    } else if (part.category === 'wheel') {
      state.build.wheelId = part.id;
    } else {
      const chassis = getChassis(state.build.chassisId);
      if (state.build.weaponIds.includes(part.id)) return;
      if (state.build.weaponIds.length >= chassis.weaponMounts.length) {
        flashMessage('スロットが満杯です。先に武器を外してください。');
        return;
      }
      state.build.weaponIds.push(part.id);
    }
    renderAll();
  }

  function flashMessage(msg: string): void {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  function partList(category: PartCategory): AnyPart[] {
    if (category === 'chassis') return CHASSIS_LIST;
    if (category === 'wheel') return WHEEL_LIST;
    return WEAPON_LIST;
  }

  function renderPartsList(): void {
    partsList.innerHTML = '';
    for (const part of partList(activeTab)) {
      const unlocked = state.isUnlocked(part.id);
      const equipped = isEquipped(part);
      const card = document.createElement('button');
      card.className = 'part-card' + (equipped ? ' equipped' : '') + (unlocked ? '' : ' locked');
      card.innerHTML = `
        <div class="part-card-head">
          <span class="part-name">${part.name}</span>
          <span class="rarity rarity-${part.rarity}">${RARITY_LABEL[part.rarity]}</span>
        </div>
        <p class="part-desc">${unlocked ? part.description : '???  未解放パーツ(バトルの報酬で獲得)'}</p>
        <div class="part-tags">${partTags(part)}</div>
      `;
      card.disabled = !unlocked;
      card.addEventListener('click', () => selectPart(part));
      partsList.appendChild(card);
    }
  }

  function partTags(part: AnyPart): string {
    if (part.category === 'chassis') {
      return `<span>HP ${part.hp}</span><span>重量 ${part.weight}</span><span>DEF ${Math.round(part.defense * 100)}%</span>`;
    }
    if (part.category === 'wheel') {
      return `<span>速度 ${part.maxSpeed}</span><span>グリップ ${Math.round(part.grip * 100)}%</span>`;
    }
    return `<span>ATK ${part.attack}</span><span>射程 ${part.range}</span><span>種別 ${weaponKindLabel(part.kind)}</span>`;
  }

  function weaponKindLabel(kind: string): string {
    switch (kind) {
      case 'melee':
        return '近接';
      case 'forward':
        return '前方射撃';
      case 'upward':
        return '上方攻撃';
      case 'area':
        return '範囲';
      default:
        return kind;
    }
  }

  function renderTabs(): void {
    tabsEl.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === activeTab);
    });
  }

  function renderAll(): void {
    renderPreview();
    renderStats();
    renderEquippedWeapons();
    renderPartsList();
    renderTabs();
  }

  const onTabClick = (e: Event) => {
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>('.tab-btn');
    if (!target) return;
    activeTab = target.dataset.tab as PartCategory;
    soundManager.play('ui-click');
    renderAll();
  };
  tabsEl.addEventListener('click', onTabClick);

  const onBattleClick = () => {
    soundManager.play('ui-click');
    ctx.goto('prep');
  };
  battleBtn.addEventListener('click', onBattleClick);

  renderAll();

  return () => {
    tabsEl.removeEventListener('click', onTabClick);
    battleBtn.removeEventListener('click', onBattleClick);
  };
};
