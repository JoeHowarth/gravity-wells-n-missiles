import { Game } from './Game';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

canvas.width = 1200;
canvas.height = 800;

const game = new Game(canvas, ctx);

// Show controls on initial load
const overlay = document.getElementById('victory-overlay') as HTMLElement;
const message = document.getElementById('victory-message') as HTMLElement;
overlay.style.display = 'block';
message.textContent = 'Welcome to Gravity Wells & Missiles!';

document.getElementById('new-game-btn')?.addEventListener('click', () => {
    const overlay = document.getElementById('victory-overlay') as HTMLElement;
    overlay.style.display = 'none';
    game.reset();
});

game.start();