/**
 * ParticleSystem类 - 粒子效果系统
 * 实现基础的粒子引擎，支持火焰、光芒等哪吒主题特效
 */
class ParticleSystem {
    constructor(canvas) {
        // Canvas相关
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 粒子池
        this.particles = [];
        this.maxParticles = 1000;
        this.particlePool = [];
        
        // 发射器列表
        this.emitters = [];
        
        // 性能相关
        this.lastUpdateTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
        
        // 预设效果配置
        this.presets = {
            fire: this.createFirePreset(),
            spark: this.createSparkPreset(),
            glow: this.createGlowPreset(),
            smoke: this.createSmokePreset(),
            explosion: this.createExplosionPreset(),
            magic: this.createMagicPreset(),
            lotus: this.createLotusPreset(),
            divine: this.createDivinePreset()
        };
        
        console.log('粒子效果系统初始化完成');
    }

    /**
     * 启动粒子系统
     */
    start() {
        this.isRunning = true;
        this.lastUpdateTime = performance.now();
        console.log('粒子效果系统已启动');
    }

    /**
     * 停止粒子系统
     */
    stop() {
        this.isRunning = false;
        console.log('粒子效果系统已停止');
    }

    /**
     * 更新粒子系统
     * @param {number} currentTime - 当前时间戳
     */
    update(currentTime) {
        if (!this.isRunning) return;
        
        this.deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;
        
        // 更新所有发射器
        this.emitters.forEach(emitter => {
            if (emitter.active) {
                emitter.update(this.deltaTime);
            }
        });
        
        // 更新所有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(this.deltaTime);
            
            // 移除死亡的粒子
            if (particle.isDead()) {
                this.recycleParticle(particle);
                this.particles.splice(i, 1);
            }
        }
        
