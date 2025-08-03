/**
 * ThemeConfig类 - 管理游戏主题配置
 * 包含颜色、图标、特效等主题相关设置
 */
class ThemeConfig {
    constructor(themeName = 'nezha') {
        this.themeName = themeName;
        this.loadTheme(themeName);
    }

    /**
     * 加载指定主题
     * @param {string} themeName - 主题名称
     */
    loadTheme(themeName) {
        this.themeName = themeName;
        
        switch (themeName) {
            case 'nezha':
                this.loadNezhaTheme();
                break;
            case 'classic':
                this.loadClassicTheme();
                break;
            default:
                this.loadNezhaTheme();
        }
    }

    /**
     * 加载哪吒主题配置
     */
    loadNezhaTheme() {
        // 哪吒主题色彩方案
        this.colors = {
            // 背景色
            background: '#8B4513',          // 土黄色背景
            backgroundGradient: 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%)',
            
            // 主要颜色
            primary: '#DC143C',             // 朱红色（哪吒主色）
            secondary: '#FFD700',           // 金色（神器色）
            accent: '#00CED1',              // 青色（法力色）
            
            // UI颜色
            gridBackground: '#BBADA0',      // 网格背景
            cellBackground: 'rgba(238, 228, 218, 0.35)', // 空格子背景
            textPrimary: '#2F1B14',         // 主要文字色
            textSecondary: '#776E65',       // 次要文字色
            textLight: '#F9F6F2',           // 浅色文字
            
            // 特效颜色
            fireEffect: '#FF4500',          // 火焰特效
            lightEffect: '#FFD700',         // 光芒特效
            waterEffect: '#00CED1',         // 水波特效
            divineEffect: '#9370DB'         // 神力特效
        };

        // 哪吒主题方块颜色
        this.tileColors = {
            2: { bg: '#EEE4DA', text: '#776E65' },      // 莲花 - 淡雅
            4: { bg: '#EDE0C8', text: '#776E65' },      // 火焰 - 温暖
            8: { bg: '#F2B179', text: '#F9F6F2' },      // 混天绫 - 橙色
            16: { bg: '#F59563', text: '#F9F6F2' },     // 乾坤圈 - 橙红
            32: { bg: '#F67C5F', text: '#F9F6F2' },     // 神力 - 红橙
            64: { bg: '#F65E3B', text: '#F9F6F2' },     // 神兵 - 红色
            128: { bg: '#EDCF72', text: '#F9F6F2' },    // 太子 - 金黄
            256: { bg: '#EDCC61', text: '#F9F6F2' },    // 龙王 - 深金
            512: { bg: '#EDC850', text: '#F9F6F2' },    // 神器 - 亮金
            1024: { bg: '#EDC53F', text: '#F9F6F2' },   // 神光 - 纯金
            2048: { bg: '#EDC22E', text: '#F9F6F2' },   // 哪吒真身 - 圣金
            4096: { bg: '#DC143C', text: '#F9F6F2' },   // 超越 - 朱红
            8192: { bg: '#9370DB', text: '#F9F6F2' }    // 神话 - 紫色
        };

        // 哪吒主题图标/符号 - 使用更具代表性的符号
        this.sprites = {
            2: '🪷',      // 莲花 - 哪吒出生的莲花
            4: '🔥',      // 火焰 - 火尖枪的火焰
            8: '🌊',      // 波浪 - 混天绫的飘逸
            16: '⭕',     // 圆圈 - 乾坤圈
            32: '⚡',     // 闪电 - 神力显现
            64: '🗡️',     // 剑 - 神兵利器
            128: '👑',    // 王冠 - 太子身份
            256: '🐉',    // 龙 - 龙王三太子
            512: '🔱',    // 三叉戟 - 三头六臂神器
            1024: '🌟',   // 星星 - 神光普照
            2048: '👼',   // 天使 - 哪吒真身显现
            4096: '🌈',   // 彩虹 - 超越凡俗
            8192: '✨'    // 闪烁 - 神话传说
        };

        // 备用文字显示（当emoji不支持时）
        this.spritesFallback = {
            2: '莲',
            4: '火',
            8: '绫',
            16: '圈',
            32: '电',
            64: '剑',
            128: '冠',
            256: '龙',
            512: '戟',
            1024: '星',
            2048: '神',
            4096: '虹',
            8192: '仙'
        };

