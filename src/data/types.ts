// 共通のパーツデータ構造定義。
// ゲームロジックとデータを分離し、後からパーツを追加しやすくするための型。

export type PartCategory = 'chassis' | 'wheel' | 'weapon';

export type Rarity = 'common' | 'rare' | 'epic';

export type WeaponKind = 'melee' | 'forward' | 'upward' | 'area';

export interface PartBase {
  id: string;
  name: string;
  category: PartCategory;
  rarity: Rarity;
  cost: number;
  weight: number; // kg相当。重心・慣性計算に影響。
  description: string;
}

export interface ChassisPart extends PartBase {
  category: 'chassis';
  hp: number;
  defense: number; // 被ダメージ軽減率(0-1)
  /** 車体の当たり判定サイズ (px) */
  size: { width: number; height: number };
  /** 車輪の取り付けオフセット(車体中心からの相対座標) */
  wheelMounts: { x: number; y: number }[];
  /** 武器の取り付けオフセット */
  weaponMounts: { x: number; y: number }[];
  /** 重心オフセット。プラスで前寄り、マイナスで後ろ寄り(転倒しやすさに影響) */
  centerOfMassBias: number;
}

export interface WheelPart extends PartBase {
  category: 'wheel';
  radius: number;
  /** 駆動力(加速性能) */
  torque: number;
  /** 最大回転速度(=最高速) */
  maxSpeed: number;
  /** 接地グリップ。高いほど転倒しにくく安定する */
  grip: number;
}

export interface WeaponPart extends PartBase {
  category: 'weapon';
  kind: WeaponKind;
  attack: number;
  /** 攻撃間隔(ms) */
  cooldown: number;
  /** 有効射程(px)。melee/upwardは近距離、forwardは中距離、areaは自身中心の半径 */
  range: number;
  /** ノックバックの力積(質量で割った分だけ相手の速度が変化する) */
  knockback: number;
  /** 反動の力積。自分自身にも逆方向に作用し、姿勢を崩す原因になる */
  recoil: number;
}

export type AnyPart = ChassisPart | WheelPart | WeaponPart;

export interface MachineBuild {
  chassisId: string;
  wheelId: string;
  weaponIds: string[]; // weaponMounts数まで
}
