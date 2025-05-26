import { Game } from './Game';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Set canvas to full window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Initial resize
resizeCanvas();

// Handle window resize
window.addEventListener('resize', resizeCanvas);

const game = new Game(canvas, ctx);

// Show controls on initial load
const overlay = document.getElementById('victory-overlay') as HTMLElement;
const message = document.getElementById('victory-message') as HTMLElement;
overlay.style.display = 'block';
message.textContent = 'Welcome to Gravity Wells & Missiles!';

// Don't auto-start the game - let the user click "New Game" to start