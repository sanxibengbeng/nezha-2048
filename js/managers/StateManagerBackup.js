/**
 * StateManagerBackup - 简化的状态管理器备用实现
 * 用于在主 StateManager 失败时提供基本功能
 */
class StateManagerBackup {
    constructor() {
        console.log('使用备用 StateManager 实现');
        
        // 事件监听器
        this.eventListeners = new Map();
        
        // 基本存储
        this.storage = new Map();
        
        // 初始化
        this.init();
    }
    
    init() {
        console.log('StateManagerBackup 初始化完成');
    }
    
    /**
     * 添加事件监听器
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    /**
     * 移除事件监听器
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
     */
    emit(event, data = null) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`StateManagerBackup事件处理器错误 (${event}):`, error);
                }
            });
        }
    }
    
    /**
     * 保存游戏状态
     */
    saveGameState(gameState) {
        try {
            this.storage.set('gameState', JSON.stringify(gameState));
            console.log('游戏状态已保存（备用实现）');
        } catch (error) {
            console.error('保存游戏状态失败:', error);
        }
    }
    
    /**
     * 加载游戏状态
     */
    loadGameState() {
        try {
            const saved = this.storage.get('gameState');
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error('加载游戏状态失败:', error);
            return null;
        }
    }
    
    /**
     * 清除游戏状态
     */
    clearGameState() {
        this.storage.delete('gameState');
        console.log('游戏状态已清除（备用实现）');
    }
    
    /**
     * 获取最高分
     */
    getHighScore() {
        try {
            const saved = this.storage.get('highScore');
            return saved ? parseInt(saved) : 0;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * 更新最高分
     */
    updateHighScore(score) {
        const currentHighScore = this.getHighScore();
        if (score > currentHighScore) {
            this.storage.set('highScore', score.toString());
            this.emit('newHighScore', { 
                newScore: score, 
                oldScore: currentHighScore 
            });
        }
    }
    
    /**
     * 更新统计信息
     */
    updateStatistics(gameData) {
        // 简化实现，只触发事件
        this.emit('statisticsUpdated', { statistics: {} });
    }
    
    /**
     * 计算合并分数
     */
    calculateMergeScore(value, comboMultiplier = 1, skillMultiplier = 1) {
        return value * comboMultiplier * skillMultiplier;
    }
    
    /**
     * 销毁
     */
    destroy() {
        this.eventListeners.clear();
        this.storage.clear();
        console.log('StateManagerBackup 已销毁');
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManagerBackup;
}
