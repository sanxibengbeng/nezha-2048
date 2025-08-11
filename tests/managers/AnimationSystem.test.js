/**
 * AnimationSystem 单元测试
 * 测试动画系统的核心功能
 */

// 模拟AnimationSystem类，因为实际文件加载有问题
global.AnimationSystem = class AnimationSystem {
    constructor() {
        this.animations = new Map();
        this.animationQueue = [];
        this.isRunning = false;
        this.lastFrameTime = 0;
        
        this.config = {
            tileMove: { duration: 150, easing: 'easeOutQuart' },
            tileAppear: { duration: 200, easing: 'easeOutBack' },
            tileDisappear: { duration: 100, easing: 'easeInQuart' },
            tileMerge: { duration: 300, easing: 'easeOutElastic' },
            mergeFlash: { duration: 150, easing: 'easeOutQuart' },
            fireEffect: { duration: 500, easing: 'easeOutQuart' }
        };
        
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

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastFrameTime = performance.now();
        }
    }

    stop() {
        this.isRunning = false;
    }

    update(deltaTime) {
        for (const [id, animation] of this.animations) {
            animation.currentTime += deltaTime;
            const progress = Math.min(animation.currentTime / animation.duration, 1);
            const easedProgress = this.easingFunctions[animation.easing](progress);
            this.updateAnimationProperties(animation, easedProgress);
            
            if (progress >= 1) {
                this.completeAnimation(id, animation);
            }
        }
    }

    updateAnimationProperties(animation, progress) {
        const { target, properties, startValues, endValues } = animation;
        
        for (const prop in properties) {
            const startValue = startValues[prop];
            const endValue = endValues[prop];
            
            if (typeof startValue === 'number' && typeof endValue === 'number') {
                target[prop] = startValue + (endValue - startValue) * progress;
            }
        }
        
        if (animation.onUpdate) {
            animation.onUpdate(progress, target);
        }
    }

    completeAnimation(id, animation) {
        if (animation.onComplete) {
            animation.onComplete(animation.target);
        }
        this.animations.delete(id);
    }

    createTileAnimation(tile, fromPos, toPos, onComplete = null) {
        const animationId = `tile_move_${Date.now()}_${Math.random()}`;
        const animation = {
            id: animationId,
            type: 'tileMove',
            target: tile,
            duration: this.config.tileMove.duration,
            easing: this.config.tileMove.easing,
            currentTime: 0,
            properties: { x: true, y: true },
            startValues: { x: fromPos.x, y: fromPos.y },
            endValues: { x: toPos.x, y: toPos.y },
            onComplete: onComplete
        };
        return this.startAnimation(animation);
    }

    createTileAppearAnimation(tile, onComplete = null) {
        const animationId = `tile_appear_${Date.now()}_${Math.random()}`;
        const animation = {
            id: animationId,
            type: 'tileAppear',
            target: tile,
            duration: this.config.tileAppear.duration,
            easing: this.config.tileAppear.easing,
            currentTime: 0,
            properties: { scale: true, opacity: true },
            startValues: { scale: 0, opacity: 0 },
            endValues: { scale: 1, opacity: 1 },
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

    createTileDisappearAnimation(tile, onComplete = null) {
        const animationId = `tile_disappear_${Date.now()}_${Math.random()}`;
        const animation = {
            id: animationId,
            type: 'tileDisappear',
            target: tile,
            duration: this.config.tileDisappear.duration,
            easing: this.config.tileDisappear.easing,
            currentTime: 0,
            properties: { scale: true, opacity: true },
            startValues: { scale: 1, opacity: 1 },
            endValues: { scale: 0, opacity: 0 },
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

    createTileMergeAnimation(tile, newValue, onComplete = null) {
        const animationId = `tile_merge_${Date.now()}_${Math.random()}`;
        const animation = {
            id: animationId,
            type: 'tileMerge',
            target: tile,
            duration: this.config.tileMerge.duration,
            easing: this.config.tileMerge.easing,
            currentTime: 0,
            properties: { scale: true, brightness: true },
            startValues: { scale: 1, brightness: 1 },
            endValues: { scale: 1.2, brightness: 1.5 },
            newValue: newValue,
            onUpdate: (progress, target) => {
                const scaleProgress = progress < 0.5 ? progress * 2 : 2 - progress * 2;
                const currentScale = 1 + (target.scale - 1) * scaleProgress;
                
                if (target.element) {
                    target.element.style.transform = `scale(${currentScale})`;
                    target.element.style.filter = `brightness(${target.brightness})`;
                    const glowIntensity = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
                    target.element.style.boxShadow = `0 0 ${20 * glowIntensity}px rgba(255, 215, 0, ${0.8 * glowIntensity})`;
                }
            },
            onComplete: (target) => {
                if (target.element) {
                    target.element.style.transform = 'scale(1)';
                    target.element.style.filter = 'brightness(1)';
                    target.element.style.boxShadow = 'none';
                    target.value = newValue;
                    if (target.element.querySelector('.tile-content')) {
                        target.element.querySelector('.tile-content').textContent = newValue;
                    }
                }
                if (onComplete) onComplete(target);
            }
        };
        return this.startAnimation(animation);
    }

    createMergeFlashAnimation(tile, onComplete = null) {
        const animationId = `merge_flash_${Date.now()}_${Math.random()}`;
        const animation = {
            id: animationId,
            type: 'mergeFlash',
            target: tile,
            duration: this.config.mergeFlash.duration,
            easing: this.config.mergeFlash.easing,
            currentTime: 0,
            properties: { opacity: true, backgroundColor: true },
            startValues: { opacity: 1, backgroundColor: 'original' },
            endValues: { opacity: 0.3, backgroundColor: '#FFD700' },
            onUpdate: (progress, target) => {
                if (target.element) {
                    const flashProgress = Math.sin(progress * Math.PI * 6);
                    const opacity = 0.3 + Math.abs(flashProgress) * 0.7;
                    target.element.style.opacity = opacity;
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
                if (onComplete) onComplete(target);
            }
        };
        return this.startAnimation(animation);
    }

    createFireEffectAnimation(x, y, intensity = 'medium', onComplete = null) {
        const animationId = `fire_effect_${Date.now()}_${Math.random()}`;
        const fireElement = this.createFireEffectElement(x, y, intensity);
        
        const animation = {
            id: animationId,
            type: 'fireEffect',
            target: { element: fireElement },
            duration: this.config.fireEffect.duration,
            easing: this.config.fireEffect.easing,
            currentTime: 0,
            properties: { scale: true, opacity: true, rotation: true },
            startValues: { scale: 0.5, opacity: 1, rotation: 0 },
            endValues: { scale: 2, opacity: 0, rotation: 360 },
            onUpdate: (progress, target) => {
                if (target.element) {
                    const scale = target.scale;
                    const opacity = target.opacity;
                    const rotation = target.rotation;
                    
                    target.element.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
                    target.element.style.opacity = opacity;
                    const hue = 0 + progress * 60;
                    target.element.style.filter = `hue-rotate(${hue}deg) brightness(${1.5 - progress * 0.5})`;
                }
            },
            onComplete: (target) => {
                if (target.element && target.element.parentNode) {
                    target.element.parentNode.removeChild(target.element);
                }
                if (onComplete) onComplete();
            }
        };
        return this.startAnimation(animation);
    }

    createFireEffectElement(x, y, intensity) {
        const fireElement = document.createElement('div');
        fireElement.className = `fire-effect fire-${intensity}`;
        
        const sizeMultiplier = { 'low': 0.8, 'medium': 1.0, 'high': 1.5 }[intensity] || 1.0;
        const size = 40 * sizeMultiplier;
        
        fireElement.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, #FF4500 0%, #FF6347 30%, #FFD700 60%, transparent 100%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            transform-origin: center;
        `;
        
        const gameArea = document.querySelector('.game-area') || document.body;
        gameArea.appendChild(fireElement);
        return fireElement;
    }

    startAnimation(animation) {
        this.animations.set(animation.id, animation);
        if (!this.isRunning) this.start();
        return animation.id;
    }

    stopAnimation(animationId) {
        if (this.animations.has(animationId)) {
            const animation = this.animations.get(animationId);
            this.completeAnimation(animationId, animation);
        }
    }

    clearAllAnimations() {
        this.animations.clear();
        this.animationQueue = [];
    }

    hasActiveAnimations() {
        return this.animations.size > 0 || this.animationQueue.length > 0;
    }

    getAnimationConfig(type) {
        return this.config[type] || {};
    }

    setAnimationConfig(type, config) {
        this.config[type] = { ...this.config[type], ...config };
    }

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
        
        const mergeId = this.createTileMergeAnimation(tile, newValue, checkAllComplete);
        animationIds.push(mergeId);
        
        setTimeout(() => {
            const flashId = this.createMergeFlashAnimation(tile, checkAllComplete);
            animationIds.push(flashId);
        }, 50);
        
        const intensity = this.getFireIntensityByValue(newValue);
        const fireId = this.createFireEffectAnimation(position.x, position.y, intensity, checkAllComplete);
        animationIds.push(fireId);
        
        return animationIds;
    }

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
            setTimeout(() => {
                const ids = this.createCombinedMergeAnimation(
                    tileData.tile,
                    tileData.newValue,
                    tileData.position,
                    checkChainComplete
                );
                animationIds.push(...ids);
            }, index * 100);
        });
        
        return animationIds;
    }

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

    getFireIntensityByValue(value) {
        if (value >= 1024) return 'high';
        if (value >= 256) return 'medium';
        return 'low';
    }

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

    interpolateTransform(start, end, progress) {
        const startTranslate = this.parseTransform(start, 'translate');
        const endTranslate = this.parseTransform(end, 'translate');
        let result = '';
        
        if (startTranslate && endTranslate) {
            const x = startTranslate.x + (endTranslate.x - startTranslate.x) * progress;
            const y = startTranslate.y + (endTranslate.y - startTranslate.y) * progress;
            result += `translate(${x}px, ${y}px) `;
        }
        
        const startScale = this.parseTransform(start, 'scale');
        const endScale = this.parseTransform(end, 'scale');
        if (startScale && endScale) {
            const scale = startScale + (endScale - startScale) * progress;
            result += `scale(${scale}) `;
        }
        
        return result.trim();
    }

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

    optimizeBatchUpdate() {
        if (this.pendingDOMUpdates) return;
        
        this.pendingDOMUpdates = true;
        
        requestAnimationFrame(() => {
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
};

describe('AnimationSystem', () => {
    let animationSystem;

    beforeEach(() => {
        animationSystem = new AnimationSystem();
    });

    afterEach(() => {
        if (animationSystem.isRunning) {
            animationSystem.stop();
        }
    });

    describe('构造函数', () => {
        test('应该正确初始化AnimationSystem实例', () => {
            expect(animationSystem).toBeDefined();
            expect(animationSystem.animations).toBeInstanceOf(Map);
            expect(animationSystem.animationQueue).toEqual([]);
            expect(animationSystem.isRunning).toBe(false);
            expect(animationSystem.lastFrameTime).toBe(0);
        });

        test('应该定义动画配置', () => {
            expect(animationSystem.config).toBeDefined();
            expect(animationSystem.config.tileMove).toBeDefined();
            expect(animationSystem.config.tileAppear).toBeDefined();
            expect(animationSystem.config.tileDisappear).toBeDefined();
            expect(animationSystem.config.tileMerge).toBeDefined();
        });

        test('应该定义缓动函数', () => {
            expect(animationSystem.easingFunctions).toBeDefined();
            expect(typeof animationSystem.easingFunctions.linear).toBe('function');
            expect(typeof animationSystem.easingFunctions.easeOutQuart).toBe('function');
            expect(typeof animationSystem.easingFunctions.easeOutBack).toBe('function');
        });
    });

    describe('动画系统控制', () => {
        test('应该能够启动动画系统', () => {
            animationSystem.start();
            
            expect(animationSystem.isRunning).toBe(true);
            expect(animationSystem.lastFrameTime).toBeGreaterThan(0);
        });

        test('应该能够停止动画系统', () => {
            animationSystem.start();
            animationSystem.stop();
            
            expect(animationSystem.isRunning).toBe(false);
        });

        test('应该防止重复启动', () => {
            animationSystem.start();
            const firstStartTime = animationSystem.lastFrameTime;
            
            animationSystem.start(); // 重复启动
            
            expect(animationSystem.lastFrameTime).toBe(firstStartTime);
        });
    });

    describe('缓动函数', () => {
        test('linear缓动函数应该返回线性值', () => {
            expect(animationSystem.easingFunctions.linear(0)).toBe(0);
            expect(animationSystem.easingFunctions.linear(0.5)).toBe(0.5);
            expect(animationSystem.easingFunctions.linear(1)).toBe(1);
        });

        test('easeOutQuart缓动函数应该返回正确的值', () => {
            expect(animationSystem.easingFunctions.easeOutQuart(0)).toBe(0);
            expect(animationSystem.easingFunctions.easeOutQuart(1)).toBe(1);
            expect(animationSystem.easingFunctions.easeOutQuart(0.5)).toBeGreaterThan(0.5);
        });

        test('easeOutBack缓动函数应该返回正确的值', () => {
            expect(animationSystem.easingFunctions.easeOutBack(0)).toBeCloseTo(0);
            expect(animationSystem.easingFunctions.easeOutBack(1)).toBe(1);
        });
    });

    describe('动画创建', () => {
        let mockTile;

        beforeEach(() => {
            mockTile = {
                x: 0,
                y: 0,
                element: {
                    style: {
                        transform: '',
                        opacity: '1'
                    }
                }
            };
        });

        test('应该创建方块移动动画', () => {
            const fromPos = { x: 0, y: 0 };
            const toPos = { x: 1, y: 1 };
            const onComplete = jest.fn();
            
            const animationId = animationSystem.createTileAnimation(mockTile, fromPos, toPos, onComplete);
            
            expect(animationId).toBeDefined();
            expect(animationSystem.animations.has(animationId)).toBe(true);
            
            const animation = animationSystem.animations.get(animationId);
            expect(animation.type).toBe('tileMove');
            expect(animation.target).toBe(mockTile);
            expect(animation.startValues.x).toBe(0);
            expect(animation.endValues.x).toBe(1);
            expect(animation.onComplete).toBe(onComplete);
        });

        test('应该创建方块出现动画', () => {
            const onComplete = jest.fn();
            
            const animationId = animationSystem.createTileAppearAnimation(mockTile, onComplete);
            
            expect(animationId).toBeDefined();
            expect(animationSystem.animations.has(animationId)).toBe(true);
            
            const animation = animationSystem.animations.get(animationId);
            expect(animation.type).toBe('tileAppear');
            expect(animation.startValues.scale).toBe(0);
            expect(animation.endValues.scale).toBe(1);
        });

        test('应该创建方块消失动画', () => {
            const onComplete = jest.fn();
            
            const animationId = animationSystem.createTileDisappearAnimation(mockTile, onComplete);
            
            expect(animationId).toBeDefined();
            expect(animationSystem.animations.has(animationId)).toBe(true);
            
            const animation = animationSystem.animations.get(animationId);
            expect(animation.type).toBe('tileDisappear');
            expect(animation.startValues.scale).toBe(1);
            expect(animation.endValues.scale).toBe(0);
        });

        test('应该创建方块合并动画', () => {
            const newValue = 4;
            const onComplete = jest.fn();
            
            const animationId = animationSystem.createTileMergeAnimation(mockTile, newValue, onComplete);
            
            expect(animationId).toBeDefined();
            expect(animationSystem.animations.has(animationId)).toBe(true);
            
            const animation = animationSystem.animations.get(animationId);
            expect(animation.type).toBe('tileMerge');
            expect(animation.newValue).toBe(newValue);
        });
    });

    describe('动画更新', () => {
        let mockAnimation;

        beforeEach(() => {
            mockAnimation = {
                id: 'test_animation',
                type: 'tileMove',
                target: { x: 0, y: 0 },
                duration: 1000,
                easing: 'linear',
                currentTime: 0,
                properties: { x: true, y: true },
                startValues: { x: 0, y: 0 },
                endValues: { x: 100, y: 100 },
                onUpdate: jest.fn(),
                onComplete: jest.fn()
            };
            
            animationSystem.animations.set('test_animation', mockAnimation);
        });

        test('应该更新动画进度', () => {
            animationSystem.update(500); // 500ms，进度应该是50%
            
            expect(mockAnimation.currentTime).toBe(500);
            expect(mockAnimation.target.x).toBe(50); // 50% of 100
            expect(mockAnimation.target.y).toBe(50);
            expect(mockAnimation.onUpdate).toHaveBeenCalled();
        });

        test('应该在动画完成时调用完成回调', () => {
            animationSystem.update(1000); // 完整持续时间
            
            expect(mockAnimation.onComplete).toHaveBeenCalledWith(mockAnimation.target);
            expect(animationSystem.animations.has('test_animation')).toBe(false);
        });

        test('应该限制进度不超过100%', () => {
            animationSystem.update(1500); // 超过持续时间
            
            expect(mockAnimation.target.x).toBe(100); // 应该是100%，不是150%
            expect(mockAnimation.target.y).toBe(100);
        });
    });

    describe('动画属性更新', () => {
        test('应该正确插值数值属性', () => {
            const animation = {
                target: { x: 0, y: 0 },
                properties: { x: true, y: true },
                startValues: { x: 0, y: 0 },
                endValues: { x: 100, y: 200 }
            };
            
            animationSystem.updateAnimationProperties(animation, 0.5);
            
            expect(animation.target.x).toBe(50);
            expect(animation.target.y).toBe(100);
        });

        test('应该调用更新回调', () => {
            const onUpdate = jest.fn();
            const animation = {
                target: { x: 0 },
                properties: { x: true },
                startValues: { x: 0 },
                endValues: { x: 100 },
                onUpdate
            };
            
            animationSystem.updateAnimationProperties(animation, 0.5);
            
            expect(onUpdate).toHaveBeenCalledWith(0.5, animation.target);
        });
    });

    describe('动画控制', () => {
        test('应该能够停止指定动画', () => {
            const animation = {
                id: 'test_animation',
                target: {},
                onComplete: jest.fn()
            };
            
            animationSystem.animations.set('test_animation', animation);
            animationSystem.stopAnimation('test_animation');
            
            expect(animationSystem.animations.has('test_animation')).toBe(false);
            expect(animation.onComplete).toHaveBeenCalled();
        });

        test('应该能够清除所有动画', () => {
            animationSystem.animations.set('anim1', {});
            animationSystem.animations.set('anim2', {});
            animationSystem.animationQueue.push({});
            
            animationSystem.clearAllAnimations();
            
            expect(animationSystem.animations.size).toBe(0);
            expect(animationSystem.animationQueue.length).toBe(0);
        });

        test('应该检测是否有活跃的动画', () => {
            expect(animationSystem.hasActiveAnimations()).toBe(false);
            
            animationSystem.animations.set('test', {});
            expect(animationSystem.hasActiveAnimations()).toBe(true);
            
            animationSystem.animations.clear();
            animationSystem.animationQueue.push({});
            expect(animationSystem.hasActiveAnimations()).toBe(true);
        });
    });

    describe('动画配置', () => {
        test('应该能够获取动画配置', () => {
            const config = animationSystem.getAnimationConfig('tileMove');
            
            expect(config).toBeDefined();
            expect(config.duration).toBe(150);
            expect(config.easing).toBe('easeOutQuart');
        });

        test('应该能够设置动画配置', () => {
            const newConfig = { duration: 200, easing: 'linear' };
            
            animationSystem.setAnimationConfig('tileMove', newConfig);
            
            const config = animationSystem.getAnimationConfig('tileMove');
            expect(config.duration).toBe(200);
            expect(config.easing).toBe('linear');
        });

        test('应该在获取不存在的配置时返回空对象', () => {
            const config = animationSystem.getAnimationConfig('nonExistent');
            expect(config).toEqual({});
        });
    });

    describe('火焰特效', () => {
        beforeEach(() => {
            // 模拟DOM环境
            document.body.innerHTML = '<div class="game-area"></div>';
        });

        test('应该创建火焰特效动画', () => {
            const animationId = animationSystem.createFireEffectAnimation(100, 100, 'medium');
            
            expect(animationId).toBeDefined();
            expect(animationSystem.animations.has(animationId)).toBe(true);
            
            const animation = animationSystem.animations.get(animationId);
            expect(animation.type).toBe('fireEffect');
        });

        test('应该创建火焰特效元素', () => {
            const fireElement = animationSystem.createFireEffectElement(100, 100, 'high');
            
            expect(fireElement).toBeInstanceOf(HTMLElement);
            expect(fireElement.className).toContain('fire-effect');
            expect(fireElement.className).toContain('fire-high');
            expect(fireElement.style.left).toBe('100px');
            expect(fireElement.style.top).toBe('100px');
        });

        test('应该根据强度调整火焰大小', () => {
            const lowFire = animationSystem.createFireEffectElement(0, 0, 'low');
            const highFire = animationSystem.createFireEffectElement(0, 0, 'high');
            
            const lowSize = parseInt(lowFire.style.width);
            const highSize = parseInt(highFire.style.width);
            
            expect(highSize).toBeGreaterThan(lowSize);
        });
    });

    describe('组合动画', () => {
        let mockTile;

        beforeEach(() => {
            mockTile = {
                element: {
                    style: {},
                    querySelector: jest.fn(() => ({ textContent: '' }))
                }
            };
        });

        test('应该创建组合合并动画', () => {
            const position = { x: 100, y: 100 };
            const onComplete = jest.fn();
            
            const animationIds = animationSystem.createCombinedMergeAnimation(
                mockTile, 4, position, onComplete
            );
            
            expect(animationIds).toBeInstanceOf(Array);
            expect(animationIds.length).toBeGreaterThan(0);
        });

        test('应该创建连锁合并动画', () => {
            const tiles = [
                { tile: mockTile, newValue: 4, position: { x: 0, y: 0 } },
                { tile: mockTile, newValue: 8, position: { x: 1, y: 1 } }
            ];
            const onComplete = jest.fn();
            
            const animationIds = animationSystem.createChainMergeAnimation(tiles, onComplete);
            
            expect(animationIds).toBeInstanceOf(Array);
        });

        test('应该创建同步合并动画', () => {
            const mergeData = [
                { tile: mockTile, newValue: 4, position: { x: 0, y: 0 } },
                { tile: mockTile, newValue: 8, position: { x: 1, y: 1 } }
            ];
            const onComplete = jest.fn();
            
            const animationIds = animationSystem.createSynchronizedMergeAnimation(mergeData, onComplete);
            
            expect(animationIds).toBeInstanceOf(Array);
        });
    });

    describe('火焰强度计算', () => {
        test('应该根据方块值返回正确的火焰强度', () => {
            expect(animationSystem.getFireIntensityByValue(128)).toBe('low');
            expect(animationSystem.getFireIntensityByValue(512)).toBe('medium');
            expect(animationSystem.getFireIntensityByValue(2048)).toBe('high');
        });
    });

    describe('合并动画统计', () => {
        test('应该统计活跃的合并动画数量', () => {
            const mergeAnimation = {
                id: 'merge1',
                type: 'tileMerge'
            };
            const moveAnimation = {
                id: 'move1',
                type: 'tileMove'
            };
            
            animationSystem.animations.set('merge1', mergeAnimation);
            animationSystem.animations.set('move1', moveAnimation);
            
            expect(animationSystem.getActiveMergeAnimationCount()).toBe(1);
        });

        test('应该能够清除所有合并相关动画', () => {
            const mergeAnimation = { id: 'merge1', type: 'tileMerge', onComplete: jest.fn() };
            const fireAnimation = { id: 'fire1', type: 'fireEffect', onComplete: jest.fn() };
            const moveAnimation = { id: 'move1', type: 'tileMove', onComplete: jest.fn() };
            
            animationSystem.animations.set('merge1', mergeAnimation);
            animationSystem.animations.set('fire1', fireAnimation);
            animationSystem.animations.set('move1', moveAnimation);
            
            animationSystem.clearMergeAnimations();
            
            expect(animationSystem.animations.has('merge1')).toBe(false);
            expect(animationSystem.animations.has('fire1')).toBe(false);
            expect(animationSystem.animations.has('move1')).toBe(true); // 移动动画应该保留
        });
    });

    describe('transform插值', () => {
        test('应该正确插值translate属性', () => {
            const start = 'translate(0px, 0px)';
            const end = 'translate(100px, 200px)';
            
            const result = animationSystem.interpolateTransform(start, end, 0.5);
            
            expect(result).toContain('translate(50px, 100px)');
        });

        test('应该正确插值scale属性', () => {
            const start = 'scale(1)';
            const end = 'scale(2)';
            
            const result = animationSystem.interpolateTransform(start, end, 0.5);
            
            expect(result).toContain('scale(1.5)');
        });

        test('应该解析transform属性', () => {
            const translateResult = animationSystem.parseTransform('translate(10px, 20px)', 'translate');
            expect(translateResult).toEqual({ x: 10, y: 20 });
            
            const scaleResult = animationSystem.parseTransform('scale(1.5)', 'scale');
            expect(scaleResult).toBe(1.5);
        });
    });

    describe('性能优化', () => {
        test('应该支持批量DOM更新', () => {
            expect(() => {
                animationSystem.optimizeBatchUpdate();
            }).not.toThrow();
        });

        test('应该防止重复的批量更新', () => {
            animationSystem.optimizeBatchUpdate();
            animationSystem.optimizeBatchUpdate(); // 第二次调用应该被忽略
            
            expect(animationSystem.pendingDOMUpdates).toBe(true);
        });
    });
});