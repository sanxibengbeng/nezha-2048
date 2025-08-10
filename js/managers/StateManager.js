/**
 * StateManager - 状态管理器
 * 负责游戏状态的保存、恢复、分数计算和本地存储管理
 */
class StateManager {
    constructor() {
        // 存储键名
        this.STORAGE_KEYS = {
            GAME_STATE: 'nezha2048_game_state',
            HIGH_SCORE: 'nezha2048_high_score',
            STATISTICS: 'nezha2048_statistics',
            SETTINGS: 'nezha2048_settings',
            ACHIEVEMENTS: 'nezha2048_achievements'
        };
        
        // 分数计算配置
        this.scoreConfig = {
            // 基础分数倍数
            baseMultiplier: 1,
            // 合并奖励倍数
            mergeMultiplier: {
                2: 2,
                4: 4,
                8: 8,
                16: 16,
                32: 32,
                64: 64,
                128: 128,
                256: 256,
                512: 512,
                1024: 1024,
                2048: 2048,
                4096: 4096
            },
            // 连击奖励
            comboBonus: {
                2: 1.2,
                3: 1.5,
                4: 2.0,
                5: 2.5,
                6: 3.0
            },
            // 特殊技能奖励
            skillBonus: {
                threeHeadsSixArms: 1.5,
                qiankunCircle: 2.0,
                huntianLing: 1.8,
                transformation: 3.0
            }
        };
        
        // 游戏统计
        this.statistics = {
            totalGames: 0,
            totalScore: 0,
            totalMoves: 0,
            totalPlayTime: 0,
            bestScore: 0,
            bestTile: 0,
            averageScore: 0,
            winRate: 0,
            skillsUsed: {
                threeHeadsSixArms: 0,
                qiankunCircle: 0,
                huntianLing: 0,
                transformation: 0
            },
            achievements: []
        };
        
        // 成就系统
        this.achievements = {
            firstWin: { unlocked: false, name: '初次胜利', description: '第一次达到2048' },
            speedRunner: { unlocked: false, name: '速度之王', description: '在5分钟内达到2048' },
            comboMaster: { unlocked: false, name: '连击大师', description: '达成6连击' },
            skillMaster: { unlocked: false, name: '技能大师', description: '使用所有哪吒技能' },
            highScorer: { unlocked: false, name: '高分达人', description: '单局得分超过50000' },
            persistent: { unlocked: false, name: '坚持不懈', description: '游玩100局游戏' },
            nezhaAwakening: { unlocked: false, name: '哪吒觉醒', description: '达到4096方块' }
        };
        
        // 事件监听器
        this.eventListeners = new Map();
        
        // 存储支持标志
        this.storageSupported = false;
        this.memoryStorage = new Map();
        
        // 初始化
        this.init();
    }

    /**
     * 初始化状态管理器
     */
    init() {
        try {
            // 首先检查本地存储支持
            this.checkStorageSupport();
            
            // 加载统计数据
            this.loadStatistics();
            
            // 加载成就数据
            this.loadAchievements();
            
            console.log('StateManager 初始化完成');
        } catch (error) {
            console.error('StateManager 初始化失败:', error);
            this.emit('error', { type: 'initialization', error });
        }
    }

    /**
     * 检查本地存储支持
     */
    checkStorageSupport() {
        try {
            const testKey = 'nezha2048_test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            this.storageSupported = true;
        } catch (error) {
            console.warn('本地存储不支持，将使用内存存储');
            this.storageSupported = false;
            this.memoryStorage = new Map();
        }
    }

