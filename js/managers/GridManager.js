/**
 * GridManager类 - 网格管理器
 * 处理方块移动、合并逻辑和游戏状态检查
 */
class GridManager {
    constructor(size = 4) {
        this.size = size;
        this.gameState = null;
        
        // 移动方向常量
        this.DIRECTIONS = {
            UP: { x: 0, y: -1, name: 'up' },
            DOWN: { x: 0, y: 1, name: 'down' },
            LEFT: { x: -1, y: 0, name: 'left' },
            RIGHT: { x: 1, y: 0, name: 'right' }
        };
        
        console.log('GridManager 初始化完成');
    }

    /**
     * 设置游戏状态引用
     * @param {GameState} gameState - 游戏状态对象
     */
    setGameState(gameState) {
        this.gameState = gameState;
    }

    /**
     * 获取指定位置的方块
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Tile|null} 方块或null
     */
    getTile(x, y) {
        if (!this.gameState) return null;
        return this.gameState.getTile(x, y);
    }

    /**
     * 设置指定位置的方块
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Tile|null} tile - 方块或null
     */
    setTile(x, y, tile) {
        if (!this.gameState) return;
        this.gameState.setTile(x, y, tile);
    }

    /**
     * 获取所有空位置
     * @returns {Array<{x: number, y: number}>} 空位置数组
     */
    getEmptyTiles() {
        if (!this.gameState) return [];
        return this.gameState.getEmptyTiles();
    }

    /**
     * 检查指定方向是否可以移动
     * @param {Object} direction - 移动方向
     * @returns {boolean} 是否可以移动
     */
    canMove(direction) {
        if (!this.gameState) return false;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const tile = this.getTile(x, y);
                if (tile && this.canTileMove(tile, direction)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 检查单个方块是否可以在指定方向移动
     * @param {Tile} tile - 方块
     * @param {Object} direction - 移动方向
     * @returns {boolean} 是否可以移动
     */
    canTileMove(tile, direction) {
        const newX = tile.x + direction.x;
        const newY = tile.y + direction.y;

        // 检查边界
        if (newX < 0 || newX >= this.size || newY < 0 || newY >= this.size) {
            return false;
        }

        const targetTile = this.getTile(newX, newY);
        
        // 目标位置为空，可以移动
        if (!targetTile) {
            return true;
        }

        // 目标位置有方块，检查是否可以合并
        return tile.canMergeWith(targetTile);
    }

    /**
     * 向指定方向移动所有方块
     * @param {Object} direction - 移动方向
     * @returns {Object} 移动结果 {moved: boolean, merged: Array, score: number}
     */
    moveTiles(direction) {
        if (!this.gameState || !this.canMove(direction)) {
            return { moved: false, merged: [], score: 0 };
        }

        // 重置所有方块的合并标志
        this.resetTileFlags();

        let moved = false;
        let totalScore = 0;
        const mergedTiles = [];

        // 根据移动方向确定遍历顺序
        const traversals = this.buildTraversals(direction);

        // 遍历所有位置
        traversals.x.forEach(x => {
            traversals.y.forEach(y => {
                const tile = this.getTile(x, y);
                if (tile) {
                    const moveResult = this.moveTile(tile, direction);
                    if (moveResult.moved) {
                        moved = true;
                    }
                    if (moveResult.merged && moveResult.mergedTile) {
                        mergedTiles.push(moveResult.mergedTile);
                        totalScore += moveResult.score;
                    }
                }
            });
        });

        // 更新游戏状态
        if (moved) {
            this.gameState.incrementMoves();
            this.gameState.addScore(totalScore);
            
            if (mergedTiles.length > 0) {
                this.gameState.incrementMergeCount(Math.max(...mergedTiles.map(t => t.value)));
            } else {
                this.gameState.resetConsecutiveMerges();
            }
        }

        return {
            moved,
            merged: mergedTiles,
            score: totalScore
        };
    }

    /**
     * 移动单个方块
     * @param {Tile} tile - 要移动的方块
     * @param {Object} direction - 移动方向
     * @returns {Object} 移动结果
     */
    moveTile(tile, direction) {
        const startX = tile.x;
        const startY = tile.y;
        let currentX = startX;
        let currentY = startY;
        let merged = false;
        let mergedTile = null;
        let score = 0;

        // 持续移动直到不能移动为止
        while (true) {
            const nextX = currentX + direction.x;
            const nextY = currentY + direction.y;

            // 检查边界
            if (nextX < 0 || nextX >= this.size || nextY < 0 || nextY >= this.size) {
                break;
            }

            const nextTile = this.getTile(nextX, nextY);

            if (!nextTile) {
                // 目标位置为空，继续移动
                currentX = nextX;
                currentY = nextY;
            } else if (tile.canMergeWith(nextTile)) {
                // 可以合并
                currentX = nextX;
                currentY = nextY;
                merged = true;
                
                // 创建合并后的新方块
                const newValue = tile.getMergedValue();
                mergedTile = new Tile(currentX, currentY, newValue);
                mergedTile.markAsMerged([tile, nextTile]);
                
                score = newValue;
                break;
            } else {
                // 目标位置被占用且不能合并，停止移动
                break;
            }
        }

        // 如果位置发生了变化
        if (currentX !== startX || currentY !== startY) {
            // 清除原位置
            this.setTile(startX, startY, null);

            if (merged) {
                // 设置合并后的方块
                this.setTile(currentX, currentY, mergedTile);
            } else {
                // 移动方块到新位置
                tile.updatePosition(currentX, currentY);
                this.setTile(currentX, currentY, tile);
            }

            return {
                moved: true,
                merged,
                mergedTile,
                score
            };
        }

        return {
            moved: false,
            merged: false,
            mergedTile: null,
            score: 0
        };
    }

    /**
     * 构建遍历顺序
     * @param {Object} direction - 移动方向
     * @returns {Object} 遍历顺序 {x: Array, y: Array}
     */
    buildTraversals(direction) {
        const traversals = { x: [], y: [] };

        for (let pos = 0; pos < this.size; pos++) {
            traversals.x.push(pos);
            traversals.y.push(pos);
        }

        // 根据移动方向调整遍历顺序
        if (direction.x === 1) traversals.x = traversals.x.reverse(); // 向右移动
        if (direction.y === 1) traversals.y = traversals.y.reverse(); // 向下移动

        return traversals;
    }

    /**
     * 重置所有方块的状态标志
     */
    resetTileFlags() {
        if (!this.gameState) return;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const tile = this.getTile(x, y);
                if (tile) {
                    tile.resetFlags();
                }
            }
        }
    }

