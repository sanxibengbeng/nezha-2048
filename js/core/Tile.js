/**
 * Tile类 - 表示游戏中的单个方块
 * 包含位置、数值和状态信息
 */
class Tile {
    constructor(x, y, value) {
        this.x = x;                    // 网格X坐标 (0-3)
        this.y = y;                    // 网格Y坐标 (0-3)
        this.value = value;            // 方块数值 (2, 4, 8, 16, ...)
        this.previousX = x;            // 移动前的X坐标
        this.previousY = y;            // 移动前的Y坐标

        // 状态标志
        this.isNew = false;            // 是否为新生成的方块
        this.isMerged = false;         // 是否刚刚合并
        this.mergedFrom = null;        // 合并来源方块数组

        // 视觉相关
        this.sprite = null;            // 哪吒主题精灵图标
        this.element = null;           // DOM元素引用

        // 动画相关
        this.animationState = 'idle';  // 动画状态: idle, moving, merging, appearing
        this.animationProgress = 0;    // 动画进度 (0-1)
    }

    /**
     * 更新方块位置
     * @param {number} x - 新的X坐标
     * @param {number} y - 新的Y坐标
     */
    updatePosition(x, y) {
        this.previousX = this.x;
        this.previousY = this.y;
        this.x = x;
        this.y = y;
    }

    /**
     * 标记为新生成的方块
     */
    markAsNew() {
        this.isNew = true;
        this.animationState = 'appearing';
    }

    /**
     * 标记为合并的方块
     * @param {Array<Tile>} fromTiles - 合并来源的方块数组
     */
    markAsMerged(fromTiles) {
        this.isMerged = true;
        this.mergedFrom = fromTiles;
        this.animationState = 'merging';
    }

    /**
     * 重置状态标志
     */
    resetFlags() {
        this.isNew = false;
        this.isMerged = false;
        this.mergedFrom = null;
        this.animationState = 'idle';
        this.animationProgress = 0;
    }

    /**
     * 获取方块的哪吒主题图标
     * @returns {string} 对应的哪吒元素符号
     */
    getNezhaSymbol() {
        const symbols = {
            2: '🪷',      // 莲花
            4: '🔥',      // 火焰 (火尖枪)
            8: '🌊',      // 波浪 (混天绫)
            16: '⭕',     // 圆圈 (乾坤圈)
            32: '⚡',     // 闪电 (神力)
            64: '🗡️',     // 剑 (神兵)
            128: '👑',    // 王冠 (太子)
            256: '🐉',    // 龙 (龙王)
            512: '🔱',    // 三叉戟 (神器)
            1024: '🌟',   // 星星 (神光)
            2048: '👼',   // 天使 (哪吒真身)
        };
        return symbols[this.value] || '✨';
    }

    /**
     * 获取方块的CSS类名
     * @returns {string} CSS类名
     */
    getCSSClass() {
        return `tile tile-${this.value}`;
    }

    /**
     * 检查是否可以与另一个方块合并
     * @param {Tile} otherTile - 另一个方块
     * @returns {boolean} 是否可以合并
     */
    canMergeWith(otherTile) {
        return otherTile && this.value === otherTile.value && !this.isMerged && !otherTile.isMerged;
    }

    /**
     * 获取合并后的新数值
     * @returns {number} 合并后的数值
     */
    getMergedValue() {
        return this.value * 2;
    }

    /**
     * 克隆方块
     * @returns {Tile} 新的方块实例
     */
    clone() {
        const newTile = new Tile(this.x, this.y, this.value);
        newTile.previousX = this.previousX;
        newTile.previousY = this.previousY;
        newTile.isNew = this.isNew;
        newTile.isMerged = this.isMerged;
        newTile.animationState = this.animationState;
        newTile.animationProgress = this.animationProgress;
        return newTile;
    }

    /**
     * 转换为JSON对象（用于保存游戏状态）
     * @returns {Object} JSON表示
     */
    toJSON() {
        return {
            x: this.x,
            y: this.y,
            value: this.value,
            previousX: this.previousX,
            previousY: this.previousY,
            isNew: this.isNew,
            isMerged: this.isMerged
        };
    }