    /**
     * 安全的存储操作
     * @param {string} key - 存储键
     * @param {*} value - 存储值
     */
    setItem(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            
            if (this.storageSupported) {
                localStorage.setItem(key, serializedValue);
            } else {
                this.memoryStorage.set(key, serializedValue);
            }
        } catch (error) {
            console.error('存储数据失败:', error);
            this.emit('storageError', { key, error });
        }
    }

    /**
     * 安全的读取操作
     * @param {string} key - 存储键
     * @param {*} defaultValue - 默认值
     * @returns {*} 读取的值
     */
    getItem(key, defaultValue = null) {
        try {
            let serializedValue;
            
            if (this.storageSupported) {
                serializedValue = localStorage.getItem(key);
            } else {
                serializedValue = this.memoryStorage.get(key);
            }
            
            if (serializedValue === null || serializedValue === undefined) {
                return defaultValue;
            }
            
            return JSON.parse(serializedValue);
        } catch (error) {
            console.error('读取数据失败:', error);
            return defaultValue;
        }
    }

    /**
     * 删除存储项
     * @param {string} key - 存储键
     */
    removeItem(key) {
        try {
            if (this.storageSupported) {
                localStorage.removeItem(key);
            } else {
                this.memoryStorage.delete(key);
            }
        } catch (error) {
            console.error('删除数据失败:', error);
        }
    }

    /**
     * 保存游戏状态
     * @param {Object} gameState - 游戏状态对象
     */
    saveGameState(gameState) {
        try {
            const stateToSave = {
                grid: gameState.grid,
                score: gameState.score,
                moves: gameState.moves,
                playTime: gameState.playTime,
                isGameOver: gameState.isGameOver,
                isWon: gameState.isWon,
                skillCooldowns: gameState.skillCooldowns,
                nezhaLevel: gameState.nezhaLevel,
                consecutiveMerges: gameState.consecutiveMerges,
                timestamp: Date.now()
            };
            
            this.setItem(this.STORAGE_KEYS.GAME_STATE, stateToSave);
            
            // 更新最高分
            this.updateHighScore(gameState.score);
            
            this.emit('gameStateSaved', { gameState: stateToSave });
            console.log('游戏状态已保存');
            
        } catch (error) {
            console.error('保存游戏状态失败:', error);
            this.emit('error', { type: 'saveState', error });
        }
    }

    /**
     * 加载游戏状态
     * @returns {Object|null} 游戏状态对象或null
     */
    loadGameState() {
        try {
            const savedState = this.getItem(this.STORAGE_KEYS.GAME_STATE);
            
            if (!savedState) {
                console.log('没有找到保存的游戏状态');
                return null;
            }
            
            // 检查状态是否过期（24小时）
            const now = Date.now();
            const stateAge = now - (savedState.timestamp || 0);
            const maxAge = 24 * 60 * 60 * 1000; // 24小时
            
            if (stateAge > maxAge) {
                console.log('保存的游戏状态已过期');
                this.removeItem(this.STORAGE_KEYS.GAME_STATE);
                return null;
            }
            
            this.emit('gameStateLoaded', { gameState: savedState });
            console.log('游戏状态已加载');
            
            return savedState;
            
        } catch (error) {
            console.error('加载游戏状态失败:', error);
            this.emit('error', { type: 'loadState', error });
            return null;
        }
    }

    /**
     * 清除保存的游戏状态
     */
    clearGameState() {
        try {
            this.removeItem(this.STORAGE_KEYS.GAME_STATE);
            this.emit('gameStateCleared');
            console.log('游戏状态已清除');
        } catch (error) {
            console.error('清除游戏状态失败:', error);
        }
    }

    /**
     * 更新最高分
     * @param {number} score - 当前分数
     * @returns {boolean} 是否创造新纪录
     */
    updateHighScore(score) {
        try {
            const currentHighScore = this.getHighScore();
            
            if (score > currentHighScore) {
                this.setItem(this.STORAGE_KEYS.HIGH_SCORE, score);
                this.statistics.bestScore = score;
                
                this.emit('newHighScore', { 
                    newScore: score, 
                    oldScore: currentHighScore 
                });
                
                console.log(`新的最高分: ${score} (之前: ${currentHighScore})`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('更新最高分失败:', error);
            return false;
        }
    }

    /**
     * 获取最高分
     * @returns {number} 最高分
     */
    getHighScore() {
        return this.getItem(this.STORAGE_KEYS.HIGH_SCORE, 0);
    }

    /**
     * 计算合并分数
     * @param {number} tileValue - 方块值
     * @param {number} comboCount - 连击数
     * @param {string} skillUsed - 使用的技能
     * @returns {number} 计算后的分数
     */
    calculateMergeScore(tileValue, comboCount = 1, skillUsed = null) {
        // 参数验证
        if (!tileValue || typeof tileValue !== 'number' || isNaN(tileValue) || tileValue <= 0) {
            console.warn('calculateMergeScore: 无效的方块值:', tileValue);
            return 0;
        }
        
        if (!comboCount || typeof comboCount !== 'number' || isNaN(comboCount) || comboCount < 1) {
            console.warn('calculateMergeScore: 无效的连击数:', comboCount);
            comboCount = 1;
        }
        
        console.log('calculateMergeScore 参数:', { tileValue, comboCount, skillUsed });
        
        let baseScore = this.scoreConfig.mergeMultiplier[tileValue] || tileValue;
        console.log('基础分数:', baseScore);
        
        // 应用连击奖励
        if (comboCount > 1) {
            const comboMultiplier = this.scoreConfig.comboBonus[Math.min(comboCount, 6)] || 1;
            console.log('连击倍数:', comboMultiplier);
            baseScore *= comboMultiplier;
        }
        
        // 应用技能奖励
        if (skillUsed && this.scoreConfig.skillBonus[skillUsed]) {
            const skillMultiplier = this.scoreConfig.skillBonus[skillUsed];
            console.log('技能倍数:', skillMultiplier);
            baseScore *= skillMultiplier;
        }
        
        // 应用基础倍数
        baseScore *= this.scoreConfig.baseMultiplier;
        console.log('应用基础倍数后:', baseScore);
        
        const finalScore = Math.floor(baseScore);
        console.log('最终分数:', finalScore);
        
        // 最终验证
        if (isNaN(finalScore)) {
            console.error('calculateMergeScore: 计算结果为 NaN', {
                tileValue,
                comboCount,
                skillUsed,
                baseScore,
                finalScore
            });
            return 0;
        }
        
        return finalScore;
    }

    /**
     * 更新游戏统计
     * @param {Object} gameData - 游戏数据
     */
    updateStatistics(gameData) {
        try {
            this.statistics.totalGames++;
            this.statistics.totalScore += gameData.score || 0;
            this.statistics.totalMoves += gameData.moves || 0;
            this.statistics.totalPlayTime += gameData.playTime || 0;
            
            // 更新最佳记录
            if (gameData.score > this.statistics.bestScore) {
                this.statistics.bestScore = gameData.score;
            }
            
            if (gameData.maxTile > this.statistics.bestTile) {
                this.statistics.bestTile = gameData.maxTile;
            }
            
            // 计算平均分
            this.statistics.averageScore = Math.floor(
                this.statistics.totalScore / this.statistics.totalGames
            );
            
            // 更新胜率
            if (gameData.isWon) {
                this.statistics.winRate = this.calculateWinRate();
            }
            
            // 更新技能使用统计
            if (gameData.skillsUsed) {
                Object.keys(gameData.skillsUsed).forEach(skill => {
                    this.statistics.skillsUsed[skill] += gameData.skillsUsed[skill] || 0;
                });
            }
            
            // 保存统计数据
            this.saveStatistics();
            
            // 检查成就
            this.checkAchievements(gameData);
            
            this.emit('statisticsUpdated', { statistics: this.statistics });
            
        } catch (error) {
            console.error('更新统计失败:', error);
        }
    }

    /**
     * 计算胜率
     * @returns {number} 胜率百分比
     */
    calculateWinRate() {
        const wins = this.statistics.achievements.filter(a => a.includes('win')).length;
        return this.statistics.totalGames > 0 ? 
            Math.floor((wins / this.statistics.totalGames) * 100) : 0;
    }

    /**
     * 保存统计数据
     */
    saveStatistics() {
        this.setItem(this.STORAGE_KEYS.STATISTICS, this.statistics);
    }

    /**
     * 加载统计数据
     */
    loadStatistics() {
        const savedStats = this.getItem(this.STORAGE_KEYS.STATISTICS);
        if (savedStats) {
            this.statistics = { ...this.statistics, ...savedStats };
        }
    }

    /**
     * 获取统计数据
     * @returns {Object} 统计数据
     */
    getStatistics() {
        return { ...this.statistics };
    }

    /**
     * 重置统计数据
     */
    resetStatistics() {
        this.statistics = {
            totalGames: 0,
            totalScore: 0,
            totalMoves: 0,
            totalPlayTime: 0,
            bestScore: 0,
            bestTile: 0,
            averageScore: 0,
            winRate: 0,
            skillsUsed: {
                threeHeadsSixArms: 0,
                qiankunCircle: 0,
                huntianLing: 0,
                transformation: 0
            },
            achievements: []
        };
        
        this.saveStatistics();
        this.emit('statisticsReset');
    }

    /**
     * 检查成就
     * @param {Object} gameData - 游戏数据
     */
    checkAchievements(gameData) {
        const newAchievements = [];
        
        // 初次胜利
        if (gameData.isWon && !this.achievements.firstWin.unlocked) {
            this.achievements.firstWin.unlocked = true;
            newAchievements.push('firstWin');
        }
        
        // 速度之王
        if (gameData.isWon && gameData.playTime < 300000 && !this.achievements.speedRunner.unlocked) {
            this.achievements.speedRunner.unlocked = true;
            newAchievements.push('speedRunner');
        }
        
        // 连击大师
        if (gameData.maxCombo >= 6 && !this.achievements.comboMaster.unlocked) {
            this.achievements.comboMaster.unlocked = true;
            newAchievements.push('comboMaster');
        }
        
        // 高分达人
        if (gameData.score >= 50000 && !this.achievements.highScorer.unlocked) {
            this.achievements.highScorer.unlocked = true;
            newAchievements.push('highScorer');
        }
        
        // 坚持不懈
        if (this.statistics.totalGames >= 100 && !this.achievements.persistent.unlocked) {
            this.achievements.persistent.unlocked = true;
            newAchievements.push('persistent');
        }
        
        // 哪吒觉醒
        if (gameData.maxTile >= 4096 && !this.achievements.nezhaAwakening.unlocked) {
            this.achievements.nezhaAwakening.unlocked = true;
            newAchievements.push('nezhaAwakening');
        }
        
        // 技能大师
        const allSkillsUsed = Object.values(this.statistics.skillsUsed).every(count => count > 0);
        if (allSkillsUsed && !this.achievements.skillMaster.unlocked) {
            this.achievements.skillMaster.unlocked = true;
            newAchievements.push('skillMaster');
        }
        
        // 保存成就并触发事件
        if (newAchievements.length > 0) {
            this.saveAchievements();
            newAchievements.forEach(achievement => {
                this.emit('achievementUnlocked', {
                    achievement: achievement,
                    data: this.achievements[achievement]
                });
            });
        }
    }

    /**
     * 保存成就数据
     */
    saveAchievements() {
        this.setItem(this.STORAGE_KEYS.ACHIEVEMENTS, this.achievements);
    }

    /**
     * 加载成就数据
     */
    loadAchievements() {
        const savedAchievements = this.getItem(this.STORAGE_KEYS.ACHIEVEMENTS);
        if (savedAchievements) {
            this.achievements = { ...this.achievements, ...savedAchievements };
        }
    }

    /**
     * 获取成就数据
     * @returns {Object} 成就数据
     */
    getAchievements() {
        return { ...this.achievements };
    }

    /**
     * 获取已解锁的成就数量
     * @returns {number} 已解锁成就数量
     */
    getUnlockedAchievementsCount() {
        return Object.values(this.achievements).filter(a => a.unlocked).length;
    }

    /**
     * 保存游戏设置
     * @param {Object} settings - 设置对象
     */
    saveSettings(settings) {
        this.setItem(this.STORAGE_KEYS.SETTINGS, settings);
        this.emit('settingsSaved', { settings });
    }

    /**
     * 加载游戏设置
     * @returns {Object} 设置对象
     */
    loadSettings() {
        return this.getItem(this.STORAGE_KEYS.SETTINGS, {
            volume: 0.7,
            theme: 'nezha',
            language: 'zh-CN',
            animations: true,
            autoSave: true
        });
    }

    /**
     * 重置游戏（清除所有数据）
     */
    resetGame() {
        try {
            // 清除所有存储数据
            Object.values(this.STORAGE_KEYS).forEach(key => {
                this.removeItem(key);
            });
            
            // 重置内存数据
            this.resetStatistics();
            this.achievements = {
                firstWin: { unlocked: false, name: '初次胜利', description: '第一次达到2048' },
                speedRunner: { unlocked: false, name: '速度之王', description: '在5分钟内达到2048' },
                comboMaster: { unlocked: false, name: '连击大师', description: '达成6连击' },
                skillMaster: { unlocked: false, name: '技能大师', description: '使用所有哪吒技能' },
                highScorer: { unlocked: false, name: '高分达人', description: '单局得分超过50000' },
                persistent: { unlocked: false, name: '坚持不懈', description: '游玩100局游戏' },
                nezhaAwakening: { unlocked: false, name: '哪吒觉醒', description: '达到4096方块' }
            };
            
            this.emit('gameReset');
            console.log('游戏已完全重置');
            
        } catch (error) {
            console.error('重置游戏失败:', error);
            this.emit('error', { type: 'resetGame', error });
        }
    }

    /**
     * 导出游戏数据
     * @returns {Object} 导出的数据
     */
    exportData() {
        return {
            statistics: this.statistics,
            achievements: this.achievements,
            highScore: this.getHighScore(),
            settings: this.loadSettings(),
            exportTime: Date.now()
        };
    }

    /**
     * 导入游戏数据
     * @param {Object} data - 导入的数据
     */
    importData(data) {
        try {
            if (data.statistics) {
                this.statistics = { ...this.statistics, ...data.statistics };
                this.saveStatistics();
            }
            
            if (data.achievements) {
                this.achievements = { ...this.achievements, ...data.achievements };
                this.saveAchievements();
            }
            
            if (data.highScore) {
                this.setItem(this.STORAGE_KEYS.HIGH_SCORE, data.highScore);
            }
            
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            
            this.emit('dataImported', { data });
            console.log('数据导入成功');
            
        } catch (error) {
            console.error('导入数据失败:', error);
            this.emit('error', { type: 'importData', error });
        }
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
                    console.error(`StateManager事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 获取存储使用情况
     * @returns {Object} 存储使用情况
     */
    getStorageUsage() {
        if (!this.storageSupported) {
            return { supported: false, used: 0, total: 0 };
        }
        
        try {
            let totalSize = 0;
            Object.values(this.STORAGE_KEYS).forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    totalSize += item.length;
                }
            });
            
            return {
                supported: true,
                used: totalSize,
                total: 5 * 1024 * 1024, // 假设5MB限制
                percentage: (totalSize / (5 * 1024 * 1024)) * 100
            };
        } catch (error) {
            return { supported: true, used: 0, total: 0, error: error.message };
        }
    }

    /**
     * 销毁状态管理器
     */
    destroy() {
        this.eventListeners.clear();
        console.log('StateManager 已销毁');
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}