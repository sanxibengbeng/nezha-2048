/**
 * GameState类 - 管理游戏的整体状态
 * 包含分数、网格数据、技能状态等
 */
class GameState {
    constructor() {
        // 游戏基础状态
        this.grid = this.createEmptyGrid();  // 4x4网格数据
        this.score = 0;                      // 当前分数
        this.highScore = 0;                  // 最高分
        this.moves = 0;                      // 移动次数
        this.isGameOver = false;             // 游戏结束标志
        this.isPaused = false;               // 游戏暂停标志
        this.isWon = false;                  // 是否达到2048
        
        // 哪吒技能相关状态
        this.skillCooldowns = {
            threeHeadsSixArms: 0,    // 三头六臂冷却时间
            qiankunCircle: 0,        // 乾坤圈冷却时间
            huntianLing: 0,          // 混天绫冷却时间
            transformation: 0         // 哪吒变身冷却时间
        };
        
        this.activeSkills = {
            threeHeadsSixArms: false,    // 三头六臂是否激活
            transformation: false        // 变身模式是否激活
        };
        
        // 技能统计
        this.skillUsageCount = {
            threeHeadsSixArms: 0,
            qiankunCircle: 0,
            huntianLing: 0,
            transformation: 0
        };
        
        // 游戏统计
        this.mergeCount = 0;             // 总合并次数
        this.consecutiveMerges = 0;      // 连续合并次数
        this.maxTileValue = 2;           // 最大方块数值
        this.nezhaLevel = 1;             // 哪吒等级
        this.playTime = 0;               // 游戏时间（秒）
        
        // 时间戳
        this.startTime = Date.now();
        this.lastUpdateTime = Date.now();
    }

    /**
     * 创建空的4x4网格
     * @returns {Array<Array<Tile|null>>} 空网格
     */
    createEmptyGrid() {
        const grid = [];
        for (let x = 0; x < 4; x++) {
            grid[x] = [];
            for (let y = 0; y < 4; y++) {
                grid[x][y] = null;
            }
        }
        return grid;
    }

    /**
     * 获取指定位置的方块
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Tile|null} 方块或null
     */
    getTile(x, y) {
        if (x < 0 || x >= 4 || y < 0 || y >= 4) {
            return null;
        }
        return this.grid[x][y];
    }

    /**
     * 设置指定位置的方块
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Tile|null} tile - 方块或null
     */
    setTile(x, y, tile) {
        if (x >= 0 && x < 4 && y >= 0 && y < 4) {
            this.grid[x][y] = tile;
            if (tile) {
                tile.x = x;
                tile.y = y;
            }
        }
    }

