/**
 * GameEngine类 - 游戏引擎核心
 * 管理游戏主循环、状态转换和系统协调
 */
class GameEngine {
    constructor(config = {}) {
        // 配置参数
        this.config = {
            targetFPS: 60,
            canvas: null,
            gridSize: 4,
            ...config
        };

        // 游戏状态
        this.gameState = new GameState();
        this.themeConfig = new ThemeConfig('nezha');
        this.gridManager = new GridManager(4);
        this.inputManager = new InputManager(this);
        this.themeManager = new ThemeManager(this);
        this.animationSystem = new AnimationSystem();
        this.nezhaSkillSystem = new NezhaSkillSystem(this);
        this.audioManager = new AudioManager();
        this.effectsManager = null; // 将在init方法中初始化
        
        // 调试 StateManager 创建
        console.log('准备创建 StateManager...');
        console.log('StateManager 类型:', typeof StateManager);
        
        try {
            this.stateManager = new StateManager();
            console.log('StateManager 创建成功');
            console.log('stateManager 实例:', this.stateManager);
            console.log('stateManager.on 类型:', typeof this.stateManager.on);
            
            // 验证 StateManager 是否正常工作
            if (typeof this.stateManager.on !== 'function') {
                throw new Error('StateManager.on 方法不存在');
            }
            
        } catch (error) {
            console.error('StateManager 创建失败:', error);
            console.log('尝试使用备用 StateManager 实现...');
            
            // 使用备用实现
            this.stateManager = {
                eventListeners: new Map(),
                
                on: function(event, callback) {
                    if (!this.eventListeners.has(event)) {
                        this.eventListeners.set(event, []);
                    }
                    this.eventListeners.get(event).push(callback);
                },
                
                emit: function(event, data = null) {
                    if (this.eventListeners.has(event)) {
                        this.eventListeners.get(event).forEach(callback => {
                            try {
                                callback(data);
                            } catch (error) {
                                console.error(`事件处理器错误 (${event}):`, error);
                            }
                        });
                    }
                },
                
                saveGameState: function(gameState) {
                    console.log('保存游戏状态（简化实现）');
                },
                
                loadGameState: function() {
                    console.log('加载游戏状态（简化实现）');
                    return null;
                },
                
                clearGameState: function() {
                    console.log('清除游戏状态（简化实现）');
                },
                
                getHighScore: function() {
                    return 0;
                },
                
                updateStatistics: function(gameData) {
                    this.emit('statisticsUpdated', { statistics: {} });
                },
                
                calculateMergeScore: function(value, comboMultiplier = 1, skillMultiplier = 1) {
                    return value * comboMultiplier * skillMultiplier;
                },
                
                destroy: function() {
                    this.eventListeners.clear();
                }
            };
            
            console.log('备用 StateManager 创建成功');
        }
        
        // 渲染相关
        this.canvas = null;
        this.ctx = null;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        
        // 游戏循环控制
        this.isRunning = false;
        this.isPaused = false;
        this.animationFrameId = null;
        
        // 性能监控
        this.performanceStats = {
            frameTime: 0,
            updateTime: 0,
            renderTime: 0,
            memoryUsage: 0
        };
        
        // 事件系统
        this.eventListeners = new Map();
        
        console.log('GameEngine 初始化完成');
    }