    /**
     * 从JSON对象创建Tile实例
     * @param {Object} json - JSON数据
     * @returns {Tile} Tile实例
     */
    static fromJSON(json) {
        const tile = new Tile(json.x, json.y, json.value);
        tile.previousX = json.previousX;
        tile.previousY = json.previousY;
        tile.isNew = json.isNew || false;
        tile.isMerged = json.isMerged || false;
        return tile;
    }

    /**
     * 计算方块在Canvas上的像素位置
     * @param {number} canvasSize - Canvas尺寸
     * @param {number} gridSize - 网格大小（默认4）
     * @returns {Object} 像素位置 {x, y, width, height}
     */
    getCanvasPosition(canvasSize, gridSize = 4) {
        const cellSize = canvasSize / gridSize;
        const gap = cellSize * 0.1;
        const actualCellSize = cellSize - gap;

        return {
            x: this.x * cellSize + gap,
            y: this.y * cellSize + gap,
            width: actualCellSize,
            height: actualCellSize
        };
    }

    /**
     * 计算移动动画的中间位置
     * @param {number} canvasSize - Canvas尺寸
     * @param {number} progress - 动画进度 (0-1)
     * @param {number} gridSize - 网格大小（默认4）
     * @returns {Object} 中间位置 {x, y, width, height}
     */
    getAnimatedPosition(canvasSize, progress, gridSize = 4) {
        const cellSize = canvasSize / gridSize;
        const gap = cellSize * 0.1;
        const actualCellSize = cellSize - gap;

        // 计算起始和结束位置
        const startX = this.previousX * cellSize + gap;
        const startY = this.previousY * cellSize + gap;
        const endX = this.x * cellSize + gap;
        const endY = this.y * cellSize + gap;

        // 使用缓动函数计算中间位置
        const easedProgress = this.easeInOutCubic(progress);

        return {
            x: startX + (endX - startX) * easedProgress,
            y: startY + (endY - startY) * easedProgress,
            width: actualCellSize,
            height: actualCellSize
        };
    }

    /**
     * 缓动函数 - 三次贝塞尔曲线
     * @param {number} t - 时间参数 (0-1)
     * @returns {number} 缓动后的值
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * 获取方块的缩放比例（用于出现和合并动画）
     * @returns {number} 缩放比例
     */
    getScale() {
        switch (this.animationState) {
            case 'appearing':
                return 0.5 + 0.5 * this.animationProgress;
            case 'merging':
                return 1 + 0.2 * Math.sin(this.animationProgress * Math.PI);
            default:
                return 1;
        }
    }

    /**
     * 获取方块的透明度
     * @returns {number} 透明度 (0-1)
     */
    getOpacity() {
        switch (this.animationState) {
            case 'appearing':
                return this.animationProgress;
            case 'disappearing':
                return 1 - this.animationProgress;
            default:
                return 1;
        }
    }

    /**
     * 在Canvas上渲染方块
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {number} canvasSize - Canvas尺寸
     * @param {ThemeConfig} themeConfig - 主题配置
     * @param {number} gridSize - 网格大小
     */
    render(ctx, canvasSize, themeConfig, gridSize = 4) {
        // 获取位置信息
        const pos = this.animationState === 'moving' && this.animationProgress < 1
            ? this.getAnimatedPosition(canvasSize, this.animationProgress, gridSize)
            : this.getCanvasPosition(canvasSize, gridSize);

        // 获取缩放和透明度
        const scale = this.getScale();
        const opacity = this.getOpacity();

        // 保存Canvas状态
        ctx.save();

        // 设置透明度
        ctx.globalAlpha = opacity;

        // 移动到方块中心进行缩放
        const centerX = pos.x + pos.width / 2;
        const centerY = pos.y + pos.height / 2;
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-pos.width / 2, -pos.height / 2);

        // 获取颜色配置
        const colors = themeConfig.getTileColor(this.value);

