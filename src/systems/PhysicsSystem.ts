import Matter from 'matter-js';
import type { ChassisPart, WeaponPart, WheelPart } from '../data/types';
import { Machine, type Side } from '../entities/Machine';

const { Bodies, Body, Composite, Constraint } = Matter;

export const ARENA_WIDTH = 900;
export const ARENA_HEIGHT = 420;
export const GROUND_Y = 370;

export interface ArenaBodies {
  ground: Matter.Body;
  leftWall: Matter.Body;
  rightWall: Matter.Body;
}

export function createArena(world: Matter.World): ArenaBodies {
  const ground = Bodies.rectangle(ARENA_WIDTH / 2, GROUND_Y + 30, ARENA_WIDTH + 200, 60, {
    isStatic: true,
    friction: 0.9,
    label: 'ground',
  });
  const leftWall = Bodies.rectangle(-10, ARENA_HEIGHT / 2, 20, ARENA_HEIGHT * 2, {
    isStatic: true,
    label: 'wall',
  });
  const rightWall = Bodies.rectangle(ARENA_WIDTH + 10, ARENA_HEIGHT / 2, 20, ARENA_HEIGHT * 2, {
    isStatic: true,
    label: 'wall',
  });
  Composite.add(world, [ground, leftWall, rightWall]);
  return { ground, leftWall, rightWall };
}

export function buildMachine(params: {
  world: Matter.World;
  side: Side;
  name: string;
  chassisPart: ChassisPart;
  wheelPart: WheelPart;
  weaponParts: WeaponPart[];
  spawnX: number;
}): Machine {
  const { world, side, name, chassisPart, wheelPart, weaponParts, spawnX } = params;

  // 車輪が接地する高さでスポーンさせ、初期落下による暴れを抑える
  const wheelMountY = chassisPart.wheelMounts[0]?.y ?? chassisPart.size.height / 2;
  const spawnY = GROUND_Y - wheelPart.radius - wheelMountY;

  const group = Body.nextGroup(true);

  const chassisArea = chassisPart.size.width * chassisPart.size.height;
  const chassisDensity = chassisPart.weight / chassisArea;

  const chassisRect = Bodies.rectangle(
    spawnX,
    spawnY,
    chassisPart.size.width,
    chassisPart.size.height,
    {
      density: chassisDensity,
      friction: 0.4,
      frictionAir: 0.012,
      restitution: 0.05,
      collisionFilter: { group },
      label: `chassis-${side}`,
    },
  );

  // 武器を質量パーツとして追加(重心・慣性に反映)。当たり判定はセンサー化して
  // 実ダメージ判定はCombatSystemの距離計算で行う。
  const weaponParts_ = weaponParts.map((wp, i) => {
    const mount = chassisPart.weaponMounts[i] ?? { x: 0, y: 0 };
    const size = 14;
    const density = wp.weight / (size * size);
    return Bodies.rectangle(spawnX + mount.x, spawnY + mount.y, size, size, {
      density,
      isSensor: true,
      collisionFilter: { group },
      label: `weapon-${side}-${wp.id}`,
    });
  });

  // 注意: Body.create({parts}) は各パーツの絶対座標から複合ボディの重心を
  // 自動計算する。ここで位置を上書きすると重心とパーツの相対関係がずれて
  // 車輪の取り付け位置と実際の車体形状が食い違い、スポーン直後に転倒する
  // 不具合を招くため、位置の上書きは行わない。
  const chassisBody =
    weaponParts_.length > 0
      ? Body.create({ parts: [chassisRect, ...weaponParts_] })
      : chassisRect;

  Composite.add(world, chassisBody);

  const wheelBodies: Matter.Body[] = [];
  const constraints: Matter.Constraint[] = [];

  for (const mount of chassisPart.wheelMounts) {
    const wheelX = spawnX + mount.x;
    const wheelY = spawnY + mount.y;
    const wheelArea = Math.PI * wheelPart.radius * wheelPart.radius;
    const wheel = Bodies.circle(wheelX, wheelY, wheelPart.radius, {
      density: wheelPart.weight / wheelArea,
      friction: wheelPart.grip,
      frictionAir: 0.02,
      restitution: 0.02,
      collisionFilter: { group },
      label: `wheel-${side}`,
    });
    const constraint = Constraint.create({
      bodyA: chassisBody,
      pointA: { x: mount.x, y: mount.y },
      bodyB: wheel,
      pointB: { x: 0, y: 0 },
      length: 0,
      stiffness: 1,
      damping: 0.2,
    });
    wheelBodies.push(wheel);
    constraints.push(constraint);
  }

  Composite.add(world, wheelBodies);
  Composite.add(world, constraints);

  return new Machine({
    side,
    name,
    chassisPart,
    wheelPart,
    weaponParts,
    chassisBody,
    wheelBodies,
    constraints,
  });
}

/**
 * 車輪モーターを目標角速度に向けて滑らかに近づける。
 * 角加速度を物理的に妥当な範囲に制限することで、急激なトルクにより
 * 車体が宙返りしてしまう不具合を防いでいる。
 */
export function driveWheels(machine: Machine, moveDir: -1 | 0 | 1, deltaMs: number): void {
  const target = moveDir * machine.wheelPart.maxSpeed;
  const angularAccelPerSec = 3 + machine.wheelPart.torque * 60;
  const deltaLimit = angularAccelPerSec * (deltaMs / 1000);
  for (const wheel of machine.wheelBodies) {
    const diff = target - wheel.angularVelocity;
    const step = Math.sign(diff) * Math.min(Math.abs(diff), deltaLimit);
    Body.setAngularVelocity(wheel, wheel.angularVelocity + step);
  }
}