        // 技能图标
        this.skillIcons = {
            threeHeadsSixArms: '🔥',    // 三头六臂
            qiankunCircle: '⭕',        // 乾坤圈
            huntianLing: '🌊',          // 混天绫
            transformation: '⚡'        // 哪吒变身
        };

        // 特效配置
        this.effects = {
            merge: {
                type: 'fire_explosion',
                color: this.colors.fireEffect,
                duration: 500,
                particles: 20
            },
            skill: {
                type: 'divine_light',
                color: this.colors.lightEffect,
                duration: 1000,
                particles: 30
            },
            transformation: {
                type: 'golden_aura',
                color: this.colors.secondary,
                duration: 2000,
                particles: 50
            },
            combo: {
                type: 'chain_lightning',
                color: this.colors.accent,
                duration: 800,
                particles: 25
            }
        };

        // 音效配置
        this.sounds = {
            move: 'nezha_move.mp3',
            merge: 'nezha_merge.mp3',
            skill_activate: 'nezha_skill.mp3',
            transformation: 'nezha_transform.mp3',
            background: 'nezha_theme.mp3',
            gameOver: 'nezha_gameover.mp3',
            victory: 'nezha_victory.mp3'
        };

        // 动画配置
        this.animations = {
            tileMove: {
                duration: 150,
                easing: 'ease-in-out'
            },
            tileMerge: {
                duration: 300,
                easing: 'ease-in-out',
                scale: 1.2
            },
            tileAppear: {
                duration: 300,
                easing: 'ease-out',
                scale: [0, 1]
            },
            skillActivate: {
                duration: 500,
                easing: 'ease-out',
                scale: [1, 1.2, 1]
            }
        };
    }

    /**
     * 加载经典主题配置
     */
    loadClassicTheme() {
        // 经典2048色彩方案
        this.colors = {
            background: '#FAF8EF',
            backgroundGradient: 'linear-gradient(135deg, #FAF8EF 0%, #F5F5DC 100%)',
            primary: '#8F7A66',
            secondary: '#BBADA0',
            accent: '#776E65',
            gridBackground: '#BBADA0',
            cellBackground: 'rgba(238, 228, 218, 0.35)',
            textPrimary: '#776E65',
            textSecondary: '#776E65',
            textLight: '#F9F6F2',
            fireEffect: '#FF6B6B',
            lightEffect: '#FFD93D',
            waterEffect: '#6BCF7F',
            divineEffect: '#A8E6CF'
        };

        // 经典方块颜色
        this.tileColors = {
            2: { bg: '#EEE4DA', text: '#776E65' },
            4: { bg: '#EDE0C8', text: '#776E65' },
            8: { bg: '#F2B179', text: '#F9F6F2' },
            16: { bg: '#F59563', text: '#F9F6F2' },
            32: { bg: '#F67C5F', text: '#F9F6F2' },
            64: { bg: '#F65E3B', text: '#F9F6F2' },
            128: { bg: '#EDCF72', text: '#F9F6F2' },
            256: { bg: '#EDCC61', text: '#F9F6F2' },
            512: { bg: '#EDC850', text: '#F9F6F2' },
            1024: { bg: '#EDC53F', text: '#F9F6F2' },
            2048: { bg: '#EDC22E', text: '#F9F6F2' },
            4096: { bg: '#3C3A32', text: '#F9F6F2' },
            8192: { bg: '#3C3A32', text: '#F9F6F2' }
        };

        // 经典数字显示
        this.sprites = {};
        for (let i = 2; i <= 8192; i *= 2) {
            this.sprites[i] = i.toString();
        }

        // 简化的技能图标
        this.skillIcons = {
            threeHeadsSixArms: '⚡',
            qiankunCircle: '⭕',
            huntianLing: '🌀',
            transformation: '✨'
        };

        // 简化的特效
        this.effects = {
            merge: { type: 'simple_flash', color: '#FFD93D', duration: 300, particles: 10 },
            skill: { type: 'simple_glow', color: '#A8E6CF', duration: 500, particles: 15 },
            transformation: { type: 'simple_pulse', color: '#FF6B6B', duration: 1000, particles: 20 },
            combo: { type: 'simple_wave', color: '#6BCF7F', duration: 400, particles: 12 }
        };

        // 经典音效
        this.sounds = {
            move: 'classic_move.mp3',
            merge: 'classic_merge.mp3',
            skill_activate: 'classic_skill.mp3',
            transformation: 'classic_transform.mp3',
            background: 'classic_theme.mp3',
            gameOver: 'classic_gameover.mp3',
            victory: 'classic_victory.mp3'
        };

        // 经典动画
        this.animations = {
            tileMove: { duration: 100, easing: 'ease-in-out' },
            tileMerge: { duration: 200, easing: 'ease-in-out', scale: 1.1 },
            tileAppear: { duration: 200, easing: 'ease-out', scale: [0, 1] },
            skillActivate: { duration: 300, easing: 'ease-out', scale: [1, 1.1, 1] }
        };
    }

    /**
     * 获取方块的颜色配置
     * @param {number} value - 方块数值
     * @returns {Object} 颜色配置 {bg, text}
     */
    getTileColor(value) {
        return this.tileColors[value] || this.tileColors[2048];
    }

    /**
     * 获取方块的图标/符号
     * @param {number} value - 方块数值
     * @param {boolean} useFallback - 是否使用备用文字
     * @returns {string} 图标或数字
     */
    getTileSprite(value, useFallback = false) {
        if (this.themeName === 'nezha') {
            if (useFallback && this.spritesFallback) {
                return this.spritesFallback[value] || value.toString();
            }
            return this.sprites[value] || value.toString();
        }
        return this.sprites[value] || value.toString();
    }

    /**
     * 检测是否支持emoji显示
     * @returns {boolean} 是否支持emoji
     */
    supportsEmoji() {
        // 简单的emoji支持检测
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.height = 1;
        ctx.textBaseline = 'top';
        ctx.font = '16px Arial';
        ctx.fillText('🪷', 0, 0);
        return ctx.getImageData(0, 0, 1, 1).data[3] > 0;
    }

    /**
     * 获取技能图标
     * @param {string} skillName - 技能名称
     * @returns {string} 技能图标
     */
    getSkillIcon(skillName) {
        return this.skillIcons[skillName] || '?';
    }

    /**
     * 获取特效配置
     * @param {string} effectType - 特效类型
     * @returns {Object} 特效配置
     */
    getEffectConfig(effectType) {
        return this.effects[effectType] || this.effects.merge;
    }

    /**
     * 获取音效文件名
     * @param {string} soundType - 音效类型
     * @returns {string} 音效文件名
     */
    getSoundFile(soundType) {
        return this.sounds[soundType] || '';
    }

    /**
     * 获取动画配置
     * @param {string} animationType - 动画类型
     * @returns {Object} 动画配置
     */
    getAnimationConfig(animationType) {
        return this.animations[animationType] || this.animations.tileMove;
    }

    /**
     * 获取背景元素配置
     * @returns {Object} 背景配置
     */
    getBackgroundElements() {
        if (this.themeName === 'nezha') {
            return {
                gradient: this.colors.backgroundGradient,
                decorations: [
                    { type: 'cloud', opacity: 0.1, count: 3 },
                    { type: 'flame', opacity: 0.05, count: 2 },
                    { type: 'lotus', opacity: 0.08, count: 4 }
                ]
            };
        } else {
            return {
                gradient: this.colors.backgroundGradient,
                decorations: []
            };
        }
    }

    /**
     * 获取粒子效果配置
     * @param {string} effectType - 效果类型
     * @returns {Object} 粒子配置
     */
    getParticleConfig(effectType) {
        const baseConfig = this.getEffectConfig(effectType);
        return {
            ...baseConfig,
            gravity: 0.5,
            friction: 0.95,
            velocityRange: { min: -5, max: 5 },
            sizeRange: { min: 2, max: 8 },
            lifespan: baseConfig.duration
        };
    }

    /**
     * 转换为JSON对象
     * @returns {Object} JSON表示
     */
    toJSON() {
        return {
            themeName: this.themeName,
            colors: this.colors,
            tileColors: this.tileColors,
            sprites: this.sprites,
            skillIcons: this.skillIcons,
            effects: this.effects,
            sounds: this.sounds,
            animations: this.animations
        };
    }

    /**
     * 从JSON对象加载配置
     * @param {Object} json - JSON数据
     */
    fromJSON(json) {
        this.themeName = json.themeName || 'nezha';
        this.colors = { ...this.colors, ...json.colors };
        this.tileColors = { ...this.tileColors, ...json.tileColors };
        this.sprites = { ...this.sprites, ...json.sprites };
        this.skillIcons = { ...this.skillIcons, ...json.skillIcons };
        this.effects = { ...this.effects, ...json.effects };
        this.sounds = { ...this.sounds, ...json.sounds };
        this.animations = { ...this.animations, ...json.animations };
    }
}