        // 绘制方块背景
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, pos.width, pos.height);

        // 绘制边框（如果需要）
        if (this.isMerged) {
            ctx.strokeStyle = themeConfig.colors.accent;
            ctx.lineWidth = 3;
            ctx.strokeRect(0, 0, pos.width, pos.height);
        }

        // 绘制方块内容
        this.renderContent(ctx, pos, colors, themeConfig);

        // 恢复Canvas状态
        ctx.restore();
    }

    /**
     * 渲染方块内容（数字或符号）
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {Object} pos - 位置信息
     * @param {Object} colors - 颜色配置
     * @param {ThemeConfig} themeConfig - 主题配置
     */
    renderContent(ctx, pos, colors, themeConfig) {
        ctx.fillStyle = colors.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 根据数值大小调整字体大小
        let fontSize = pos.width * 0.4;
        if (this.value >= 128) fontSize = pos.width * 0.35;
        if (this.value >= 1024) fontSize = pos.width * 0.3;

        ctx.font = `${fontSize}px 'Noto Sans SC', sans-serif`;

        // 获取显示内容
        const content = themeConfig.getTileSprite(this.value);

        // 绘制内容
        const centerX = pos.width / 2;
        const centerY = pos.height / 2;

        // 如果是哪吒主题，绘制符号
        if (themeConfig.themeName === 'nezha') {
            ctx.fillText(content, centerX, centerY);
        } else {
            // 经典主题，绘制数字
            ctx.fillText(this.value.toString(), centerX, centerY);
        }

        // 绘制特殊效果（如果是新方块或合并方块）
        if (this.isNew || this.isMerged) {
            this.renderSpecialEffects(ctx, pos, themeConfig);
        }
    }

    /**
     * 渲染特殊效果
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {Object} pos - 位置信息
     * @param {ThemeConfig} themeConfig - 主题配置
     */
    renderSpecialEffects(ctx, pos, themeConfig) {
        if (this.isNew) {
            // 新方块的光晕效果
            const gradient = ctx.createRadialGradient(
                pos.width / 2, pos.height / 2, 0,
                pos.width / 2, pos.height / 2, pos.width / 2
            );
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, pos.width, pos.height);
        }

        if (this.isMerged) {
            // 合并方块的闪烁效果
            const alpha = 0.5 + 0.5 * Math.sin(this.animationProgress * Math.PI * 4);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
            ctx.fillRect(0, 0, pos.width, pos.height);
        }
    }

    /**
     * 更新动画状态
     * @param {number} deltaTime - 时间差（毫秒）
     */
    updateAnimation(deltaTime) {
        if (this.animationState === 'idle') return;

        // 动画持续时间（毫秒）
        const animationDuration = {
            appearing: 300,
            merging: 400,
            moving: 150,
            disappearing: 200
        };

        const duration = animationDuration[this.animationState] || 300;
        const progressIncrement = deltaTime / duration;

        this.animationProgress += progressIncrement;

        // 动画完成
        if (this.animationProgress >= 1) {
            this.animationProgress = 1;
            this.completeAnimation();
        }
    }

    /**
     * 完成动画
     */
    completeAnimation() {
        switch (this.animationState) {
            case 'appearing':
                this.isNew = false;
                break;
            case 'merging':
                this.isMerged = false;
                break;
            case 'moving':
                this.previousX = this.x;
                this.previousY = this.y;
                break;
        }

        this.animationState = 'idle';
        this.animationProgress = 0;
    }

    /**
     * 开始移动动画
     */
    startMoveAnimation() {
        if (this.x !== this.previousX || this.y !== this.previousY) {
            this.animationState = 'moving';
            this.animationProgress = 0;
        }
    }

    /**
     * 检查动画是否完成
     * @returns {boolean} 是否完成
     */
    isAnimationComplete() {
        return this.animationState === 'idle' || this.animationProgress >= 1;
    }

    /**
     * 获取方块的调试信息
     * @returns {string} 调试信息
     */
    getDebugInfo() {
        return `Tile(${this.x},${this.y}): ${this.value} [${this.animationState}:${this.animationProgress.toFixed(2)}]`;
    }
}