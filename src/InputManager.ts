import { Vector2D } from './Vector2D';

export interface InputState {
    mousePosition: Vector2D;
    isMouseDown: boolean;
    keys: Set<string>;
    touches: Map<number, Touch>;
    isTouchDevice: boolean;
}

export class InputManager {
    private canvas: HTMLCanvasElement;
    private state: InputState;
    private mouseDownCallback?: (position: Vector2D) => void;
    private mouseUpCallback?: (position: Vector2D) => void;
    private mouseMoveCallback?: (position: Vector2D) => void;
    private keyHandlers: Map<string, () => void> = new Map();

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.state = {
            mousePosition: new Vector2D(0, 0),
            isMouseDown: false,
            keys: new Set(),
            touches: new Map(),
            isTouchDevice: 'ontouchstart' in window
        };

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        
        // Keyboard events
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    private getCanvasPosition(clientX: number, clientY: number): Vector2D {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return new Vector2D(
            (clientX - rect.left) * scaleX,
            (clientY - rect.top) * scaleY
        );
    }

    private handleMouseDown(event: MouseEvent): void {
        this.state.isMouseDown = true;
        this.state.mousePosition = this.getCanvasPosition(event.clientX, event.clientY);
        
        if (this.mouseDownCallback) {
            this.mouseDownCallback(this.state.mousePosition);
        }
    }

    private handleMouseUp(event: MouseEvent): void {
        this.state.isMouseDown = false;
        this.state.mousePosition = this.getCanvasPosition(event.clientX, event.clientY);
        
        if (this.mouseUpCallback) {
            this.mouseUpCallback(this.state.mousePosition);
        }
    }

    private handleMouseMove(event: MouseEvent): void {
        this.state.mousePosition = this.getCanvasPosition(event.clientX, event.clientY);
        
        if (this.mouseMoveCallback) {
            this.mouseMoveCallback(this.state.mousePosition);
        }
    }

    private handleTouchStart(event: TouchEvent): void {
        event.preventDefault();
        
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.state.touches.set(touch.identifier, touch);
            
            const position = this.getCanvasPosition(touch.clientX, touch.clientY);
            this.state.mousePosition = position;
            this.state.isMouseDown = true;
            
            if (this.mouseDownCallback) {
                this.mouseDownCallback(position);
            }
        }
    }

    private handleTouchEnd(event: TouchEvent): void {
        event.preventDefault();
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.state.touches.delete(touch.identifier);
        }
        
        if (this.state.touches.size === 0) {
            this.state.isMouseDown = false;
            
            if (this.mouseUpCallback && event.changedTouches.length > 0) {
                const touch = event.changedTouches[0];
                const position = this.getCanvasPosition(touch.clientX, touch.clientY);
                this.mouseUpCallback(position);
            }
        }
    }

    private handleTouchMove(event: TouchEvent): void {
        event.preventDefault();
        
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.state.touches.set(touch.identifier, touch);
            
            const position = this.getCanvasPosition(touch.clientX, touch.clientY);
            this.state.mousePosition = position;
            
            if (this.mouseMoveCallback) {
                this.mouseMoveCallback(position);
            }
        }
    }

    private handleKeyDown(event: KeyboardEvent): void {
        this.state.keys.add(event.key);
        
        const handler = this.keyHandlers.get(event.key);
        if (handler) {
            handler();
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        this.state.keys.delete(event.key);
    }

    onMouseDown(callback: (position: Vector2D) => void): void {
        this.mouseDownCallback = callback;
    }

    onMouseUp(callback: (position: Vector2D) => void): void {
        this.mouseUpCallback = callback;
    }

    onMouseMove(callback: (position: Vector2D) => void): void {
        this.mouseMoveCallback = callback;
    }

    onKey(key: string, callback: () => void): void {
        this.keyHandlers.set(key, callback);
    }

    isKeyPressed(key: string): boolean {
        return this.state.keys.has(key);
    }

    getMousePosition(): Vector2D {
        return this.state.mousePosition;
    }

    isMouseDown(): boolean {
        return this.state.isMouseDown;
    }

    isTouchDevice(): boolean {
        return this.state.isTouchDevice;
    }

    cleanup(): void {
        this.state.keys.clear();
        this.state.touches.clear();
        this.keyHandlers.clear();
    }
}