        // 清理非活跃的发射器
        this.emitters = this.emitters.filter(emitter => emitter.active || emitter.particles.length > 0);
    }

    /**
     * 渲染粒子系统
     */
    render() {
        if (!this.isRunning) return;
        
        // 保存当前上下文状态
        this.ctx.save();
        
        // 渲染所有粒子
        this.particles.forEach(particle => {
            particle.render(this.ctx);
        });
        
        // 恢复上下文状态
        this.ctx.restore();
    }

    /**
     * 创建粒子发射器
     * @param {Object} config - 发射器配置
     * @returns {ParticleEmitter} 粒子发射器
     */
    createEmitter(config) {
        const emitter = new ParticleEmitter(this, config);
        this.emitters.push(emitter);
        return emitter;
    }

    /**
     * 创建单次粒子效果
     * @param {string} type - 效果类型
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} options - 额外选项
     */
    createEffect(type, x, y, options = {}) {
        const preset = this.presets[type];
        if (!preset) {
            console.warn(`未知的粒子效果类型: ${type}`);
            return;
        }
        
        const config = {
            ...preset,
            x: x,
            y: y,
            duration: options.duration || preset.duration || 1000,
            ...options
        };
        
        const emitter = this.createEmitter(config);
        emitter.start();
        
        // 设置自动停止
        setTimeout(() => {
            emitter.stop();
        }, config.duration);
        
        return emitter;
    }

    /**
     * 获取粒子对象（从池中获取或创建新的）
     * @returns {Particle} 粒子对象
     */
    getParticle() {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        return new Particle();
    }

    /**
     * 回收粒子对象到池中
     * @param {Particle} particle - 要回收的粒子
     */
    recycleParticle(particle) {
        if (this.particlePool.length < this.maxParticles / 2) {
            particle.reset();
            this.particlePool.push(particle);
        }
    }

    /**
     * 添加粒子到系统
     * @param {Particle} particle - 粒子对象
     */
    addParticle(particle) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push(particle);
        }
    }

    /**
     * 创建火焰效果预设
     * @returns {Object} 火焰效果配置
     */
    createFirePreset() {
        return {
            particleCount: 20,
            emissionRate: 30,
            lifetime: { min: 0.5, max: 1.5 },
            position: { x: 0, y: 0, spread: 10 },
            velocity: {
                x: { min: -20, max: 20 },
                y: { min: -50, max: -20 }
            },
            acceleration: {
                x: 0,
                y: 20
            },
            size: { min: 3, max: 8 },
            sizeOverTime: { start: 1, end: 0.2 },
            color: {
                start: { r: 255, g: 100, b: 0, a: 1 },
                end: { r: 255, g: 0, b: 0, a: 0 }
            },
            blendMode: 'lighter',
            shape: 'circle'
        };
    }

    /**
     * 创建火花效果预设
     * @returns {Object} 火花效果配置
     */
    createSparkPreset() {
        return {
            particleCount: 15,
            emissionRate: 50,
            lifetime: { min: 0.3, max: 0.8 },
            position: { x: 0, y: 0, spread: 5 },
            velocity: {
                x: { min: -100, max: 100 },
                y: { min: -100, max: 100 }
            },
            acceleration: {
                x: 0,
                y: 200
            },
            size: { min: 1, max: 3 },
            sizeOverTime: { start: 1, end: 0 },
            color: {
                start: { r: 255, g: 255, b: 100, a: 1 },
                end: { r: 255, g: 150, b: 0, a: 0 }
            },
            blendMode: 'lighter',
            shape: 'star'
        };
    }

    /**
     * 创建光芒效果预设
     * @returns {Object} 光芒效果配置
     */
    createGlowPreset() {
        return {
            particleCount: 10,
            emissionRate: 20,
            lifetime: { min: 1.0, max: 2.0 },
            position: { x: 0, y: 0, spread: 15 },
            velocity: {
                x: { min: -30, max: 30 },
                y: { min: -30, max: 30 }
            },
            acceleration: {
                x: 0,
                y: 0
            },
            size: { min: 5, max: 15 },
            sizeOverTime: { start: 0.2, end: 1 },
            color: {
                start: { r: 255, g: 215, b: 0, a: 0.8 },
                end: { r: 255, g: 255, b: 255, a: 0 }
            },
            blendMode: 'lighter',
            shape: 'glow'
        };
    }

    /**
     * 创建烟雾效果预设
     * @returns {Object} 烟雾效果配置
     */
    createSmokePreset() {
        return {
            particleCount: 8,
            emissionRate: 15,
            lifetime: { min: 2.0, max: 3.0 },
            position: { x: 0, y: 0, spread: 8 },
            velocity: {
                x: { min: -15, max: 15 },
                y: { min: -40, max: -20 }
            },
            acceleration: {
                x: 0,
                y: -10
            },
            size: { min: 8, max: 20 },
            sizeOverTime: { start: 0.5, end: 1.5 },
            color: {
                start: { r: 100, g: 100, b: 100, a: 0.6 },
                end: { r: 150, g: 150, b: 150, a: 0 }
            },
            blendMode: 'normal',
            shape: 'circle'
        };
    }

    /**
     * 创建爆炸效果预设
     * @returns {Object} 爆炸效果配置
     */
    createExplosionPreset() {
        return {
            particleCount: 30,
            emissionRate: 100,
            lifetime: { min: 0.5, max: 1.2 },
            position: { x: 0, y: 0, spread: 5 },
            velocity: {
                x: { min: -150, max: 150 },
                y: { min: -150, max: 150 }
            },
            acceleration: {
                x: 0,
                y: 100
            },
            size: { min: 2, max: 6 },
            sizeOverTime: { start: 1, end: 0.1 },
            color: {
                start: { r: 255, g: 255, b: 255, a: 1 },
                end: { r: 255, g: 100, b: 0, a: 0 }
            },
            blendMode: 'lighter',
            shape: 'circle'
        };
    }

    /**
     * 创建魔法效果预设
     * @returns {Object} 魔法效果配置
     */
    createMagicPreset() {
        return {
            particleCount: 25,
            emissionRate: 40,
            lifetime: { min: 1.0, max: 2.5 },
            position: { x: 0, y: 0, spread: 20 },
            velocity: {
                x: { min: -50, max: 50 },
                y: { min: -80, max: -20 }
            },
            acceleration: {
                x: 0,
                y: -20
            },
            size: { min: 2, max: 8 },
            sizeOverTime: { start: 0.5, end: 1.2 },
            color: {
                start: { r: 138, g: 43, b: 226, a: 0.9 },
                end: { r: 255, g: 20, b: 147, a: 0 }
            },
            blendMode: 'lighter',
            shape: 'star',
            rotation: true
        };
    }

    /**
     * 创建莲花效果预设
     * @returns {Object} 莲花效果配置
     */
    createLotusPreset() {
        return {
            particleCount: 12,
            emissionRate: 25,
            lifetime: { min: 1.5, max: 3.0 },
            position: { x: 0, y: 0, spread: 25 },
            velocity: {
                x: { min: -40, max: 40 },
                y: { min: -60, max: -10 }
            },
            acceleration: {
                x: 0,
                y: 15
            },
            size: { min: 4, max: 12 },
            sizeOverTime: { start: 0.3, end: 1 },
            color: {
                start: { r: 255, g: 182, b: 193, a: 0.8 },
                end: { r: 255, g: 105, b: 180, a: 0 }
            },
            blendMode: 'normal',
            shape: 'petal',
            rotation: true
        };
    }

    /**
     * 创建神圣效果预设
     * @returns {Object} 神圣效果配置
     */
    createDivinePreset() {
        return {
            particleCount: 18,
            emissionRate: 35,
            lifetime: { min: 2.0, max: 4.0 },
            position: { x: 0, y: 0, spread: 30 },
            velocity: {
                x: { min: -25, max: 25 },
                y: { min: -50, max: -10 }
            },
            acceleration: {
                x: 0,
                y: -5
            },
            size: { min: 3, max: 10 },
            sizeOverTime: { start: 0.2, end: 1.5 },
            color: {
                start: { r: 255, g: 255, b: 255, a: 1 },
                end: { r: 255, g: 215, b: 0, a: 0 }
            },
            blendMode: 'lighter',
            shape: 'glow',
            rotation: false
        };
    }

    /**
     * 清理所有粒子和发射器
     */
    clear() {
        this.particles = [];
        this.emitters = [];
        this.particlePool = [];
        console.log('粒子效果系统已清理');
    }

    /**
     * 获取系统状态信息
     * @returns {Object} 系统状态
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            particleCount: this.particles.length,
            emitterCount: this.emitters.length,
            poolSize: this.particlePool.length,
            maxParticles: this.maxParticles
        };
    }
}

/**
 * Particle类 - 单个粒子
 */
