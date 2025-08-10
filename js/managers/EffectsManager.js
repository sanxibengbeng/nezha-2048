/**
 * EffectsManager类 - 特效管理器
 * 管理游戏中的各种视觉特效，包括粒子效果
 */
class EffectsManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 粒子系统
        this.particleSystem = new ParticleSystem(canvas);
        
        // 特效队列
        this.activeEffects = [];
        this.effectQueue = [];
        
        // 性能设置
        this.maxEffects = 50;
        this.qualityLevel = 'high'; // 'low', 'medium', 'high'
        
        // 哪吒主题特效预设
        this.nezhaEffects = {
            // 技能特效
            threeHeadsActivation: this.createThreeHeadsEffect(),
            qiankunCircleCharge: this.createQiankunCircleEffect(),
            huntianLingFlow: this.createHuntianLingEffect(),
            transformationAura: this.createTransformationEffect(),
            
            // 游戏特效
            tileSpawn: this.createTileSpawnEffect(),
            tileMerge: this.createTileMergeEffect(),
            scoreBonus: this.createScoreBonusEffect(),
            comboEffect: this.createComboEffect(),
            
            // 环境特效
            backgroundAmbient: this.createBackgroundAmbientEffect(),
            victoryBurst: this.createVictoryBurstEffect(),
            gameOverFade: this.createGameOverFadeEffect()
        };
        
        // 事件监听器
        this.eventListeners = new Map();
        
        console.log('特效管理器初始化完成');
    }

    /**
     * 启动特效管理器
     */
    start() {
        this.particleSystem.start();
        console.log('特效管理器已启动');
    }

    /**
     * 停止特效管理器
     */
    stop() {
        this.particleSystem.stop();
        this.activeEffects = [];
        this.effectQueue = [];
        console.log('特效管理器已停止');
    }

    /**
     * 更新特效管理器
     * @param {number} currentTime - 当前时间戳
     */
    update(currentTime) {
        // 更新粒子系统
        this.particleSystem.update(currentTime);
        
        // 处理特效队列
        this.processEffectQueue();
        
        // 更新活跃特效
        this.updateActiveEffects(currentTime);
    }

    /**
     * 渲染特效
     */
    render() {
        // 渲染粒子系统
        this.particleSystem.render();
        
        // 渲染其他特效
        this.renderActiveEffects();
    }

    /**
     * 创建哪吒特效
     * @param {string} effectName - 特效名称
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} options - 额外选项
     */
    createNezhaEffect(effectName, x, y, options = {}) {
        const effectConfig = this.nezhaEffects[effectName];
        if (!effectConfig) {
            console.warn(`未知的哪吒特效: ${effectName}`);
            return;
        }
        
        // 根据质量等级调整特效
        const adjustedConfig = this.adjustEffectForQuality(effectConfig, options);
        
        // 创建特效
        return this.createEffect(adjustedConfig, x, y, options);
    }

    /**
     * 创建通用特效
     * @param {Object} config - 特效配置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} options - 额外选项
     */
    createEffect(config, x, y, options = {}) {
        if (this.activeEffects.length >= this.maxEffects) {
            // 如果特效太多，加入队列等待
            this.effectQueue.push({ config, x, y, options });
            return;
        }
        
        const effect = {
            id: this.generateEffectId(),
            config: { ...config, ...options },
            x, y,
            startTime: performance.now(),
            duration: config.duration || 1000,
            particles: [],
            emitters: []
        };
        
        // 创建粒子效果
        if (config.particles) {
            config.particles.forEach(particleConfig => {
                const emitter = this.particleSystem.createEmitter({
                    ...particleConfig,
                    x: x + (particleConfig.offsetX || 0),
                    y: y + (particleConfig.offsetY || 0)
                });
                emitter.start();
                effect.emitters.push(emitter);
            });
        }
        
        this.activeEffects.push(effect);
        
        // 触发特效创建事件
        this.emit('effectCreated', { effect, name: config.name });
        
        return effect;
    }

    /**
     * 创建三头六臂激活特效
     * @returns {Object} 特效配置
     */
    createThreeHeadsEffect() {
        return {
            name: 'threeHeadsActivation',
            duration: 2000,
            particles: [
                {
                    type: 'fire',
                    offsetX: -20,
                    offsetY: 0,
                    particleCount: 15,
                    emissionRate: 25,
                    lifetime: { min: 0.8, max: 1.5 },
                    velocity: {
                        x: { min: -30, max: 30 },
                        y: { min: -60, max: -20 }
                    },
                    color: {
                        start: { r: 255, g: 69, b: 0, a: 1 },
                        end: { r: 255, g: 0, b: 0, a: 0 }
                    }
                },
                {
                    type: 'fire',
                    offsetX: 20,
                    offsetY: 0,
                    particleCount: 15,
                    emissionRate: 25,
                    lifetime: { min: 0.8, max: 1.5 },
                    velocity: {
                        x: { min: -30, max: 30 },
                        y: { min: -60, max: -20 }
                    },
                    color: {
                        start: { r: 255, g: 69, b: 0, a: 1 },
                        end: { r: 255, g: 0, b: 0, a: 0 }
                    }
                },
                {
                    type: 'spark',
                    offsetX: 0,
                    offsetY: -10,
                    particleCount: 20,
                    emissionRate: 40,
                    lifetime: { min: 0.5, max: 1.0 },
                    velocity: {
                        x: { min: -80, max: 80 },
                        y: { min: -100, max: -40 }
                    },
                    color: {
                        start: { r: 255, g: 215, b: 0, a: 1 },
                        end: { r: 255, g: 140, b: 0, a: 0 }
                    }
                }
            ]
        };
    }

    /**
     * 创建乾坤圈充能特效
     * @returns {Object} 特效配置
     */
    createQiankunCircleEffect() {
        return {
            name: 'qiankunCircleCharge',
            duration: 1500,
            particles: [
                {
                    type: 'glow',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 12,
                    emissionRate: 20,
                    lifetime: { min: 1.0, max: 2.0 },
                    position: { spread: 40 },
                    velocity: {
                        x: { min: -20, max: 20 },
                        y: { min: -20, max: 20 }
                    },
                    color: {
                        start: { r: 0, g: 191, b: 255, a: 0.8 },
                        end: { r: 135, g: 206, b: 250, a: 0 }
                    },
                    shape: 'glow',
                    blendMode: 'lighter'
                },
                {
                    type: 'magic',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 8,
                    emissionRate: 15,
                    lifetime: { min: 1.5, max: 2.5 },
                    velocity: {
                        x: { min: -40, max: 40 },
                        y: { min: -40, max: 40 }
                    },
                    color: {
                        start: { r: 30, g: 144, b: 255, a: 0.9 },
                        end: { r: 0, g: 100, b: 200, a: 0 }
                    },
                    shape: 'circle',
                    rotation: true
                }
            ]
        };
    }

    /**
     * 创建混天绫流动特效
     * @returns {Object} 特效配置
     */
    createHuntianLingEffect() {
        return {
            name: 'huntianLingFlow',
            duration: 3000,
            particles: [
                {
                    type: 'magic',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 20,
                    emissionRate: 30,
                    lifetime: { min: 1.5, max: 3.0 },
                    position: { spread: 30 },
                    velocity: {
                        x: { min: -60, max: 60 },
                        y: { min: -80, max: -20 }
                    },
                    acceleration: {
                        x: 0,
                        y: -10
                    },
                    color: {
                        start: { r: 255, g: 20, b: 147, a: 0.8 },
                        end: { r: 138, g: 43, b: 226, a: 0 }
                    },
                    shape: 'star',
                    rotation: true,
                    blendMode: 'lighter'
                },
                {
                    type: 'glow',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 10,
                    emissionRate: 20,
                    lifetime: { min: 2.0, max: 4.0 },
                    velocity: {
                        x: { min: -30, max: 30 },
                        y: { min: -50, max: -10 }
                    },
                    color: {
                        start: { r: 255, g: 105, b: 180, a: 0.6 },
                        end: { r: 255, g: 182, b: 193, a: 0 }
                    },
                    shape: 'glow'
                }
            ]
        };
    }

    /**
     * 创建哪吒变身光环特效
     * @returns {Object} 特效配置
     */
    createTransformationEffect() {
        return {
            name: 'transformationAura',
            duration: 5000,
            particles: [
                {
                    type: 'divine',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 25,
                    emissionRate: 40,
                    lifetime: { min: 2.0, max: 4.0 },
                    position: { spread: 50 },
                    velocity: {
                        x: { min: -40, max: 40 },
                        y: { min: -80, max: -20 }
                    },
                    acceleration: {
                        x: 0,
                        y: -15
                    },
                    color: {
                        start: { r: 255, g: 255, b: 255, a: 1 },
                        end: { r: 255, g: 215, b: 0, a: 0 }
                    },
                    shape: 'glow',
                    blendMode: 'lighter',
                    sizeOverTime: { start: 0.3, end: 2.0 }
                },
                {
                    type: 'fire',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 30,
                    emissionRate: 50,
                    lifetime: { min: 1.0, max: 2.0 },
                    position: { spread: 40 },
                    velocity: {
                        x: { min: -60, max: 60 },
                        y: { min: -100, max: -40 }
                    },
                    color: {
                        start: { r: 255, g: 140, b: 0, a: 0.8 },
                        end: { r: 255, g: 69, b: 0, a: 0 }
                    },
                    shape: 'circle',
                    blendMode: 'lighter'
                }
            ]
        };
    }

    /**
     * 创建方块生成特效
     * @returns {Object} 特效配置
     */
    createTileSpawnEffect() {
        return {
            name: 'tileSpawn',
            duration: 800,
            particles: [
                {
                    type: 'spark',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 8,
                    emissionRate: 30,
                    lifetime: { min: 0.3, max: 0.8 },
                    position: { spread: 15 },
                    velocity: {
                        x: { min: -50, max: 50 },
                        y: { min: -50, max: 50 }
                    },
                    color: {
                        start: { r: 255, g: 215, b: 0, a: 0.8 },
                        end: { r: 255, g: 165, b: 0, a: 0 }
                    },
                    shape: 'star',
                    blendMode: 'lighter'
                }
            ]
        };
    }

    /**
     * 创建方块合并特效
     * @returns {Object} 特效配置
     */
    createTileMergeEffect() {
        return {
            name: 'tileMerge',
            duration: 1000,
            particles: [
                {
                    type: 'explosion',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 12,
                    emissionRate: 60,
                    lifetime: { min: 0.5, max: 1.0 },
                    velocity: {
                        x: { min: -80, max: 80 },
                        y: { min: -80, max: 80 }
                    },
                    color: {
                        start: { r: 255, g: 255, b: 255, a: 1 },
                        end: { r: 255, g: 140, b: 0, a: 0 }
                    },
                    shape: 'circle',
                    blendMode: 'lighter'
                },
                {
                    type: 'glow',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 5,
                    emissionRate: 20,
                    lifetime: { min: 0.8, max: 1.5 },
                    velocity: {
                        x: { min: -20, max: 20 },
                        y: { min: -20, max: 20 }
                    },
                    color: {
                        start: { r: 255, g: 215, b: 0, a: 0.6 },
                        end: { r: 255, g: 255, b: 255, a: 0 }
                    },
                    shape: 'glow',
                    sizeOverTime: { start: 0.5, end: 2.0 }
                }
            ]
        };
    }

    /**
     * 创建分数奖励特效
     * @returns {Object} 特效配置
     */
    createScoreBonusEffect() {
        return {
            name: 'scoreBonus',
            duration: 1200,
            particles: [
                {
                    type: 'spark',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 10,
                    emissionRate: 40,
                    lifetime: { min: 0.6, max: 1.2 },
                    velocity: {
                        x: { min: -40, max: 40 },
                        y: { min: -80, max: -20 }
                    },
                    color: {
                        start: { r: 255, g: 215, b: 0, a: 1 },
                        end: { r: 255, g: 140, b: 0, a: 0 }
                    },
                    shape: 'star',
                    blendMode: 'lighter'
                }
            ]
        };
    }

    /**
     * 创建连击特效
     * @returns {Object} 特效配置
     */
    createComboEffect() {
        return {
            name: 'comboEffect',
            duration: 1500,
            particles: [
                {
                    type: 'magic',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 15,
                    emissionRate: 35,
                    lifetime: { min: 1.0, max: 2.0 },
                    velocity: {
                        x: { min: -60, max: 60 },
                        y: { min: -100, max: -40 }
                    },
                    color: {
                        start: { r: 138, g: 43, b: 226, a: 0.9 },
                        end: { r: 255, g: 20, b: 147, a: 0 }
                    },
                    shape: 'star',
                    rotation: true,
                    blendMode: 'lighter'
                }
            ]
        };
    }

    /**
     * 创建背景环境特效
     * @returns {Object} 特效配置
     */
    createBackgroundAmbientEffect() {
        return {
            name: 'backgroundAmbient',
            duration: -1, // 持续特效
            particles: [
                {
                    type: 'glow',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 3,
                    emissionRate: 5,
                    lifetime: { min: 3.0, max: 6.0 },
                    position: { spread: 100 },
                    velocity: {
                        x: { min: -10, max: 10 },
                        y: { min: -20, max: -5 }
                    },
                    color: {
                        start: { r: 255, g: 215, b: 0, a: 0.2 },
                        end: { r: 255, g: 255, b: 255, a: 0 }
                    },
                    shape: 'glow',
                    sizeOverTime: { start: 0.5, end: 1.5 }
                }
            ]
        };
    }

    /**
     * 创建胜利爆发特效
     * @returns {Object} 特效配置
     */
    createVictoryBurstEffect() {
        return {
            name: 'victoryBurst',
            duration: 3000,
            particles: [
                {
                    type: 'explosion',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 40,
                    emissionRate: 80,
                    lifetime: { min: 1.0, max: 2.5 },
                    velocity: {
                        x: { min: -150, max: 150 },
                        y: { min: -150, max: 150 }
                    },
                    color: {
                        start: { r: 255, g: 215, b: 0, a: 1 },
                        end: { r: 255, g: 140, b: 0, a: 0 }
                    },
                    shape: 'star',
                    blendMode: 'lighter'
                },
                {
                    type: 'divine',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 20,
                    emissionRate: 40,
                    lifetime: { min: 2.0, max: 4.0 },
                    velocity: {
                        x: { min: -80, max: 80 },
                        y: { min: -120, max: -40 }
                    },
                    color: {
                        start: { r: 255, g: 255, b: 255, a: 0.8 },
                        end: { r: 255, g: 215, b: 0, a: 0 }
                    },
                    shape: 'glow',
                    sizeOverTime: { start: 0.3, end: 2.0 }
                }
            ]
        };
    }

    /**
     * 创建游戏结束淡化特效
     * @returns {Object} 特效配置
     */
    createGameOverFadeEffect() {
        return {
            name: 'gameOverFade',
            duration: 2000,
            particles: [
                {
                    type: 'smoke',
                    offsetX: 0,
                    offsetY: 0,
                    particleCount: 15,
                    emissionRate: 25,
                    lifetime: { min: 2.0, max: 4.0 },
                    velocity: {
                        x: { min: -30, max: 30 },
                        y: { min: -60, max: -20 }
                    },
                    color: {
                        start: { r: 100, g: 100, b: 100, a: 0.4 },
                        end: { r: 50, g: 50, b: 50, a: 0 }
                    },
                    shape: 'circle',
                    sizeOverTime: { start: 0.5, end: 2.0 }
                }
            ]
        };
    }

    /**
     * 根据质量等级调整特效
     * @param {Object} config - 原始配置
     * @param {Object} options - 选项
     * @returns {Object} 调整后的配置
     */
    adjustEffectForQuality(config, options) {
        const adjustedConfig = JSON.parse(JSON.stringify(config));
        
        switch (this.qualityLevel) {
            case 'low':
                // 减少粒子数量和发射率
                adjustedConfig.particles?.forEach(particle => {
                    particle.particleCount = Math.ceil(particle.particleCount * 0.3);
                    particle.emissionRate = Math.ceil(particle.emissionRate * 0.3);
                });
                break;
            case 'medium':
                // 适中的粒子数量
                adjustedConfig.particles?.forEach(particle => {
                    particle.particleCount = Math.ceil(particle.particleCount * 0.6);
                    particle.emissionRate = Math.ceil(particle.emissionRate * 0.6);
                });
                break;
            case 'high':
                // 保持原始设置
                break;
        }
        
        return adjustedConfig;
    }

    /**
     * 处理特效队列
     */
    processEffectQueue() {
        while (this.effectQueue.length > 0 && this.activeEffects.length < this.maxEffects) {
            const { config, x, y, options } = this.effectQueue.shift();
            this.createEffect(config, x, y, options);
        }
    }

    /**
     * 更新活跃特效
     * @param {number} currentTime - 当前时间
     */
    updateActiveEffects(currentTime) {
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            
            // 检查特效是否过期
            if (effect.duration > 0 && currentTime - effect.startTime > effect.duration) {
                // 停止所有发射器
                effect.emitters.forEach(emitter => emitter.stop());
                
                // 移除特效
                this.activeEffects.splice(i, 1);
                
                // 触发特效结束事件
                this.emit('effectEnded', { effect });
            }
        }
    }

    /**
     * 渲染活跃特效
     */
    renderActiveEffects() {
        // 目前主要通过粒子系统渲染
        // 可以在这里添加其他类型的特效渲染
    }

    /**
     * 设置质量等级
     * @param {string} level - 质量等级 ('low', 'medium', 'high')
     */
    setQualityLevel(level) {
        if (['low', 'medium', 'high'].includes(level)) {
            this.qualityLevel = level;
            console.log(`特效质量等级设置为: ${level}`);
        }
    }

    /**
     * 生成特效ID
     * @returns {string} 特效ID
     */
    generateEffectId() {
        return 'effect_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 清理所有特效
     */
    clear() {
        this.particleSystem.clear();
        this.activeEffects = [];
        this.effectQueue = [];
        console.log('所有特效已清理');
    }

    /**
     * 获取系统状态
     * @returns {Object} 系统状态
     */
    getStatus() {
        return {
            particleSystem: this.particleSystem.getStatus(),
            activeEffects: this.activeEffects.length,
            queuedEffects: this.effectQueue.length,
            qualityLevel: this.qualityLevel,
            maxEffects: this.maxEffects
        };
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
                    console.error(`特效管理器事件处理器错误 (${event}):`, error);
                }
            });
        }
    }
}