    /**
     * 初始化游戏引擎
     * @param {HTMLCanvasElement} canvas - Canvas元素
     */
    async init(canvas) {
        try {
            // 设置Canvas
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            
            if (!this.ctx) {
                throw new Error('无法获取Canvas 2D上下文');
            }

            // 设置Canvas属性
            this.setupCanvas();
            
            // 初始化特效管理器（需要canvas）
            this.effectsManager = new EffectsManager(this.canvas);
            
            // 初始化游戏状态
            this.gameState.reset();
            
            // 设置GridManager的游戏状态引用
            this.gridManager.setGameState(this.gameState);
            
            // 初始化输入管理器
            this.inputManager.init();
            
            // 初始化主题管理器
            await this.themeManager.init('nezha');
            
            // 启动动画系统
            this.animationSystem.start();
            
            // 初始化音频管理器
            await this.audioManager.init();
            
            // 启动特效管理器
            if (this.effectsManager) {
                this.effectsManager.start();
            }
            
            // 绑定状态管理器事件
            this.bindStateManagerEvents();
            
            // 尝试加载保存的游戏状态
            this.loadSavedGame();
            
            // 绑定输入管理器事件
            this.bindInputEvents();
            
            // 绑定事件
            this.bindEvents();
            
            // 触发初始化完成事件
            this.emit('initialized');
            
            console.log('GameEngine 初始化成功');
            return true;
            
        } catch (error) {
            console.error('GameEngine 初始化失败:', error);
            this.emit('error', { type: 'initialization', error });
            return false;
        }
    }

