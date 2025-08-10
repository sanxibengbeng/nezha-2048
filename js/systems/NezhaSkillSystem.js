/**
 * NezhaSkillSystem类 - 哪吒技能系统
 * 管理哪吒主题的特殊技能，包括冷却、触发条件和效果
 */
class NezhaSkillSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // 技能定义
        this.skills = {
            threeHeadsSixArms: {
                name: '三头六臂',
                description: '允许同时进行多方向操作',
                icon: '🔥',
                cooldown: 15000, // 15秒冷却
                duration: 8000,  // 8秒持续时间
                triggerCondition: 'manual', // 手动触发
                cost: 0, // 无消耗
                unlockScore: 1000 // 1000分解锁
            },
            qiankunCircle: {
                name: '乾坤圈',
                description: '清除指定区域的方块',
                icon: '⭕',
                cooldown: 20000, // 20秒冷却
                duration: 0,     // 瞬发技能
                triggerCondition: 'consecutiveMerges', // 连续合并触发
                triggerThreshold: 5, // 5连击触发
                cost: 0,
                unlockScore: 2000 // 2000分解锁
            },
            huntianLing: {
                name: '混天绫',
                description: '触发连锁消除效果',
                icon: '🌊',
                cooldown: 25000, // 25秒冷却
                duration: 0,     // 瞬发技能
                triggerCondition: 'specificPattern', // 特定数字组合触发
                cost: 0,
                unlockScore: 5000 // 5000分解锁
            },
            transformation: {
                name: '哪吒变身',
                description: '提供额外的游戏机制',
                icon: '⚡',
                cooldown: 60000, // 60秒冷却
                duration: 15000, // 15秒持续时间
                triggerCondition: 'manual', // 手动触发
                cost: 0,
                unlockScore: 10000 // 10000分解锁
            }
        };
        
        // 技能状态
        this.skillStates = {};
        this.activeSkills = new Set();
        this.skillCooldowns = {};
        this.skillUnlocked = {};
        
        // 触发条件状态
        this.consecutiveMerges = 0;
        this.lastMergeTime = 0;
        this.mergeComboTimeout = null;
        
        // 事件监听器
        this.eventListeners = new Map();
        
        // 初始化技能状态
        this.initializeSkills();
        
        // 延迟检查解锁条件，确保游戏引擎完全初始化
        setTimeout(() => {
            this.checkUnlockConditions();
        }, 100);
        
        console.log('NezhaSkillSystem 初始化完成');
    }

    /**
     * 初始化技能状态
     */
    initializeSkills() {
        Object.keys(this.skills).forEach(skillId => {
            this.skillStates[skillId] = {
                available: false,
                cooldownRemaining: 0,
                isActive: false,
                activationTime: 0,
                usageCount: 0
            };
            
            this.skillCooldowns[skillId] = 0;
            this.skillUnlocked[skillId] = false;
        });
    }

    /**
     * 更新技能系统
     * @param {number} deltaTime - 时间差（毫秒）
     */
    update(deltaTime) {
        // 更新技能冷却
        this.updateCooldowns(deltaTime);
        
        // 更新激活技能的持续时间
        this.updateActiveSkills(deltaTime);
        
        // 检查技能解锁条件
        this.checkUnlockConditions();
        
        // 检查自动触发条件
        this.checkAutoTriggerConditions();
        
        // 更新UI指示器
        this.updateSkillUI();
    }

    /**
     * 更新技能冷却时间
     * @param {number} deltaTime - 时间差（毫秒）
     */
    updateCooldowns(deltaTime) {
        Object.keys(this.skillCooldowns).forEach(skillId => {
            if (this.skillCooldowns[skillId] > 0) {
                this.skillCooldowns[skillId] = Math.max(0, this.skillCooldowns[skillId] - deltaTime);
                this.skillStates[skillId].cooldownRemaining = this.skillCooldowns[skillId];
                
                // 冷却完成
                if (this.skillCooldowns[skillId] === 0) {
                    this.skillStates[skillId].available = true;
                    this.emit('skillReady', { skillId, skill: this.skills[skillId] });
                }
            }
        });
    }

    /**
     * 更新激活技能的持续时间
     * @param {number} deltaTime - 时间差（毫秒）
     */
    updateActiveSkills(deltaTime) {
        this.activeSkills.forEach(skillId => {
            const state = this.skillStates[skillId];
            const skill = this.skills[skillId];
            
            if (state.isActive && skill.duration > 0) {
                const elapsed = Date.now() - state.activationTime;
                
                if (elapsed >= skill.duration) {
                    this.deactivateSkill(skillId);
                }
            }
        });
    }

    /**
     * 检查技能解锁条件
     */
    checkUnlockConditions() {
        if (!this.gameEngine) return;
        
        const gameState = this.gameEngine.getGameState();
        if (!gameState) return;
        
        const currentScore = gameState.score;
        
        Object.keys(this.skills).forEach(skillId => {
            const skill = this.skills[skillId];
            
            if (!this.skillUnlocked[skillId] && currentScore >= skill.unlockScore) {
                this.unlockSkill(skillId);
            }
        });
    }

    /**
     * 检查自动触发条件
     */
    checkAutoTriggerConditions() {
        // 检查乾坤圈的连续合并触发条件
        if (this.canActivateSkill('qiankunCircle') && 
            this.consecutiveMerges >= this.skills.qiankunCircle.triggerThreshold) {
            this.activateSkill('qiankunCircle');
        }
        
        // 检查混天绫的特定模式触发条件
        if (this.canActivateSkill('huntianLing')) {
            if (this.checkSpecificPattern()) {
                this.activateSkill('huntianLing');
            }
        }
    }

    /**
     * 解锁技能
     * @param {string} skillId - 技能ID
     */
    unlockSkill(skillId) {
        if (this.skillUnlocked[skillId]) return;
        
        this.skillUnlocked[skillId] = true;
        this.skillStates[skillId].available = true;
        
        this.emit('skillUnlocked', { 
            skillId, 
            skill: this.skills[skillId] 
        });
        
        console.log(`技能解锁: ${this.skills[skillId].name}`);
    }

    /**
     * 检查技能是否可以激活
     * @param {string} skillId - 技能ID
     * @returns {boolean} 是否可以激活
     */
    canActivateSkill(skillId) {
        const state = this.skillStates[skillId];
        const unlocked = this.skillUnlocked[skillId];
        const available = state.available;
        const cooldown = this.skillCooldowns[skillId];
        const isActive = state.isActive;
        
        console.log(`检查技能 ${skillId} 激活条件:`, {
            unlocked,
            available,
            cooldown,
            isActive,
            canActivate: unlocked && available && cooldown === 0 && !isActive
        });
        
        return unlocked && 
               available && 
               cooldown === 0 && 
               !isActive;
    }

    /**
     * 调试技能状态
     * @param {string} skillId - 技能ID
     */
    debugSkillState(skillId) {
        const skill = this.skills[skillId];
        const state = this.skillStates[skillId];
        const unlocked = this.skillUnlocked[skillId];
        const cooldown = this.skillCooldowns[skillId];
        
        let currentScore = 0;
        if (this.gameEngine && this.gameEngine.getGameState()) {
            currentScore = this.gameEngine.getGameState().score;
        }
        
        console.log(`技能 ${skillId} 调试信息:`, {
            skill,
            state,
            unlocked,
            cooldown,
            currentScore,
            requiredScore: skill?.unlockScore || 0
        });
    }

    /**
     * 激活技能
     * @param {string} skillId - 技能ID
     * @param {Object} options - 激活选项
     * @returns {boolean} 是否成功激活
     */
    activateSkill(skillId, options = {}) {
        console.log(`尝试激活技能: ${skillId}`);
        
        // 检查技能是否存在
        if (!this.skills[skillId]) {
            console.error(`技能不存在: ${skillId}`);
            return false;
        }
        
        // 调试技能状态
        this.debugSkillState(skillId);
        
        if (!this.canActivateSkill(skillId)) {
            const state = this.skillStates[skillId];
            const reasons = [];
            
            if (!this.skillUnlocked[skillId]) {
                const requiredScore = this.skills[skillId].unlockScore;
                let currentScore = 0;
                if (this.gameEngine && this.gameEngine.getGameState()) {
                    currentScore = this.gameEngine.getGameState().score;
                }
                reasons.push(`技能未解锁 (需要 ${requiredScore} 分，当前 ${currentScore} 分)`);
            }
            if (!state.available) {
                reasons.push('技能不可用');
            }
            if (this.skillCooldowns[skillId] > 0) {
                reasons.push(`技能冷却中 (剩余 ${Math.ceil(this.skillCooldowns[skillId] / 1000)} 秒)`);
            }
            if (state.isActive) {
                reasons.push('技能已激活');
            }
            
            console.warn(`无法激活技能 ${skillId}: ${reasons.join(', ')}`);
            return false;
        }
        
        const skill = this.skills[skillId];
        const state = this.skillStates[skillId];
        
        // 设置技能状态
        state.isActive = true;
        state.available = false;
        state.activationTime = Date.now();
        state.usageCount++;
        
        // 设置冷却时间
        this.skillCooldowns[skillId] = skill.cooldown;
        state.cooldownRemaining = skill.cooldown;
        
        // 添加到激活技能集合
        this.activeSkills.add(skillId);
        
        // 执行技能效果
        this.executeSkillEffect(skillId, options);
        
        // 触发事件
        this.emit('skillActivated', { 
            skillId, 
            skill, 
            options 
        });
        
        console.log(`技能激活: ${skill.name}`);
        
        // 如果是瞬发技能，立即停用
        if (skill.duration === 0) {
            setTimeout(() => {
                this.deactivateSkill(skillId);
            }, 100);
        }
        
        return true;
    }

    /**
     * 停用技能
     * @param {string} skillId - 技能ID
     */
    deactivateSkill(skillId) {
        const state = this.skillStates[skillId];
        
        if (!state.isActive) return;
        
        state.isActive = false;
        this.activeSkills.delete(skillId);
        
        // 执行技能结束效果
        this.executeSkillEndEffect(skillId);
        
        this.emit('skillDeactivated', { 
            skillId, 
            skill: this.skills[skillId] 
        });
        
        console.log(`技能结束: ${this.skills[skillId].name}`);
    }

    /**
     * 执行技能效果
     * @param {string} skillId - 技能ID
     * @param {Object} options - 选项
     */
    executeSkillEffect(skillId, options) {
        switch (skillId) {
            case 'threeHeadsSixArms':
                this.executeThreeHeadsSixArms(options);
                break;
            case 'qiankunCircle':
                this.executeQiankunCircle(options);
                break;
            case 'huntianLing':
                this.executeHuntianLing(options);
                break;
            case 'transformation':
                this.executeTransformation(options);
                break;
            default:
                console.warn(`未知技能: ${skillId}`);
        }
    }

    /**
     * 执行技能结束效果
     * @param {string} skillId - 技能ID
     */
    executeSkillEndEffect(skillId) {
        switch (skillId) {
            case 'threeHeadsSixArms':
                this.endThreeHeadsSixArms();
                break;
            case 'transformation':
                this.endTransformation();
                break;
        }
    }

    /**
     * 执行三头六臂技能
     * @param {Object} options - 选项
     */
    executeThreeHeadsSixArms(options) {
        console.log('🔥 执行三头六臂技能');
        
        // 启用多方向操作模式
        if (this.gameEngine && this.gameEngine.getInputManager) {
            const inputManager = this.gameEngine.getInputManager();
            if (inputManager.enableMultiDirectionMode) {
                inputManager.enableMultiDirectionMode(true);
                console.log('🔥 多方向操作模式已启用');
            }
        }
        
        // 创建视觉效果
        this.createSkillVisualEffect('threeHeadsSixArms');
        
        // 提供额外的移动机会奖励
        this.applyThreeHeadsSixArmsBonus();
    }

    /**
     * 结束三头六臂技能
     */
    endThreeHeadsSixArms() {
        console.log('🔥 三头六臂技能结束');
        
        // 禁用多方向操作模式
        if (this.gameEngine && this.gameEngine.getInputManager) {
            const inputManager = this.gameEngine.getInputManager();
            if (inputManager.enableMultiDirectionMode) {
                inputManager.enableMultiDirectionMode(false);
                console.log('🔥 多方向操作模式已禁用');
            }
        }
        
        // 移除额外奖励
        this.removeThreeHeadsSixArmsBonus();
    }

    /**
     * 应用三头六臂技能奖励
     */
    applyThreeHeadsSixArmsBonus() {
        if (!this.gameEngine) return;
        
        const gameState = this.gameEngine.getGameState();
        
        // 临时提升合并分数倍数
        if (!gameState.threeHeadsSixArmsBonus) {
            gameState.threeHeadsSixArmsBonus = {
                scoreMultiplier: 1.5,
                originalMultiplier: gameState.scoreMultiplier || 1
            };
            
            gameState.scoreMultiplier = gameState.threeHeadsSixArmsBonus.scoreMultiplier;
            console.log('🔥 三头六臂奖励：合并分数 x1.5');
        }
    }

    /**
     * 移除三头六臂技能奖励
     */
    removeThreeHeadsSixArmsBonus() {
        if (!this.gameEngine) return;
        
        const gameState = this.gameEngine.getGameState();
        
        // 恢复原始分数倍数
        if (gameState.threeHeadsSixArmsBonus) {
            gameState.scoreMultiplier = gameState.threeHeadsSixArmsBonus.originalMultiplier;
            delete gameState.threeHeadsSixArmsBonus;
            console.log('🔥 三头六臂奖励已移除');
        }
    }

    /**
     * 执行乾坤圈技能
     * @param {Object} options - 选项
     */
    executeQiankunCircle(options = {}) {
        if (!this.gameEngine) return;
        
        console.log('⭕ 执行乾坤圈技能');
        
        const gridManager = this.gameEngine.getGridManager();
        const gameState = this.gameEngine.getGameState();
        
        // 选择清除区域
        const clearArea = this.selectClearArea(options);
        
        if (clearArea.length === 0) {
            console.log('⭕ 没有找到合适的清除区域');
            return;
        }
        
        // 收集要清除的方块信息
        const tilesToClear = [];
        let totalValue = 0;
        
        clearArea.forEach(pos => {
            const tile = gameState.getTile(pos.x, pos.y);
            if (tile) {
                tilesToClear.push({
                    tile: tile,
                    position: { x: pos.x, y: pos.y },
                    value: tile.value
                });
                totalValue += tile.value;
            }
        });
        
        if (tilesToClear.length === 0) {
            console.log('⭕ 选定区域没有方块可清除');
            return;
        }
        
        // 创建清除前的视觉预览
        this.createQiankunCirclePreview(clearArea);
        
        // 延迟执行清除，让玩家看到预览效果
        setTimeout(() => {
            this.performQiankunCircleClear(tilesToClear, totalValue);
        }, 800);
    }

    /**
     * 创建乾坤圈预览效果
     * @param {Array} clearArea - 清除区域
     */
    createQiankunCirclePreview(clearArea) {
        // 创建预览指示器
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        
        const previewContainer = document.createElement('div');
        previewContainer.className = 'qiankun-circle-preview';
        previewContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 150;
        `;
        
        // 为每个要清除的位置创建预览效果
        clearArea.forEach((pos, index) => {
            const previewTile = document.createElement('div');
            previewTile.className = 'qiankun-preview-tile';
            
            const cellSize = 100 / 4; // 每个格子占25%
            const gap = 2;
            
            previewTile.style.cssText = `
                position: absolute;
                left: ${pos.x * cellSize + gap}%;
                top: ${pos.y * cellSize + gap}%;
                width: ${cellSize - gap * 2}%;
                height: ${cellSize - gap * 2}%;
                background: radial-gradient(circle, rgba(255, 215, 0, 0.8), rgba(255, 165, 0, 0.6));
                border: 3px solid #FFD700;
                border-radius: 8px;
                animation: qiankunPreview 0.8s ease-in-out;
                animation-delay: ${index * 100}ms;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                color: #8B4513;
                font-weight: bold;
            `;
            
            previewTile.textContent = '⭕';
            previewContainer.appendChild(previewTile);
        });
        
        gameArea.appendChild(previewContainer);
        
        // 0.8秒后移除预览
        setTimeout(() => {
            if (previewContainer.parentNode) {
                previewContainer.parentNode.removeChild(previewContainer);
            }
        }, 800);
    }

    /**
     * 执行乾坤圈清除
     * @param {Array} tilesToClear - 要清除的方块数组
     * @param {number} totalValue - 总价值
     */
    performQiankunCircleClear(tilesToClear, totalValue) {
        if (!this.gameEngine) return;
        
        const gameState = this.gameEngine.getGameState();
        
        // 计算奖励分数（基础分数 + 奖励）
        const baseScore = totalValue;
        const clearBonus = tilesToClear.length * 20; // 每个方块额外20分
        const comboBonus = this.consecutiveMerges >= 5 ? totalValue * 0.5 : 0; // 连击奖励
        const finalScore = Math.floor(baseScore + clearBonus + comboBonus);
        
        // 创建清除动画
        this.createQiankunCircleClearAnimation(tilesToClear);
        
        // 延迟清除方块，让动画播放
        setTimeout(() => {
            // 清除方块
            tilesToClear.forEach(({ position }) => {
                gameState.setTile(position.x, position.y, null);
            });
            
            // 添加分数
            gameState.addScore(finalScore);
            
            // 触发清除完成事件
            this.emit('qiankunCircleCleared', {
                clearedTiles: tilesToClear,
                score: finalScore,
                area: tilesToClear.map(t => t.position)
            });
            
            console.log(`⭕ 乾坤圈清除了 ${tilesToClear.length} 个方块，获得 ${finalScore} 分`);
            
            // 重置连击计数（因为使用了技能）
            this.consecutiveMerges = 0;
            
        }, 600);
    }

    /**
     * 创建乾坤圈清除动画
     * @param {Array} tilesToClear - 要清除的方块数组
     */
    createQiankunCircleClearAnimation(tilesToClear) {
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        
        const animationContainer = document.createElement('div');
        animationContainer.className = 'qiankun-circle-animation';
        animationContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 200;
        `;
        
        // 为每个方块创建清除动画
        tilesToClear.forEach(({ position, value }, index) => {
            const animationTile = document.createElement('div');
            animationTile.className = 'qiankun-clear-tile';
            
            const cellSize = 100 / 4;
            const gap = 2;
            
            animationTile.style.cssText = `
                position: absolute;
                left: ${position.x * cellSize + gap}%;
                top: ${position.y * cellSize + gap}%;
                width: ${cellSize - gap * 2}%;
                height: ${cellSize - gap * 2}%;
                background: radial-gradient(circle, #FFD700, #FFA500);
                border-radius: 50%;
                animation: qiankunClear 0.6s ease-out forwards;
                animation-delay: ${index * 50}ms;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                color: white;
                font-weight: bold;
                box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
            `;
            
            animationTile.textContent = `+${value}`;
            animationContainer.appendChild(animationTile);
            
            // 创建粒子效果
            this.createQiankunParticles(position, index * 50);
        });
        
        gameArea.appendChild(animationContainer);
        
        // 1秒后移除动画容器
        setTimeout(() => {
            if (animationContainer.parentNode) {
                animationContainer.parentNode.removeChild(animationContainer);
            }
        }, 1000);
    }

    /**
     * 创建乾坤圈粒子效果
     * @param {Object} position - 位置
     * @param {number} delay - 延迟时间
     */
    createQiankunParticles(position, delay) {
        setTimeout(() => {
            const gameArea = document.querySelector('.game-area');
            if (!gameArea) return;
            
            const particleCount = 8;
            const cellSize = gameArea.clientWidth / 4;
            const centerX = (position.x + 0.5) * cellSize;
            const centerY = (position.y + 0.5) * cellSize;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'qiankun-particle';
                
                const angle = (i / particleCount) * Math.PI * 2;
                const distance = 30 + Math.random() * 20;
                const endX = centerX + Math.cos(angle) * distance;
                const endY = centerY + Math.sin(angle) * distance;
                
                particle.style.cssText = `
                    position: absolute;
                    left: ${centerX}px;
                    top: ${centerY}px;
                    width: 4px;
                    height: 4px;
                    background: #FFD700;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 250;
                    animation: qiankunParticle 0.8s ease-out forwards;
                    --end-x: ${endX}px;
                    --end-y: ${endY}px;
                `;
                
                gameArea.appendChild(particle);
                
                // 0.8秒后移除粒子
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 800);
            }
        }, delay);
    }

    /**
     * 执行混天绫技能
     * @param {Object} options - 选项
     */
    executeHuntianLing(options = {}) {
        if (!this.gameEngine) return;
        
        console.log('🌊 执行混天绫技能');
        
        const gameState = this.gameEngine.getGameState();
        
        // 检查是否有特定数字组合模式
        const patterns = this.findSpecificPatterns();
        
        if (patterns.length === 0) {
            console.log('🌊 没有找到可连锁的数字组合模式');
            return;
        }
        
        // 创建混天绫预览效果
        this.createHuntianLingPreview(patterns);
        
        // 延迟执行连锁消除
        setTimeout(() => {
            this.performHuntianLingChain(patterns);
        }, 1000);
    }

    /**
     * 寻找特定数字组合模式
     * @returns {Array} 模式数组
     */
    findSpecificPatterns() {
        if (!this.gameEngine) return [];
        
        const gameState = this.gameEngine.getGameState();
        const patterns = [];
        
        // 寻找递增序列模式 (如 2-4-8, 4-8-16)
        const progressionPatterns = this.findProgressionPatterns();
        patterns.push(...progressionPatterns);
        
        // 寻找相同数值聚集模式
        const clusterPatterns = this.findClusterPatterns();
        patterns.push(...clusterPatterns);
        
        // 寻找对称模式
        const symmetryPatterns = this.findSymmetryPatterns();
        patterns.push(...symmetryPatterns);
        
        return patterns;
    }

    /**
     * 寻找递增序列模式
     * @returns {Array} 递增序列模式数组
     */
    findProgressionPatterns() {
        if (!this.gameEngine) return [];
        
        const gameState = this.gameEngine.getGameState();
        const patterns = [];
        
        // 检查水平递增序列
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x <= 1; x++) { // 最多检查到x=1，因为需要3个连续位置
                const tiles = [
                    gameState.getTile(x, y),
                    gameState.getTile(x + 1, y),
                    gameState.getTile(x + 2, y)
                ];
                
                if (tiles.every(tile => tile !== null)) {
                    if (this.isProgressionSequence(tiles)) {
                        patterns.push({
                            type: 'horizontal_progression',
                            tiles: tiles.map((tile, index) => ({
                                tile,
                                position: { x: x + index, y }
                            })),
                            multiplier: 2.0
                        });
                    }
                }
            }
        }
        
        // 检查垂直递增序列
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y <= 1; y++) {
                const tiles = [
                    gameState.getTile(x, y),
                    gameState.getTile(x, y + 1),
                    gameState.getTile(x, y + 2)
                ];
                
                if (tiles.every(tile => tile !== null)) {
                    if (this.isProgressionSequence(tiles)) {
                        patterns.push({
                            type: 'vertical_progression',
                            tiles: tiles.map((tile, index) => ({
                                tile,
                                position: { x, y: y + index }
                            })),
                            multiplier: 2.0
                        });
                    }
                }
            }
        }
        
        return patterns;
    }

    /**
     * 检查是否为递增序列
     * @param {Array} tiles - 方块数组
     * @returns {boolean} 是否为递增序列
     */
    isProgressionSequence(tiles) {
        if (tiles.length < 3) return false;
        
        // 检查是否为2的幂次递增序列
        for (let i = 0; i < tiles.length - 1; i++) {
            if (tiles[i + 1].value !== tiles[i].value * 2) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * 寻找相同数值聚集模式
     * @returns {Array} 聚集模式数组
     */
    findClusterPatterns() {
        if (!this.gameEngine) return [];
        
        const gameState = this.gameEngine.getGameState();
        const patterns = [];
        const visited = new Set();
        
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                const key = `${x},${y}`;
                if (visited.has(key)) continue;
                
                const tile = gameState.getTile(x, y);
                if (!tile) continue;
                
                const cluster = this.findConnectedTiles(x, y, tile.value, visited);
                
                // 至少4个相同数值的方块才能形成聚集模式
                if (cluster.length >= 4) {
                    patterns.push({
                        type: 'cluster',
                        tiles: cluster.map(pos => ({
                            tile: gameState.getTile(pos.x, pos.y),
                            position: pos
                        })),
                        multiplier: 1.5 + (cluster.length - 4) * 0.2 // 聚集越大，倍数越高
                    });
                }
            }
        }
        
        return patterns;
    }

    /**
     * 寻找对称模式
     * @returns {Array} 对称模式数组
     */
    findSymmetryPatterns() {
        if (!this.gameEngine) return [];
        
        const gameState = this.gameEngine.getGameState();
        const patterns = [];
        
        // 检查中心对称模式
        const centerSymmetry = this.checkCenterSymmetry();
        if (centerSymmetry.length > 0) {
            patterns.push({
                type: 'center_symmetry',
                tiles: centerSymmetry,
                multiplier: 3.0
            });
        }
        
        // 检查轴对称模式
        const axisSymmetry = this.checkAxisSymmetry();
        if (axisSymmetry.length > 0) {
            patterns.push({
                type: 'axis_symmetry',
                tiles: axisSymmetry,
                multiplier: 2.5
            });
        }
        
        return patterns;
    }

    /**
     * 检查中心对称模式
     * @returns {Array} 对称方块数组
     */
    checkCenterSymmetry() {
        if (!this.gameEngine) return [];
        
        const gameState = this.gameEngine.getGameState();
        const symmetricTiles = [];
        
        // 检查以(1.5, 1.5)为中心的对称性
        for (let x = 0; x < 2; x++) {
            for (let y = 0; y < 2; y++) {
                const tile1 = gameState.getTile(x, y);
                const tile2 = gameState.getTile(3 - x, 3 - y);
                
                if (tile1 && tile2 && tile1.value === tile2.value) {
                    symmetricTiles.push(
                        { tile: tile1, position: { x, y } },
                        { tile: tile2, position: { x: 3 - x, y: 3 - y } }
                    );
                }
            }
        }
        
        // 至少需要4个方块形成对称
        return symmetricTiles.length >= 4 ? symmetricTiles : [];
    }

    /**
     * 检查轴对称模式
     * @returns {Array} 对称方块数组
     */
    checkAxisSymmetry() {
        if (!this.gameEngine) return [];
        
        const gameState = this.gameEngine.getGameState();
        const symmetricTiles = [];
        
        // 检查垂直轴对称
        for (let x = 0; x < 2; x++) {
            for (let y = 0; y < 4; y++) {
                const tile1 = gameState.getTile(x, y);
                const tile2 = gameState.getTile(3 - x, y);
                
                if (tile1 && tile2 && tile1.value === tile2.value) {
                    symmetricTiles.push(
                        { tile: tile1, position: { x, y } },
                        { tile: tile2, position: { x: 3 - x, y } }
                    );
                }
            }
        }
        
        return symmetricTiles.length >= 4 ? symmetricTiles : [];
    }

    /**
     * 创建混天绫预览效果
     * @param {Array} patterns - 模式数组
     */
    createHuntianLingPreview(patterns) {
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        
        const previewContainer = document.createElement('div');
        previewContainer.className = 'huntian-ling-preview';
        previewContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 150;
        `;
        
        // 为每个模式创建预览效果
        patterns.forEach((pattern, patternIndex) => {
            pattern.tiles.forEach((tileInfo, tileIndex) => {
                const previewTile = document.createElement('div');
                previewTile.className = 'huntian-preview-tile';
                
                const cellSize = 100 / 4;
                const gap = 2;
                const pos = tileInfo.position;
                
                previewTile.style.cssText = `
                    position: absolute;
                    left: ${pos.x * cellSize + gap}%;
                    top: ${pos.y * cellSize + gap}%;
                    width: ${cellSize - gap * 2}%;
                    height: ${cellSize - gap * 2}%;
                    background: radial-gradient(circle, rgba(0, 206, 209, 0.8), rgba(64, 224, 208, 0.6));
                    border: 3px solid #00CED1;
                    border-radius: 8px;
                    animation: huntianPreview 1s ease-in-out;
                    animation-delay: ${(patternIndex * pattern.tiles.length + tileIndex) * 100}ms;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: #008B8B;
                    font-weight: bold;
                `;
                
                previewTile.textContent = '🌊';
                previewContainer.appendChild(previewTile);
            });
        });
        
        gameArea.appendChild(previewContainer);
        
        // 1秒后移除预览
        setTimeout(() => {
            if (previewContainer.parentNode) {
                previewContainer.parentNode.removeChild(previewContainer);
            }
        }, 1000);
    }

    /**
     * 执行混天绫连锁消除
     * @param {Array} patterns - 模式数组
     */
    performHuntianLingChain(patterns) {
        if (!this.gameEngine) return;
        
        const gameState = this.gameEngine.getGameState();
        let totalScore = 0;
        let totalCleared = 0;
        
        // 按顺序执行每个模式的连锁消除
        patterns.forEach((pattern, index) => {
            setTimeout(() => {
                let patternScore = 0;
                
                // 创建连锁动画
                this.createHuntianLingChainAnimation(pattern, index);
                
                // 延迟清除方块
                setTimeout(() => {
                    pattern.tiles.forEach(({ tile, position }) => {
                        if (tile) {
                            const baseScore = tile.value;
                            const multipliedScore = Math.floor(baseScore * pattern.multiplier);
                            patternScore += multipliedScore;
                            totalScore += multipliedScore;
                            totalCleared++;
                            
                            // 清除方块
                            gameState.setTile(position.x, position.y, null);
                        }
                    });
                    
                    // 添加分数
                    gameState.addScore(patternScore);
                    
                    console.log(`🌊 连锁 ${index + 1}: ${pattern.type}, 清除 ${pattern.tiles.length} 个方块, 得分 ${patternScore}`);
                    
                    // 如果是最后一个模式，触发完成事件
                    if (index === patterns.length - 1) {
                        setTimeout(() => {
                            this.emit('huntianLingCompleted', {
                                patterns: patterns,
                                totalScore: totalScore,
                                totalCleared: totalCleared
                            });
                            
                            console.log(`🌊 混天绫连锁完成: ${patterns.length} 个模式, 总计清除 ${totalCleared} 个方块, 总得分 ${totalScore}`);
                        }, 300);
                    }
                }, 400);
                
            }, index * 800);
        });
    }

    /**
     * 创建混天绫连锁动画
     * @param {Object} pattern - 模式对象
     * @param {number} chainIndex - 连锁索引
     */
    createHuntianLingChainAnimation(pattern, chainIndex) {
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        
        const animationContainer = document.createElement('div');
        animationContainer.className = 'huntian-ling-chain-animation';
        animationContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 200;
        `;
        
        // 为每个方块创建连锁动画
        pattern.tiles.forEach(({ tile, position }, index) => {
            const animationTile = document.createElement('div');
            animationTile.className = 'huntian-chain-tile';
            
            const cellSize = 100 / 4;
            const gap = 2;
            
            animationTile.style.cssText = `
                position: absolute;
                left: ${position.x * cellSize + gap}%;
                top: ${position.y * cellSize + gap}%;
                width: ${cellSize - gap * 2}%;
                height: ${cellSize - gap * 2}%;
                background: radial-gradient(circle, #00CED1, #40E0D0);
                border-radius: 50%;
                animation: huntianChain 0.8s ease-out forwards;
                animation-delay: ${index * 100}ms;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                color: white;
                font-weight: bold;
                box-shadow: 0 0 20px rgba(0, 206, 209, 0.8);
            `;
            
            const multipliedScore = Math.floor(tile.value * pattern.multiplier);
            animationTile.textContent = `+${multipliedScore}`;
            animationContainer.appendChild(animationTile);
            
            // 创建连锁波纹效果
            this.createHuntianLingRipple(position, index * 100 + chainIndex * 200);
        });
        
        gameArea.appendChild(animationContainer);
        
        // 1.2秒后移除动画容器
        setTimeout(() => {
            if (animationContainer.parentNode) {
                animationContainer.parentNode.removeChild(animationContainer);
            }
        }, 1200);
    }

    /**
     * 创建混天绫波纹效果
     * @param {Object} position - 位置
     * @param {number} delay - 延迟时间
     */
    createHuntianLingRipple(position, delay) {
        setTimeout(() => {
            const gameArea = document.querySelector('.game-area');
            if (!gameArea) return;
            
            const ripple = document.createElement('div');
            ripple.className = 'huntian-ripple';
            
            const cellSize = gameArea.clientWidth / 4;
            const centerX = (position.x + 0.5) * cellSize;
            const centerY = (position.y + 0.5) * cellSize;
            
            ripple.style.cssText = `
                position: absolute;
                left: ${centerX}px;
                top: ${centerY}px;
                width: 10px;
                height: 10px;
                background: rgba(0, 206, 209, 0.6);
                border: 2px solid #00CED1;
                border-radius: 50%;
                pointer-events: none;
                z-index: 250;
                animation: huntianRipple 1s ease-out forwards;
                transform: translate(-50%, -50%);
            `;
            
            gameArea.appendChild(ripple);
            
            // 1秒后移除波纹
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 1000);
        }, delay);
    }

    /**
     * 执行哪吒变身技能
     * @param {Object} options - 选项
     */
    executeTransformation(options) {
        // 启用变身模式
        if (this.gameEngine) {
            const gameState = this.gameEngine.getGameState();
            gameState.activeSkills.transformation = true;
        }
        
        // 创建变身视觉效果
        this.createSkillVisualEffect('transformation');
        
        // 提升游戏机制（例如：合并分数翻倍）
        this.applyTransformationBonus();
    }

    /**
     * 结束哪吒变身技能
     */
    endTransformation() {
        // 禁用变身模式
        if (this.gameEngine) {
            const gameState = this.gameEngine.getGameState();
            gameState.activeSkills.transformation = false;
        }
        
        // 移除变身奖励
        this.removeTransformationBonus();
    }

    /**
     * 选择清除区域
     * @param {Object} options - 选择选项
     * @returns {Array} 清除区域坐标数组
     */
    selectClearArea(options = {}) {
        if (!this.gameEngine) return [];
        
        const gameState = this.gameEngine.getGameState();
        
        // 如果指定了区域，直接返回
        if (options.area) {
            return options.area;
        }
        
        // 智能选择最佳清除区域
        const bestArea = this.findBestClearArea();
        
        if (bestArea.length > 0) {
            return bestArea;
        }
        
        // 默认选择中心2x2区域
        return [
            { x: 1, y: 1 },
            { x: 1, y: 2 },
            { x: 2, y: 1 },
            { x: 2, y: 2 }
        ];
    }

    /**
     * 寻找最佳清除区域
     * @returns {Array} 最佳清除区域坐标数组
     */
    findBestClearArea() {
        if (!this.gameEngine) return [];
        
        const gameState = this.gameEngine.getGameState();
        const possibleAreas = this.generatePossibleAreas();
        let bestArea = [];
        let bestScore = 0;
        
        // 评估每个可能的区域
        possibleAreas.forEach(area => {
            const score = this.evaluateClearArea(area);
            if (score > bestScore) {
                bestScore = score;
                bestArea = area;
            }
        });
        
        return bestArea;
    }

    /**
     * 生成所有可能的清除区域
     * @returns {Array} 可能的区域数组
     */
    generatePossibleAreas() {
        const areas = [];
        
        // 2x2区域
        for (let x = 0; x <= 2; x++) {
            for (let y = 0; y <= 2; y++) {
                areas.push([
                    { x, y },
                    { x: x + 1, y },
                    { x, y: y + 1 },
                    { x: x + 1, y: y + 1 }
                ]);
            }
        }
        
        // 十字形区域
        areas.push([
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 1, y: 2 },
            { x: 2, y: 2 },
            { x: 1, y: 0 },
            { x: 1, y: 3 },
            { x: 0, y: 1 },
            { x: 3, y: 1 }
        ]);
        
        // L形区域
        areas.push([
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: 2 }
        ]);
        
        return areas;
    }

    /**
     * 评估清除区域的价值
     * @param {Array} area - 区域坐标数组
     * @returns {number} 区域价值分数
     */
    evaluateClearArea(area) {
        if (!this.gameEngine) return 0;
        
        const gameState = this.gameEngine.getGameState();
        let score = 0;
        let tileCount = 0;
        let highValueTiles = 0;
        
        area.forEach(pos => {
            const tile = gameState.getTile(pos.x, pos.y);
            if (tile) {
                tileCount++;
                score += tile.value;
                
                // 高价值方块额外加分
                if (tile.value >= 128) {
                    highValueTiles++;
                    score += tile.value * 0.5;
                }
                
                // 阻塞位置额外加分
                if (this.isBlockingPosition(pos.x, pos.y)) {
                    score += tile.value * 0.3;
                }
            }
        });
        
        // 考虑清除后的空间价值
        const spaceValue = tileCount * 10;
        
        // 高价值方块集中的区域优先
        const concentrationBonus = highValueTiles * 50;
        
        return score + spaceValue + concentrationBonus;
    }

    /**
     * 检查位置是否为阻塞位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {boolean} 是否为阻塞位置
     */
    isBlockingPosition(x, y) {
        if (!this.gameEngine) return false;
        
        const gameState = this.gameEngine.getGameState();
        const gridManager = this.gameEngine.getGridManager();
        
        // 检查该位置是否阻止了可能的移动
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 0, dy: 1 },  // 下
            { dx: -1, dy: 0 }, // 左
            { dx: 1, dy: 0 }   // 右
        ];
        
        let blockingCount = 0;
        
        directions.forEach(dir => {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (nx >= 0 && nx < 4 && ny >= 0 && ny < 4) {
                const neighborTile = gameState.getTile(nx, ny);
                const currentTile = gameState.getTile(x, y);
                
                if (neighborTile && currentTile && 
                    neighborTile.value === currentTile.value) {
                    blockingCount++;
                }
            }
        });
        
        return blockingCount >= 2; // 至少阻塞两个方向
    }

    /**
     * 寻找连锁消除的方块
     * @returns {Array} 连锁方块数组
     */
    findChainTiles() {
        if (!this.gameEngine) return [];
        
        const gameState = this.gameEngine.getGameState();
        const chains = [];
        const visited = new Set();
        
        // 寻找相同数值的连续方块
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                const key = `${x},${y}`;
                if (visited.has(key)) continue;
                
                const tile = gameState.getTile(x, y);
                if (!tile) continue;
                
                const chain = this.findConnectedTiles(x, y, tile.value, visited);
                if (chain.length >= 3) { // 至少3个连续方块才能形成链
                    chains.push(chain);
                }
            }
        }
        
        return chains;
    }

    /**
     * 寻找连接的方块
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} value - 方块数值
     * @param {Set} visited - 已访问的位置
     * @returns {Array} 连接的方块位置数组
     */
    findConnectedTiles(x, y, value, visited) {
        const gameState = this.gameEngine.getGameState();
        const key = `${x},${y}`;
        
        if (visited.has(key)) return [];
        
        const tile = gameState.getTile(x, y);
        if (!tile || tile.value !== value) return [];
        
        visited.add(key);
        const connected = [{ x, y }];
        
        // 检查四个方向
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 0, dy: 1 },  // 下
            { dx: -1, dy: 0 }, // 左
            { dx: 1, dy: 0 }   // 右
        ];
        
        directions.forEach(dir => {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (nx >= 0 && nx < 4 && ny >= 0 && ny < 4) {
                const neighborTiles = this.findConnectedTiles(nx, ny, value, visited);
                connected.push(...neighborTiles);
            }
        });
        
        return connected;
    }

    /**
     * 检查特定数字组合模式
     * @returns {boolean} 是否存在特定模式
     */
    checkSpecificPattern() {
        if (!this.gameEngine) return false;
        
        const gameState = this.gameEngine.getGameState();
        
        // 检查是否存在2-4-8或4-8-16等递增序列
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 2; y++) {
                // 检查垂直序列
                const tile1 = gameState.getTile(x, y);
                const tile2 = gameState.getTile(x, y + 1);
                const tile3 = gameState.getTile(x, y + 2);
                
                if (tile1 && tile2 && tile3) {
                    if (tile2.value === tile1.value * 2 && tile3.value === tile2.value * 2) {
                        return true;
                    }
                }
            }
        }
        
        // 检查水平序列
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 2; x++) {
                const tile1 = gameState.getTile(x, y);
                const tile2 = gameState.getTile(x + 1, y);
                const tile3 = gameState.getTile(x + 2, y);
                
                if (tile1 && tile2 && tile3) {
                    if (tile2.value === tile1.value * 2 && tile3.value === tile2.value * 2) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * 创建技能视觉效果
     * @param {string} skillId - 技能ID
     * @param {Object} options - 选项
     */
    createSkillVisualEffect(skillId, options = {}) {
        if (!this.gameEngine || !this.gameEngine.getAnimationSystem) return;
        
        const animationSystem = this.gameEngine.getAnimationSystem();
        
        // 根据技能类型创建不同的视觉效果
        switch (skillId) {
            case 'threeHeadsSixArms':
                animationSystem.createSkillAnimation('threeHeadsSixArms');
                break;
            case 'qiankunCircle':
                if (options.area) {
                    options.area.forEach(pos => {
                        animationSystem.createParticleEffect(pos.x, pos.y, 'qiankunCircle');
                    });
                }
                break;
            case 'huntianLing':
                animationSystem.createSkillAnimation('huntianLing');
                break;
            case 'transformation':
                animationSystem.createSkillAnimation('transformation');
                break;
        }
    }

    /**
     * 创建连锁效果
     * @param {Array} chain - 连锁方块位置
     * @param {number} index - 连锁索引
     */
    createChainEffect(chain, index) {
        if (!this.gameEngine || !this.gameEngine.getAnimationSystem) return;
        
        const animationSystem = this.gameEngine.getAnimationSystem();
        
        chain.forEach(pos => {
            animationSystem.createParticleEffect(pos.x, pos.y, 'huntianLingChain');
        });
    }

    /**
     * 应用变身奖励
     */
    applyTransformationBonus() {
        // 这里可以修改游戏机制，比如合并分数翻倍
        console.log('变身奖励已激活');
    }

    /**
     * 移除变身奖励
     */
    removeTransformationBonus() {
        console.log('变身奖励已移除');
    }

    /**
     * 更新技能UI指示器
     */
    updateSkillUI() {
        Object.keys(this.skills).forEach(skillId => {
            this.updateSkillButton(skillId);
        });
    }

    /**
     * 更新技能按钮状态
     * @param {string} skillId - 技能ID
     */
    updateSkillButton(skillId) {
        const skillElement = document.getElementById(`skill-${skillId.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
        if (!skillElement) return;
        
        const state = this.skillStates[skillId];
        const skill = this.skills[skillId];
        
        // 更新解锁状态
        if (this.skillUnlocked[skillId]) {
            skillElement.classList.remove('locked');
        } else {
            skillElement.classList.add('locked');
        }
        
        // 更新可用状态
        if (this.canActivateSkill(skillId)) {
            skillElement.classList.remove('disabled');
            skillElement.classList.add('available');
        } else {
            skillElement.classList.add('disabled');
            skillElement.classList.remove('available');
        }
        
        // 更新激活状态
        if (state.isActive) {
            skillElement.classList.add('active');
        } else {
            skillElement.classList.remove('active');
        }
        
        // 更新冷却显示
        const cooldownElement = skillElement.querySelector('.skill-cooldown');
        if (cooldownElement && state.cooldownRemaining > 0) {
            const progress = state.cooldownRemaining / skill.cooldown;
            cooldownElement.style.background = `conic-gradient(from 0deg, transparent ${(1-progress)*100}%, rgba(0, 0, 0, 0.7) ${(1-progress)*100}%)`;
            cooldownElement.classList.add('active');
        } else if (cooldownElement) {
            cooldownElement.classList.remove('active');
        }
    }

    /**
     * 处理合并事件
     * @param {Object} mergeData - 合并数据
     */
    onMerge(mergeData) {
        // 更新连续合并计数
        this.consecutiveMerges++;
        this.lastMergeTime = Date.now();
        
        // 重置连击超时
        if (this.mergeComboTimeout) {
            clearTimeout(this.mergeComboTimeout);
        }
        
        this.mergeComboTimeout = setTimeout(() => {
            this.consecutiveMerges = 0;
        }, 3000); // 3秒内没有合并则重置连击
        
        console.log(`连续合并: ${this.consecutiveMerges}`);
    }

    /**
     * 手动触发技能
     * @param {string} skillId - 技能ID
     * @param {Object} options - 选项
     * @returns {boolean} 是否成功触发
     */
    triggerSkill(skillId, options = {}) {
        const skill = this.skills[skillId];
        
        if (!skill) {
            console.warn(`未知技能: ${skillId}`);
            return false;
        }
        
        if (skill.triggerCondition !== 'manual') {
            console.warn(`技能 ${skill.name} 不能手动触发`);
            return false;
        }
        
        return this.activateSkill(skillId, options);
    }

    /**
     * 获取技能信息
     * @param {string} skillId - 技能ID
     * @returns {Object} 技能信息
     */
    getSkillInfo(skillId) {
        return {
            skill: this.skills[skillId],
            state: this.skillStates[skillId],
            unlocked: this.skillUnlocked[skillId],
            canActivate: this.canActivateSkill(skillId)
        };
    }

    /**
     * 获取所有技能状态
     * @returns {Object} 所有技能状态
     */
    getAllSkillStates() {
        const states = {};
        
        Object.keys(this.skills).forEach(skillId => {
            states[skillId] = this.getSkillInfo(skillId);
        });
        
        return states;
    }

    /**
     * 重置技能系统
     */
    reset() {
        // 清除所有激活的技能
        this.activeSkills.forEach(skillId => {
            this.deactivateSkill(skillId);
        });
        
        // 重置状态
        this.consecutiveMerges = 0;
        this.lastMergeTime = 0;
        
        if (this.mergeComboTimeout) {
            clearTimeout(this.mergeComboTimeout);
            this.mergeComboTimeout = null;
        }
        
        // 重置技能状态（保持解锁状态）
        Object.keys(this.skillStates).forEach(skillId => {
            this.skillStates[skillId].isActive = false;
            this.skillStates[skillId].activationTime = 0;
            this.skillCooldowns[skillId] = 0;
            this.skillStates[skillId].cooldownRemaining = 0;
            this.skillStates[skillId].available = this.skillUnlocked[skillId];
        });
        
        this.activeSkills.clear();
        
        console.log('技能系统已重置');
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
                    console.error(`技能系统事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 销毁技能系统
     */
    destroy() {
        // 清除所有激活的技能
        this.activeSkills.forEach(skillId => {
            this.deactivateSkill(skillId);
        });
        
        // 清除超时
        if (this.mergeComboTimeout) {
            clearTimeout(this.mergeComboTimeout);
        }
        
        // 清除事件监听器
        this.eventListeners.clear();
        
        console.log('NezhaSkillSystem 已销毁');
    }
}