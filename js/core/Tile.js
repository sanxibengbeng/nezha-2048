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
}