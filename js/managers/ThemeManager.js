/**
 * ThemeManager类 - 主题管理器
 * 管理视觉主题资源、提供可配置的主题切换、处理哪吒元素的视觉映射
 */
class ThemeManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentTheme = null;
        this.themeConfig = null;
        
        // 主题缓存
        this.themeCache = new Map();
        
        // 资源加载状态
        this.resourcesLoaded = false;
        this.loadingPromises = new Map();
        
        // 动态样式管理
        this.dynamicStyles = new Map();
        
        // 主题变化监听器
        this.themeChangeListeners = [];
        
        console.log('ThemeManager 初始化完成');
    }

    /**
     * 初始化主题管理器
     * @param {string} defaultTheme - 默认主题名称
     */
    async init(defaultTheme = 'nezha') {
        try {
            // 加载默认主题
            await this.loadTheme(defaultTheme);
            
            // 应用主题到DOM
            this.applyThemeToDOM();
            
            // 绑定主题切换事件
            this.bindThemeEvents();
            
            console.log('ThemeManager 初始化完成，当前主题:', this.currentTheme);
            return true;
        } catch (error) {
            console.error('ThemeManager 初始化失败:', error);
            return false;
        }
    }

    /**
     * 加载主题
     * @param {string} themeName - 主题名称
     * @returns {Promise<boolean>} 是否加载成功
     */
    async loadTheme(themeName) {
        // 检查缓存
        if (this.themeCache.has(themeName)) {
            this.currentTheme = themeName;
            this.themeConfig = this.themeCache.get(themeName);
            return true;
        }

        try {
            // 创建主题配置
            const themeConfig = new ThemeConfig(themeName);
            
            // 预加载主题资源
            await this.preloadThemeResources(themeConfig);
            
            // 缓存主题
            this.themeCache.set(themeName, themeConfig);
            this.currentTheme = themeName;
            this.themeConfig = themeConfig;
            
            // 触发主题变化事件
            this.notifyThemeChange(themeName);
            
            console.log(`主题 ${themeName} 加载完成`);
            return true;
        } catch (error) {
            console.error(`主题 ${themeName} 加载失败:`, error);
            return false;
        }
    }

    /**
     * 预加载主题资源
     * @param {ThemeConfig} themeConfig - 主题配置
     */
    async preloadThemeResources(themeConfig) {
        const promises = [];
        
        // 预加载音频资源
        if (themeConfig.sounds) {
            Object.values(themeConfig.sounds).forEach(soundFile => {
                if (soundFile) {
                    promises.push(this.preloadAudio(soundFile));
                }
            });
        }
        
        // 预加载图片资源（如果有）
        if (themeConfig.images) {
            Object.values(themeConfig.images).forEach(imageFile => {
                if (imageFile) {
                    promises.push(this.preloadImage(imageFile));
                }
            });
        }
        
        // 等待所有资源加载完成
        await Promise.allSettled(promises);
        this.resourcesLoaded = true;
    }

    /**
     * 预加载音频文件
     * @param {string} audioFile - 音频文件路径
     */
    async preloadAudio(audioFile) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.addEventListener('canplaythrough', resolve);
            audio.addEventListener('error', reject);
            audio.src = `assets/audio/${audioFile}`;
            audio.load();
        });
    }

    /**
     * 预加载图片文件
     * @param {string} imageFile - 图片文件路径
     */
    async preloadImage(imageFile) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.addEventListener('load', resolve);
            img.addEventListener('error', reject);
            img.src = `assets/images/${imageFile}`;
        });
    }

    /**
     * 应用主题到DOM
     */
    applyThemeToDOM() {
        if (!this.themeConfig) return;

        // 更新CSS变量
        this.updateCSSVariables();
        
        // 更新背景
        this.updateBackground();
        
        // 更新UI元素
        this.updateUIElements();
        
        // 更新技能图标
        this.updateSkillIcons();
    }

    /**
     * 更新CSS变量
     */
    updateCSSVariables() {
        const root = document.documentElement;
        const colors = this.themeConfig.colors;
        
        // 设置主题颜色变量
        root.style.setProperty('--theme-primary', colors.primary);
        root.style.setProperty('--theme-secondary', colors.secondary);
        root.style.setProperty('--theme-accent', colors.accent);
        root.style.setProperty('--theme-background', colors.background);
        root.style.setProperty('--theme-text-primary', colors.textPrimary);
        root.style.setProperty('--theme-text-secondary', colors.textSecondary);
        root.style.setProperty('--theme-grid-bg', colors.gridBackground);
        root.style.setProperty('--theme-cell-bg', colors.cellBackground);
    }

    /**
     * 更新背景
     */
    updateBackground() {
        const body = document.body;
        const backgroundConfig = this.themeConfig.getBackgroundElements();
        
        // 设置背景渐变
        body.style.background = backgroundConfig.gradient;
        
        // 添加装饰元素（如果需要）
        this.addBackgroundDecorations(backgroundConfig.decorations);
    }

    /**
     * 添加背景装饰元素
     * @param {Array} decorations - 装饰配置数组
     */
    addBackgroundDecorations(decorations) {
        // 清除现有装饰
        const existingDecorations = document.querySelectorAll('.theme-decoration');
        existingDecorations.forEach(el => el.remove());
        
        // 添加新装饰
        decorations.forEach((decoration, index) => {
            for (let i = 0; i < decoration.count; i++) {
                const element = this.createDecorationElement(decoration, index * decoration.count + i);
                document.body.appendChild(element);
            }
        });
    }

    /**
     * 创建装饰元素
     * @param {Object} decoration - 装饰配置
     * @param {number} index - 索引
     * @returns {HTMLElement} 装饰元素
     */
    createDecorationElement(decoration, index) {
        const element = document.createElement('div');
        element.className = 'theme-decoration';
        element.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: -1;
            opacity: ${decoration.opacity};
            font-size: ${20 + Math.random() * 30}px;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${5 + Math.random() * 10}s ease-in-out infinite;
            animation-delay: ${index * 0.5}s;
        `;
        
        // 设置装饰内容
        switch (decoration.type) {
            case 'cloud':
                element.textContent = '☁️';
                break;
            case 'flame':
                element.textContent = '🔥';
                break;
            case 'lotus':
                element.textContent = '🪷';
                break;
            default:
                element.textContent = '✨';
        }
        
        return element;
    }

    /**
     * 更新UI元素
     */
    updateUIElements() {
        // 更新游戏标题颜色
        const gameTitle = document.querySelector('.game-title');
        if (gameTitle) {
            gameTitle.style.background = `linear-gradient(45deg, ${this.themeConfig.colors.primary}, ${this.themeConfig.colors.secondary})`;
            gameTitle.style.webkitBackgroundClip = 'text';
            gameTitle.style.webkitTextFillColor = 'transparent';
        }
        
        // 更新分数框
        const scoreBoxes = document.querySelectorAll('.score-box');
        scoreBoxes.forEach(box => {
            box.style.background = `linear-gradient(135deg, ${this.themeConfig.colors.secondary}, ${this.themeConfig.colors.accent})`;
        });
        
        // 更新按钮
        const primaryButtons = document.querySelectorAll('.control-btn.primary');
        primaryButtons.forEach(btn => {
            btn.style.background = `linear-gradient(135deg, ${this.themeConfig.colors.primary}, #B22222)`;
        });
    }

    /**
     * 更新技能图标
     */
    updateSkillIcons() {
        const skills = ['three-heads', 'qiankun-circle', 'huntian-ling', 'transformation'];
        const skillNameMap = {
            'three-heads': 'threeHeadsSixArms',
            'qiankun-circle': 'qiankunCircle',
            'huntian-ling': 'huntianLing',
            'transformation': 'transformation'
        };
        
        skills.forEach(skillId => {
            const skillElement = document.getElementById(`skill-${skillId}`);
            const iconElement = skillElement?.querySelector('.skill-icon');
            
            if (iconElement) {
                const skillName = skillNameMap[skillId];
                const icon = this.themeConfig.getSkillIcon(skillName);
                iconElement.textContent = icon;
            }
        });
    }

    /**
     * 绑定主题事件
     */
    bindThemeEvents() {
        // 监听主题选择器变化
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (event) => {
                this.switchTheme(event.target.value);
            });
        }
        
        // 添加浮动动画样式
        this.addFloatAnimation();
    }

    /**
     * 添加浮动动画样式
     */
    addFloatAnimation() {
        if (document.getElementById('float-animation-style')) return;
        
        const style = document.createElement('style');
        style.id = 'float-animation-style';
        style.textContent = `
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                25% { transform: translateY(-10px) rotate(5deg); }
                50% { transform: translateY(-5px) rotate(-5deg); }
                75% { transform: translateY(-15px) rotate(3deg); }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 切换主题
     * @param {string} themeName - 新主题名称
     */
    async switchTheme(themeName) {
        if (themeName === this.currentTheme) return;
        
        console.log(`切换主题: ${this.currentTheme} -> ${themeName}`);
        
        // 显示加载提示
        this.showThemeLoadingIndicator();
        
        try {
            // 加载新主题
            const success = await this.loadTheme(themeName);
            
            if (success) {
                // 应用新主题
                this.applyThemeToDOM();
                
                // 更新游戏引擎的主题配置
                if (this.gameEngine) {
                    this.gameEngine.themeConfig = this.themeConfig;
                }
                
                // 保存主题偏好
                this.saveThemePreference(themeName);
                
                console.log(`主题切换成功: ${themeName}`);
            } else {
                throw new Error('主题加载失败');
            }
        } catch (error) {
            console.error('主题切换失败:', error);
            // 恢复到之前的主题
            this.revertThemeSelect();
        } finally {
            this.hideThemeLoadingIndicator();
        }
    }

    /**
     * 显示主题加载指示器
     */
    showThemeLoadingIndicator() {
        // 可以添加加载动画或提示
        console.log('正在加载主题...');
    }

    /**
     * 隐藏主题加载指示器
     */
    hideThemeLoadingIndicator() {
        console.log('主题加载完成');
    }

    /**
     * 恢复主题选择器到之前的值
     */
    revertThemeSelect() {
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = this.currentTheme;
        }
    }

    /**
     * 保存主题偏好
     * @param {string} themeName - 主题名称
     */
    saveThemePreference(themeName) {
        try {
            localStorage.setItem('nezha2048_theme', themeName);
        } catch (error) {
            console.warn('无法保存主题偏好:', error);
        }
    }

    /**
     * 加载主题偏好
     * @returns {string|null} 保存的主题名称
     */
    loadThemePreference() {
        try {
            return localStorage.getItem('nezha2048_theme');
        } catch (error) {
            console.warn('无法加载主题偏好:', error);
            return null;
        }
    }

    /**
     * 获取当前主题配置
     * @returns {ThemeConfig} 主题配置
     */
    getCurrentThemeConfig() {
        return this.themeConfig;
    }

    /**
     * 获取方块的颜色配置
     * @param {number} value - 方块数值
     * @returns {Object} 颜色配置
     */
    getTileColor(value) {
        return this.themeConfig ? this.themeConfig.getTileColor(value) : { bg: '#EEE4DA', text: '#776E65' };
    }

    /**
     * 获取方块的图标/符号
     * @param {number} value - 方块数值
     * @returns {string} 图标或数字
     */
    getTileSprite(value) {
        return this.themeConfig ? this.themeConfig.getTileSprite(value) : value.toString();
    }

    /**
     * 获取技能图标
     * @param {string} skillName - 技能名称
     * @returns {string} 技能图标
     */
    getSkillIcon(skillName) {
        return this.themeConfig ? this.themeConfig.getSkillIcon(skillName) : '?';
    }

    /**
     * 获取特效配置
     * @param {string} effectType - 特效类型
     * @returns {Object} 特效配置
     */
    getEffectConfig(effectType) {
        return this.themeConfig ? this.themeConfig.getEffectConfig(effectType) : {};
    }

    /**
     * 获取动画配置
     * @param {string} animationType - 动画类型
     * @returns {Object} 动画配置
     */
    getAnimationConfig(animationType) {
        return this.themeConfig ? this.themeConfig.getAnimationConfig(animationType) : {};
    }

    /**
     * 添加主题变化监听器
     * @param {Function} listener - 监听器函数
     */
    addThemeChangeListener(listener) {
        this.themeChangeListeners.push(listener);
    }

    /**
     * 移除主题变化监听器
     * @param {Function} listener - 监听器函数
     */
    removeThemeChangeListener(listener) {
        const index = this.themeChangeListeners.indexOf(listener);
        if (index > -1) {
            this.themeChangeListeners.splice(index, 1);
        }
    }

    /**
     * 通知主题变化
     * @param {string} themeName - 新主题名称
     */
    notifyThemeChange(themeName) {
        this.themeChangeListeners.forEach(listener => {
            try {
                listener(themeName, this.themeConfig);
            } catch (error) {
                console.error('主题变化监听器错误:', error);
            }
        });
    }

    /**
     * 获取可用主题列表
     * @returns {Array<string>} 主题名称数组
     */
    getAvailableThemes() {
        return ['nezha', 'classic'];
    }

    /**
     * 获取主题信息
     * @param {string} themeName - 主题名称
     * @returns {Object} 主题信息
     */
    getThemeInfo(themeName) {
        const themeInfo = {
            nezha: {
                name: '哪吒主题',
                description: '中国神话风格，包含哪吒元素和特效',
                preview: '🪷🔥🌊⭕'
            },
            classic: {
                name: '经典主题',
                description: '传统2048风格，简洁明了',
                preview: '2 4 8 16'
            }
        };
        
        return themeInfo[themeName] || { name: '未知主题', description: '', preview: '' };
    }

    /**
     * 创建主题预览
     * @param {string} themeName - 主题名称
     * @returns {HTMLElement} 预览元素
     */
    createThemePreview(themeName) {
        const preview = document.createElement('div');
        preview.className = 'theme-preview';
        
        const info = this.getThemeInfo(themeName);
        preview.innerHTML = `
            <div class="theme-preview-content">
                <div class="theme-preview-symbols">${info.preview}</div>
                <div class="theme-preview-name">${info.name}</div>
                <div class="theme-preview-description">${info.description}</div>
            </div>
        `;
        
        return preview;
    }

    /**
     * 销毁主题管理器
     */
    destroy() {
        // 清除缓存
        this.themeCache.clear();
        
        // 清除动态样式
        this.dynamicStyles.forEach((style, id) => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });
        this.dynamicStyles.clear();
        
        // 清除装饰元素
        const decorations = document.querySelectorAll('.theme-decoration');
        decorations.forEach(el => el.remove());
        
        // 清除监听器
        this.themeChangeListeners = [];
        
        console.log('ThemeManager 已销毁');
    }
}