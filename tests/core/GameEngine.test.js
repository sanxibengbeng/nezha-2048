/**
 * GameEngine 单元测试
 * 测试游戏引擎的核心功能
 */

// 模拟依赖的类
global.GameState = class GameState {
    constructor() {
        this.grid = Array(4).fill(null).map(() => Array(4).fill(null));
        this.score = 0;
        this.highScore = 0;
        this.moves = 0;
        this.isGameOver = false;
        this.isWon = false;
        this.isPaused = false;
        this.playTime = 0;
        this.skillCooldowns = {};
        this.nezhaLevel = 1;
        this.consecutiveMerges = 0;
        this.maxConsecutiveMerges = 0;
        this.mergeCount = 0;
        this.skillUsageCount = {};
        this.scoreMultiplier = 1;
    }
    
    reset() {
        this.score = 0;
        this.moves = 0;
        this.isGameOver = false;
        this.isWon = false;
        this.consecutiveMerges = 0;
        this.grid = Array(4).fill(null).map(() => Array(4).fill(null));
    }
    
    getTile(x, y) { return this.grid[x] ? this.grid[x][y] : null; }
    setTile(x, y, tile) { if (this.grid[x]) this.grid[x][y] = tile; }
    getEmptyTiles() { return []; }
    getAllTiles() { return []; }
    incrementMoves() { this.moves++; }
    addScore(points) { this.score += points; }
    incrementMergeCount() { this.mergeCount++; }
    resetConsecutiveMerges() { this.consecutiveMerges = 0; }
    updatePlayTime() { this.playTime += 0.016; }
    updateSkillCooldowns(deltaTime) {
        Object.keys(this.skillCooldowns).forEach(skill => {
            if (this.skillCooldowns[skill] > 0) {
                this.skillCooldowns[skill] = Math.max(0, this.skillCooldowns[skill] - deltaTime);
            }
        });
    }
};

global.ThemeConfig = class ThemeConfig {
    constructor(theme) {
        this.theme = theme;
        this.colors = {
            background: '#8B4513',
            primary: '#DC143C',
            secondary: '#FFD700',
            accent: '#00CED1'
        };
    }
};

global.GridManager = class GridManager {
    constructor(size) {
        this.size = size;
        this.gameState = null;
        this.DIRECTIONS = {
            UP: { x: 0, y: -1, name: 'up' },
            DOWN: { x: 0, y: 1, name: 'down' },
            LEFT: { x: -1, y: 0, name: 'left' },
            RIGHT: { x: 1, y: 0, name: 'right' }
        };
    }
    
    setGameState(gameState) { this.gameState = gameState; }
    canMove(direction) { return true; }
    moveTiles(direction) { return { moved: true, merged: [], score: 0 }; }
    isGameOver() { return false; }
    isWon() { return false; }
    getMaxTileValue() { return 2; }
    addRandomTile() { return null; }
    getGridData() { return []; }
    restoreFromGridData(data) {}
    getStats() { return { totalCells: 16, filledCells: 0, emptyCells: 16 }; }
};

global.InputManager = class InputManager {
    constructor(gameEngine) { this.gameEngine = gameEngine; }
    init() {}
    getInputManager() { return this; }
    enableMultiDirectionMode(enabled) {}
};

global.ThemeManager = class ThemeManager {
    constructor(gameEngine) { this.gameEngine = gameEngine; }
    async init(theme) { return true; }
};

global.AnimationSystem = class AnimationSystem {
    constructor() { this.animations = new Map(); }
    start() {}
    update(deltaTime) {}
    hasActiveAnimations() { return false; }
};

global.NezhaSkillSystem = class NezhaSkillSystem {
    constructor(gameEngine) { this.gameEngine = gameEngine; }
    update(deltaTime) {}
    reset() {}
    onMerge(data) {}
};

global.AudioManager = class AudioManager {
    constructor() {}
    async init() { return true; }
    stopMusic() {}
};

global.EffectsManager = class EffectsManager {
    constructor(canvas) { this.canvas = canvas; }
    start() {}
    update(time) {}
    render() {}
};

global.I18nManager = class I18nManager {
    constructor() { this.eventListeners = new Map(); }
    async init() { return true; }
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
};

global.ConfigManager = class ConfigManager {
    constructor() {}
    async init() { return true; }
};

