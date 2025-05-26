export interface UIElements {
    welcomeScreen: HTMLElement;
    gameOverlay: HTMLElement;
    player1Ammo: HTMLElement;
    player2Ammo: HTMLElement;
    powerMeter: HTMLElement;
    currentPlayerIndicator: HTMLElement;
    winnerDisplay: HTMLElement;
    playAgainButton: HTMLElement;
    volumeSlider: HTMLInputElement;
    startButton: HTMLElement;
}

export class UIManager {
    private elements: UIElements;

    constructor() {
        this.elements = this.initializeElements();
        this.setupStyles();
    }

    private initializeElements(): UIElements {
        return {
            welcomeScreen: this.getElement('welcome-screen'),
            gameOverlay: this.getElement('game-overlay'),
            player1Ammo: this.getElement('player1-ammo'),
            player2Ammo: this.getElement('player2-ammo'),
            powerMeter: this.getElement('power-meter'),
            currentPlayerIndicator: this.getElement('current-player'),
            winnerDisplay: this.getElement('winner-display'),
            playAgainButton: this.getElement('play-again-button'),
            volumeSlider: this.getElement('volume-slider') as HTMLInputElement,
            startButton: this.getElement('start-button')
        };
    }

    private getElement(id: string): HTMLElement {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`UI element with id '${id}' not found`);
        }
        return element;
    }

    private setupStyles(): void {
        // Add touch-friendly styles for mobile
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
            
            // Make buttons larger on touch devices
            const style = document.createElement('style');
            style.textContent = `
                .touch-device button {
                    min-height: 44px;
                    min-width: 44px;
                    font-size: 16px;
                }
                .touch-device #power-meter {
                    height: 30px;
                }
                .touch-device .ammo-display {
                    font-size: 18px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    showWelcomeScreen(): void {
        this.elements.welcomeScreen.style.display = 'flex';
        this.elements.gameOverlay.style.display = 'none';
    }

    hideWelcomeScreen(): void {
        this.elements.welcomeScreen.style.display = 'none';
    }

    showGameOverlay(): void {
        this.elements.gameOverlay.style.display = 'block';
    }

    hideGameOverlay(): void {
        this.elements.gameOverlay.style.display = 'none';
    }

    updateAmmo(player: 1 | 2, bullets: number, missiles: number): void {
        const element = player === 1 ? this.elements.player1Ammo : this.elements.player2Ammo;
        element.textContent = `Bullets: ${bullets} | Missiles: ${missiles}`;
    }

    updatePowerMeter(power: number, maxPower: number): void {
        const percentage = (power / maxPower) * 100;
        this.elements.powerMeter.style.width = `${percentage}%`;
        
        // Change color based on power level
        if (percentage < 33) {
            this.elements.powerMeter.style.backgroundColor = '#4CAF50';
        } else if (percentage < 66) {
            this.elements.powerMeter.style.backgroundColor = '#FFC107';
        } else {
            this.elements.powerMeter.style.backgroundColor = '#F44336';
        }
    }

    updateCurrentPlayer(player: 1 | 2): void {
        this.elements.currentPlayerIndicator.textContent = `Player ${player}'s Turn`;
        this.elements.currentPlayerIndicator.style.color = player === 1 ? '#4CAF50' : '#2196F3';
    }

    showWinner(winner: 1 | 2): void {
        this.elements.winnerDisplay.textContent = `Player ${winner} Wins!`;
        this.elements.winnerDisplay.style.color = winner === 1 ? '#4CAF50' : '#2196F3';
        this.elements.winnerDisplay.style.display = 'block';
        this.elements.playAgainButton.style.display = 'block';
    }

    hideWinner(): void {
        this.elements.winnerDisplay.style.display = 'none';
        this.elements.playAgainButton.style.display = 'none';
    }

    getVolumeValue(): number {
        return parseFloat(this.elements.volumeSlider.value);
    }

    onStartClick(callback: () => void): void {
        this.elements.startButton.addEventListener('click', callback);
    }

    onPlayAgainClick(callback: () => void): void {
        this.elements.playAgainButton.addEventListener('click', callback);
    }

    onVolumeChange(callback: (volume: number) => void): void {
        this.elements.volumeSlider.addEventListener('input', () => {
            callback(this.getVolumeValue());
        });
    }

    showAimingHint(show: boolean): void {
        if (show) {
            // Create aiming hint if it doesn't exist
            let hint = document.getElementById('aiming-hint');
            if (!hint) {
                hint = document.createElement('div');
                hint.id = 'aiming-hint';
                hint.style.cssText = `
                    position: absolute;
                    bottom: 120px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    font-size: 14px;
                    pointer-events: none;
                `;
                hint.textContent = 'Click/Touch and drag to aim, release to fire';
                document.body.appendChild(hint);
            }
            hint.style.display = 'block';
        } else {
            const hint = document.getElementById('aiming-hint');
            if (hint) {
                hint.style.display = 'none';
            }
        }
    }
}