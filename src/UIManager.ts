export interface UIElements {
    // Audio controls
    muteBtn: HTMLButtonElement;
    volumeSlider: HTMLInputElement;
    
    // Ammo displays
    player1Ammo: HTMLElement;
    player2Ammo: HTMLElement;
    p1Bullets: HTMLElement;
    p1Missiles: HTMLElement;
    p1Delayed: HTMLElement;
    p1Burst: HTMLElement;
    p2Bullets: HTMLElement;
    p2Missiles: HTMLElement;
    p2Delayed: HTMLElement;
    p2Burst: HTMLElement;
    
    // Victory overlay
    victoryOverlay: HTMLElement;
    victoryMessage: HTMLElement;
    newGameBtn: HTMLButtonElement;
}

export class UIManager {
    private elements: UIElements;

    constructor() {
        this.elements = this.initializeElements();
        this.setupStyles();
    }

    private initializeElements(): UIElements {
        return {
            // Audio controls
            muteBtn: this.getElement('mute-btn') as HTMLButtonElement,
            volumeSlider: this.getElement('volume-slider') as HTMLInputElement,
            
            // Ammo displays
            player1Ammo: this.getElement('player1-ammo'),
            player2Ammo: this.getElement('player2-ammo'),
            p1Bullets: this.getElement('p1-bullets'),
            p1Missiles: this.getElement('p1-missiles'),
            p1Delayed: this.getElement('p1-delayed'),
            p1Burst: this.getElement('p1-burst'),
            p2Bullets: this.getElement('p2-bullets'),
            p2Missiles: this.getElement('p2-missiles'),
            p2Delayed: this.getElement('p2-delayed'),
            p2Burst: this.getElement('p2-burst'),
            
            // Victory overlay
            victoryOverlay: this.getElement('victory-overlay'),
            victoryMessage: this.getElement('victory-message'),
            newGameBtn: this.getElement('new-game-btn') as HTMLButtonElement
        };
    }

    private getElement(id: string): HTMLElement {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Required UI element with id '${id}' not found`);
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

    showVictoryOverlay(message: string): void {
        this.elements.victoryOverlay.style.display = 'block';
        this.elements.victoryMessage.textContent = message;
    }

    hideVictoryOverlay(): void {
        this.elements.victoryOverlay.style.display = 'none';
    }

    updateAmmo(player: 1 | 2, bullets: number, missiles: number, delayed: number, burst: number): void {
        if (player === 1) {
            this.elements.p1Bullets.textContent = bullets.toString();
            this.elements.p1Missiles.textContent = missiles.toString();
            this.elements.p1Delayed.textContent = delayed.toString();
            this.elements.p1Burst.textContent = burst.toString();
        } else {
            this.elements.p2Bullets.textContent = bullets.toString();
            this.elements.p2Missiles.textContent = missiles.toString();
            this.elements.p2Delayed.textContent = delayed.toString();
            this.elements.p2Burst.textContent = burst.toString();
        }
    }

    showWinner(winner: 1 | 2): void {
        this.elements.victoryMessage.textContent = `Player ${winner} Wins!`;
        this.elements.victoryMessage.style.color = winner === 1 ? '#4CAF50' : '#2196F3';
        this.elements.victoryOverlay.style.display = 'block';
    }

    getVolumeValue(): number {
        return parseFloat(this.elements.volumeSlider.value);
    }

    onNewGameClick(callback: () => void): void {
        this.elements.newGameBtn.addEventListener('click', callback);
    }

    onMuteClick(callback: () => void): void {
        this.elements.muteBtn.addEventListener('click', callback);
    }

    updateMuteButton(isMuted: boolean): void {
        this.elements.muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
    }

    onVolumeChange(callback: (volume: number) => void): void {
        this.elements.volumeSlider.addEventListener('input', () => {
            callback(this.getVolumeValue());
        });
    }

}