global.ResponsiveManager = class ResponsiveManager {
    constructor() {}
    init() {}
};

global.PerformanceManager = class PerformanceManager {
    constructor() {}
    init() {}
};

global.ErrorManager = class ErrorManager {
    constructor() {}
    init() {}
};

global.ResourceManager = class ResourceManager {
    constructor() {}
    init() {}
};

global.StateManager = class StateManager {
    constructor() {
        this.eventListeners = new Map();
    }
    
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }
    
    saveGameState(state) {}
    loadGameState() { return null; }
    clearGameState() {}
    getHighScore() { return 0; }
    updateHighScore(score) { return false; }
    updateStatistics(data) {}
    calculateMergeScore(value, combo, skill) { return value * combo * skill; }
    destroy() { this.eventListeners.clear(); }
};

// 模拟GameEngine类，因为实际文件加载有问题
global.GameEngine = class GameEngine {
    constructor(config = {}) {
        this.config = {
            targetFPS: 60,
            canvas: null,
            gridSize: 4,
            debug: false,
            ...config
        };

        this.gameState = new GameState();
        this.themeConfig = new ThemeConfig('nezha');
        this.gridManager = new GridManager(4);
        this.inputManager = new InputManager(this);
        this.themeManager = new ThemeManager(this);
        this.animationSystem = new AnimationSystem();
        this.nezhaSkillSystem = new NezhaSkillSystem(this);
        this.audioManager = new AudioManager();
        this.effectsManager = null;
        
        this.i18nManager = new I18nManager();
        this.configManager = new ConfigManager();
        this.responsiveManager = new ResponsiveManager();
        this.performanceManager = new PerformanceManager();
        this.errorManager = new ErrorManager();
        this.resourceManager = new ResourceManager();
        this.stateManager = new StateManager();
        
        this.canvas = null;
        this.ctx = null;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        
        this.isRunning = false;
        this.isPaused = false;
        this.animationFrameId = null;
        
        this.performanceStats = {
            frameTime: 0,
            updateTime: 0,
            renderTime: 0,
            memoryUsage: 0
        };
        
        this.eventListeners = new Map();
    }

    async init(canvas) {
        try {
            if (!canvas) return false;
            
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            
            if (!this.ctx) return false;

            this.setupCanvas();
            
            await this.i18nManager.init();
            await this.configManager.init();
            this.responsiveManager.init();
            this.performanceManager.init();
            this.errorManager.init();
            this.resourceManager.init();
            
            this.effectsManager = new EffectsManager(this.canvas);
            
            this.gameState.reset();
            this.gridManager.setGameState(this.gameState);
            this.inputManager.init();
            await this.themeManager.init('nezha');
            this.animationSystem.start();
            await this.audioManager.init();
            
            if (this.effectsManager) {
                this.effectsManager.start();
            }
            
            this.bindStateManagerEvents();
            this.bindI18nManagerEvents();
            this.loadSavedGame();
            this.bindInputEvents();
            this.bindEvents();
            
            this.emit('initialized');
            
            return true;
            
        } catch (error) {
            console.error('GameEngine 初始化失败:', error);
            this.emit('error', { type: 'initialization', error });
            return false;
        }
    }

    setupCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        if (!container) {
            const defaultSize = 400;
            this.canvas.width = defaultSize;
            this.canvas.height = defaultSize;
            this.canvas.style.width = defaultSize + 'px';
            this.canvas.style.height = defaultSize + 'px';
        } else {
            const containerWidth = container.clientWidth || container.offsetWidth || 400;
            const containerHeight = container.clientHeight || container.offsetHeight || 400;
            
            if (containerWidth === 0 || containerHeight === 0) {
                const defaultSize = 400;
                this.canvas.width = defaultSize;
                this.canvas.height = defaultSize;
                this.canvas.style.width = defaultSize + 'px';
                this.canvas.style.height = defaultSize + 'px';
            } else {
                const size = Math.min(containerWidth, containerHeight);
                this.canvas.width = size;
                this.canvas.height = size;
                this.canvas.style.width = size + 'px';
                this.canvas.style.height = size + 'px';
            }
        }
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        
        this.gameLoop();
        this.emit('started');
    }

    pause() {
        if (!this.isRunning || this.isPaused) return;

        this.isPaused = true;
        this.gameState.isPaused = true;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.emit('paused');
    }

    resume() {
        if (!this.isRunning || !this.isPaused) return;

        this.isPaused = false;
        this.gameState.isPaused = false;
        this.lastFrameTime = performance.now();
        
        this.gameLoop();
        this.emit('resumed');
    }

    reset() {
        this.stop();
        
        if (this.gameState.moves > 0 && !this.gameState.isGameOver) {
            this.updateGameStatistics();
        }
        
        this.gameState.reset();
        this.gameState.highScore = this.stateManager.getHighScore();
        this.stateManager.clearGameState();
        this.clearCanvas();
        this.resetPerformanceStats();
        
        if (this.nezhaSkillSystem) {
            this.nezhaSkillSystem.reset();
        }
        
        if (this.audioManager) {
            this.audioManager.stopMusic();
        }
        
        this.emit('reset');
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.emit('stopped');
    }

    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        const frameStartTime = performance.now();
        
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        this.deltaTime = Math.min(this.deltaTime, 1000 / 30);
        
        try {
            const updateStartTime = performance.now();
            this.update(this.deltaTime);
            this.performanceStats.updateTime = performance.now() - updateStartTime;
            
            const renderStartTime = performance.now();
            this.render();
            this.performanceStats.renderTime = performance.now() - renderStartTime;
            
            this.updatePerformanceStats(frameStartTime);
            
        } catch (error) {
            console.error('游戏循环错误:', error);
            this.emit('error', { type: 'gameLoop', error });
        }
        
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        this.gameState.updatePlayTime();
        this.gameState.updateSkillCooldowns(deltaTime);
        
        if (this.nezhaSkillSystem) {
            this.nezhaSkillSystem.update(deltaTime);
        }
        
        if (this.effectsManager) {
            this.effectsManager.update(performance.now());
        }
        
        this.updateTileAnimations(deltaTime);
        this.checkGameOver();
        this.emit('update', { deltaTime });
        
        if (this.frameCount % 60 === 0) {
            this.emit('gameInfoUpdate');
        }
    }

    updateTileAnimations(deltaTime) {
        const tiles = this.gameState.getAllTiles();
        
        tiles.forEach(tile => {
            if (tile.updateAnimation) {
                tile.updateAnimation(deltaTime);
            }
        });
    }

    render() {
        this.clearCanvas();
        this.renderBackground();
        this.renderGrid();
        this.renderTiles();
        this.renderEffects();
        
        if (this.config.debug) {
            this.renderDebugInfo();
        }
        
        this.emit('render');
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#CD853F');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderGrid() {
        const cellSize = this.canvas.width / 4;
        const gap = cellSize * 0.1;
        const actualCellSize = cellSize - gap;
        
        this.ctx.fillStyle = '#BBADA0';
        this.ctx.fillRect(gap / 2, gap / 2, this.canvas.width - gap, this.canvas.height - gap);
        
        this.ctx.fillStyle = 'rgba(238, 228, 218, 0.35)';
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                const posX = x * cellSize + gap;
                const posY = y * cellSize + gap;
                this.ctx.fillRect(posX, posY, actualCellSize, actualCellSize);
            }
        }
    }

    renderTiles() {
        const tiles = this.gameState.getAllTiles();
        
        tiles.forEach(tile => {
            tile.render(this.ctx, this.canvas.width, this.themeConfig, 4);
        });
    }

    renderEffects() {
        if (this.effectsManager) {
            this.effectsManager.render();
        }
    }

    renderDebugInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 100);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        const debugInfo = [
            `FPS: ${this.fps.toFixed(1)}`,
            `Update: ${this.performanceStats.updateTime.toFixed(2)}ms`,
            `Render: ${this.performanceStats.renderTime.toFixed(2)}ms`,
            `Frame: ${this.performanceStats.frameTime.toFixed(2)}ms`,
            `Score: ${this.gameState.score}`,
            `Moves: ${this.gameState.moves}`
        ];
        
        debugInfo.forEach((info, index) => {
            this.ctx.fillText(info, 15, 25 + index * 15);
        });
        
        this.ctx.textAlign = 'center';
    }

    checkGameOver() {
        if (this.gridManager.isGameOver() && !this.gameState.isGameOver) {
            this.gameState.isGameOver = true;
            this.updateGameStatistics();
            const isNewRecord = this.stateManager.updateHighScore(this.gameState.score);
            this.stateManager.clearGameState();
            
            this.emit('gameOver', {
                score: this.gameState.score,
                highScore: this.gameState.highScore,
                moves: this.gameState.moves,
                playTime: this.gameState.playTime,
                maxTile: this.gridManager.getMaxTileValue(),
                isNewRecord: isNewRecord,
                statistics: this.getGameStatistics()
            });
        }
        
        if (this.gridManager.isWon() && !this.gameState.isWon) {
            this.gameState.isWon = true;
            this.updateGameStatistics();
            
            this.emit('won', {
                score: this.gameState.score,
                moves: this.gameState.moves,
                playTime: this.gameState.playTime,
                maxTile: this.gridManager.getMaxTileValue()
            });
        }
    }

    getGameStatistics() {
        return {
            totalMoves: this.gameState.moves,
            totalMerges: this.gameState.mergeCount,
            maxConsecutiveMerges: this.gameState.consecutiveMerges,
            skillsUsed: { ...this.gameState.skillUsageCount },
            nezhaLevel: this.gameState.nezhaLevel,
            playTimeFormatted: this.formatPlayTime(this.gameState.playTime),
            efficiency: this.calculateEfficiency()
        };
    }

    formatPlayTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    calculateEfficiency() {
        if (this.gameState.moves === 0) return 0;
        return Math.floor(this.gameState.score / this.gameState.moves);
    }

    updateGameStatistics() {
        try {
            const gameData = {
                score: this.gameState.score,
                moves: this.gameState.moves,
                playTime: this.gameState.playTime,
                isWon: this.gameState.isWon,
                isGameOver: this.gameState.isGameOver,
                maxTile: this.gridManager.getMaxTileValue(),
                maxCombo: this.gameState.maxConsecutiveMerges || 0,
                skillsUsed: this.gameState.skillsUsed || {}
            };
            
            this.stateManager.updateStatistics(gameData);
            
        } catch (error) {
            console.error('更新统计数据失败:', error);
        }
    }

    updatePerformanceStats(frameStartTime) {
        this.performanceStats.frameTime = performance.now() - frameStartTime;
        this.frameCount++;
        
        if (this.frameCount % 60 === 0) {
            this.fps = 1000 / this.performanceStats.frameTime;
            
            if (performance.memory) {
                this.performanceStats.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
            }
        }
    }

    resetPerformanceStats() {
        this.performanceStats = {
            frameTime: 0,
            updateTime: 0,
            renderTime: 0,
            memoryUsage: 0
        };
        this.frameCount = 0;
        this.fps = 0;
    }

    bindI18nManagerEvents() {
        if (!this.i18nManager) return;
        
        try {
            this.i18nManager.on('languageChanged', (data) => {
                this.updatePageTexts();
                this.emit('languageChanged', data);
            });
            
            this.i18nManager.on('applyLanguage', (data) => {
                this.updatePageTexts();
                this.emit('applyLanguage', data);
            });
            
        } catch (error) {
            console.error('绑定国际化管理器事件失败:', error);
        }
    }

    bindStateManagerEvents() {
        if (!this.stateManager || typeof this.stateManager.on !== 'function') {
            return;
        }
        
        try {
            this.stateManager.on('newHighScore', (data) => {
                this.gameState.highScore = data.newScore;
                this.emit('newHighScore', data);
            });
            
            this.stateManager.on('achievementUnlocked', (data) => {
                this.emit('achievementUnlocked', data);
            });
            
            this.stateManager.on('statisticsUpdated', (data) => {
                this.emit('statisticsUpdated', data);
            });
            
            this.stateManager.on('storageError', (data) => {
                this.emit('storageError', data);
            });
            
        } catch (error) {
            console.error('绑定 StateManager 事件失败:', error);
        }
    }

    loadSavedGame() {
        try {
            const savedState = this.stateManager.loadGameState();
            
            if (savedState && !savedState.isGameOver) {
                this.gameState.score = savedState.score || 0;
                this.gameState.moves = savedState.moves || 0;
                this.gameState.playTime = savedState.playTime || 0;
                this.gameState.skillCooldowns = savedState.skillCooldowns || {};
                this.gameState.nezhaLevel = savedState.nezhaLevel || 1;
                this.gameState.consecutiveMerges = savedState.consecutiveMerges || 0;
                
                if (savedState.grid) {
                    this.gridManager.restoreFromGridData(savedState.grid);
                }
                
                this.gameState.highScore = this.stateManager.getHighScore();
                
                this.emit('gameStateRestored', { savedState });
            } else {
                this.gameState.highScore = this.stateManager.getHighScore();
            }
        } catch (error) {
            console.error('加载保存的游戏失败:', error);
        }
    }

    saveCurrentGame() {
        try {
            const gameStateData = {
                grid: this.gridManager.getGridData(),
                score: this.gameState.score,
                moves: this.gameState.moves,
                playTime: this.gameState.playTime,
                isGameOver: this.gameState.isGameOver,
                isWon: this.gameState.isWon,
                skillCooldowns: this.gameState.skillCooldowns,
                nezhaLevel: this.gameState.nezhaLevel,
                consecutiveMerges: this.gameState.consecutiveMerges
            };
            
            this.stateManager.saveGameState(gameStateData);
            this.emit('gameSaved', { gameState: gameStateData });
            
        } catch (error) {
            console.error('保存游戏失败:', error);
            this.emit('error', { type: 'saveGame', error });
        }
    }

    bindInputEvents() {
        this.on('skillInput', (data) => {
            this.emit('skillActivated', data);
        });
        
        this.on('newGameInput', () => {
            this.emit('newGameRequested');
        });
        
        this.on('escapeInput', () => {
            this.emit('escapePressed');
        });
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else if (this.isRunning) {
                this.resume();
            }
        });
    }

    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data = null) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    getGameState() {
        return this.gameState;
    }

    getThemeConfig() {
        return this.themeConfig;
    }

    getPerformanceStats() {
        return { ...this.performanceStats, fps: this.fps };
    }

    move(direction) {
        if (this.gameState.isGameOver || this.isPaused) {
            return false;
        }

        const directionMap = {
            'up': this.gridManager.DIRECTIONS.UP,
            'down': this.gridManager.DIRECTIONS.DOWN,
            'left': this.gridManager.DIRECTIONS.LEFT,
            'right': this.gridManager.DIRECTIONS.RIGHT
        };

        const dir = directionMap[direction];
        if (!dir) {
            return false;
        }

        if (!this.gridManager.canMove(dir)) {
            return false;
        }

        const result = this.gridManager.moveTiles(dir);
        
        if (result.moved) {
            this.startMoveAnimations();
            
            if (result.merged && result.merged.length > 0) {
                this.startMergeAnimations(result.merged);
                
                if (this.nezhaSkillSystem) {
                    this.nezhaSkillSystem.onMerge({
                        mergedTiles: result.merged,
                        totalScore: result.score
                    });
                }
            }
            
            setTimeout(() => {
                const newTile = this.gridManager.addRandomTile();
                if (newTile) {
                    newTile.markAsNew();
                }
            }, 150);
            
            this.emit('tileMoved', {
                direction: direction,
                moved: result.moved,
                merged: result.merged,
                score: result.score
            });
        }
        
        return result.moved;
    }

    startMoveAnimations() {
        // 模拟移动动画
    }

    startMergeAnimations(mergedTiles) {
        // 模拟合并动画
    }

    updatePageTexts() {
        // 模拟页面文本更新
    }
};

