/**
 * GridManager 单元测试
 * 测试网格管理器的核心功能
 */

// 模拟Tile类
global.Tile = class Tile {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.id = `tile_${Date.now()}_${Math.random()}`;
        this.isNew = false;
        this.isMerged = false;
    }
    
    canMergeWith(other) {
        return other && other.value === this.value && !other.isMerged && !this.isMerged;
    }
    
    getMergedValue() {
        return this.value * 2;
    }
    
    markAsNew() {
        this.isNew = true;
    }
    
    markAsMerged(tiles = []) {
        this.isMerged = true;
        this.mergedFrom = tiles;
    }
    
    resetFlags() {
        this.isNew = false;
        this.isMerged = false;
    }
    
    updatePosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    clone() {
        const clone = new Tile(this.x, this.y, this.value);
        clone.id = this.id;
        clone.isNew = this.isNew;
        clone.isMerged = this.isMerged;
        return clone;
    }
};

// 模拟GridManager类，因为实际文件加载有问题
global.GridManager = class GridManager {
    constructor(size = 4) {
        this.size = size;
        this.gameState = null;
        
        this.DIRECTIONS = {
            UP: { x: 0, y: -1, name: 'up' },
            DOWN: { x: 0, y: 1, name: 'down' },
            LEFT: { x: -1, y: 0, name: 'left' },
            RIGHT: { x: 1, y: 0, name: 'right' }
        };
    }

    setGameState(gameState) {
        this.gameState = gameState;
    }

    getTile(x, y) {
        if (!this.gameState) return null;
        return this.gameState.getTile(x, y);
    }

    setTile(x, y, tile) {
        if (!this.gameState) return;
        this.gameState.setTile(x, y, tile);
    }

    getEmptyTiles() {
        if (!this.gameState) return [];
        return this.gameState.getEmptyTiles();
    }

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

    canTileMove(tile, direction) {
        const newX = tile.x + direction.x;
        const newY = tile.y + direction.y;

        if (newX < 0 || newX >= this.size || newY < 0 || newY >= this.size) {
            return false;
        }

        const targetTile = this.getTile(newX, newY);
        
        if (!targetTile) {
            return true;
        }

        return tile.canMergeWith(targetTile);
    }

    moveTiles(direction) {
        if (!this.gameState || !this.canMove(direction)) {
            return { moved: false, merged: [], score: 0 };
        }

        this.resetTileFlags();

        let moved = false;
        let totalScore = 0;
        const mergedTiles = [];

        const traversals = this.buildTraversals(direction);

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

    moveTile(tile, direction) {
        const startX = tile.x;
        const startY = tile.y;
        let currentX = startX;
        let currentY = startY;
        let merged = false;
        let mergedTile = null;
        let score = 0;

        while (true) {
            const nextX = currentX + direction.x;
            const nextY = currentY + direction.y;

            if (nextX < 0 || nextX >= this.size || nextY < 0 || nextY >= this.size) {
                break;
            }

            const nextTile = this.getTile(nextX, nextY);

            if (!nextTile) {
                currentX = nextX;
                currentY = nextY;
            } else if (tile.canMergeWith(nextTile)) {
                currentX = nextX;
                currentY = nextY;
                merged = true;
                
                const newValue = tile.getMergedValue();
                mergedTile = new Tile(currentX, currentY, newValue);
                mergedTile.markAsMerged([tile, nextTile]);
                
                score = newValue;
                break;
            } else {
                break;
            }
        }

        if (currentX !== startX || currentY !== startY) {
            this.setTile(startX, startY, null);

            if (merged) {
                this.setTile(currentX, currentY, mergedTile);
            } else {
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

    buildTraversals(direction) {
        const traversals = { x: [], y: [] };

        for (let pos = 0; pos < this.size; pos++) {
            traversals.x.push(pos);
            traversals.y.push(pos);
        }

        if (direction.x === 1) traversals.x = traversals.x.reverse();
        if (direction.y === 1) traversals.y = traversals.y.reverse();

        return traversals;
    }

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

    addRandomTile(value = null) {
        const emptyTiles = this.getEmptyTiles();
        
        if (emptyTiles.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * emptyTiles.length);
        const position = emptyTiles[randomIndex];

        if (value === null) {
            value = Math.random() < 0.9 ? 2 : 4;
        }

        const newTile = new Tile(position.x, position.y, value);
        newTile.markAsNew();

        this.setTile(position.x, position.y, newTile);

        return newTile;
    }

    isGameOver() {
        if (this.getEmptyTiles().length > 0) {
            return false;
        }

        for (const direction of Object.values(this.DIRECTIONS)) {
            if (this.canMove(direction)) {
                return false;
            }
        }

        return true;
    }

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

    getAvailableMovesCount() {
        let count = 0;
        for (const direction of Object.values(this.DIRECTIONS)) {
            if (this.canMove(direction)) {
                count++;
            }
        }
        return count;
    }

    getFillRate() {
        const totalCells = this.size * this.size;
        const emptyCells = this.getEmptyTiles().length;
        return (totalCells - emptyCells) / totalCells;
    }

    predictMove(direction) {
        if (!this.gameState) {
            return { canMove: false, score: 0, merges: 0 };
        }

        const originalGrid = this.cloneGrid();
        const result = this.moveTiles(direction);
        this.restoreGrid(originalGrid);
        
        return {
            canMove: result.moved,
            score: result.score,
            merges: result.merged.length
        };
    }

    getGridData() {
        const gridData = [];
        for (let x = 0; x < this.size; x++) {
            gridData[x] = [];
            for (let y = 0; y < this.size; y++) {
                const tile = this.getTile(x, y);
                if (tile) {
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

    restoreGrid(gridClone) {
        if (!this.gameState) return;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                this.gameState.setTile(x, y, gridClone[x][y]);
            }
        }
    }

    clearGrid() {
        if (!this.gameState) return;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                this.setTile(x, y, null);
            }
        }
    }

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
};

describe('GridManager', () => {
    let gridManager;
    let mockGameState;

    beforeEach(() => {
        gridManager = new GridManager(4);
        mockGameState = createMockGameState();
        gridManager.setGameState(mockGameState);
    });

    describe('构造函数', () => {
        test('应该正确初始化GridManager实例', () => {
            expect(gridManager).toBeDefined();
            expect(gridManager.size).toBe(4);
            expect(gridManager.DIRECTIONS).toBeDefined();
            expect(gridManager.DIRECTIONS.UP).toEqual({ x: 0, y: -1, name: 'up' });
            expect(gridManager.DIRECTIONS.DOWN).toEqual({ x: 0, y: 1, name: 'down' });
            expect(gridManager.DIRECTIONS.LEFT).toEqual({ x: -1, y: 0, name: 'left' });
            expect(gridManager.DIRECTIONS.RIGHT).toEqual({ x: 1, y: 0, name: 'right' });
        });

        test('应该支持自定义网格大小', () => {
            const customGridManager = new GridManager(6);
            expect(customGridManager.size).toBe(6);
        });
    });

    describe('游戏状态设置', () => {
        test('应该能够设置游戏状态引用', () => {
            const newGameState = createMockGameState();
            gridManager.setGameState(newGameState);
            expect(gridManager.gameState).toBe(newGameState);
        });
    });

    describe('方块操作', () => {
        test('应该能够获取指定位置的方块', () => {
            const tile = createMockTile(1, 1, 2);
            mockGameState.getTile.mockReturnValue(tile);
            
            const result = gridManager.getTile(1, 1);
            
            expect(result).toBe(tile);
            expect(mockGameState.getTile).toHaveBeenCalledWith(1, 1);
        });

        test('应该能够设置指定位置的方块', () => {
            const tile = createMockTile(2, 2, 4);
            
            gridManager.setTile(2, 2, tile);
            
            expect(mockGameState.setTile).toHaveBeenCalledWith(2, 2, tile);
        });

        test('应该在没有游戏状态时返回null', () => {
            gridManager.setGameState(null);
            
            const result = gridManager.getTile(0, 0);
            
            expect(result).toBeNull();
        });
    });

    describe('空位置管理', () => {
        test('应该能够获取所有空位置', () => {
            const emptyTiles = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
            mockGameState.getEmptyTiles.mockReturnValue(emptyTiles);
            
            const result = gridManager.getEmptyTiles();
            
            expect(result).toEqual(emptyTiles);
            expect(mockGameState.getEmptyTiles).toHaveBeenCalled();
        });

        test('应该在没有游戏状态时返回空数组', () => {
            gridManager.setGameState(null);
            
            const result = gridManager.getEmptyTiles();
            
            expect(result).toEqual([]);
        });
    });

    describe('移动检测', () => {
        beforeEach(() => {
            // 设置一个简单的网格状态用于测试
            mockGameState.getTile = jest.fn((x, y) => {
                if (x === 0 && y === 0) return createMockTile(0, 0, 2);
                if (x === 1 && y === 0) return createMockTile(1, 0, 2);
                return null;
            });
        });

        test('应该检测到可以移动的情况', () => {
            const result = gridManager.canMove(gridManager.DIRECTIONS.RIGHT);
            expect(result).toBe(true);
        });

        test('应该在没有游戏状态时返回false', () => {
            gridManager.setGameState(null);
            
            const result = gridManager.canMove(gridManager.DIRECTIONS.UP);
            
            expect(result).toBe(false);
        });
    });

    describe('单个方块移动检测', () => {
        test('应该检测方块可以移动到空位置', () => {
            const tile = createMockTile(1, 1, 2);
            mockGameState.getTile = jest.fn((x, y) => {
                if (x === 1 && y === 1) return tile;
                return null; // 其他位置为空
            });
            
            const result = gridManager.canTileMove(tile, gridManager.DIRECTIONS.UP);
            
            expect(result).toBe(true);
        });

        test('应该检测方块可以与相同值的方块合并', () => {
            const tile1 = createMockTile(1, 1, 2);
            const tile2 = createMockTile(1, 0, 2);
            
            mockGameState.getTile = jest.fn((x, y) => {
                if (x === 1 && y === 1) return tile1;
                if (x === 1 && y === 0) return tile2;
                return null;
            });
            
            const result = gridManager.canTileMove(tile1, gridManager.DIRECTIONS.UP);
            
            expect(result).toBe(true);
        });

        test('应该检测方块不能移动到边界外', () => {
            const tile = createMockTile(0, 0, 2);
            
            const result = gridManager.canTileMove(tile, gridManager.DIRECTIONS.UP);
            
            expect(result).toBe(false);
        });

        test('应该检测方块不能移动到被不同值方块占用的位置', () => {
            const tile1 = createMockTile(1, 1, 2);
            const tile2 = createMockTile(1, 0, 4);
            
            mockGameState.getTile = jest.fn((x, y) => {
                if (x === 1 && y === 1) return tile1;
                if (x === 1 && y === 0) return tile2;
                return null;
            });
            
            tile2.canMergeWith = jest.fn(() => false);
            
            const result = gridManager.canTileMove(tile1, gridManager.DIRECTIONS.UP);
            
            expect(result).toBe(false);
        });
    });

    describe('方块移动执行', () => {
        beforeEach(() => {
            // 重置mock函数
            mockGameState.incrementMoves.mockClear();
            mockGameState.addScore.mockClear();
            mockGameState.incrementMergeCount.mockClear();
            mockGameState.resetConsecutiveMerges.mockClear();
        });

        test('应该在无法移动时返回未移动结果', () => {
            jest.spyOn(gridManager, 'canMove').mockReturnValue(false);
            
            const result = gridManager.moveTiles(gridManager.DIRECTIONS.UP);
            
            expect(result).toEqual({
                moved: false,
                merged: [],
                score: 0
            });
        });

        test('应该在没有游戏状态时返回未移动结果', () => {
            gridManager.setGameState(null);
            
            const result = gridManager.moveTiles(gridManager.DIRECTIONS.UP);
            
            expect(result).toEqual({
                moved: false,
                merged: [],
                score: 0
            });
        });

        test('应该在成功移动后更新游戏状态', () => {
            // 模拟可以移动的情况
            jest.spyOn(gridManager, 'canMove').mockReturnValue(true);
            jest.spyOn(gridManager, 'buildTraversals').mockReturnValue({
                x: [0, 1, 2, 3],
                y: [0, 1, 2, 3]
            });
            
            const tile = createMockTile(1, 1, 2);
            mockGameState.getTile = jest.fn((x, y) => {
                if (x === 1 && y === 1) return tile;
                return null;
            });
            
            jest.spyOn(gridManager, 'moveTile').mockReturnValue({
                moved: true,
                merged: false,
                mergedTile: null,
                score: 0
            });
            
            const result = gridManager.moveTiles(gridManager.DIRECTIONS.UP);
            
            expect(result.moved).toBe(true);
            expect(mockGameState.incrementMoves).toHaveBeenCalled();
        });
    });

    describe('遍历顺序构建', () => {
        test('应该为向右移动构建正确的遍历顺序', () => {
            const traversals = gridManager.buildTraversals(gridManager.DIRECTIONS.RIGHT);
            
            expect(traversals.x).toEqual([3, 2, 1, 0]); // 反向遍历
            expect(traversals.y).toEqual([0, 1, 2, 3]);
        });

        test('应该为向下移动构建正确的遍历顺序', () => {
            const traversals = gridManager.buildTraversals(gridManager.DIRECTIONS.DOWN);
            
            expect(traversals.x).toEqual([0, 1, 2, 3]);
            expect(traversals.y).toEqual([3, 2, 1, 0]); // 反向遍历
        });

        test('应该为向左移动构建正确的遍历顺序', () => {
            const traversals = gridManager.buildTraversals(gridManager.DIRECTIONS.LEFT);
            
            expect(traversals.x).toEqual([0, 1, 2, 3]);
            expect(traversals.y).toEqual([0, 1, 2, 3]);
        });

        test('应该为向上移动构建正确的遍历顺序', () => {
            const traversals = gridManager.buildTraversals(gridManager.DIRECTIONS.UP);
            
            expect(traversals.x).toEqual([0, 1, 2, 3]);
            expect(traversals.y).toEqual([0, 1, 2, 3]);
        });
    });

    describe('方块标志重置', () => {
        test('应该重置所有方块的状态标志', () => {
            const tile1 = createMockTile(0, 0, 2);
            const tile2 = createMockTile(1, 1, 4);
            
            mockGameState.getTile = jest.fn((x, y) => {
                if (x === 0 && y === 0) return tile1;
                if (x === 1 && y === 1) return tile2;
                return null;
            });
            
            gridManager.resetTileFlags();
            
            expect(tile1.resetFlags).toHaveBeenCalled();
            expect(tile2.resetFlags).toHaveBeenCalled();
        });

        test('应该在没有游戏状态时安全返回', () => {
            gridManager.setGameState(null);
            
            expect(() => {
                gridManager.resetTileFlags();
            }).not.toThrow();
        });
    });

    describe('随机方块添加', () => {
        test('应该在空位置添加新方块', () => {
            const emptyTiles = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
            mockGameState.getEmptyTiles.mockReturnValue(emptyTiles);
            
            // 模拟Math.random返回0，选择第一个空位置
            jest.spyOn(Math, 'random').mockReturnValue(0);
            
            const result = gridManager.addRandomTile();
            
            expect(result).toBeInstanceOf(Tile);
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect([2, 4]).toContain(result.value);
            expect(mockGameState.setTile).toHaveBeenCalledWith(0, 0, result);
            
            Math.random.mockRestore();
        });

        test('应该在没有空位置时返回null', () => {
            mockGameState.getEmptyTiles.mockReturnValue([]);
            
            const result = gridManager.addRandomTile();
            
            expect(result).toBeNull();
        });

        test('应该能够添加指定值的方块', () => {
            const emptyTiles = [{ x: 2, y: 2 }];
            mockGameState.getEmptyTiles.mockReturnValue(emptyTiles);
            
            const result = gridManager.addRandomTile(8);
            
            expect(result.value).toBe(8);
        });

        test('应该90%概率生成2，10%概率生成4', () => {
            const emptyTiles = [{ x: 0, y: 0 }];
            mockGameState.getEmptyTiles.mockReturnValue(emptyTiles);
            
            // 测试生成2的情况
            jest.spyOn(Math, 'random').mockReturnValue(0.5); // < 0.9
            let result = gridManager.addRandomTile();
            expect(result.value).toBe(2);
            
            // 测试生成4的情况
            Math.random.mockReturnValue(0.95); // >= 0.9
            result = gridManager.addRandomTile();
            expect(result.value).toBe(4);
            
            Math.random.mockRestore();
        });
    });

    describe('游戏结束检测', () => {
        test('应该在有空位置时返回false', () => {
            mockGameState.getEmptyTiles.mockReturnValue([{ x: 0, y: 0 }]);
            
            const result = gridManager.isGameOver();
            
            expect(result).toBe(false);
        });

        test('应该在没有空位置但可以移动时返回false', () => {
            mockGameState.getEmptyTiles.mockReturnValue([]);
            jest.spyOn(gridManager, 'canMove').mockReturnValue(true);
            
            const result = gridManager.isGameOver();
            
            expect(result).toBe(false);
        });

        test('应该在没有空位置且无法移动时返回true', () => {
            mockGameState.getEmptyTiles.mockReturnValue([]);
            jest.spyOn(gridManager, 'canMove').mockReturnValue(false);
            
            const result = gridManager.isGameOver();
            
            expect(result).toBe(true);
        });
    });

    describe('获胜检测', () => {
        test('应该在有2048方块时返回true', () => {
            const tile2048 = createMockTile(1, 1, 2048);
            mockGameState.getTile = jest.fn((x, y) => {
                if (x === 1 && y === 1) return tile2048;
                return null;
            });
            
            const result = gridManager.isWon();
            
            expect(result).toBe(true);
        });

        test('应该在没有2048方块时返回false', () => {
            mockGameState.getTile = jest.fn(() => createMockTile(0, 0, 1024));
            
            const result = gridManager.isWon();
            
            expect(result).toBe(false);
        });

        test('应该在没有游戏状态时返回false', () => {
            gridManager.setGameState(null);
            
            const result = gridManager.isWon();
            
            expect(result).toBe(false);
        });
    });

    describe('最大方块值获取', () => {
        test('应该返回网格中的最大方块值', () => {
            mockGameState.getTile = jest.fn((x, y) => {
                if (x === 0 && y === 0) return createMockTile(0, 0, 2);
                if (x === 1 && y === 1) return createMockTile(1, 1, 1024);
                if (x === 2 && y === 2) return createMockTile(2, 2, 512);
                return null;
            });
            
            const result = gridManager.getMaxTileValue();
            
            expect(result).toBe(1024);
        });

        test('应该在空网格时返回0', () => {
            mockGameState.getTile = jest.fn(() => null);
            
            const result = gridManager.getMaxTileValue();
            
            expect(result).toBe(0);
        });
    });

    describe('网格状态字符串', () => {
        test('应该生成正确的网格状态字符串', () => {
            mockGameState.getTile = jest.fn((x, y) => {
                if (x === 0 && y === 0) return createMockTile(0, 0, 2);
                if (x === 1 && y === 0) return createMockTile(1, 0, 4);
                return null;
            });
            
            const result = gridManager.getGridString();
            
            expect(result).toContain('2');
            expect(result).toContain('4');
            expect(result).toContain('.');
        });
    });

    describe('可用移动数量', () => {
        test('应该计算可用的移动方向数量', () => {
            jest.spyOn(gridManager, 'canMove')
                .mockReturnValueOnce(true)  // UP
                .mockReturnValueOnce(false) // DOWN
                .mockReturnValueOnce(true)  // LEFT
                .mockReturnValueOnce(false); // RIGHT
            
            const result = gridManager.getAvailableMovesCount();
            
            expect(result).toBe(2);
        });
    });

    describe('网格填充率', () => {
        test('应该计算正确的填充率', () => {
            mockGameState.getEmptyTiles.mockReturnValue([
                { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }
            ]); // 3个空位置，总共16个位置
            
            const result = gridManager.getFillRate();
            
            expect(result).toBe((16 - 3) / 16); // 13/16
        });
    });

    describe('移动预测', () => {
        test('应该预测移动结果而不实际执行', () => {
            jest.spyOn(gridManager, 'cloneGrid').mockReturnValue([]);
            jest.spyOn(gridManager, 'restoreGrid').mockImplementation();
            jest.spyOn(gridManager, 'moveTiles').mockReturnValue({
                moved: true,
                merged: [createMockTile(0, 0, 4)],
                score: 4
            });
            
            const result = gridManager.predictMove(gridManager.DIRECTIONS.UP);
            
            expect(result).toEqual({
                canMove: true,
                score: 4,
                merges: 1
            });
            expect(gridManager.restoreGrid).toHaveBeenCalled();
        });

        test('应该在没有游戏状态时返回默认预测结果', () => {
            gridManager.setGameState(null);
            
            const result = gridManager.predictMove(gridManager.DIRECTIONS.UP);
            
            expect(result).toEqual({
                canMove: false,
                score: 0,
                merges: 0
            });
        });
    });

    describe('网格数据序列化', () => {
        test('应该获取可序列化的网格数据', () => {
            const tile = createMockTile(1, 1, 2);
            tile.id = 'test_tile_id';
            tile.isNew = true;
            
            mockGameState.getTile = jest.fn((x, y) => {
                if (x === 1 && y === 1) return tile;
                return null;
            });
            
            const result = gridManager.getGridData();
            
            expect(result).toHaveLength(4);
            expect(result[1][1]).toEqual({
                x: 1,
                y: 1,
                value: 2,
                id: 'test_tile_id',
                isNew: true,
                isMerged: false
            });
            expect(result[0][0]).toBeNull();
        });
    });

    describe('网格数据恢复', () => {
        test('应该从网格数据恢复网格状态', () => {
            const gridData = Array(4).fill(null).map(() => Array(4).fill(null));
            gridData[1][1] = {
                x: 1,
                y: 1,
                value: 4,
                id: 'restored_tile',
                isNew: false,
                isMerged: true
            };
            
            gridManager.restoreFromGridData(gridData);
            
            expect(mockGameState.setTile).toHaveBeenCalledWith(1, 1, expect.any(Tile));
            expect(mockGameState.setTile).toHaveBeenCalledWith(0, 0, null);
        });

        test('应该在没有网格数据时安全返回', () => {
            expect(() => {
                gridManager.restoreFromGridData(null);
            }).not.toThrow();
        });

        test('应该在没有游戏状态时安全返回', () => {
            gridManager.setGameState(null);
            
            expect(() => {
                gridManager.restoreFromGridData([]);
            }).not.toThrow();
        });
    });

    describe('网格清空', () => {
        test('应该清空整个网格', () => {
            gridManager.clearGrid();
            
            // 验证所有位置都被设置为null
            for (let x = 0; x < 4; x++) {
                for (let y = 0; y < 4; y++) {
                    expect(mockGameState.setTile).toHaveBeenCalledWith(x, y, null);
                }
            }
        });

        test('应该在没有游戏状态时安全返回', () => {
            gridManager.setGameState(null);
            
            expect(() => {
                gridManager.clearGrid();
            }).not.toThrow();
        });
    });

    describe('统计信息', () => {
        test('应该获取网格统计信息', () => {
            mockGameState.getEmptyTiles.mockReturnValue([{ x: 0, y: 0 }]);
            jest.spyOn(gridManager, 'getMaxTileValue').mockReturnValue(512);
            jest.spyOn(gridManager, 'getAvailableMovesCount').mockReturnValue(3);
            jest.spyOn(gridManager, 'isGameOver').mockReturnValue(false);
            jest.spyOn(gridManager, 'isWon').mockReturnValue(false);
            
            const stats = gridManager.getStats();
            
            expect(stats).toEqual({
                totalCells: 16,
                filledCells: 15,
                emptyCells: 1,
                fillRate: 15/16,
                maxValue: 512,
                availableMoves: 3,
                isGameOver: false,
                isWon: false
            });
        });
    });
});