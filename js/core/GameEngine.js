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
    init(canvas) {
        try {
            // 设置Canvas
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            
            if (!this.ctx) {
                throw new Error('无法获取Canvas 2D上下文');
            }

            // 设置Canvas属性
            this.setupCanvas();
            
            // 初始化游戏状态
            this.gameState.reset();
            
            // 设置GridManager的游戏状态引用
            this.gridManager.setGameState(this.gameState);
            
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
        
        // 重置游戏状态
        this.gameState.reset();
        
        // 清空Canvas
        this.clearCanvas();
        
        // 重置性能统计
        this.resetPerformanceStats();
        
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
        
        // 检查游戏结束条件
        this.checkGameOver();
        
        // 触发更新事件
        this.emit('update', { deltaTime });
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
        const cellSize = this.canvas.width / 4;
        const gap = cellSize * 0.1;
        const actualCellSize = cellSize - gap;
        
        tiles.forEach(tile => {
            const posX = tile.x * cellSize + gap;
            const posY = tile.y * cellSize + gap;
            
            // 获取方块颜色
            const colors = this.themeConfig.getTileColor(tile.value);
            
            // 绘制方块背景
            this.ctx.fillStyle = colors.bg;
            this.ctx.fillRect(posX, posY, actualCellSize, actualCellSize);
            
            // 绘制方块内容
            this.ctx.fillStyle = colors.text;
            this.ctx.font = `${actualCellSize * 0.4}px 'Noto Sans SC', sans-serif`;
            
            const symbol = this.themeConfig.getTileSprite(tile.value);
            const centerX = posX + actualCellSize / 2;
            const centerY = posY + actualCellSize / 2;
            
            this.ctx.fillText(symbol, centerX, centerY);
        });
    }

    /**
     * 渲染特效
     */
    renderEffects() {
        // 特效渲染将在动画系统中实现
        // 这里预留接口
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
            this.emit('gameOver', {
                score: this.gameState.score,
                highScore: this.gameState.highScore,
                moves: this.gameState.moves
            });
            console.log('游戏结束');
        }
        
        // 检查是否获胜
        if (this.gridManager.isWon() && !this.gameState.isWon) {
            this.gameState.isWon = true;
            this.emit('won', {
                score: this.gameState.score,
                moves: this.gameState.moves
            });
            console.log('恭喜获胜！');
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

        // 执行移动
        const result = this.gridManager.moveTiles(dir);
        
        if (result.moved) {
            // 添加新方块
            setTimeout(() => {
                this.gridManager.addRandomTile();
            }, 150); // 延迟添加，让移动动画完成

            // 触发移动事件
            this.emit('move', {
                direction,
                score: result.score,
                merged: result.merged
            });

            console.log(`移动${direction}, 得分:${result.score}, 合并:${result.merged.length}个`);
            return true;
        }

        return false;
    }

    /**
     * 获取网格管理器
     * @returns {GridManager} 网格管理器
     */
    getGridManager() {
        return this.gridManager;
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
        
        // 清理Canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        console.log('GameEngine 已销毁');
    }
}