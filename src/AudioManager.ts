export type SoundEffectType = 'fire' | 'missile' | 'explosion' | 'collision' | 'thrust' | 'powerup' | 'powerdown';

export class AudioManager {
    private backgroundMusic: HTMLAudioElement | null = null;
    private soundEffects: Map<SoundEffectType, HTMLAudioElement[]> = new Map();
    private isMuted: boolean = false;
    private volume: number = 0.3;
    private sfxVolume: number = 0.5;
    
    // Get the base URL for assets (handles both dev and production)
    private getAssetUrl(path: string): string {
        // Check if we're on GitHub Pages by looking at the pathname
        const isGitHubPages = window.location.pathname.includes('/gravity-wells-n-missiles');
        const base = isGitHubPages ? '/gravity-wells-n-missiles/' : '/';
        return `${base}${path}`.replace(/\/+/g, '/');
    }
    
    private get soundPaths(): Record<SoundEffectType, string> {
        return {
            fire: this.getAssetUrl('sounds/fire.mp3'),
            missile: this.getAssetUrl('sounds/missile.mp3'),
            explosion: this.getAssetUrl('sounds/explosion.mp3'),
            collision: this.getAssetUrl('sounds/collision.mp3'),
            thrust: this.getAssetUrl('sounds/thrust.mp3'),
            powerup: this.getAssetUrl('sounds/powerup.mp3'),
            powerdown: this.getAssetUrl('sounds/powerdown.mp3')
        };
    }

    constructor() {
        this.initializeAudio();
    }

    private initializeAudio(): void {
        const musicUrl = this.getAssetUrl('music/background.mp3');
        console.log('Loading background music from:', musicUrl);
        
        this.backgroundMusic = new Audio(musicUrl);
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = this.volume;
        
        // Add error handler for background music
        this.backgroundMusic.addEventListener('error', (e) => {
            console.error('Failed to load background music:', e);
        });
        
        // Pre-load sound effects with multiple instances for overlapping sounds
        console.log('Loading sound effects...');
        for (const [type, path] of Object.entries(this.soundPaths) as [SoundEffectType, string][]) {
            console.log(`Loading ${type} from:`, path);
            const sounds: HTMLAudioElement[] = [];
            // Create 3 instances of each sound for potential overlap
            for (let i = 0; i < 3; i++) {
                const audio = new Audio(path);
                audio.volume = this.sfxVolume;
                
                // Add error handler for each sound effect
                audio.addEventListener('error', (e) => {
                    console.error(`Failed to load ${type} sound effect:`, e);
                });
                
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