    /**
     * 获取所有空位置
     * @returns {Array<{x: number, y: number}>} 空位置数组
     */
    getEmptyTiles() {
        const emptyTiles = [];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (!this.grid[x][y]) {
                    emptyTiles.push({ x, y });
                }
            }
        }
        return emptyTiles;
    }

    /**
     * 获取所有非空方块
     * @returns {Array<Tile>} 方块数组
     */
    getAllTiles() {
        const tiles = [];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (this.grid[x][y]) {
                    tiles.push(this.grid[x][y]);
                }
            }
        }
        return tiles;
    }

    /**
     * 增加分数
     * @param {number} points - 增加的分数
     */
    addScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
    }

    /**
     * 增加移动次数
     */
    incrementMoves() {
        this.moves++;
    }

    /**
     * 增加合并次数
     * @param {number} tileValue - 合并的方块数值
     */
    incrementMergeCount(tileValue) {
        this.mergeCount++;
        this.consecutiveMerges++;
        
        // 更新最大方块数值
        if (tileValue > this.maxTileValue) {
            this.maxTileValue = tileValue;
        }
        
        // 检查是否达到2048
        if (tileValue >= 2048 && !this.isWon) {
            this.isWon = true;
        }
        
        // 根据合并情况更新哪吒等级
        this.updateNezhaLevel();
    }

    /**
     * 重置连续合并次数
     */
    resetConsecutiveMerges() {
        this.consecutiveMerges = 0;
    }

    /**
     * 更新哪吒等级
     */
    updateNezhaLevel() {
        const newLevel = Math.floor(this.score / 1000) + 1;
        if (newLevel > this.nezhaLevel) {
            this.nezhaLevel = newLevel;
        }
    }

    /**
     * 激活技能
     * @param {string} skillName - 技能名称
     * @param {number} duration - 持续时间（毫秒）
     * @param {number} cooldown - 冷却时间（毫秒）
     */
    activateSkill(skillName, duration = 0, cooldown = 10000) {
        if (this.skillCooldowns[skillName] <= 0) {
            this.skillUsageCount[skillName]++;
            this.skillCooldowns[skillName] = cooldown;
            
            if (duration > 0) {
                this.activeSkills[skillName] = true;
                setTimeout(() => {
                    this.activeSkills[skillName] = false;
                }, duration);
            }
            
            return true;
        }
        return false;
    }

    /**
     * 更新技能冷却时间
     * @param {number} deltaTime - 时间差（毫秒）
     */
    updateSkillCooldowns(deltaTime) {
        for (const skill in this.skillCooldowns) {
            if (this.skillCooldowns[skill] > 0) {
                this.skillCooldowns[skill] = Math.max(0, this.skillCooldowns[skill] - deltaTime);
            }
        }
    }

    /**
     * 检查技能是否可用
     * @param {string} skillName - 技能名称
     * @returns {boolean} 是否可用
     */
    isSkillAvailable(skillName) {
        return this.skillCooldowns[skillName] <= 0;
    }

    /**
     * 获取技能冷却进度（0-1）
     * @param {string} skillName - 技能名称
     * @param {number} maxCooldown - 最大冷却时间
     * @returns {number} 冷却进度
     */
    getSkillCooldownProgress(skillName, maxCooldown) {
        return Math.max(0, this.skillCooldowns[skillName] / maxCooldown);
    }

    /**
     * 更新游戏时间
     */
    updatePlayTime() {
        const now = Date.now();
        this.playTime += (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;
    }

    /**
     * 重置游戏状态
     */
    reset() {
        this.grid = this.createEmptyGrid();
        this.score = 0;
        this.moves = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.isWon = false;
        
        // 重置技能状态
        for (const skill in this.skillCooldowns) {
            this.skillCooldowns[skill] = 0;
        }
        for (const skill in this.activeSkills) {
            this.activeSkills[skill] = false;
        }
        for (const skill in this.skillUsageCount) {
            this.skillUsageCount[skill] = 0;
        }
        
        // 重置统计
        this.mergeCount = 0;
        this.consecutiveMerges = 0;
        this.maxTileValue = 2;
        this.nezhaLevel = 1;
        this.playTime = 0;
        
        // 重置时间
        this.startTime = Date.now();
        this.lastUpdateTime = Date.now();
    }

    /**
     * 转换为JSON对象（用于保存游戏）
     * @returns {Object} JSON表示
     */
    toJSON() {
        return {
            grid: this.grid.map(row => row.map(tile => tile ? tile.toJSON() : null)),
            score: this.score,
            highScore: this.highScore,
            moves: this.moves,
            isGameOver: this.isGameOver,
            isPaused: this.isPaused,
            isWon: this.isWon,
            skillCooldowns: { ...this.skillCooldowns },
            activeSkills: { ...this.activeSkills },
            skillUsageCount: { ...this.skillUsageCount },
            mergeCount: this.mergeCount,
            consecutiveMerges: this.consecutiveMerges,
            maxTileValue: this.maxTileValue,
            nezhaLevel: this.nezhaLevel,
            playTime: this.playTime,
            startTime: this.startTime
        };
    }

    /**
     * 从JSON对象恢复游戏状态
     * @param {Object} json - JSON数据
     */
    fromJSON(json) {
        // 恢复网格
        this.grid = json.grid.map(row => 
            row.map(tileData => tileData ? Tile.fromJSON(tileData) : null)
        );
        
        // 恢复基础状态
        this.score = json.score || 0;
        this.highScore = json.highScore || 0;
        this.moves = json.moves || 0;
        this.isGameOver = json.isGameOver || false;
        this.isPaused = json.isPaused || false;
        this.isWon = json.isWon || false;
        
        // 恢复技能状态
        this.skillCooldowns = { ...this.skillCooldowns, ...json.skillCooldowns };
        this.activeSkills = { ...this.activeSkills, ...json.activeSkills };
        this.skillUsageCount = { ...this.skillUsageCount, ...json.skillUsageCount };
        
        // 恢复统计
        this.mergeCount = json.mergeCount || 0;
        this.consecutiveMerges = json.consecutiveMerges || 0;
        this.maxTileValue = json.maxTileValue || 2;
        this.nezhaLevel = json.nezhaLevel || 1;
        this.playTime = json.playTime || 0;
        this.startTime = json.startTime || Date.now();
        this.lastUpdateTime = Date.now();
    }
}