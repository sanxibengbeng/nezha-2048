/**
 * AnimationSystem - 动画系统管理器
 * 负责管理游戏中的所有动画效果，包括方块移动、出现、消失等动画
 */
class AnimationSystem {
    constructor() {
        this.animations = new Map(); // 存储所有活跃的动画
        this.animationQueue = []; // 动画队列
        this.isRunning = false;
        this.lastFrameTime = 0;
        
        // 动画配置
        this.config = {
            // 方块移动动画配置
            tileMove: {
                duration: 150, // 毫秒
                easing: 'easeOutQuart'
            },
            // 方块出现动画配置
            tileAppear: {
                duration: 200,
                easing: 'easeOutBack'
            },
            // 方块消失动画配置
            tileDisappear: {
                duration: 100,
                easing: 'easeInQuart'
            },
            // 方块合并动画配置
            tileMerge: {
                duration: 300,
                easing: 'easeOutElastic'
            },
            // 合并闪烁效果配置
            mergeFlash: {
                duration: 150,
                easing: 'easeOutQuart'
            },
            // 火焰特效配置
            fireEffect: {
                duration: 500,
                easing: 'easeOutQuart'
            }
        };
        
        // 缓动函数
        this.easingFunctions = {
            linear: t => t,
            easeOutQuart: t => 1 - Math.pow(1 - t, 4),
            easeOutBack: t => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            },
            easeInQuart: t => t * t * t * t,
            easeOutElastic: t => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            }
        };
    }

    /**
     * 启动动画系统
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            this.animationLoop();
        }
    }

    /**
     * 停止动画系统
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * 动画主循环
     */
    animationLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        this.update(deltaTime);
        requestAnimationFrame(() => this.animationLoop());
    }

    /**
     * 更新所有动画
     * @param {number} deltaTime - 时间差（毫秒）
     */
    update(deltaTime) {
        // 更新所有活跃的动画
        for (const [id, animation] of this.animations) {
            animation.currentTime += deltaTime;
            const progress = Math.min(animation.currentTime / animation.duration, 1);
            
            // 应用缓动函数
            const easedProgress = this.easingFunctions[animation.easing](progress);
            
            // 更新动画属性
            this.updateAnimationProperties(animation, easedProgress);
            
            // 检查动画是否完成
            if (progress >= 1) {
                this.completeAnimation(id, animation);
            }
        }
        
        // 处理动画队列
        this.processAnimationQueue();
    }

    /**
     * 更新动画属性
     * @param {Object} animation - 动画对象
     * @param {number} progress - 动画进度 (0-1)
     */
    updateAnimationProperties(animation, progress) {
        const { target, properties, startValues, endValues } = animation;
        
        for (const prop in properties) {
            const startValue = startValues[prop];
            const endValue = endValues[prop];
            
            if (typeof startValue === 'number' && typeof endValue === 'number') {
                target[prop] = startValue + (endValue - startValue) * progress;
            } else if (prop === 'transform') {
                // 处理CSS transform属性
                target.style.transform = this.interpolateTransform(startValue, endValue, progress);
            }
        }
        
        // 调用更新回调
        if (animation.onUpdate) {
            animation.onUpdate(progress, target);
        }
    }

    /**
     * 插值计算transform属性
     * @param {string} start - 起始transform值
     * @param {string} end - 结束transform值
     * @param {number} progress - 进度
     * @returns {string} 插值后的transform值
     */
    interpolateTransform(start, end, progress) {
        // 简化实现，主要处理translate和scale
        const startMatch = start.match(/translate\(([^)]+)\)|scale\(([^)]+)\)/g) || [];
        const endMatch = end.match(/translate\(([^)]+)\)|scale\(([^)]+)\)/g) || [];
        
        let result = '';
        
        // 处理translate
        const startTranslate = this.parseTransform(start, 'translate');
        const endTranslate = this.parseTransform(end, 'translate');
        if (startTranslate && endTranslate) {
            const x = startTranslate.x + (endTranslate.x - startTranslate.x) * progress;
            const y = startTranslate.y + (endTranslate.y - startTranslate.y) * progress;
            result += `translate(${x}px, ${y}px) `;
        }
        
        // 处理scale
        const startScale = this.parseTransform(start, 'scale');
        const endScale = this.parseTransform(end, 'scale');
        if (startScale && endScale) {
            const scale = startScale + (endScale - startScale) * progress;
            result += `scale(${scale}) `;
        }
        
        return result.trim();
    }

    /**
     * 解析transform属性
     * @param {string} transform - transform字符串
     * @param {string} type - 变换类型
     * @returns {Object|number} 解析结果
     */
    parseTransform(transform, type) {
        const regex = new RegExp(`${type}\\(([^)]+)\\)`);
        const match = transform.match(regex);
        
        if (!match) return null;
        
        const values = match[1].split(',').map(v => parseFloat(v.trim()));
        
        if (type === 'translate') {
            return { x: values[0] || 0, y: values[1] || 0 };
        } else if (type === 'scale') {
            return values[0] || 1;
        }
        
        return null;
    }

    /**
     * 完成动画
     * @param {string} id - 动画ID
     * @param {Object} animation - 动画对象
     */
    completeAnimation(id, animation) {
        // 调用完成回调
        if (animation.onComplete) {
            animation.onComplete(animation.target);
        }
        
        // 从活跃动画中移除
        this.animations.delete(id);
    }

    /**
     * 处理动画队列
     */
    processAnimationQueue() {
        while (this.animationQueue.length > 0) {
            const queuedAnimation = this.animationQueue.shift();
            this.startAnimation(queuedAnimation);
        }
    }

    /**
     * 创建方块移动动画
     * @param {Object} tile - 方块对象
     * @param {Object} fromPos - 起始位置 {x, y}
     * @param {Object} toPos - 目标位置 {x, y}
     * @param {Function} onComplete - 完成回调
     * @returns {string} 动画ID
     */
    createTileAnimation(tile, fromPos, toPos, onComplete = null) {
        const animationId = `tile_move_${Date.now()}_${Math.random()}`;
        
        const animation = {
            id: animationId,
            type: 'tileMove',
            target: tile,
            duration: this.config.tileMove.duration,
            easing: this.config.tileMove.easing,
            currentTime: 0,
            properties: {
                x: true,
                y: true
            },
            startValues: {
                x: fromPos.x,
                y: fromPos.y
            },
            endValues: {
                x: toPos.x,
                y: toPos.y
            },
            onComplete: onComplete
        };
        
        return this.startAnimation(animation);
    }

    /**
     * 创建方块出现动画
     * @param {Object} tile - 方块对象
     * @param {Function} onComplete - 完成回调
     * @returns {string} 动画ID
     */
    createTileAppearAnimation(tile, onComplete = null) {
        const animationId = `tile_appear_${Date.now()}_${Math.random()}`;
        
        const animation = {
            id: animationId,
            type: 'tileAppear',
            target: tile,
            duration: this.config.tileAppear.duration,
            easing: this.config.tileAppear.easing,
            currentTime: 0,
            properties: {
                scale: true,
                opacity: true
            },
            startValues: {
                scale: 0,
                opacity: 0
            },
            endValues: {
                scale: 1,
                opacity: 1
            },
            onUpdate: (progress, target) => {
                // 更新方块的视觉属性
                if (target.element) {
                    target.element.style.transform = `scale(${target.scale})`;
                    target.element.style.opacity = target.opacity;
                }
            },
            onComplete: onComplete
        };
        
        return this.startAnimation(animation);
    }

    /**
     * 创建方块消失动画
     * @param {Object} tile - 方块对象
     * @param {Function} onComplete - 完成回调
     * @returns {string} 动画ID
     */
    createTileDisappearAnimation(tile, onComplete = null) {
        const animationId = `tile_disappear_${Date.now()}_${Math.random()}`;
        
        const animation = {
            id: animationId,
            type: 'tileDisappear',
            target: tile,
            duration: this.config.tileDisappear.duration,
            easing: this.config.tileDisappear.easing,
            currentTime: 0,
            properties: {
                scale: true,
                opacity: true
            },
            startValues: {
                scale: 1,
                opacity: 1
            },
            endValues: {
                scale: 0,
                opacity: 0
            },
            onUpdate: (progress, target) => {
                if (target.element) {
                    target.element.style.transform = `scale(${target.scale})`;
                    target.element.style.opacity = target.opacity;
                }
            },
            onComplete: onComplete
        };
        
        return this.startAnimation(animation);
    }

    /**
     * 启动动画
     * @param {Object} animation - 动画对象
     * @returns {string} 动画ID
     */
    startAnimation(animation) {
        this.animations.set(animation.id, animation);
        
        // 如果动画系统未运行，启动它
        if (!this.isRunning) {
            this.start();
        }
        
        return animation.id;
    }

    /**
     * 停止指定动画
     * @param {string} animationId - 动画ID
     */
    stopAnimation(animationId) {
        if (this.animations.has(animationId)) {
            const animation = this.animations.get(animationId);
            this.completeAnimation(animationId, animation);
        }
    }

    /**
     * 清除所有动画
     */
    clearAllAnimations() {
        this.animations.clear();
        this.animationQueue = [];
    }

    /**
     * 检查是否有活跃的动画
     * @returns {boolean}
     */
    hasActiveAnimations() {
        return this.animations.size > 0 || this.animationQueue.length > 0;
    }

    /**
     * 获取动画配置
     * @param {string} type - 动画类型
     * @returns {Object} 动画配置
     */
    getAnimationConfig(type) {
        return this.config[type] || {};
    }

    /**
     * 设置动画配置
     * @param {string} type - 动画类型
     * @param {Object} config - 配置对象
     */
    setAnimationConfig(type, config) {
        this.config[type] = { ...this.config[type], ...config };
    }

    /**
     * 创建方块合并动画
     * @param {Object} tile - 方块对象
     * @param {number} newValue - 合并后的新值
     * @param {Function} onComplete - 完成回调
     * @returns {string} 动画ID
     */
    createTileMergeAnimation(tile, newValue, onComplete = null) {
        const animationId = `tile_merge_${Date.now()}_${Math.random()}`;
        
        const animation = {
            id: animationId,
            type: 'tileMerge',
            target: tile,
            duration: this.config.tileMerge.duration,
            easing: this.config.tileMerge.easing,
            currentTime: 0,
            properties: {
                scale: true,
                brightness: true
            },
            startValues: {
                scale: 1,
                brightness: 1
            },
            endValues: {
                scale: 1.2,
                brightness: 1.5
            },
            newValue: newValue,
            onUpdate: (progress, target) => {
                // 创建弹性缩放效果
                const scaleProgress = progress < 0.5 ? progress * 2 : 2 - progress * 2;
                const currentScale = 1 + (target.scale - 1) * scaleProgress;
                
                if (target.element) {
                    target.element.style.transform = `scale(${currentScale})`;
                    target.element.style.filter = `brightness(${target.brightness})`;
                    
                    // 添加发光效果
                    const glowIntensity = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
                    target.element.style.boxShadow = `0 0 ${20 * glowIntensity}px rgba(255, 215, 0, ${0.8 * glowIntensity})`;
                }
            },
            onComplete: (target) => {
                // 重置样式
                if (target.element) {
                    target.element.style.transform = 'scale(1)';
                    target.element.style.filter = 'brightness(1)';
                    target.element.style.boxShadow = 'none';
                    
                    // 更新方块值
                    target.value = newValue;
                    if (target.element.querySelector('.tile-content')) {
                        target.element.querySelector('.tile-content').textContent = newValue;
                    }
                }
                
                if (onComplete) {
                    onComplete(target);
                }
            }
        };
        
        return this.startAnimation(animation);
    }

    /**
     * 创建合并闪烁效果
     * @param {Object} tile - 方块对象
     * @param {Function} onComplete - 完成回调
     * @returns {string} 动画ID
     */
    createMergeFlashAnimation(tile, onComplete = null) {
        const animationId = `merge_flash_${Date.now()}_${Math.random()}`;
        
        const animation = {
            id: animationId,
            type: 'mergeFlash',
            target: tile,
            duration: this.config.mergeFlash.duration,
            easing: this.config.mergeFlash.easing,
            currentTime: 0,
            properties: {
                opacity: true,
                backgroundColor: true
            },
            startValues: {
                opacity: 1,
                backgroundColor: 'original'
            },
            endValues: {
                opacity: 0.3,
                backgroundColor: '#FFD700'
            },
            onUpdate: (progress, target) => {
                if (target.element) {
                    // 创建闪烁效果
                    const flashProgress = Math.sin(progress * Math.PI * 6);
                    const opacity = 0.3 + Math.abs(flashProgress) * 0.7;
                    
                    target.element.style.opacity = opacity;
                    
                    // 背景颜色闪烁
                    if (progress < 0.8) {
                        const intensity = Math.abs(flashProgress);
                        target.element.style.backgroundColor = `rgba(255, 215, 0, ${intensity * 0.5})`;
                    }
                }
            },
            onComplete: (target) => {
                if (target.element) {
                    target.element.style.opacity = '1';
                    target.element.style.backgroundColor = '';
                }
                
                if (onComplete) {
                    onComplete(target);
                }
            }
        };
        
        return this.startAnimation(animation);
    }

    /**
     * 创建火焰特效动画
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} intensity - 强度 ('low', 'medium', 'high')
     * @param {Function} onComplete - 完成回调
     * @returns {string} 动画ID
     */
    createFireEffectAnimation(x, y, intensity = 'medium', onComplete = null) {
        const animationId = `fire_effect_${Date.now()}_${Math.random()}`;
        
        // 创建火焰特效元素
        const fireElement = this.createFireEffectElement(x, y, intensity);
        
        const animation = {
            id: animationId,
            type: 'fireEffect',
            target: { element: fireElement },
            duration: this.config.fireEffect.duration,
            easing: this.config.fireEffect.easing,
            currentTime: 0,
            properties: {
                scale: true,
                opacity: true,
                rotation: true
            },
            startValues: {
                scale: 0.5,
                opacity: 1,
                rotation: 0
            },
            endValues: {
                scale: 2,
                opacity: 0,
                rotation: 360
            },
            onUpdate: (progress, target) => {
                if (target.element) {
                    const scale = target.scale;
                    const opacity = target.opacity;
                    const rotation = target.rotation;
                    
                    target.element.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
                    target.element.style.opacity = opacity;
                    
                    // 添加火焰颜色变化
                    const hue = 0 + progress * 60; // 从红色到橙色
                    target.element.style.filter = `hue-rotate(${hue}deg) brightness(${1.5 - progress * 0.5})`;
                }
            },
            onComplete: (target) => {
                // 移除火焰特效元素
                if (target.element && target.element.parentNode) {
                    target.element.parentNode.removeChild(target.element);
                }
                
                if (onComplete) {
                    onComplete();
                }
            }
        };
        
        return this.startAnimation(animation);
    }

    /**
     * 创建火焰特效元素
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} intensity - 强度
     * @returns {HTMLElement} 火焰特效元素
     */
    createFireEffectElement(x, y, intensity) {
        const fireElement = document.createElement('div');
        fireElement.className = `fire-effect fire-${intensity}`;
        
        // 设置火焰样式
        fireElement.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 40px;
            height: 40px;
            background: radial-gradient(circle, #FF4500 0%, #FF6347 30%, #FFD700 60%, transparent 100%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            transform-origin: center;
        `;
        
        // 根据强度调整大小
        const sizeMultiplier = {
            'low': 0.8,
            'medium': 1.0,
            'high': 1.5
        }[intensity] || 1.0;
        
        const size = 40 * sizeMultiplier;
        fireElement.style.width = size + 'px';
        fireElement.style.height = size + 'px';
        
        // 添加到游戏区域
        const gameArea = document.querySelector('.game-area') || document.body;
        gameArea.appendChild(fireElement);
        
        return fireElement;
    }

    /**
     * 创建组合合并动画（包含缩放、闪烁和火焰特效）
     * @param {Object} tile - 方块对象
     * @param {number} newValue - 合并后的新值
     * @param {Object} position - 位置 {x, y}
     * @param {Function} onComplete - 完成回调
     * @returns {Array} 动画ID数组
     */
    createCombinedMergeAnimation(tile, newValue, position, onComplete = null) {
        const animationIds = [];
        let completedAnimations = 0;
        const totalAnimations = 3;
        
        const checkAllComplete = () => {
            completedAnimations++;
            if (completedAnimations >= totalAnimations && onComplete) {
                onComplete(tile);
            }
        };
        
        // 1. 合并缩放动画
        const mergeId = this.createTileMergeAnimation(tile, newValue, checkAllComplete);
        animationIds.push(mergeId);
        
        // 2. 闪烁效果（稍微延迟）
        setTimeout(() => {
            const flashId = this.createMergeFlashAnimation(tile, checkAllComplete);
            animationIds.push(flashId);
        }, 50);
        
        // 3. 火焰特效
        const intensity = this.getFireIntensityByValue(newValue);
        const fireId = this.createFireEffectAnimation(position.x, position.y, intensity, checkAllComplete);
        animationIds.push(fireId);
        
        return animationIds;
    }

    /**
     * 根据方块值确定火焰强度
     * @param {number} value - 方块值
     * @returns {string} 火焰强度
     */
    getFireIntensityByValue(value) {
        if (value >= 1024) return 'high';
        if (value >= 256) return 'medium';
        return 'low';
    }

    /**
     * 创建连锁合并动画
     * @param {Array} tiles - 参与连锁的方块数组
     * @param {Function} onComplete - 完成回调
     * @returns {Array} 动画ID数组
     */
    createChainMergeAnimation(tiles, onComplete = null) {
        const animationIds = [];
        let completedChains = 0;
        
        const checkChainComplete = () => {
            completedChains++;
            if (completedChains >= tiles.length && onComplete) {
                onComplete();
            }
        };
        
        tiles.forEach((tileData, index) => {
            // 为每个方块添加延迟，创建连锁效果
            setTimeout(() => {
                const ids = this.createCombinedMergeAnimation(
                    tileData.tile,
                    tileData.newValue,
                    tileData.position,
                    checkChainComplete
                );
                animationIds.push(...ids);
            }, index * 100); // 100ms延迟
        });
        
        return animationIds;
    }

    /**
     * 创建同步合并动画（多个方块同时合并）
     * @param {Array} mergeData - 合并数据数组
     * @param {Function} onComplete - 完成回调
     * @returns {Array} 动画ID数组
     */
    createSynchronizedMergeAnimation(mergeData, onComplete = null) {
        const animationIds = [];
        let completedMerges = 0;
        
        const checkSyncComplete = () => {
            completedMerges++;
            if (completedMerges >= mergeData.length && onComplete) {
                onComplete();
            }
        };
        
        mergeData.forEach(data => {
            const ids = this.createCombinedMergeAnimation(
                data.tile,
                data.newValue,
                data.position,
                checkSyncComplete
            );
            animationIds.push(...ids);
        });
        
        return animationIds;
    }

    /**
     * 优化动画性能 - 批量更新DOM
     */
    optimizeBatchUpdate() {
        // 使用requestAnimationFrame批量更新DOM
        if (this.pendingDOMUpdates) {
            return;
        }
        
        this.pendingDOMUpdates = true;
        
        requestAnimationFrame(() => {
            // 批量执行DOM更新
            this.animations.forEach(animation => {
                if (animation.onUpdate && animation.target) {
                    const progress = Math.min(animation.currentTime / animation.duration, 1);
                    const easedProgress = this.easingFunctions[animation.easing](progress);
                    this.updateAnimationProperties(animation, easedProgress);
                }
            });
            
            this.pendingDOMUpdates = false;
        });
    }

    /**
     * 获取当前活跃的合并动画数量
     * @returns {number} 合并动画数量
     */
    getActiveMergeAnimationCount() {
        let count = 0;
        for (const animation of this.animations.values()) {
            if (animation.type === 'tileMerge' || 
                animation.type === 'mergeFlash' || 
                animation.type === 'fireEffect') {
                count++;
            }
        }
        return count;
    }

    /**
     * 清除所有合并相关动画
     */
    clearMergeAnimations() {
        const mergeAnimationIds = [];
        
        for (const [id, animation] of this.animations) {
            if (animation.type === 'tileMerge' || 
                animation.type === 'mergeFlash' || 
                animation.type === 'fireEffect') {
                mergeAnimationIds.push(id);
            }
        }
        
        mergeAnimationIds.forEach(id => {
            this.stopAnimation(id);
        });
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationSystem;
}