/**
 * Tile 单元测试
 * 测试方块类的核心功能
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
        this.mergedFrom = null;
        this.element = null;
        this.animationData = {};
    }
    
    canMergeWith(other) {
        if (!other) return false;
        return other.value === this.value && 
               !other.isMerged && 
               !this.isMerged;
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
        this.mergedFrom = null;
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
        clone.mergedFrom = this.mergedFrom;
        return clone;
    }
    
    render(ctx, canvasSize, themeConfig, gridSize) {
        // 模拟渲染逻辑
        const cellSize = canvasSize / gridSize;
        const gap = cellSize * 0.1;
        const actualCellSize = cellSize - gap;
        
        const posX = this.x * cellSize + gap;
        const posY = this.y * cellSize + gap;
        
        // 绘制方块背景
        ctx.fillStyle = this.getTileColor();
        ctx.fillRect(posX, posY, actualCellSize, actualCellSize);
        
        // 绘制数值
        ctx.fillStyle = this.getTextColor();
        ctx.font = this.getFontSize(actualCellSize) + 'px Arial';
        ctx.fillText(this.value.toString(), posX + actualCellSize / 2, posY + actualCellSize / 2);
    }
    
    getTileColor() {
        const colorMap = {
            2: '#EEE4DA',
            4: '#EDE0C8',
            8: '#F2B179',
            16: '#F59563',
            32: '#F67C5F',
            64: '#F65E3B',
            128: '#EDCF72',
            256: '#EDCC61',
            512: '#EDC850',
            1024: '#EDC53F',
            2048: '#EDC22E'
        };
        return colorMap[this.value] || '#3C3A32';
    }
    
    getTextColor() {
        return this.value <= 4 ? '#776E65' : '#F9F6F2';
    }
    
    getFontSize(cellSize) {
        if (this.value < 100) return Math.floor(cellSize * 0.4);
        if (this.value < 1000) return Math.floor(cellSize * 0.35);
        return Math.floor(cellSize * 0.3);
    }
    
    updateAnimation(deltaTime) {
        // 更新动画状态
        if (this.animationData.type) {
            this.animationData.currentTime = (this.animationData.currentTime || 0) + deltaTime;
            
            if (this.animationData.currentTime >= this.animationData.duration) {
                this.animationData = {}; // 清除动画数据
            }
        }
    }
    
    startAnimation(type, duration, data = {}) {
        this.animationData = {
            type,
            duration,
            currentTime: 0,
            ...data
        };
    }
    
    isAnimating() {
        return !!this.animationData.type;
    }
    
    getDisplayValue() {
        // 根据主题返回显示值（可能是图标或数字）
        const nezhaSymbols = {
            2: '🪷', // 莲花
            4: '🔥', // 火
            8: '🌊', // 混天绫
            16: '⭕', // 乾坤圈
            32: '⚡', // 雷电
            64: '🗡️', // 剑
            128: '🛡️', // 盾
            256: '👑', // 王冠
            512: '🐉', // 龙
            1024: '⚡', // 神力
            2048: '🔱' // 三叉戟
        };
        
        return nezhaSymbols[this.value] || this.value.toString();
    }
    
    equals(other) {
        if (!other) return false;
        return this.x === other.x && 
               this.y === other.y && 
               this.value === other.value;
    }
    
    toString() {
        return `Tile(${this.x}, ${this.y}, ${this.value})`;
    }
};

describe('Tile', () => {
    let tile;

    beforeEach(() => {
        tile = new Tile(1, 2, 4);
    });

    describe('构造函数', () => {
        test('应该正确初始化Tile实例', () => {
            expect(tile.x).toBe(1);
            expect(tile.y).toBe(2);
            expect(tile.value).toBe(4);
            expect(tile.id).toBeDefined();
            expect(tile.isNew).toBe(false);
            expect(tile.isMerged).toBe(false);
        });

        test('应该生成唯一的ID', () => {
            const tile1 = new Tile(0, 0, 2);
            const tile2 = new Tile(0, 0, 2);
            
            expect(tile1.id).not.toBe(tile2.id);
        });
    });

    describe('合并检测', () => {
        test('应该能够与相同值的方块合并', () => {
            const otherTile = new Tile(2, 2, 4);
            
            expect(tile.canMergeWith(otherTile)).toBe(true);
        });

        test('应该不能与不同值的方块合并', () => {
            const otherTile = new Tile(2, 2, 8);
            
            expect(tile.canMergeWith(otherTile)).toBe(false);
        });

        test('应该不能与已合并的方块合并', () => {
            const otherTile = new Tile(2, 2, 4);
            otherTile.isMerged = true;
            
            expect(tile.canMergeWith(otherTile)).toBe(false);
        });

        test('应该不能在自己已合并时合并', () => {
            const otherTile = new Tile(2, 2, 4);
            tile.isMerged = true;
            
            expect(tile.canMergeWith(otherTile)).toBe(false);
        });

        test('应该不能与null合并', () => {
            expect(tile.canMergeWith(null)).toBe(false);
        });
    });

    describe('合并值计算', () => {
        test('应该返回正确的合并值', () => {
            expect(tile.getMergedValue()).toBe(8); // 4 * 2
        });

        test('应该为不同值返回正确的合并值', () => {
            const tile2 = new Tile(0, 0, 2);
            const tile1024 = new Tile(0, 0, 1024);
            
            expect(tile2.getMergedValue()).toBe(4);
            expect(tile1024.getMergedValue()).toBe(2048);
        });
    });

    describe('状态标记', () => {
        test('应该能够标记为新方块', () => {
            tile.markAsNew();
            expect(tile.isNew).toBe(true);
        });

        test('应该能够标记为已合并', () => {
            const sourceTiles = [new Tile(0, 0, 2), new Tile(1, 0, 2)];
            
            tile.markAsMerged(sourceTiles);
            
            expect(tile.isMerged).toBe(true);
            expect(tile.mergedFrom).toBe(sourceTiles);
        });

        test('应该能够重置标志', () => {
            tile.markAsNew();
            tile.markAsMerged();
            
            tile.resetFlags();
            
            expect(tile.isNew).toBe(false);
            expect(tile.isMerged).toBe(false);
            expect(tile.mergedFrom).toBeNull();
        });
    });

    describe('位置更新', () => {
        test('应该能够更新位置', () => {
            tile.updatePosition(3, 4);
            
            expect(tile.x).toBe(3);
            expect(tile.y).toBe(4);
        });
    });

    describe('克隆', () => {
        test('应该创建正确的克隆', () => {
            tile.markAsNew();
            tile.markAsMerged();
            
            const clone = tile.clone();
            
            expect(clone).not.toBe(tile);
            expect(clone.x).toBe(tile.x);
            expect(clone.y).toBe(tile.y);
            expect(clone.value).toBe(tile.value);
            expect(clone.id).toBe(tile.id);
            expect(clone.isNew).toBe(tile.isNew);
            expect(clone.isMerged).toBe(tile.isMerged);
        });
    });

    describe('渲染', () => {
        let mockCtx;
        let mockThemeConfig;

        beforeEach(() => {
            mockCtx = {
                fillStyle: '',
                font: '',
                fillRect: jest.fn(),
                fillText: jest.fn()
            };
            
            mockThemeConfig = {
                colors: {
                    background: '#8B4513',
                    primary: '#DC143C'
                }
            };
        });

        test('应该能够渲染方块', () => {
            tile.render(mockCtx, 400, mockThemeConfig, 4);
            
            expect(mockCtx.fillRect).toHaveBeenCalled();
            expect(mockCtx.fillText).toHaveBeenCalledWith('4', expect.any(Number), expect.any(Number));
        });

        test('应该为不同值使用不同颜色', () => {
            const tile2 = new Tile(0, 0, 2);
            const tile8 = new Tile(0, 0, 8);
            
            const color2 = tile2.getTileColor();
            const color8 = tile8.getTileColor();
            
            expect(color2).not.toBe(color8);
        });

        test('应该为小数值使用深色文字', () => {
            const tile2 = new Tile(0, 0, 2);
            expect(tile2.getTextColor()).toBe('#776E65');
        });

        test('应该为大数值使用浅色文字', () => {
            const tile8 = new Tile(0, 0, 8);
            expect(tile8.getTextColor()).toBe('#F9F6F2');
        });

        test('应该根据数值调整字体大小', () => {
            const tile2 = new Tile(0, 0, 2);
            const tile100 = new Tile(0, 0, 100);
            const tile1000 = new Tile(0, 0, 1000);
            
            const cellSize = 100;
            const fontSize2 = tile2.getFontSize(cellSize);
            const fontSize100 = tile100.getFontSize(cellSize);
            const fontSize1000 = tile1000.getFontSize(cellSize);
            
            expect(fontSize2).toBeGreaterThan(fontSize100);
            expect(fontSize100).toBeGreaterThan(fontSize1000);
        });
    });

    describe('动画', () => {
        test('应该能够开始动画', () => {
            tile.startAnimation('move', 1000, { fromX: 0, toX: 1 });
            
            expect(tile.animationData.type).toBe('move');
            expect(tile.animationData.duration).toBe(1000);
            expect(tile.animationData.currentTime).toBe(0);
            expect(tile.animationData.fromX).toBe(0);
            expect(tile.animationData.toX).toBe(1);
        });

        test('应该检测是否在动画中', () => {
            expect(tile.isAnimating()).toBe(false);
            
            tile.startAnimation('appear', 500);
            expect(tile.isAnimating()).toBe(true);
        });

        test('应该更新动画状态', () => {
            tile.startAnimation('fade', 1000);
            
            tile.updateAnimation(500);
            expect(tile.animationData.currentTime).toBe(500);
            
            tile.updateAnimation(600); // 总共1100ms，超过持续时间
            expect(tile.animationData.type).toBeUndefined(); // 动画应该结束
        });
    });

    describe('显示值', () => {
        test('应该为哪吒主题返回符号', () => {
            const tile2 = new Tile(0, 0, 2);
            const tile4 = new Tile(0, 0, 4);
            
            expect(tile2.getDisplayValue()).toBe('🪷');
            expect(tile4.getDisplayValue()).toBe('🔥');
        });

        test('应该为未定义的值返回数字', () => {
            const tile4096 = new Tile(0, 0, 4096);
            expect(tile4096.getDisplayValue()).toBe('4096');
        });
    });

    describe('比较', () => {
        test('应该正确比较相等的方块', () => {
            const otherTile = new Tile(1, 2, 4);
            expect(tile.equals(otherTile)).toBe(true);
        });

        test('应该正确比较不同位置的方块', () => {
            const otherTile = new Tile(2, 2, 4);
            expect(tile.equals(otherTile)).toBe(false);
        });

        test('应该正确比较不同值的方块', () => {
            const otherTile = new Tile(1, 2, 8);
            expect(tile.equals(otherTile)).toBe(false);
        });

        test('应该处理null比较', () => {
            expect(tile.equals(null)).toBe(false);
        });
    });

    describe('字符串表示', () => {
        test('应该返回正确的字符串表示', () => {
            expect(tile.toString()).toBe('Tile(1, 2, 4)');
        });
    });

    describe('边界情况', () => {
        test('应该处理零值', () => {
            const zeroTile = new Tile(0, 0, 0);
            expect(zeroTile.value).toBe(0);
            expect(zeroTile.getMergedValue()).toBe(0);
        });

        test('应该处理负值', () => {
            const negativeTile = new Tile(0, 0, -2);
            expect(negativeTile.value).toBe(-2);
            expect(negativeTile.getMergedValue()).toBe(-4);
        });

        test('应该处理大数值', () => {
            const largeTile = new Tile(0, 0, 65536);
            expect(largeTile.value).toBe(65536);
            expect(largeTile.getMergedValue()).toBe(131072);
        });
    });

    describe('内存管理', () => {
        test('应该能够清理动画数据', () => {
            tile.startAnimation('test', 100);
            tile.updateAnimation(200); // 超过持续时间
            
            expect(Object.keys(tile.animationData).length).toBe(0);
        });

        test('应该能够重置所有状态', () => {
            tile.markAsNew();
            tile.markAsMerged();
            tile.startAnimation('test', 1000);
            
            tile.resetFlags();
            tile.animationData = {};
            
            expect(tile.isNew).toBe(false);
            expect(tile.isMerged).toBe(false);
            expect(tile.isAnimating()).toBe(false);
        });
    });
});