    /**
     * 设置Canvas属性
     */
    setupCanvas() {
        // 设置Canvas尺寸
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight);
        
        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        
        // 设置渲染质量
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // 设置字体
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }

    /**
     * 开始游戏
     */
    start() {
        if (this.isRunning) {
            console.warn('游戏已经在运行中');
            return;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        
        // 开始游戏循环
        this.gameLoop();
        
        // 触发开始事件
        this.emit('started');
        
        console.log('游戏开始');
    }

    /**
     * 暂停游戏
     */
    pause() {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        this.isPaused = true;
        this.gameState.isPaused = true;
        
        // 取消动画帧
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.emit('paused');
        console.log('游戏暂停');
    }

    /**
     * 恢复游戏
     */
    resume() {
        if (!this.isRunning || !this.isPaused) {
            return;
        }

        this.isPaused = false;
        this.gameState.isPaused = false;
        this.lastFrameTime = performance.now();
        
        // 重新开始游戏循环
        this.gameLoop();
        
        this.emit('resumed');
        console.log('游戏恢复');
    }

    /**
     * 重置游戏
     */
    reset() {
        // 停止当前游戏
        this.stop();
        
        // 保存当前游戏统计（如果游戏进行中）
        if (this.gameState.moves > 0 && !this.gameState.isGameOver) {
            this.updateGameStatistics();
        }
        
        // 重置游戏状态
        this.gameState.reset();
        
        // 加载最高分
        this.gameState.highScore = this.stateManager.getHighScore();
        
        // 清除保存的游戏状态
        this.stateManager.clearGameState();
        
        // 清空Canvas
        this.clearCanvas();
        
        // 重置性能统计
        this.resetPerformanceStats();
        
        // 重置技能系统
        if (this.nezhaSkillSystem) {
            this.nezhaSkillSystem.reset();
        }
        
        // 停止音频
        if (this.audioManager) {
            this.audioManager.stopMusic();
        }
        
        this.emit('reset');
        console.log('游戏重置');
    }

    /**
     * 停止游戏
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.emit('stopped');
        console.log('游戏停止');
    }

    /**
     * 游戏主循环
     * @param {number} currentTime - 当前时间戳
     */
    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        const frameStartTime = performance.now();
        
        // 计算时间差
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // 限制最大时间差（防止长时间暂停后的跳跃）
        this.deltaTime = Math.min(this.deltaTime, 1000 / 30); // 最低30FPS
        
        try {
            // 更新游戏逻辑
            const updateStartTime = performance.now();
            this.update(this.deltaTime);
            this.performanceStats.updateTime = performance.now() - updateStartTime;
            
            // 渲染游戏
            const renderStartTime = performance.now();
            this.render();
            this.performanceStats.renderTime = performance.now() - renderStartTime;
            
            // 更新性能统计
            this.updatePerformanceStats(frameStartTime);
            
        } catch (error) {
            console.error('游戏循环错误:', error);
            this.emit('error', { type: 'gameLoop', error });
        }
        
        // 请求下一帧
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * 更新游戏逻辑
     * @param {number} deltaTime - 时间差（毫秒）
     */
    update(deltaTime) {
        // 更新游戏状态时间
        this.gameState.updatePlayTime();
        
        // 更新技能冷却
        this.gameState.updateSkillCooldowns(deltaTime);
        
        // 更新哪吒技能系统
        if (this.nezhaSkillSystem) {
            this.nezhaSkillSystem.update(deltaTime);
        }
        
        // 更新特效管理器
        if (this.effectsManager) {
            this.effectsManager.update(performance.now());
        }
        
        // 更新方块动画
        this.updateTileAnimations(deltaTime);
        
        // 检查游戏结束条件
        this.checkGameOver();
        
        // 触发更新事件
        this.emit('update', { deltaTime });
        
        // 定期更新游戏信息显示（每秒更新一次）
        if (this.frameCount % 60 === 0) {
            this.emit('gameInfoUpdate');
        }
    }

    /**
     * 更新方块动画
     * @param {number} deltaTime - 时间差（毫秒）
     */
    updateTileAnimations(deltaTime) {
        // 动画系统会自动更新，这里可以处理其他动画相关逻辑
        const tiles = this.gameState.getAllTiles();
        
        tiles.forEach(tile => {
            if (tile.updateAnimation) {
                tile.updateAnimation(deltaTime);
            }
        });
    }

    /**
     * 渲染游戏画面
     */
    render() {
        // 清空Canvas
        this.clearCanvas();
        
        // 绘制背景
        this.renderBackground();
        
        // 绘制网格
        this.renderGrid();
        
        // 绘制方块
        this.renderTiles();
        
        // 绘制特效（如果有）
        this.renderEffects();
        
        // 绘制调试信息（开发模式）
        if (this.config.debug) {
            this.renderDebugInfo();
        }
        
        // 触发渲染事件
        this.emit('render');
    }

    /**
     * 清空Canvas
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 渲染背景
     */
    renderBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#CD853F');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 渲染网格
     */
    renderGrid() {
        const cellSize = this.canvas.width / 4;
        const gap = cellSize * 0.1;
        const actualCellSize = cellSize - gap;
        
        this.ctx.fillStyle = '#BBADA0';
        this.ctx.fillRect(gap / 2, gap / 2, this.canvas.width - gap, this.canvas.height - gap);
        
        // 绘制空格子
        this.ctx.fillStyle = 'rgba(238, 228, 218, 0.35)';
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                const posX = x * cellSize + gap;
                const posY = y * cellSize + gap;
                this.ctx.fillRect(posX, posY, actualCellSize, actualCellSize);
            }
        }
    }

    /**
     * 渲染方块
     */
    renderTiles() {
        const tiles = this.gameState.getAllTiles();
        
        // 渲染所有方块
        tiles.forEach(tile => {
            tile.render(this.ctx, this.canvas.width, this.themeConfig, 4);
        });
    }

    /**
     * 渲染特效
     */
    renderEffects() {
        // 渲染粒子特效
        if (this.effectsManager) {
            this.effectsManager.render();
        }
    }

    /**
     * 渲染调试信息
     */
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

    /**
     * 检查游戏结束条件
     */
    checkGameOver() {
        // 使用GridManager检查游戏结束
        if (this.gridManager.isGameOver() && !this.gameState.isGameOver) {
            this.gameState.isGameOver = true;
            
            // 更新统计数据
            this.updateGameStatistics();
            
            // 检查是否创造新纪录
            const isNewRecord = this.stateManager.updateHighScore(this.gameState.score);
            
            // 清除保存的游戏状态
            this.stateManager.clearGameState();
            
            // 触发游戏结束事件，包含详细信息
            this.emit('gameOver', {
                score: this.gameState.score,
                highScore: this.gameState.highScore,
                moves: this.gameState.moves,
                playTime: this.gameState.playTime,
                maxTile: this.gridManager.getMaxTileValue(),
                isNewRecord: isNewRecord,
                statistics: this.getGameStatistics()
            });
            
            console.log('游戏结束 - 分数:', this.gameState.score, '移动次数:', this.gameState.moves);
        }
        
        // 检查是否获胜
        if (this.gridManager.isWon() && !this.gameState.isWon) {
            this.gameState.isWon = true;
            
            // 更新统计数据
            this.updateGameStatistics();
            
            this.emit('won', {
                score: this.gameState.score,
                moves: this.gameState.moves,
                playTime: this.gameState.playTime,
                maxTile: this.gridManager.getMaxTileValue()
            });
            console.log('恭喜获胜！达到2048');
        }
    }

    /**
     * 获取游戏统计信息
     * @returns {Object} 游戏统计
     */
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

    /**
     * 格式化游戏时间
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时间字符串
     */
    formatPlayTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * 计算游戏效率
     * @returns {number} 效率分数
     */
    calculateEfficiency() {
        if (this.gameState.moves === 0) return 0;
        return Math.floor(this.gameState.score / this.gameState.moves);
    }

    /**
     * 更新游戏统计数据
     */
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

    /**
     * 更新性能统计
     * @param {number} frameStartTime - 帧开始时间
     */
    updatePerformanceStats(frameStartTime) {
        this.performanceStats.frameTime = performance.now() - frameStartTime;
        this.frameCount++;
        
        // 每秒更新一次FPS
        if (this.frameCount % 60 === 0) {
            this.fps = 1000 / this.performanceStats.frameTime;
            
            // 更新内存使用情况（如果支持）
            if (performance.memory) {
                this.performanceStats.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
            }
        }
    }

    /**
     * 重置性能统计
     */
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

    /**
     * 绑定状态管理器事件
     */
    bindStateManagerEvents() {
        console.log('绑定 StateManager 事件...');
        
        if (!this.stateManager || typeof this.stateManager.on !== 'function') {
            console.error('StateManager 不可用，跳过事件绑定');
            return;
        }
        
        try {
            // 新最高分事件
            this.stateManager.on('newHighScore', (data) => {
                this.gameState.highScore = data.newScore;
                this.emit('newHighScore', data);
                console.log('新的最高分:', data.newScore);
            });
            
            // 成就解锁事件
            this.stateManager.on('achievementUnlocked', (data) => {
                this.emit('achievementUnlocked', data);
                console.log('成就解锁:', data.achievement);
            });
            
            // 统计更新事件
            this.stateManager.on('statisticsUpdated', (data) => {
                this.emit('statisticsUpdated', data);
            });
            
            // 存储错误事件
            this.stateManager.on('storageError', (data) => {
                console.warn('存储错误:', data);
                this.emit('storageError', data);
            });
            
            console.log('StateManager 事件绑定完成');
            
        } catch (error) {
            console.error('绑定 StateManager 事件失败:', error);
            // 不抛出错误，允许游戏继续运行
        }
    }

    /**
     * 加载保存的游戏
     */
    loadSavedGame() {
        try {
            const savedState = this.stateManager.loadGameState();
            
            if (savedState && !savedState.isGameOver) {
                // 恢复游戏状态
                this.gameState.score = savedState.score || 0;
                this.gameState.moves = savedState.moves || 0;
                this.gameState.playTime = savedState.playTime || 0;
                this.gameState.skillCooldowns = savedState.skillCooldowns || {};
                this.gameState.nezhaLevel = savedState.nezhaLevel || 1;
                this.gameState.consecutiveMerges = savedState.consecutiveMerges || 0;
                
                // 恢复网格状态
                if (savedState.grid) {
                    this.gridManager.restoreFromGridData(savedState.grid);
                }
                
                // 加载最高分
                this.gameState.highScore = this.stateManager.getHighScore();
                
                this.emit('gameStateRestored', { savedState });
                console.log('游戏状态已恢复');
            } else {
                // 加载最高分
                this.gameState.highScore = this.stateManager.getHighScore();
            }
        } catch (error) {
            console.error('加载保存的游戏失败:', error);
        }
    }

    /**
     * 保存当前游戏状态
     */
    saveCurrentGame() {
        try {
            // 准备游戏状态数据
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

    /**
     * 绑定输入管理器事件
     */
    bindInputEvents() {
        // 技能输入事件
        this.on('skillInput', (data) => {
            console.log('技能输入事件:', data.skillName);
            this.emit('skillActivated', data);
        });
        
        // 新游戏输入事件
        this.on('newGameInput', () => {
            console.log('新游戏输入事件');
            this.emit('newGameRequested');
        });
        
        // ESC键输入事件
        this.on('escapeInput', () => {
            console.log('ESC输入事件');
            this.emit('escapePressed');
        });
    }

    /**
     * 绑定窗口事件
     */
    bindEvents() {
        // 窗口大小改变
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
        
        // 页面可见性改变
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else if (this.isRunning) {
                this.resume();
            }
        });
    }

    /**
     * 添加事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
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

    /**
     * 获取游戏状态
     * @returns {GameState} 游戏状态
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * 获取主题配置
     * @returns {ThemeConfig} 主题配置
     */
    getThemeConfig() {
        return this.themeConfig;
    }

    /**
     * 获取性能统计
     * @returns {Object} 性能统计
     */
    getPerformanceStats() {
        return { ...this.performanceStats, fps: this.fps };
    }

    /**
     * 移动方块
     * @param {string} direction - 移动方向 ('up', 'down', 'left', 'right')
     * @returns {boolean} 是否成功移动
     */
    move(direction) {
        // 基础状态检查
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
            console.warn('无效的移动方向:', direction);
            return false;
        }

        // 检查是否可以移动
        if (!this.gridManager.canMove(dir)) {
            return false;
        }

        // 执行移动
        const result = this.gridManager.moveTiles(dir);
        
        if (result.moved) {
            // 启动移动动画
            this.startMoveAnimations();
            
            // 处理合并动画
            if (result.merged && result.merged.length > 0) {
                this.startMergeAnimations(result.merged);
                
                // 通知技能系统合并事件
                if (this.nezhaSkillSystem) {
                    this.nezhaSkillSystem.onMerge({
                        mergedTiles: result.merged,
                        totalScore: result.score
                    });
                }
            }
            
            // 记录移动前的状态（用于统计）
            const preMoveStats = this.gridManager.getStats();
            
            // 添加新方块（延迟添加，让移动和合并动画完成）
            setTimeout(() => {
                const newTile = this.gridManager.addRandomTile();
                if (newTile) {
                    newTile.markAsNew(); // 标记为新方块以触发动画
                }
                
                // 检查游戏状态变化
                this.checkGameStateChanges(preMoveStats);
                
                // 在添加新方块后检查游戏结束条件
                setTimeout(() => {
                    this.checkGameOver();
                }, 100);
            }, 300); // 增加延迟以等待合并动画完成

            // 触发移动事件
            this.emit('move', {
                direction,
                score: result.score,
                merged: result.merged,
                moveCount: this.gameState.moves,
                gridStats: this.gridManager.getStats()
            });

            console.log(`移动${direction}, 得分:${result.score}, 合并:${result.merged.length}个`);
            return true;
        }

        return false;
    }

    /**
     * 检查游戏状态变化
     * @param {Object} preStats - 移动前的统计信息
     */
    checkGameStateChanges(preStats) {
        const currentStats = this.gridManager.getStats();
        
        // 检查填充率变化
        if (currentStats.fillRate > 0.8 && preStats.fillRate <= 0.8) {
            this.emit('gridAlmostFull', { fillRate: currentStats.fillRate });
        }
        
        // 检查最大方块值变化
        if (currentStats.maxValue > preStats.maxValue) {
            this.emit('newMaxTile', { 
                oldMax: preStats.maxValue, 
                newMax: currentStats.maxValue 
            });
        }
        
        // 检查可用移动数量
        if (currentStats.availableMoves <= 1 && preStats.availableMoves > 1) {
            this.emit('limitedMoves', { availableMoves: currentStats.availableMoves });
        }
    }

    /**
     * 获取网格管理器
     * @returns {GridManager} 网格管理器
     */
    getGridManager() {
        return this.gridManager;
    }

    /**
     * 获取输入管理器
     * @returns {InputManager} 输入管理器
     */
    getInputManager() {
        return this.inputManager;
    }

    /**
     * 获取主题管理器
     * @returns {ThemeManager} 主题管理器
     */
    getThemeManager() {
        return this.themeManager;
    }

    /**
     * 获取动画系统
     * @returns {AnimationSystem} 动画系统
     */
    getAnimationSystem() {
        return this.animationSystem;
    }

    /**
     * 获取状态管理器
     * @returns {StateManager} 状态管理器
     */
    getStateManager() {
        return this.stateManager;
    }

    /**
     * 获取哪吒技能系统
     * @returns {NezhaSkillSystem} 哪吒技能系统
     */
    getNezhaSkillSystem() {
        return this.nezhaSkillSystem;
    }

    /**
     * 获取音频管理器
     * @returns {AudioManager} 音频管理器
     */
    getAudioManager() {
        return this.audioManager;
    }

    /**
     * 获取特效管理器
     * @returns {EffectsManager|null} 特效管理器
     */
    getEffectsManager() {
        return this.effectsManager;
    }

    /**
     * 启动移动动画
     */
    startMoveAnimations() {
        const tiles = this.gameState.getAllTiles();
        
        tiles.forEach(tile => {
            if (tile.needsMoveAnimation && tile.needsMoveAnimation()) {
                // 使用动画系统创建移动动画
                const fromPos = tile.getPreviousPosition();
                const toPos = tile.getCurrentPosition();
                
                this.animationSystem.createTileAnimation(tile, fromPos, toPos, () => {
                    tile.onMoveAnimationComplete();
                });
            }
            
            if (tile.isNew) {
                // 为新方块创建出现动画
                this.animationSystem.createTileAppearAnimation(tile, () => {
                    tile.isNew = false;
                });
            }
        });
    }

    /**
     * 启动合并动画
     * @param {Array} mergedTiles - 合并的方块数组
     */
    startMergeAnimations(mergedTiles) {
        console.log('startMergeAnimations called with:', mergedTiles);
        
        if (!mergedTiles || mergedTiles.length === 0) {
            return;
        }

        // 过滤掉无效的 tile
        const validMergedTiles = mergedTiles.filter(tile => {
            const isValid = tile !== null && tile !== undefined && 
                           typeof tile.x !== 'undefined' && typeof tile.y !== 'undefined';
            if (!isValid) {
                console.warn('发现无效的合并方块:', tile);
            }
            return isValid;
        });

        console.log('有效的合并方块:', validMergedTiles);

        if (validMergedTiles.length === 0) {
            console.warn('没有有效的合并方块');
            return;
        }

        // 准备合并动画数据
        const mergeData = validMergedTiles
            .map(tile => {
                // 计算方块在屏幕上的位置
                const position = this.getTileScreenPosition(tile);
                
                return {
                    tile: tile,
                    newValue: tile.value,
                    position: position
                };
            })
            .filter(data => data !== null); // 过滤掉无效的数据

        console.log('合并动画数据:', mergeData);

        if (mergeData.length === 0) {
            console.warn('没有有效的合并数据');
            return;
        }

        // 检查是否有连锁合并 - 使用过滤后的有效方块
        if (validMergedTiles.length > 1 && this.isChainMerge(mergeData)) {
            // 创建连锁合并动画
            this.animationSystem.createChainMergeAnimation(mergeData, () => {
                this.onMergeAnimationComplete(mergeData);
            });
        } else {
            // 创建同步合并动画
            this.animationSystem.createSynchronizedMergeAnimation(mergeData, () => {
                this.onMergeAnimationComplete(mergeData);
            });
        }

        // 触发合并事件
        this.emit('tilesmerged', {
            mergedTiles: validMergedTiles,
            totalScore: validMergedTiles.reduce((sum, merge) => sum + (merge.score || 0), 0)
        });
    }

    /**
     * 获取方块在屏幕上的位置
     * @param {Object} tile - 方块对象
     * @returns {Object} 屏幕位置 {x, y}
     */
    getTileScreenPosition(tile) {
        // 检查 tile 参数
        if (!tile || typeof tile.x === 'undefined' || typeof tile.y === 'undefined') {
            console.error('getTileScreenPosition: 无效的 tile 参数', tile);
            return { x: 0, y: 0 };
        }
        
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) {
            console.warn('getTileScreenPosition: 找不到 .game-area 元素');
            return { x: 0, y: 0 };
        }

        const rect = gameArea.getBoundingClientRect();
        const cellSize = rect.width / 4;
        
        return {
            x: rect.left + (tile.x + 0.5) * cellSize,
            y: rect.top + (tile.y + 0.5) * cellSize
        };
    }

    /**
     * 检查是否为连锁合并
     * @param {Array} mergeData - 合并数据数组，每个元素包含 {tile, newValue, position}
     * @returns {boolean} 是否为连锁合并
     */
    isChainMerge(mergeData) {
        // 如果有多个合并且它们的值相关联，则认为是连锁
        if (mergeData.length <= 1) {
            return false;
        }

        // 检查合并是否在相邻位置或形成链条
        for (let i = 0; i < mergeData.length - 1; i++) {
            const current = mergeData[i];
            const next = mergeData[i + 1];
            
            // 确保数据结构正确
            if (!current || !current.tile || !next || !next.tile) {
                console.warn('isChainMerge: 无效的合并数据', { current, next });
                continue;
            }
            
            // 检查是否相邻或值相关
            const isAdjacent = Math.abs(current.tile.x - next.tile.x) <= 1 && 
                              Math.abs(current.tile.y - next.tile.y) <= 1;
            const isValueRelated = current.newValue === next.newValue || 
                                  current.newValue * 2 === next.newValue ||
                                  next.newValue * 2 === current.newValue;
            
            if (isAdjacent && isValueRelated) {
                return true;
            }
        }

        return false;
    }

    /**
     * 合并动画完成回调
     * @param {Array} mergedTiles - 合并的方块数组
     */
    onMergeAnimationComplete(mergedTiles) {
        console.log('合并动画完成回调，接收到的数据:', mergedTiles);
        
        // 计算合并分数
        let totalScore = 0;
        mergedTiles.forEach((mergeInfo, index) => {
            console.log(`处理合并信息 ${index}:`, mergeInfo);
            
            // 确保 mergeInfo 有正确的结构
            let tileValue;
            if (mergeInfo && typeof mergeInfo === 'object') {
                // 如果是对象，尝试获取值
                tileValue = mergeInfo.newValue || mergeInfo.value || mergeInfo.tile?.value;
            } else if (typeof mergeInfo === 'number') {
                // 如果直接是数字
                tileValue = mergeInfo;
            }
            
            // 验证 tileValue
            if (!tileValue || typeof tileValue !== 'number' || isNaN(tileValue)) {
                console.warn('无效的方块值:', tileValue, '来自:', mergeInfo);
                return; // 跳过这个无效的合并信息
            }
            
            // 获取连击数，确保是有效数字
            const consecutiveMerges = Math.max(1, this.gameState.consecutiveMerges || 1);
            
            // 获取当前技能
            const currentSkill = this.gameState.currentSkill || null;
            
            console.log('计算分数参数:', { tileValue, consecutiveMerges, currentSkill });
            
            const score = this.stateManager.calculateMergeScore(
                tileValue,
                consecutiveMerges,
                currentSkill
            );
            
            console.log('计算得到的分数:', score);
            
            if (!isNaN(score) && score > 0) {
                totalScore += score;
            } else {
                console.warn('计算分数结果无效:', score);
            }
        });
        
        console.log('总分数:', totalScore);
        
        // 更新游戏分数
        if (!isNaN(totalScore) && totalScore > 0) {
            this.gameState.score += totalScore;
        }
        
        // 更新分数显示
        this.updateScoreDisplay();
        
        // 检查是否达成特殊成就
        this.checkMergeAchievements(mergedTiles);
        
        // 自动保存游戏状态
        if (!this.gameState.isGameOver) {
            this.saveCurrentGame();
        }
        
        // 触发合并完成事件
        this.emit('mergeAnimationComplete', {
            mergedTiles: mergedTiles,
            scoreGained: totalScore
        });
        
        console.log('合并动画完成:', mergedTiles.length, '个方块，得分:', totalScore);
    }

    /**
     * 检查合并成就
     * @param {Array} mergedTiles - 合并的方块数组
     */
    checkMergeAchievements(mergedTiles) {
        const maxValue = Math.max(...mergedTiles.map(m => m.newValue));
        
        // 检查是否达到特殊数值
        if (maxValue >= 2048 && !this.gameState.achieved2048) {
            this.gameState.achieved2048 = true;
            this.emit('achievement', {
                type: '2048',
                message: '🎉 恭喜达到2048！'
            });
        }
        
        if (maxValue >= 4096 && !this.gameState.achieved4096) {
            this.gameState.achieved4096 = true;
            this.emit('achievement', {
                type: '4096',
                message: '🌟 超越极限！达到4096！'
            });
        }
        
        // 检查连击
        if (mergedTiles.length >= 3) {
            this.gameState.consecutiveMerges = (this.gameState.consecutiveMerges || 0) + 1;
            this.emit('comboAchievement', {
                combo: this.gameState.consecutiveMerges,
                message: `🔥 ${this.gameState.consecutiveMerges}连击！`
            });
        } else {
            this.gameState.consecutiveMerges = 0;
        }
    }

    /**
     * 更新分数显示
     */
    updateScoreDisplay() {
        this.emit('scoreUpdated', {
            score: this.gameState.score,
            highScore: this.gameState.highScore,
            isNewRecord: this.gameState.score > this.gameState.highScore
        });
    }

    /**
     * 检查所有动画是否完成
     * @returns {boolean} 是否所有动画都完成
     */
    areAnimationsComplete() {
        return !this.animationSystem.hasActiveAnimations();
    }

    /**
     * 设置调试模式
     * @param {boolean} enabled - 是否启用调试
     */
    setDebugMode(enabled) {
        this.config.debug = enabled;
    }

    /**
     * 销毁游戏引擎
     */
    destroy() {
        this.stop();
        this.eventListeners.clear();
        
        // 销毁输入管理器
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        
        // 销毁主题管理器
        if (this.themeManager) {
            this.themeManager.destroy();
        }
        
        // 停止动画系统
        if (this.animationSystem) {
            this.animationSystem.stop();
            this.animationSystem.clearAllAnimations();
        }
        
        // 销毁状态管理器
        if (this.stateManager) {
            // 保存最终游戏状态
            if (this.gameState.moves > 0 && !this.gameState.isGameOver) {
                this.saveCurrentGame();
            }
            this.stateManager.destroy();
        }
        
        // 清理Canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        console.log('GameEngine 已销毁');
    }
}