    /**
     * 在随机空位置添加新方块
     * @param {number} value - 方块数值（默认随机2或4）
     * @returns {Tile|null} 新添加的方块或null
     */
    addRandomTile(value = null) {
        const emptyTiles = this.getEmptyTiles();
        
        if (emptyTiles.length === 0) {
            return null; // 没有空位置
        }

        // 随机选择一个空位置
        const randomIndex = Math.floor(Math.random() * emptyTiles.length);
        const position = emptyTiles[randomIndex];

        // 随机生成2或4（90%概率是2，10%概率是4）
        if (value === null) {
            value = Math.random() < 0.9 ? 2 : 4;
        }

        // 创建新方块
        const newTile = new Tile(position.x, position.y, value);
        newTile.markAsNew();

        // 添加到网格
        this.setTile(position.x, position.y, newTile);

        return newTile;
    }

    /**
     * 检查游戏是否结束
     * @returns {boolean} 是否游戏结束
     */
    isGameOver() {
        // 如果还有空位置，游戏未结束
        if (this.getEmptyTiles().length > 0) {
            return false;
        }

        // 检查是否还能移动（任何方向）
        for (const direction of Object.values(this.DIRECTIONS)) {
            if (this.canMove(direction)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 检查是否获胜（达到2048）
     * @returns {boolean} 是否获胜
     */
    isWon() {
        if (!this.gameState) return false;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const tile = this.getTile(x, y);
                if (tile && tile.value >= 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 获取最大方块数值
     * @returns {number} 最大数值
     */
    getMaxTileValue() {
        let maxValue = 0;
        
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const tile = this.getTile(x, y);
                if (tile && tile.value > maxValue) {
                    maxValue = tile.value;
                }
            }
        }
        
        return maxValue;
    }

    /**
     * 获取网格状态的字符串表示（用于调试）
     * @returns {string} 网格状态
     */
    getGridString() {
        let result = '';
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const tile = this.getTile(x, y);
                result += (tile ? tile.value.toString().padStart(4) : '   .') + ' ';
            }
            result += '\n';
        }
        return result;
    }

    /**
     * 计算可能的移动数量
     * @returns {number} 可能的移动数量
     */
    getAvailableMovesCount() {
        let count = 0;
        for (const direction of Object.values(this.DIRECTIONS)) {
            if (this.canMove(direction)) {
                count++;
            }
        }
        return count;
    }

    /**
     * 获取网格填充率
     * @returns {number} 填充率（0-1）
     */
    getFillRate() {
        const totalCells = this.size * this.size;
        const emptyCells = this.getEmptyTiles().length;
        return (totalCells - emptyCells) / totalCells;
    }

    /**
     * 预测移动结果（不实际执行移动）
     * @param {Object} direction - 移动方向
     * @returns {Object} 预测结果
     */
    predictMove(direction) {
        if (!this.gameState) {
            return { canMove: false, score: 0, merges: 0 };
        }

        // 创建网格状态的副本
        const originalGrid = this.cloneGrid();
        
        // 执行移动
        const result = this.moveTiles(direction);
        
        // 恢复原始状态
        this.restoreGrid(originalGrid);
        
        return {
            canMove: result.moved,
            score: result.score,
            merges: result.merged.length
        };
    }

    /**
     * 获取网格数据（用于保存游戏状态）
     * @returns {Array} 可序列化的网格数据
     */
    getGridData() {
        const gridData = [];
        for (let x = 0; x < this.size; x++) {
            gridData[x] = [];
            for (let y = 0; y < this.size; y++) {
                const tile = this.getTile(x, y);
                if (tile) {
                    // 只保存必要的数据，避免循环引用
                    gridData[x][y] = {
                        x: tile.x,
                        y: tile.y,
                        value: tile.value,
                        id: tile.id,
                        isNew: tile.isNew || false,
                        isMerged: tile.isMerged || false
                    };
                } else {
                    gridData[x][y] = null;
                }
            }
        }
        return gridData;
    }

    /**
     * 从网格数据恢复网格状态
     * @param {Array} gridData - 网格数据
     */
    restoreFromGridData(gridData) {
        if (!gridData || !this.gameState) return;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const tileData = gridData[x] && gridData[x][y];
                if (tileData) {
                    const tile = new Tile(tileData.x, tileData.y, tileData.value);
                    tile.id = tileData.id;
                    if (tileData.isNew) tile.markAsNew();
                    if (tileData.isMerged) tile.markAsMerged();
                    this.gameState.setTile(x, y, tile);
                } else {
                    this.gameState.setTile(x, y, null);
                }
            }
        }
    }

    /**
     * 克隆当前网格状态
     * @returns {Array} 网格副本
     */
    cloneGrid() {
        const clone = [];
        for (let x = 0; x < this.size; x++) {
            clone[x] = [];
            for (let y = 0; y < this.size; y++) {
                const tile = this.getTile(x, y);
                clone[x][y] = tile ? tile.clone() : null;
            }
        }
        return clone;
    }

    /**
     * 恢复网格状态
     * @param {Array} gridClone - 网格副本
     */
    restoreGrid(gridClone) {
        if (!this.gameState) return;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                this.gameState.setTile(x, y, gridClone[x][y]);
            }
        }
    }

    /**
     * 清空网格
     */
    clearGrid() {
        if (!this.gameState) return;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                this.setTile(x, y, null);
            }
        }
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        const emptyTiles = this.getEmptyTiles().length;
        const totalTiles = this.size * this.size;
        const filledTiles = totalTiles - emptyTiles;
        
        return {
            totalCells: totalTiles,
            filledCells: filledTiles,
            emptyCells: emptyTiles,
            fillRate: this.getFillRate(),
            maxValue: this.getMaxTileValue(),
            availableMoves: this.getAvailableMovesCount(),
            isGameOver: this.isGameOver(),
            isWon: this.isWon()
        };
    }
}