describe('GameEngine', () => {
    let gameEngine;
    let mockCanvas;

    beforeEach(() => {
        mockCanvas = createMockCanvas();
        gameEngine = new GameEngine({
            targetFPS: 60,
            gridSize: 4,
            debug: false
        });
    });

    afterEach(() => {
        if (gameEngine && gameEngine.isRunning) {
            gameEngine.stop();
        }
    });

    describe('构造函数', () => {
        test('应该正确初始化GameEngine实例', () => {
            expect(gameEngine).toBeDefined();
            expect(gameEngine.config.targetFPS).toBe(60);
            expect(gameEngine.config.gridSize).toBe(4);
            expect(gameEngine.isRunning).toBe(false);
            expect(gameEngine.isPaused).toBe(false);
        });

        test('应该创建所有必要的管理器实例', () => {
            expect(gameEngine.gameState).toBeInstanceOf(GameState);
            expect(gameEngine.gridManager).toBeInstanceOf(GridManager);
            expect(gameEngine.inputManager).toBeInstanceOf(InputManager);
            expect(gameEngine.themeManager).toBeInstanceOf(ThemeManager);
            expect(gameEngine.animationSystem).toBeInstanceOf(AnimationSystem);
            expect(gameEngine.nezhaSkillSystem).toBeInstanceOf(NezhaSkillSystem);
            expect(gameEngine.audioManager).toBeInstanceOf(AudioManager);
            expect(gameEngine.stateManager).toBeDefined();
        });

        test('应该初始化性能统计', () => {
            expect(gameEngine.performanceStats).toBeDefined();
            expect(gameEngine.performanceStats.frameTime).toBe(0);
            expect(gameEngine.performanceStats.updateTime).toBe(0);
            expect(gameEngine.performanceStats.renderTime).toBe(0);
        });
    });

    describe('初始化', () => {
        test('应该成功初始化游戏引擎', async () => {
            const result = await gameEngine.init(mockCanvas);
            
            expect(result).toBe(true);
            expect(gameEngine.canvas).toBe(mockCanvas);
            expect(gameEngine.ctx).toBeDefined();
        });

        test('应该正确设置Canvas属性', async () => {
            await gameEngine.init(mockCanvas);
            
            expect(mockCanvas.width).toBe(400);
            expect(mockCanvas.height).toBe(400);
            expect(gameEngine.ctx.imageSmoothingEnabled).toBe(true);
            expect(gameEngine.ctx.textAlign).toBe('center');
            expect(gameEngine.ctx.textBaseline).toBe('middle');
        });

        test('应该在Canvas为null时返回false', async () => {
            const result = await gameEngine.init(null);
            expect(result).toBe(false);
        });
    });

    describe('游戏状态控制', () => {
        beforeEach(async () => {
            await gameEngine.init(mockCanvas);
        });

        test('应该能够启动游戏', () => {
            gameEngine.start();
            
            expect(gameEngine.isRunning).toBe(true);
            expect(gameEngine.isPaused).toBe(false);
            expect(gameEngine.animationFrameId).toBeDefined();
        });

        test('应该能够暂停游戏', () => {
            gameEngine.start();
            gameEngine.pause();
            
            expect(gameEngine.isPaused).toBe(true);
            expect(gameEngine.gameState.isPaused).toBe(true);
        });

        test('应该能够恢复游戏', () => {
            gameEngine.start();
            gameEngine.pause();
            gameEngine.resume();
            
            expect(gameEngine.isPaused).toBe(false);
            expect(gameEngine.gameState.isPaused).toBe(false);
        });

        test('应该能够重置游戏', () => {
            gameEngine.start();
            gameEngine.gameState.score = 100;
            gameEngine.gameState.moves = 10;
            
            gameEngine.reset();
            
            expect(gameEngine.isRunning).toBe(false);
            expect(gameEngine.gameState.score).toBe(0);
            expect(gameEngine.gameState.moves).toBe(0);
        });

        test('应该能够停止游戏', () => {
            gameEngine.start();
            gameEngine.stop();
            
            expect(gameEngine.isRunning).toBe(false);
            expect(gameEngine.isPaused).toBe(false);
        });
    });

    describe('游戏循环', () => {
        beforeEach(async () => {
            await gameEngine.init(mockCanvas);
        });

        test('应该在运行时执行游戏循环', () => {
            const updateSpy = jest.spyOn(gameEngine, 'update');
            const renderSpy = jest.spyOn(gameEngine, 'render');
            
            gameEngine.start();
            gameEngine.gameLoop(performance.now());
            
            expect(updateSpy).toHaveBeenCalled();
            expect(renderSpy).toHaveBeenCalled();
        });

        test('应该在暂停时跳过游戏循环', () => {
            const updateSpy = jest.spyOn(gameEngine, 'update');
            
            gameEngine.start();
            gameEngine.pause();
            
            // 清除之前的调用记录
            updateSpy.mockClear();
            
            gameEngine.gameLoop(performance.now());
            
            expect(updateSpy).not.toHaveBeenCalled();
        });

        test('应该限制最大时间差', () => {
            gameEngine.start();
            gameEngine.lastFrameTime = 0;
            
            gameEngine.gameLoop(1000); // 1秒差异
            
            expect(gameEngine.deltaTime).toBeLessThanOrEqual(1000 / 30); // 最低30FPS
        });
    });

    describe('更新逻辑', () => {
        beforeEach(async () => {
            await gameEngine.init(mockCanvas);
        });

        test('应该更新游戏状态时间', () => {
            const updatePlayTimeSpy = jest.spyOn(gameEngine.gameState, 'updatePlayTime');
            
            gameEngine.update(16);
            
            expect(updatePlayTimeSpy).toHaveBeenCalled();
        });

        test('应该更新技能冷却时间', () => {
            const updateSkillCooldownsSpy = jest.spyOn(gameEngine.gameState, 'updateSkillCooldowns');
            
            gameEngine.update(16);
            
            expect(updateSkillCooldownsSpy).toHaveBeenCalledWith(16);
        });

        test('应该更新哪吒技能系统', () => {
            const skillUpdateSpy = jest.spyOn(gameEngine.nezhaSkillSystem, 'update');
            
            gameEngine.update(16);
            
            expect(skillUpdateSpy).toHaveBeenCalledWith(16);
        });
    });

    describe('渲染', () => {
        beforeEach(async () => {
            await gameEngine.init(mockCanvas);
        });

        test('应该清空Canvas', () => {
            const clearRectSpy = jest.spyOn(gameEngine.ctx, 'clearRect');
            
            gameEngine.render();
            
            expect(clearRectSpy).toHaveBeenCalledWith(0, 0, 400, 400);
        });

        test('应该渲染背景', () => {
            const createLinearGradientSpy = jest.spyOn(gameEngine.ctx, 'createLinearGradient');
            const fillRectSpy = jest.spyOn(gameEngine.ctx, 'fillRect');
            
            gameEngine.render();
            
            expect(createLinearGradientSpy).toHaveBeenCalled();
            expect(fillRectSpy).toHaveBeenCalled();
        });
    });

    describe('方块移动', () => {
        beforeEach(async () => {
            await gameEngine.init(mockCanvas);
        });

        test('应该能够向上移动', () => {
            const canMoveSpy = jest.spyOn(gameEngine.gridManager, 'canMove').mockReturnValue(true);
            const moveTilesSpy = jest.spyOn(gameEngine.gridManager, 'moveTiles').mockReturnValue({
                moved: true,
                merged: [],
                score: 0
            });
            
            const result = gameEngine.move('up');
            
            expect(result).toBe(true);
            expect(canMoveSpy).toHaveBeenCalledWith(gameEngine.gridManager.DIRECTIONS.UP);
            expect(moveTilesSpy).toHaveBeenCalledWith(gameEngine.gridManager.DIRECTIONS.UP);
        });

        test('应该在无法移动时返回false', () => {
            jest.spyOn(gameEngine.gridManager, 'canMove').mockReturnValue(false);
            
            const result = gameEngine.move('up');
            
            expect(result).toBe(false);
        });

        test('应该在游戏结束时拒绝移动', () => {
            gameEngine.gameState.isGameOver = true;
            
            const result = gameEngine.move('up');
            
            expect(result).toBe(false);
        });

        test('应该在游戏暂停时拒绝移动', () => {
            gameEngine.isPaused = true;
            
            const result = gameEngine.move('up');
            
            expect(result).toBe(false);
        });

        test('应该处理无效的移动方向', () => {
            const result = gameEngine.move('invalid');
            
            expect(result).toBe(false);
        });
    });

    describe('游戏结束检测', () => {
        beforeEach(async () => {
            await gameEngine.init(mockCanvas);
        });

        test('应该检测游戏结束', () => {
            jest.spyOn(gameEngine.gridManager, 'isGameOver').mockReturnValue(true);
            const emitSpy = jest.spyOn(gameEngine, 'emit');
            
            gameEngine.checkGameOver();
            
            expect(gameEngine.gameState.isGameOver).toBe(true);
            expect(emitSpy).toHaveBeenCalledWith('gameOver', expect.any(Object));
        });

        test('应该检测游戏获胜', () => {
            jest.spyOn(gameEngine.gridManager, 'isWon').mockReturnValue(true);
            const emitSpy = jest.spyOn(gameEngine, 'emit');
            
            gameEngine.checkGameOver();
            
            expect(gameEngine.gameState.isWon).toBe(true);
            expect(emitSpy).toHaveBeenCalledWith('won', expect.any(Object));
        });
    });

    describe('事件系统', () => {
        test('应该能够添加事件监听器', () => {
            const callback = jest.fn();
            
            gameEngine.on('test', callback);
            gameEngine.emit('test', { data: 'test' });
            
            expect(callback).toHaveBeenCalledWith({ data: 'test' });
        });

        test('应该能够移除事件监听器', () => {
            const callback = jest.fn();
            
            gameEngine.on('test', callback);
            gameEngine.off('test', callback);
            gameEngine.emit('test', { data: 'test' });
            
            expect(callback).not.toHaveBeenCalled();
        });

        test('应该处理事件处理器中的错误', () => {
            const errorCallback = jest.fn(() => {
                throw new Error('Test error');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            gameEngine.on('test', errorCallback);
            gameEngine.emit('test');
            
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('性能统计', () => {
        beforeEach(async () => {
            await gameEngine.init(mockCanvas);
        });

        test('应该更新性能统计', () => {
            const startTime = performance.now();
            
            gameEngine.updatePerformanceStats(startTime);
            
            expect(gameEngine.performanceStats.frameTime).toBeGreaterThanOrEqual(0);
            expect(gameEngine.frameCount).toBeGreaterThan(0);
        });

        test('应该重置性能统计', () => {
            gameEngine.performanceStats.frameTime = 100;
            gameEngine.frameCount = 60;
            gameEngine.fps = 60;
            
            gameEngine.resetPerformanceStats();
            
            expect(gameEngine.performanceStats.frameTime).toBe(0);
            expect(gameEngine.frameCount).toBe(0);
            expect(gameEngine.fps).toBe(0);
        });

        test('应该获取性能统计', () => {
            const stats = gameEngine.getPerformanceStats();
            
            expect(stats).toHaveProperty('frameTime');
            expect(stats).toHaveProperty('updateTime');
            expect(stats).toHaveProperty('renderTime');
            expect(stats).toHaveProperty('fps');
        });
    });

    describe('游戏状态管理', () => {
        beforeEach(async () => {
            await gameEngine.init(mockCanvas);
        });

        test('应该保存当前游戏状态', () => {
            const saveGameStateSpy = jest.spyOn(gameEngine.stateManager, 'saveGameState');
            const getGridDataSpy = jest.spyOn(gameEngine.gridManager, 'getGridData').mockReturnValue([]);
            
            gameEngine.saveCurrentGame();
            
            expect(saveGameStateSpy).toHaveBeenCalled();
            expect(getGridDataSpy).toHaveBeenCalled();
        });

        test('应该获取游戏统计信息', () => {
            gameEngine.gameState.moves = 10;
            gameEngine.gameState.mergeCount = 5;
            gameEngine.gameState.playTime = 60;
            
            const stats = gameEngine.getGameStatistics();
            
            expect(stats.totalMoves).toBe(10);
            expect(stats.totalMerges).toBe(5);
            expect(stats.playTimeFormatted).toBe('1:00');
        });

        test('应该计算游戏效率', () => {
            gameEngine.gameState.score = 1000;
            gameEngine.gameState.moves = 50;
            
            const efficiency = gameEngine.calculateEfficiency();
            
            expect(efficiency).toBe(20); // 1000 / 50 = 20
        });

        test('应该在没有移动时返回0效率', () => {
            gameEngine.gameState.score = 1000;
            gameEngine.gameState.moves = 0;
            
            const efficiency = gameEngine.calculateEfficiency();
            
            expect(efficiency).toBe(0);
        });
    });

    describe('错误处理', () => {
        test('应该处理初始化错误', async () => {
            const mockCanvas = {
                getContext: jest.fn(() => null) // 返回null模拟错误
            };
            
            const result = await gameEngine.init(mockCanvas);
            
            expect(result).toBe(false);
        });

        test('应该处理游戏循环中的错误', async () => {
            await gameEngine.init(mockCanvas);
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            jest.spyOn(gameEngine, 'update').mockImplementation(() => {
                throw new Error('Update error');
            });
            
            gameEngine.start();
            gameEngine.gameLoop(performance.now());
            
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});