class Particle {
    constructor() {
        this.reset();
    }

    /**
     * 重置粒子状态
     */
    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.size = 1;
        this.initialSize = 1;
        this.life = 1;
        this.maxLife = 1;
        this.color = { r: 255, g: 255, b: 255, a: 1 };
        this.startColor = { r: 255, g: 255, b: 255, a: 1 };
        this.endColor = { r: 255, g: 255, b: 255, a: 0 };
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.shape = 'circle';
        this.blendMode = 'normal';
        this.sizeOverTime = { start: 1, end: 1 };
    }

    /**
     * 初始化粒子
     * @param {Object} config - 粒子配置
     */
    init(config) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.ax = config.ax || 0;
        this.ay = config.ay || 0;
        this.size = config.size || 1;
        this.initialSize = this.size;
        this.life = config.life || 1;
        this.maxLife = this.life;
        this.startColor = { ...config.startColor } || { r: 255, g: 255, b: 255, a: 1 };
        this.endColor = { ...config.endColor } || { r: 255, g: 255, b: 255, a: 0 };
        this.color = { ...this.startColor };
        this.rotation = config.rotation || 0;
        this.rotationSpeed = config.rotationSpeed || 0;
        this.shape = config.shape || 'circle';
        this.blendMode = config.blendMode || 'normal';
        this.sizeOverTime = config.sizeOverTime || { start: 1, end: 1 };
    }

    /**
     * 更新粒子
     * @param {number} deltaTime - 时间增量
     */
    update(deltaTime) {
        // 更新位置
        this.vx += this.ax * deltaTime;
        this.vy += this.ay * deltaTime;
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // 更新旋转
        this.rotation += this.rotationSpeed * deltaTime;
        
        // 更新生命值
        this.life -= deltaTime;
        
        // 计算生命周期进度
        const lifeProgress = 1 - (this.life / this.maxLife);
        
        // 更新颜色
        this.color.r = this.lerp(this.startColor.r, this.endColor.r, lifeProgress);
        this.color.g = this.lerp(this.startColor.g, this.endColor.g, lifeProgress);
        this.color.b = this.lerp(this.startColor.b, this.endColor.b, lifeProgress);
        this.color.a = this.lerp(this.startColor.a, this.endColor.a, lifeProgress);
        
        // 更新大小
        const sizeMultiplier = this.lerp(this.sizeOverTime.start, this.sizeOverTime.end, lifeProgress);
        this.size = this.initialSize * sizeMultiplier;
    }

    /**
     * 渲染粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    render(ctx) {
        if (this.color.a <= 0 || this.size <= 0) return;
        
        ctx.save();
        
        // 设置混合模式
        ctx.globalCompositeOperation = this.blendMode;
        
        // 设置透明度
        ctx.globalAlpha = this.color.a;
        
        // 移动到粒子位置
        ctx.translate(this.x, this.y);
        
        // 旋转
        if (this.rotation !== 0) {
            ctx.rotate(this.rotation);
        }
        
        // 设置颜色
        const colorStr = `rgb(${Math.round(this.color.r)}, ${Math.round(this.color.g)}, ${Math.round(this.color.b)})`;
        
        // 根据形状渲染
        switch (this.shape) {
            case 'circle':
                this.renderCircle(ctx, colorStr);
                break;
            case 'star':
                this.renderStar(ctx, colorStr);
                break;
            case 'glow':
                this.renderGlow(ctx, colorStr);
                break;
            case 'petal':
                this.renderPetal(ctx, colorStr);
                break;
            default:
                this.renderCircle(ctx, colorStr);
        }
        
        ctx.restore();
    }

    /**
     * 渲染圆形粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {string} colorStr - 颜色字符串
     */
    renderCircle(ctx, colorStr) {
        ctx.fillStyle = colorStr;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 渲染星形粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {string} colorStr - 颜色字符串
     */
    renderStar(ctx, colorStr) {
        ctx.fillStyle = colorStr;
        ctx.beginPath();
        
        const spikes = 5;
        const outerRadius = this.size;
        const innerRadius = this.size * 0.4;
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
    }

    /**
     * 渲染光芒粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {string} colorStr - 颜色字符串
     */
    renderGlow(ctx, colorStr) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, colorStr);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 渲染花瓣粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {string} colorStr - 颜色字符串
     */
    renderPetal(ctx, colorStr) {
        ctx.fillStyle = colorStr;
        ctx.beginPath();
        
        // 绘制花瓣形状
        ctx.ellipse(0, 0, this.size * 0.6, this.size, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 线性插值
     * @param {number} start - 起始值
     * @param {number} end - 结束值
     * @param {number} t - 插值参数 (0-1)
     * @returns {number} 插值结果
     */
    lerp(start, end, t) {
        return start + (end - start) * Math.max(0, Math.min(1, t));
    }

    /**
     * 检查粒子是否死亡
     * @returns {boolean} 是否死亡
     */
    isDead() {
        return this.life <= 0;
    }
}

/**
 * ParticleEmitter类 - 粒子发射器
 */
class ParticleEmitter {
    constructor(particleSystem, config) {
        this.particleSystem = particleSystem;
        this.config = config;
        
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.active = false;
        this.emissionTimer = 0;
        this.particles = [];
        
        console.log('粒子发射器创建完成');
    }

    /**
     * 启动发射器
     */
    start() {
        this.active = true;
        console.log('粒子发射器已启动');
    }

    /**
     * 停止发射器
     */
    stop() {
        this.active = false;
        console.log('粒子发射器已停止');
    }

    /**
     * 更新发射器
     * @param {number} deltaTime - 时间增量
     */
    update(deltaTime) {
        if (!this.active) return;
        
        this.emissionTimer += deltaTime;
        
        // 检查是否需要发射新粒子
        const emissionInterval = 1 / (this.config.emissionRate || 10);
        
        while (this.emissionTimer >= emissionInterval) {
            this.emitParticle();
            this.emissionTimer -= emissionInterval;
        }
    }

    /**
     * 发射单个粒子
     */
    emitParticle() {
        const particle = this.particleSystem.getParticle();
        
        // 配置粒子
        const config = this.generateParticleConfig();
        particle.init(config);
        
        // 添加到系统
        this.particleSystem.addParticle(particle);
        this.particles.push(particle);
    }

    /**
     * 生成粒子配置
     * @returns {Object} 粒子配置
     */
    generateParticleConfig() {
        const config = this.config;
        
        // 位置
        const spread = config.position?.spread || 0;
        const x = this.x + (Math.random() - 0.5) * spread;
        const y = this.y + (Math.random() - 0.5) * spread;
        
        // 速度
        const vx = this.randomBetween(config.velocity?.x?.min || 0, config.velocity?.x?.max || 0);
        const vy = this.randomBetween(config.velocity?.y?.min || 0, config.velocity?.y?.max || 0);
        
        // 加速度
        const ax = config.acceleration?.x || 0;
        const ay = config.acceleration?.y || 0;
        
        // 大小
        const size = this.randomBetween(config.size?.min || 1, config.size?.max || 1);
        
        // 生命周期
        const life = this.randomBetween(config.lifetime?.min || 1, config.lifetime?.max || 1);
        
        // 旋转
        const rotationSpeed = config.rotation ? (Math.random() - 0.5) * 10 : 0;
        
        return {
            x, y, vx, vy, ax, ay, size, life,
            startColor: config.color?.start || { r: 255, g: 255, b: 255, a: 1 },
            endColor: config.color?.end || { r: 255, g: 255, b: 255, a: 0 },
            shape: config.shape || 'circle',
            blendMode: config.blendMode || 'normal',
            sizeOverTime: config.sizeOverTime || { start: 1, end: 1 },
            rotationSpeed
        };
    }

    /**
     * 在范围内生成随机数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机数
     */
    randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    /**
     * 设置发射器位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
}