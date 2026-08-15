import './style.css';
import { GameState } from './core/GameState';
import { SceneManager } from './core/SceneManager';
import { TitleScreen } from './ui/screens/TitleScreen';
import { GarageScreen } from './ui/screens/GarageScreen';
import { BattlePrepScreen } from './ui/screens/BattlePrepScreen';
import { BattleScreen } from './ui/screens/BattleScreen';
import { ResultScreen } from './ui/screens/ResultScreen';

const root = document.getElementById('app');
if (!root) throw new Error('#app root element not found');

const state = new GameState();

const sceneManager = new SceneManager(root, state, {
  title: TitleScreen,
  garage: GarageScreen,
  prep: BattlePrepScreen,
  battle: BattleScreen,
  result: ResultScreen,
});

sceneManager.goto('title');
