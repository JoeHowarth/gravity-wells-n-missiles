export type SoundEffectType = 'fire' | 'missile' | 'explosion' | 'collision' | 'thrust' | 'powerup' | 'powerdown';

export class AudioManager {
    private backgroundMusic: HTMLAudioElement | null = null;
    private soundEffects: Map<SoundEffectType, HTMLAudioElement[]> = new Map();
    private isMuted: boolean = false;
    private volume: number = 0.3;
    private sfxVolume: number = 0.5;
    
    private soundPaths: Record<SoundEffectType, string> = {
        fire: '/sounds/fire.mp3',
        missile: '/sounds/missile.mp3',
        explosion: '/sounds/explosion.mp3',
        collision: '/sounds/collision.mp3',
        thrust: '/sounds/thrust.mp3',
        powerup: '/sounds/powerup.mp3',
        powerdown: '/sounds/powerdown.mp3'
    };

    constructor() {
        this.initializeAudio();
    }

    private initializeAudio(): void {
        this.backgroundMusic = new Audio('/music/background.mp3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = this.volume;
        
        // Pre-load sound effects with multiple instances for overlapping sounds
        for (const [type, path] of Object.entries(this.soundPaths) as [SoundEffectType, string][]) {
            const sounds: HTMLAudioElement[] = [];
            // Create 3 instances of each sound for potential overlap
            for (let i = 0; i < 3; i++) {
                const audio = new Audio(path);
                audio.volume = this.sfxVolume;
                sounds.push(audio);
            }
            this.soundEffects.set(type, sounds);
        }
    }

    public startMusic(): void {
        if (this.backgroundMusic && !this.isMuted) {
            this.backgroundMusic.play().catch(error => {
                console.log('Failed to play music:', error);
            });
        }
    }

    public stopMusic(): void {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }

    public playSound(type: SoundEffectType): void {
        if (this.isMuted) return;
        
        const sounds = this.soundEffects.get(type);
        if (sounds) {
            // Find a sound instance that's not currently playing
            const availableSound = sounds.find(sound => sound.paused || sound.ended);
            if (availableSound) {
                availableSound.currentTime = 0;
                availableSound.play().catch(error => {
                    console.log(`Failed to play ${type} sound:`, error);
                });
            }
        }
    }

    public toggleMute(): void {
        this.isMuted = !this.isMuted;
        if (this.backgroundMusic) {
            this.backgroundMusic.muted = this.isMuted;
        }
        // Mute all sound effects
        for (const sounds of this.soundEffects.values()) {
            for (const sound of sounds) {
                sound.muted = this.isMuted;
            }
        }
    }

    public setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.volume;
        }
    }

    public setSfxVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        for (const sounds of this.soundEffects.values()) {
            for (const sound of sounds) {
                sound.volume = this.sfxVolume;
            }
        }
    }

    public getVolume(): number {
        return this.volume;
    }

    public getSfxVolume(): number {
        return this.sfxVolume;
    }

    public isMusicMuted(): boolean {
        return this.isMuted;
    }
}