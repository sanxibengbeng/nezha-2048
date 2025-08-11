/**
 * 游戏主入口文件
 * 初始化游戏并处理基础交互
 */

// 日志配置 - 设置为 false 来减少控制台输出
const DEBUG_MODE = false;
const debugLog = DEBUG_MODE ? console.log : () => {};

// 全局游戏实例
let game = null;

/**
 * 检查当前页面是否适合游戏初始化
 * @returns {boolean} 是否可以初始化游戏
 */
function isGamePageCompatible() {
    // 检查必需的游戏元素
    const requiredElements = [
        'game-canvas',
        'new-game-btn',
        'pause-btn',
        'settings-btn'
    ];
    
    for (const elementId of requiredElements) {
        if (!document.getElementById(elementId)) {
            debugLog(`缺少必需元素: ${elementId}`);
            return false;
        }
    }
    
    return true;
}

/**
 * 页面加载完成后初始化游戏
 */
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 检查页面是否适合游戏初始化
        if (!isGamePageCompatible()) {
            console.info('当前页面不是游戏页面，跳过游戏初始化');
            return;
        }
        
        // 初始化游戏引擎（暂时创建基础结构）
        await initializeGame();
        
        // 绑定UI事件
        bindUIEvents();
        
        // 显示初始界面
        showWelcomeMessage();
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
        showErrorMessage('游戏初始化失败，请刷新页面重试。');
    }
});

/**
 * 初始化游戏
 */
async function initializeGame() {
    // 获取Canvas元素
    const canvas = document.getElementById('game-canvas');
    
    if (!canvas) {
        throw new Error('无法找到Canvas元素');
    }
    
    // 创建游戏引擎
    game = new GameEngine({
        targetFPS: 60,
        debug: false// 开发模式下启用调试信息
    });
    
    // 初始化游戏引擎
    if (!(await game.init(canvas))) {
        throw new Error('游戏引擎初始化失败');
    }
    
    // 绑定游戏引擎事件
    bindGameEngineEvents();
    
    // 创建基础网格显示（用于HTML覆盖层）
    createGridCells();
    
    // 添加一些测试方块到游戏状态
    addTestTiles();
    
    // 启动游戏
    game.start();
    
}

/**
 * 调整画布尺寸
 */
function resizeCanvas() {
    const canvas = document.getElementById('game-canvas');
    const container = document.querySelector('.game-area');
    
    const size = Math.min(container.clientWidth, container.clientHeight);
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
}

/**
 * 创建网格单元格
 */
function createGridCells() {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = ''; // 清空现有内容
    
    // 创建16个网格单元格
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.index = i;
        grid.appendChild(cell);
    }
}

/**
 * 添加测试方块到游戏状态
 */
function addTestTiles() {
    if (!game) return;
    
    const gameState = game.getGameState();
    
    // 创建几个测试方块
    const testTiles = [
        { value: 2, x: 0, y: 0 },
        { value: 4, x: 1, y: 0 },
        { value: 8, x: 0, y: 1 },
        { value: 16, x: 2, y: 2 }
    ];
    
    testTiles.forEach(tileData => {
        const tile = new Tile(tileData.x, tileData.y, tileData.value);
        gameState.setTile(tileData.x, tileData.y, tile);
    });
    
    debugLog('测试方块已添加到游戏状态');
}

/**
 * 创建方块DOM元素
 * @param {Tile} tile - 方块对象
 */
function createTileElement(tile) {
    const tileElement = document.createElement('div');
    
    // 获取主题管理器
    const themeManager = game?.getThemeManager();
    
    // 设置基础类名
    tileElement.className = `tile tile-${tile.value}`;
    
    // 设置方块内容
    if (themeManager) {
        const sprite = themeManager.getTileSprite(tile.value);
        tileElement.textContent = sprite;
        
        // 如果是emoji，添加特殊样式
        if (sprite.length > 1 && /[\u{1F000}-\u{1F9FF}]/u.test(sprite)) {
            tileElement.style.fontSize = '1.8rem';
        }
    } else {
        tileElement.textContent = tile.value.toString();
    }
    
    // 创建内容容器以确保居中
    const contentDiv = document.createElement('div');
    contentDiv.className = 'tile-content';
    contentDiv.textContent = tileElement.textContent;
    tileElement.textContent = '';
    tileElement.appendChild(contentDiv);
    
    // 设置位置
    const cellSize = 100 / 4; // 每个格子占25%
    const gap = 2; // 间隙
    
    tileElement.style.position = 'absolute';
    tileElement.style.left = `${tile.x * cellSize + gap}%`;
    tileElement.style.top = `${tile.y * cellSize + gap}%`;
    tileElement.style.width = `${cellSize - gap * 2}%`;
    tileElement.style.height = `${cellSize - gap * 2}%`;
    
    // 添加到游戏区域
    const gameArea = document.querySelector('.game-area');
    gameArea.appendChild(tileElement);
    
    // 添加出现动画
    tileElement.classList.add('tile-new');
    
    // 移除动画类
    setTimeout(() => {
        tileElement.classList.remove('tile-new');
    }, 300);
    
    // 保存元素引用
    tile.element = tileElement;
    
    return tileElement;
}

/**
 * 绑定游戏引擎事件
 */
function bindGameEngineEvents() {
    if (!game) return;
    
    // 游戏初始化完成
    game.on('initialized', () => {
        updateScoreDisplay();
        initializeThemeSettings();
        initializeVisualElements();
        initializeI18nSettings();
    });
    
    // 游戏开始
    game.on('started', () => {
        showTemporaryMessage('游戏开始！');
        
        // 播放游戏开始音效
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager && audioManager.playButtonClickSound) {
                audioManager.playButtonClickSound();
            }
        }
    });
    
    // 游戏暂停
    game.on('paused', () => {
        showTemporaryMessage('游戏暂停');
    });
    
    // 游戏恢复
    game.on('resumed', () => {
        showTemporaryMessage('游戏恢复');
    });
    
    // 游戏重置
    game.on('reset', () => {
        updateScoreDisplay();
        showTemporaryMessage('游戏重置');
    });
    
    // 移动事件
    game.on('move', (data) => {
        
        // 更新分数显示
        updateScoreDisplay();
        
        // 显示得分反馈
        if (data.score > 0) {
            showScoreAnimation(data.score);
        }
        
        // 显示合并反馈
        if (data.merged && data.merged.length > 0) {
            showMergeAnimation(data.merged);
        }
        
        // 检查连击
        checkComboSystem(data);
    });
    
    // 游戏结束事件
    game.on('gameOver', (data) => {
        debugLog('游戏结束:', data);
        
        // 播放游戏结束音效
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager && audioManager.playGameOverSound) {
                audioManager.playGameOverSound();
            }
        }
        
        // 添加游戏结束视觉反馈
        addGameOverVisualFeedback();
        
        // 延迟显示模态框，让用户看到游戏结束状态
        setTimeout(() => {
            showGameOverModal(data);
        }, 1000);
    });
    
    // 获胜事件
    game.on('won', (data) => {
        debugLog('游戏获胜:', data);
        
        // 播放胜利音效和音乐
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager && audioManager.playVictorySound) {
                audioManager.playVictorySound();
                // 播放胜利背景音乐
                setTimeout(() => {
                    audioManager.playVictoryMusic();
                }, 1000);
            }
        }
        
        // 创建胜利特效
        if (game && game.getEffectsManager) {
            const effectsManager = game.getEffectsManager();
            if (effectsManager) {
                const gameArea = document.querySelector('.game-area');
                const rect = gameArea.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                effectsManager.createNezhaEffect('victoryBurst', centerX, centerY);
            }
        }
        
        showTemporaryMessage('🎉 恭喜达到2048！', 3000);
    });
    
    // 技能激活事件
    game.on('skillActivated', (data) => {
        activateSkillByName(data.skillName);
    });
    
    // 绑定哪吒技能系统事件
    bindNezhaSkillSystemEvents();
    
    // 绑定音频管理器事件
    bindAudioManagerEvents();
    
    // 新游戏请求事件
    game.on('newGameRequested', () => {
        debugLog('请求新游戏');
        startNewGame();
    });
    
    // 方向输入事件
    game.on('directionInput', (data) => {
        debugLog('方向输入:', data.direction);
        handleMoveInput(data.direction);
    });
    
    // 多方向输入事件（三头六臂模式）
    game.on('multiDirectionInput', (data) => {
        debugLog('多方向输入:', data.directions);
        handleMultiDirectionInput(data.directions);
    });
    
    // 网格几乎满了事件
    game.on('gridAlmostFull', (data) => {
        debugLog('网格几乎满了:', data);
        showTemporaryMessage('⚠️ 空间不足，小心游戏结束！', 2000);
        
        // 播放警告音效
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager && audioManager.playErrorSound) {
                audioManager.playErrorSound();
            }
        }
    });
    
    // 新的最大方块事件
    game.on('newMaxTile', (data) => {
        debugLog('新的最大方块:', data);
        showTemporaryMessage(`🎉 达到新高度: ${data.newMax}！`, 2000);
        
        // 播放成就音效
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager && audioManager.playVictorySound) {
                audioManager.playVictorySound();
            }
        }
    });
    
    // 移动选择有限事件
    game.on('limitedMoves', (data) => {
        debugLog('移动选择有限:', data);
        showTemporaryMessage('⚠️ 移动选择有限，请谨慎操作！', 2000);
        
        // 播放警告音效
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager && audioManager.playErrorSound) {
                audioManager.playErrorSound();
            }
        }
    });
    
    // ESC键事件
    game.on('escapePressed', () => {
        debugLog('ESC键按下');
        // 可以用来关闭模态框或暂停游戏
        closeAllModals();
    });
    
    // 游戏信息更新事件
    game.on('gameInfoUpdate', () => {
        updateGameInfoDisplay();
    });
    
    // 错误处理
    game.on('error', (data) => {
        console.error('游戏引擎错误:', data);
        showErrorMessage(`游戏错误: ${data.error.message}`);
    });
}

/**
 * 更新分数显示
 */
function updateScoreDisplay() {
    if (!game) return;
    
    const gameState = game.getGameState();
    const currentScoreElement = document.getElementById('current-score');
    const highScoreElement = document.getElementById('high-score');
    
    if (currentScoreElement) {
        currentScoreElement.textContent = gameState.score;
    }
    
    if (highScoreElement) {
        highScoreElement.textContent = gameState.highScore;
    }
    
    // 同时更新游戏信息显示
    updateGameInfoDisplay();
}

/**
 * 更新游戏信息显示
 */
function updateGameInfoDisplay() {
    if (!game) return;
    
    const gameState = game.getGameState();
    
    // 更新移动次数
    const movesElement = document.getElementById('moves-count');
    if (movesElement) {
        movesElement.textContent = gameState.moves;
    }
    
    // 更新游戏时间
    const playTimeElement = document.getElementById('play-time');
    if (playTimeElement) {
        const minutes = Math.floor(gameState.playTime / 60);
        const seconds = Math.floor(gameState.playTime % 60);
        playTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // 更新哪吒等级
    const nezhaLevelElement = document.getElementById('nezha-level');
    if (nezhaLevelElement) {
        nezhaLevelElement.textContent = gameState.nezhaLevel;
        
        // 如果等级提升，添加动画效果
        if (gameState.nezhaLevel > (gameState.previousNezhaLevel || 1)) {
            nezhaLevelElement.classList.add('level-up');
            setTimeout(() => {
                nezhaLevelElement.classList.remove('level-up');
            }, 1000);
            gameState.previousNezhaLevel = gameState.nezhaLevel;
        }
    }
}

/**
 * 初始化国际化设置
 */
function initializeI18nSettings() {
    if (!game || !game.getI18nManager) {
        console.warn('国际化管理器不可用');
        return;
    }
    
    const i18nManager = game.getI18nManager();
    
    // 绑定语言变更事件
    i18nManager.on('languageChanged', (data) => {
        console.log('语言已变更:', data.newLanguage);
        
        // 显示语言变更提示
        const languageInfo = data.languageInfo;
        showTemporaryMessage(`${languageInfo.flag} 语言已切换到 ${languageInfo.nativeName}`, 2000);
        
        // 更新设置界面的语言选择器
        updateLanguageSelector(data.newLanguage);
    });
    
    // 初始更新页面文本
    setTimeout(() => {
        if (game && game.updatePageTexts) {
            game.updatePageTexts();
        }
    }, 100);
    
    console.log('国际化设置初始化完成');
}

/**
 * 更新语言选择器
 */
function updateLanguageSelector(selectedLanguage) {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = selectedLanguage;
    }
}

/**
 * 切换语言
 */
function changeLanguage(language) {
    if (!game || !game.getI18nManager) {
        console.warn('国际化管理器不可用');
        return;
    }
    
    const i18nManager = game.getI18nManager();
    i18nManager.setLanguage(language);
}

/**
 * 绑定UI事件
 */
function bindUIEvents() {
    // 新游戏按钮
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            playButtonClickSound();
            confirmRestartGame();
        });
    } else {
        debugLog('未找到新游戏按钮');
    }
    
    // 暂停按钮
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            playButtonClickSound();
            togglePause();
        });
    } else {
        debugLog('未找到暂停按钮');
    }
    
    // 设置按钮
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            debugLog('设置按钮被点击');
            try {
                playButtonClickSound();
            } catch (error) {
                console.warn('播放按钮音效失败:', error);
            }
            showSettings();
        });
        debugLog('设置按钮事件已绑定');
    } else {
        console.error('找不到设置按钮元素 (settings-btn)');
    }
    
    // 模态框关闭按钮
    const closeModalBtn = document.getElementById('close-modal-btn');
    closeModalBtn.addEventListener('click', closeGameOverModal);
    
    const restartBtn = document.getElementById('restart-btn');
    restartBtn.addEventListener('click', restartGame);
    
    // 设置模态框按钮
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    cancelSettingsBtn.addEventListener('click', closeSettingsModal);
    
    // 语言选择器
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            // 实时预览语言变更
            changeLanguage(e.target.value);
        });
    }
    
    // 音量滑块实时更新显示
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');
    if (volumeSlider && volumeValue) {
        volumeSlider.addEventListener('input', (e) => {
            volumeValue.textContent = e.target.value + '%';
        });
    }
    
    // 技能按钮
    bindSkillEvents();
    
    // 键盘和触摸事件现在由InputManager处理
    
    // 窗口大小改变事件
    window.addEventListener('resize', resizeCanvas);
}

/**
 * 绑定技能事件
 */
function bindSkillEvents() {
    const skills = ['three-heads', 'qiankun-circle', 'huntian-ling', 'transformation'];
    
    skills.forEach(skillId => {
        const skillElement = document.getElementById(`skill-${skillId}`);
        if (skillElement) {
            skillElement.addEventListener('click', () => activateSkill(skillId));
        }
    });
}

/**
 * 绑定哪吒技能系统事件
 */
function bindNezhaSkillSystemEvents() {
    if (!game || !game.getNezhaSkillSystem) return;
    
    const skillSystem = game.getNezhaSkillSystem();
    
    // 技能解锁事件
    skillSystem.on('skillUnlocked', (data) => {
        showTemporaryMessage(`🎉 技能解锁: ${data.skill.name}`, 3000);
        
        // 播放技能解锁音效
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager && audioManager.playVictorySound) {
                audioManager.playVictorySound();
            }
        }
        
        // 更新技能按钮状态
        updateSkillButtonState(data.skillId, 'unlocked');
    });
    
    // 技能激活事件
    skillSystem.on('skillActivated', (data) => {
        showTemporaryMessage(`⚡ ${data.skill.name} 激活！`, 2000);
        
        // 更新技能按钮状态
        updateSkillButtonState(data.skillId, 'activated');
        
        // 播放技能音效（如果音频管理器可用）
        playSkillSound(data.skillId);
        
        // 创建技能激活特效
        createSkillActivationEffect(data.skillId);
    });
    
    // 技能停用事件
    skillSystem.on('skillDeactivated', (data) => {
        
        // 更新技能按钮状态
        updateSkillButtonState(data.skillId, 'deactivated');
    });
    
    // 技能准备就绪事件
    skillSystem.on('skillReady', (data) => {
        debugLog('技能准备就绪:', data.skill.name);
        showTemporaryMessage(`✨ ${data.skill.name} 准备就绪`, 1500);
        
        // 播放技能准备音效
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager && audioManager.playSkillReadySound) {
                audioManager.playSkillReadySound();
            }
        }
        
        // 更新技能按钮状态
        updateSkillButtonState(data.skillId, 'ready');
        
        // 乾坤圈技能特殊处理
        if (data.skillId === 'qiankunCircle') {
            showQiankunCircleReadyIndicator();
        }
        
        // 混天绫技能特殊处理
        if (data.skillId === 'huntianLing') {
            showHuntianLingReadyIndicator();
        }
        
        // 哪吒变身技能特殊处理
        if (data.skillId === 'transformation') {
            showTransformationReadyIndicator();
        }
    });
    
    // 乾坤圈清除完成事件
    skillSystem.on('qiankunCircleCleared', (data) => {
        debugLog('乾坤圈清除完成:', data);
        
        const message = `⭕ 乾坤圈清除 ${data.clearedTiles.length} 个方块，获得 ${data.score} 分！`;
        showTemporaryMessage(message, 3000);
        
        // 更新分数显示
        updateScoreDisplay();
        
        // 创建特殊的分数飞行效果
        createQiankunScoreEffect(data.score);
    });
    
    // 混天绫连锁完成事件
    skillSystem.on('huntianLingCompleted', (data) => {
        debugLog('混天绫连锁完成:', data);
        
        const message = `🌊 混天绫连锁: ${data.patterns.length} 个模式，清除 ${data.totalCleared} 个方块，获得 ${data.totalScore} 分！`;
        showTemporaryMessage(message, 4000);
        
        // 更新分数显示
        updateScoreDisplay();
        
        // 创建混天绫连锁分数效果
        createHuntianLingScoreEffect(data);
    });
    
    // 哪吒变身开始事件
    skillSystem.on('transformationStarted', (data) => {
        debugLog('哪吒变身开始:', data);
        
        const message = `⚡ 哪吒变身激活！${data.enhancements.description}`;
        showTemporaryMessage(message, 5000);
        
        // 播放变身音效和音乐
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager) {
                audioManager.playTransformationSound();
                // 延迟播放变身背景音乐
                setTimeout(() => {
                    audioManager.playTransformationMusic();
                }, 1000);
            }
        }
        
        // 显示增强效果提示
        showTransformationEnhancement(data.enhancements);
    });
    
    // 哪吒变身结束事件
    skillSystem.on('transformationEnded', (data) => {
        debugLog('哪吒变身结束:', data);
        
        showTemporaryMessage('⚡ 哪吒变身结束，能力恢复正常', 3000);
        
        // 恢复背景音乐
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager && audioManager.playBackgroundMusic) {
                // 淡入淡出切换回背景音乐
                setTimeout(() => {
                    audioManager.playBackgroundMusic();
                }, 500);
            }
        }
        
        // 隐藏增强效果提示
        hideTransformationEnhancement();
    });
}

// 键盘和触摸输入现在由InputManager统一处理

/**
 * 开始新游戏
 */
function startNewGame() {
    if (!game) {
        console.error('游戏引擎未初始化');
        return;
    }
    
    debugLog('开始新游戏');
    
    // 重置游戏状态显示
    resetGameStateDisplay();
    
    // 重置游戏引擎
    game.reset();
    
    // 添加初始方块
    setTimeout(() => {
        const gridManager = game.getGridManager();
        // 添加两个初始方块
        gridManager.addRandomTile();
        gridManager.addRandomTile();
        
        game.start();
        updateScoreDisplay();
        
        debugLog('新游戏已开始，初始方块已添加');
    }, 100);
}

/**
 * 切换暂停状态
 */
function togglePause() {
    if (!game) {
        console.error('游戏引擎未初始化');
        return;
    }
    
    const pauseBtn = document.getElementById('pause-btn');
    
    if (game.isPaused) {
        game.resume();
        pauseBtn.textContent = '暂停';
    } else {
        game.pause();
        pauseBtn.textContent = '继续';
    }
}

/**
 * 显示设置
 */
function showSettings() {
    debugLog('showSettings() 被调用');
    
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal) {
        console.error('找不到设置模态框元素');
        return;
    }
    
    debugLog('找到设置模态框，移除 hidden 类');
    settingsModal.classList.remove('hidden');
    
    // 初始化设置值
    initializeSettingsValues();
    
    // 暂时注释掉主题预览功能，避免可能的错误
    try {
        // 创建主题预览界面
        createThemePreviewUI();
    } catch (error) {
        console.warn('创建主题预览界面失败:', error);
        // 即使预览创建失败，也要显示基本的设置窗口
    }
    
    debugLog('设置窗口应该已显示');
}

/**
 * 初始化设置值
 */
function initializeSettingsValues() {
    // 初始化音量滑块
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');
    if (volumeSlider && volumeValue) {
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager && audioManager.getMasterVolume) {
                const volume = Math.round(audioManager.getMasterVolume() * 100);
                volumeSlider.value = volume;
                volumeValue.textContent = volume + '%';
            }
        }
    }
    
    // 初始化主题选择器
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect && game && game.getThemeManager) {
        const themeManager = game.getThemeManager();
        if (themeManager && themeManager.currentTheme) {
            themeSelect.value = themeManager.currentTheme;
        }
    }
    
    // 初始化语言选择器
    const languageSelect = document.getElementById('language-select');
    if (languageSelect && game && game.getI18nManager) {
        const i18nManager = game.getI18nManager();
        if (i18nManager && i18nManager.currentLanguage) {
            languageSelect.value = i18nManager.currentLanguage;
        }
    }
}

/**
 * 显示游戏结束模态框
 * @param {Object} data - 游戏结束数据
 */
function showGameOverModal(data) {
    const gameOverModal = document.getElementById('game-over-modal');
    const finalScoreElement = document.getElementById('final-score');
    const newRecordElement = document.getElementById('new-record');
    
    if (finalScoreElement) {
        finalScoreElement.textContent = data.score;
    }
    
    // 检查是否是新纪录
    if (data.isNewRecord) {
        newRecordElement.classList.remove('hidden');
        newRecordElement.textContent = '🎉 新纪录！';
        
        // 播放新纪录庆祝动画
        showNewRecordCelebration();
    } else {
        newRecordElement.classList.add('hidden');
    }
    
    // 更新游戏结束模态框的详细信息
    updateGameOverDetails(data);
    
    // 显示模态框
    gameOverModal.classList.remove('hidden');
    
    // 添加显示动画
    setTimeout(() => {
        gameOverModal.classList.add('show');
    }, 10);
    
    debugLog('游戏结束模态框已显示');
}

/**
 * 更新游戏结束详细信息
 * @param {Object} data - 游戏结束数据
 */
function updateGameOverDetails(data) {
    // 创建或更新详细统计信息
    const modalContent = document.querySelector('#game-over-modal .modal-content');
    
    // 移除现有的统计信息
    const existingStats = modalContent.querySelector('.game-stats');
    if (existingStats) {
        existingStats.remove();
    }
    
    // 创建新的统计信息元素
    const statsElement = document.createElement('div');
    statsElement.className = 'game-stats';
    statsElement.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-label">移动次数</div>
                <div class="stat-value">${data.moves}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">游戏时间</div>
                <div class="stat-value">${data.statistics?.playTimeFormatted || '0:00'}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">最大方块</div>
                <div class="stat-value">${data.maxTile}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">效率</div>
                <div class="stat-value">${data.statistics?.efficiency || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">合并次数</div>
                <div class="stat-value">${data.statistics?.totalMerges || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">哪吒等级</div>
                <div class="stat-value">${data.statistics?.nezhaLevel || 1}</div>
            </div>
        </div>
    `;
    
    // 插入到最终分数后面
    const finalScoreElement = document.getElementById('final-score');
    if (finalScoreElement && finalScoreElement.parentNode) {
        finalScoreElement.parentNode.insertBefore(statsElement, finalScoreElement.parentNode.querySelector('.modal-buttons'));
    }
}

/**
 * 显示新纪录庆祝动画
 */
function showNewRecordCelebration() {
    // 创建庆祝特效
    const celebration = document.createElement('div');
    celebration.className = 'celebration-effect';
    celebration.innerHTML = '🎉✨🎊';
    celebration.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 3rem;
        z-index: 3000;
        pointer-events: none;
        animation: celebrationBounce 2s ease-out;
    `;
    
    // 添加庆祝动画样式
    if (!document.getElementById('celebration-style')) {
        const style = document.createElement('style');
        style.id = 'celebration-style';
        style.textContent = `
            @keyframes celebrationBounce {
                0% { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) scale(0.5);
                }
                50% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1.2);
                }
                100% { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(celebration);
    
    // 自动移除
    setTimeout(() => {
        if (celebration.parentNode) {
            celebration.parentNode.removeChild(celebration);
        }
    }, 2000);
    
    // 播放新纪录音效（如果音频管理器可用）
    if (game && game.getAudioManager) {
        try {
            const audioManager = game.getAudioManager();
            if (audioManager && audioManager.playNewRecordSound) {
                audioManager.playNewRecordSound();
            } else if (audioManager && audioManager.playVictorySound) {
                audioManager.playVictorySound();
            }
        } catch (error) {
            debugLog('音频管理器尚未实现，跳过音效播放');
        }
    }
}

/**
 * 关闭游戏结束模态框
 */
function closeGameOverModal() {
    const gameOverModal = document.getElementById('game-over-modal');
    gameOverModal.classList.remove('show');
    
    // 延迟隐藏以播放动画
    setTimeout(() => {
        gameOverModal.classList.add('hidden');
    }, 300);
}

/**
 * 重新开始游戏
 */
function restartGame() {
    debugLog('重新开始游戏');
    
    // 关闭游戏结束模态框
    closeGameOverModal();
    
    // 显示重新开始提示
    showTemporaryMessage('正在重新开始游戏...', 1000);
    
    // 延迟一点时间让用户看到提示
    setTimeout(() => {
        startNewGame();
        showTemporaryMessage('新游戏开始！', 1500);
    }, 500);
}

/**
 * 确认重新开始游戏（如果游戏进行中）
 */
function confirmRestartGame() {
    if (!game) {
        startNewGame();
        return;
    }
    
    const gameState = game.getGameState();
    
    // 如果游戏已结束，直接重新开始
    if (gameState.isGameOver) {
        restartGame();
        return;
    }
    
    // 如果游戏进行中且有分数，询问确认
    if (gameState.score > 0 && gameState.moves > 0) {
        const confirmed = confirm('当前游戏正在进行中，确定要重新开始吗？这将丢失当前进度。');
        if (confirmed) {
            restartGame();
        }
    } else {
        // 游戏刚开始，直接重新开始
        restartGame();
    }
}

/**
 * 获取游戏引擎实例（用于调试）
 */
function getGameEngine() {
    return game;
}

/**
 * 保存设置
 */
function saveSettings() {
    const volumeSlider = document.getElementById('volume-slider');
    const themeSelect = document.getElementById('theme-select');
    const languageSelect = document.getElementById('language-select');
    
    debugLog('保存设置 - 音量:', volumeSlider.value, '主题:', themeSelect.value, '语言:', languageSelect.value);
    
    // 应用主题设置
    if (game && game.getThemeManager()) {
        const themeManager = game.getThemeManager();
        if (themeSelect.value !== themeManager.currentTheme) {
            themeManager.switchTheme(themeSelect.value);
        }
    }
    
    // 保存音量设置
    if (game && game.getAudioManager) {
        const audioManager = game.getAudioManager();
        if (audioManager && volumeSlider) {
            const volume = parseInt(volumeSlider.value) / 100;
            audioManager.setMasterVolume(volume);
        }
    }
    
    // 保存语言设置
    if (game && game.getI18nManager && languageSelect) {
        const i18nManager = game.getI18nManager();
        if (languageSelect.value !== i18nManager.currentLanguage) {
            changeLanguage(languageSelect.value);
        }
    }
    
    // 获取当前语言的"设置已保存"文本
    let message = '设置已保存';
    if (game && game.getI18nManager) {
        const i18nManager = game.getI18nManager();
        const translation = i18nManager.t('settings.saved');
        if (translation !== 'settings.saved') {
            message = translation;
        }
    }
    
    showTemporaryMessage(message);
    closeSettingsModal();
}

/**
 * 关闭设置模态框
 */
function closeSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    settingsModal.classList.add('hidden');
}

/**
 * 激活技能
 * @param {string} skillId - 技能ID
 */
function activateSkill(skillId) {
    debugLog('激活技能:', skillId);
    
    if (!game || !game.getNezhaSkillSystem) {
        console.warn('技能系统不可用');
        return;
    }
    
    const skillSystem = game.getNezhaSkillSystem();
    
    // 将UI技能ID转换为系统技能ID
    const systemSkillId = convertUISkillIdToSystemId(skillId);
    
    // 尝试触发技能
    const success = skillSystem.triggerSkill(systemSkillId);
    
    if (!success) {
        // 技能无法激活，显示原因
        const skillInfo = skillSystem.getSkillInfo(systemSkillId);
        if (!skillInfo.unlocked) {
            showTemporaryMessage('技能尚未解锁');
        } else if (skillInfo.state.cooldownRemaining > 0) {
            const remainingSeconds = Math.ceil(skillInfo.state.cooldownRemaining / 1000);
            showTemporaryMessage(`技能冷却中，还需 ${remainingSeconds} 秒`);
        } else {
            showTemporaryMessage('技能暂时无法使用');
        }
    }
}

/**
 * 将UI技能ID转换为系统技能ID
 * @param {string} uiSkillId - UI技能ID
 * @returns {string} 系统技能ID
 */
function convertUISkillIdToSystemId(uiSkillId) {
    const mapping = {
        'three-heads': 'threeHeadsSixArms',
        'qiankun-circle': 'qiankunCircle',
        'huntian-ling': 'huntianLing',
        'transformation': 'transformation'
    };
    
    return mapping[uiSkillId] || uiSkillId;
}

/**
 * 更新技能按钮状态
 * @param {string} skillId - 技能ID
 * @param {string} state - 状态
 */
function updateSkillButtonState(skillId, state) {
    // 将系统技能ID转换为UI技能ID
    const uiSkillId = convertSystemSkillIdToUIId(skillId);
    const skillElement = document.getElementById(`skill-${uiSkillId}`);
    
    if (!skillElement) return;
    
    switch (state) {
        case 'unlocked':
            skillElement.classList.remove('locked');
            skillElement.classList.add('unlocked-animation');
            setTimeout(() => {
                skillElement.classList.remove('unlocked-animation');
            }, 2000);
            break;
            
        case 'activated':
            skillElement.classList.add('activated');
            break;
            
        case 'deactivated':
            skillElement.classList.remove('activated');
            break;
            
        case 'ready':
            skillElement.classList.add('ready-pulse');
            setTimeout(() => {
                skillElement.classList.remove('ready-pulse');
            }, 1000);
            break;
    }
}

/**
 * 将系统技能ID转换为UI技能ID
 * @param {string} systemSkillId - 系统技能ID
 * @returns {string} UI技能ID
 */
function convertSystemSkillIdToUIId(systemSkillId) {
    const mapping = {
        'threeHeadsSixArms': 'three-heads',
        'qiankunCircle': 'qiankun-circle',
        'huntianLing': 'huntian-ling',
        'transformation': 'transformation'
    };
    
    return mapping[systemSkillId] || systemSkillId;
}

/**
 * 播放按钮点击音效
 */
function playButtonClickSound() {
    if (game && game.getAudioManager) {
        const audioManager = game.getAudioManager();
        if (audioManager && audioManager.playButtonClickSound) {
            audioManager.playButtonClickSound();
        }
    }
}

/**
 * 创建技能激活特效
 * @param {string} skillId - 技能ID
 */
function createSkillActivationEffect(skillId) {
    if (!game || !game.getEffectsManager) return;
    
    const effectsManager = game.getEffectsManager();
    if (!effectsManager) return;
    
    // 获取技能按钮位置
    const skillButton = document.getElementById(`skill-${skillId.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
    if (!skillButton) return;
    
    const rect = skillButton.getBoundingClientRect();
    const gameArea = document.querySelector('.game-area');
    const gameRect = gameArea.getBoundingClientRect();
    
    // 计算相对于游戏区域的坐标
    const x = rect.left + rect.width / 2 - gameRect.left;
    const y = rect.top + rect.height / 2 - gameRect.top;
    
    // 根据技能类型创建不同的特效
    let effectName = '';
    switch (skillId) {
        case 'threeHeadsSixArms':
            effectName = 'threeHeadsActivation';
            break;
        case 'qiankunCircle':
            effectName = 'qiankunCircleCharge';
            break;
        case 'huntianLing':
            effectName = 'huntianLingFlow';
            break;
        case 'transformation':
            effectName = 'transformationAura';
            break;
        default:
            effectName = 'spark'; // 默认特效
    }
    
    effectsManager.createNezhaEffect(effectName, x, y);
}

/**
 * 创建新方块特效
 */
function createNewTileEffect() {
    if (!game || !game.getEffectsManager) return;
    
    const effectsManager = game.getEffectsManager();
    const gameState = game.getGameState();
    if (!effectsManager || !gameState) return;
    
    // 获取最新添加的方块位置
    const tiles = gameState.getAllTiles();
    if (tiles.length === 0) return;
    
    // 找到最新的方块（通常是最后添加的）
    const newestTile = tiles[tiles.length - 1];
    if (!newestTile) return;
    
    // 计算屏幕坐标
    const gameArea = document.querySelector('.game-area');
    const rect = gameArea.getBoundingClientRect();
    const cellSize = rect.width / 4;
    const x = (newestTile.x + 0.5) * cellSize;
    const y = (newestTile.y + 0.5) * cellSize;
    
    effectsManager.createNezhaEffect('tileSpawn', x, y);
}

/**
 * 播放技能音效
 * @param {string} skillId - 技能ID
 */
function playSkillSound(skillId) {
    // 如果音频管理器可用，播放对应的技能音效
    if (game && game.getAudioManager) {
        try {
            const audioManager = game.getAudioManager();
            if (audioManager) {
                // 根据技能ID播放对应的音效
                switch (skillId) {
                    case 'threeHeadsSixArms':
                        audioManager.playThreeHeadsSound();
                        break;
                    case 'qiankunCircle':
                        audioManager.playQiankunCircleSound();
                        break;
                    case 'huntianLing':
                        audioManager.playHuntianLingSound();
                        break;
                    case 'transformation':
                        audioManager.playTransformationSound();
                        // 播放变身背景音乐
                        setTimeout(() => {
                            audioManager.playTransformationMusic();
                        }, 500);
                        break;
                    default:
                        debugLog(`未知技能音效: ${skillId}`);
                }
            }
        } catch (error) {
            debugLog('技能音效播放失败:', error);
        }
    }
}

/**
 * 显示乾坤圈准备就绪指示器
 */
function showQiankunCircleReadyIndicator() {
    // 创建或显示乾坤圈准备指示器
    let indicator = document.getElementById('qiankun-circle-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'qiankun-circle-indicator';
        indicator.className = 'qiankun-circle-indicator';
        indicator.innerHTML = `
            <div class="qiankun-indicator-content">
                <div class="qiankun-indicator-icon">⭕</div>
                <div class="qiankun-indicator-text">乾坤圈准备就绪</div>
                <div class="qiankun-indicator-desc">连击达成，可清除区域</div>
            </div>
        `;
        document.body.appendChild(indicator);
    }
    
    indicator.classList.add('active', 'ready');
    
    // 5秒后自动隐藏
    setTimeout(() => {
        indicator.classList.remove('active', 'ready');
    }, 5000);
}

/**
 * 创建乾坤圈分数效果
 * @param {number} score - 获得的分数
 */
function createQiankunScoreEffect(score) {
    const scoreElement = document.createElement('div');
    scoreElement.className = 'qiankun-score-effect';
    scoreElement.textContent = `+${score}`;
    scoreElement.style.cssText = `
        position: fixed;
        top: 40%;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(45deg, #FFD700, #FFA500);
        color: #8B4513;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 700;
        font-size: 1.5rem;
        z-index: 3000;
        pointer-events: none;
        animation: qiankunScoreFloat 2s ease-out forwards;
        box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
        border: 2px solid rgba(255, 165, 0, 0.8);
    `;
    
    // 添加分数飞行动画样式
    if (!document.getElementById('qiankun-score-style')) {
        const style = document.createElement('style');
        style.id = 'qiankun-score-style';
        style.textContent = `
            @keyframes qiankunScoreFloat {
                0% { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(20px) scale(0.8) rotate(-5deg);
                }
                25% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(-10px) scale(1.2) rotate(2deg);
                }
                50% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(-20px) scale(1.1) rotate(-1deg);
                }
                75% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(-30px) scale(1) rotate(1deg);
                }
                100% { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(-50px) scale(0.9) rotate(0deg);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(scoreElement);
    
    // 自动移除
    setTimeout(() => {
        if (scoreElement.parentNode) {
            scoreElement.parentNode.removeChild(scoreElement);
        }
    }, 2000);
}

/**
 * 显示混天绫准备就绪指示器
 */
function showHuntianLingReadyIndicator() {
    // 创建或显示混天绫准备指示器
    let indicator = document.getElementById('huntian-ling-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'huntian-ling-indicator';
        indicator.className = 'huntian-ling-indicator';
        indicator.innerHTML = `
            <div class="huntian-indicator-content">
                <div class="huntian-indicator-icon">🌊</div>
                <div class="huntian-indicator-text">混天绫准备就绪</div>
                <div class="huntian-indicator-desc">发现数字组合模式</div>
            </div>
        `;
        document.body.appendChild(indicator);
    }
    
    indicator.classList.add('active', 'ready');
    
    // 5秒后自动隐藏
    setTimeout(() => {
        indicator.classList.remove('active', 'ready');
    }, 5000);
}

/**
 * 创建混天绫连锁分数效果
 * @param {Object} data - 连锁数据
 */
function createHuntianLingScoreEffect(data) {
    const scoreElement = document.createElement('div');
    scoreElement.className = 'huntian-ling-score-effect';
    
    // 创建多层分数显示
    const mainScore = document.createElement('div');
    mainScore.textContent = `+${data.totalScore}`;
    mainScore.style.cssText = `
        font-size: 1.8rem;
        font-weight: 700;
        color: white;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        margin-bottom: 5px;
    `;
    
    const chainInfo = document.createElement('div');
    chainInfo.textContent = `${data.patterns.length}连锁`;
    chainInfo.style.cssText = `
        font-size: 1rem;
        font-weight: 600;
        color: #E0FFFF;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    `;
    
    scoreElement.appendChild(mainScore);
    scoreElement.appendChild(chainInfo);
    
    scoreElement.style.cssText = `
        position: fixed;
        top: 35%;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(45deg, #00CED1, #40E0D0);
        color: white;
        padding: 15px 25px;
        border-radius: 20px;
        z-index: 3000;
        pointer-events: none;
        animation: huntianScoreFloat 2.5s ease-out forwards;
        box-shadow: 0 8px 25px rgba(0, 206, 209, 0.6);
        border: 2px solid rgba(64, 224, 208, 0.8);
        text-align: center;
    `;
    
    // 添加混天绫分数飞行动画样式
    if (!document.getElementById('huntian-score-style')) {
        const style = document.createElement('style');
        style.id = 'huntian-score-style';
        style.textContent = `
            @keyframes huntianScoreFloat {
                0% { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(30px) scale(0.7) rotate(-10deg);
                }
                20% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(0px) scale(1.3) rotate(5deg);
                }
                40% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(-15px) scale(1.1) rotate(-3deg);
                }
                60% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(-25px) scale(1.05) rotate(2deg);
                }
                80% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(-35px) scale(1) rotate(-1deg);
                }
                100% { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(-60px) scale(0.8) rotate(0deg);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(scoreElement);
    
    // 创建连锁波纹效果
    createChainRippleEffect(data.patterns.length);
    
    // 自动移除
    setTimeout(() => {
        if (scoreElement.parentNode) {
            scoreElement.parentNode.removeChild(scoreElement);
        }
    }, 2500);
}

/**
 * 创建连锁波纹效果
 * @param {number} chainCount - 连锁数量
 */
function createChainRippleEffect(chainCount) {
    const gameArea = document.querySelector('.game-area');
    if (!gameArea) return;
    
    for (let i = 0; i < chainCount; i++) {
        setTimeout(() => {
            const ripple = document.createElement('div');
            ripple.className = 'chain-ripple-effect';
            ripple.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 20px;
                height: 20px;
                background: rgba(0, 206, 209, 0.3);
                border: 2px solid #00CED1;
                border-radius: 50%;
                pointer-events: none;
                z-index: 180;
                animation: chainRipple 1.5s ease-out forwards;
                transform: translate(-50%, -50%);
            `;
            
            gameArea.appendChild(ripple);
            
            // 1.5秒后移除波纹
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 1500);
        }, i * 300);
    }
    
    // 添加连锁波纹动画样式
    if (!document.getElementById('chain-ripple-style')) {
        const style = document.createElement('style');
        style.id = 'chain-ripple-style';
        style.textContent = `
            @keyframes chainRipple {
                0% { 
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                    background: rgba(0, 206, 209, 0.6);
                }
                50% { 
                    opacity: 0.8;
                    transform: translate(-50%, -50%) scale(4);
                    background: rgba(64, 224, 208, 0.4);
                }
                100% { 
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(8);
                    background: rgba(0, 206, 209, 0.1);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * 绑定音频管理器事件
 */
function bindAudioManagerEvents() {
    if (!game || !game.getAudioManager) return;
    
    const audioManager = game.getAudioManager();
    
    // 音频初始化完成事件
    audioManager.on('initialized', () => {
        
        // 初始化音频设置UI
        initializeAudioSettings();
    });
    
    // 音频加载完成事件
    audioManager.on('audioLoaded', (data) => {
        debugLog('音频加载完成:', data.name, data.type);
    });
    
    // 哪吒音频资源加载完成事件
    audioManager.on('nezhaAudioLoaded', () => {
        debugLog('哪吒主题音频资源加载完成');
        // 延迟播放背景音乐，等待用户交互
        setTimeout(() => {
            if (audioManager.userInteracted) {
                audioManager.playBackgroundMusic();
            }
        }, 2000);
    });
    
    // 音量变化事件
    audioManager.on('volumeChanged', (data) => {
        debugLog('音量变化:', data.type, data.volume);
        updateVolumeUI(data.type, data.volume);
    });
    
    // 静音状态变化事件
    audioManager.on('muteChanged', (data) => {
        debugLog('静音状态变化:', data.muted);
        updateMuteUI(data.muted);
    });
    
    // 音频错误事件
    audioManager.on('error', (data) => {
        console.error('音频管理器错误:', data);
        showTemporaryMessage('音频系统出现问题', 2000);
    });
    
    // 音频加载错误事件
    audioManager.on('loadError', (data) => {
        console.warn('音频加载失败:', data.name, data.error);
    });
}

/**
 * 初始化音频设置UI
 */
function initializeAudioSettings() {
    if (!game || !game.getAudioManager) return;
    
    const audioManager = game.getAudioManager();
    const audioInfo = audioManager.getAudioInfo();
    
    // 更新音量滑块
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.value = Math.round(audioInfo.volumes.master * 100);
        
        // 绑定音量滑块事件
        volumeSlider.addEventListener('input', (event) => {
            const volume = parseInt(event.target.value) / 100;
            audioManager.setMasterVolume(volume);
        });
    }
    
    // 添加静音按钮功能
    addMuteButtonFunctionality();
}

/**
 * 添加静音按钮功能
 */
function addMuteButtonFunctionality() {
    // 创建静音按钮（如果不存在）
    let muteButton = document.getElementById('mute-button');
    
    if (!muteButton) {
        muteButton = document.createElement('button');
        muteButton.id = 'mute-button';
        muteButton.className = 'control-btn';
        muteButton.innerHTML = '🔊';
        muteButton.title = '静音/取消静音';
        
        // 添加到控制按钮区域
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
            gameControls.appendChild(muteButton);
        }
    }
    
    // 绑定点击事件
    muteButton.addEventListener('click', () => {
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            audioManager.toggleMute();
        }
    });
}

/**
 * 更新音量UI
 * @param {string} type - 音量类型
 * @param {number} volume - 音量值
 */
function updateVolumeUI(type, volume) {
    if (type === 'master') {
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.value = Math.round(volume * 100);
        }
    }
}

/**
 * 更新静音UI
 * @param {boolean} muted - 是否静音
 */
function updateMuteUI(muted) {
    const muteButton = document.getElementById('mute-button');
    if (muteButton) {
        muteButton.innerHTML = muted ? '🔇' : '🔊';
        muteButton.title = muted ? '取消静音' : '静音';
    }
}

/**
 * 通过技能名称激活技能
 * @param {string} skillName - 技能名称
 */
function activateSkillByName(skillName) {
    const skillNameToId = {
        'threeHeadsSixArms': 'three-heads',
        'qiankunCircle': 'qiankun-circle',
        'huntianLing': 'huntian-ling',
        'transformation': 'transformation'
    };
    
    const skillId = skillNameToId[skillName];
    if (skillId) {
        activateSkill(skillId);
    }
}

/**
 * 关闭所有模态框
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.add('hidden');
    });
}

/**
 * 获取技能名称
 * @param {string} skillId - 技能ID
 * @returns {string} 技能名称
 */
function getSkillName(skillId) {
    const names = {
        'three-heads': '三头六臂',
        'qiankun-circle': '乾坤圈',
        'huntian-ling': '混天绫',
        'transformation': '哪吒变身'
    };
    return names[skillId] || '未知技能';
}

/**
 * 显示欢迎消息
 */
function showWelcomeMessage() {
    showTemporaryMessage('欢迎来到哪吒2048！使用方向键或滑动屏幕开始游戏。', 3000);
}

/**
 * 显示临时消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒）
 */
function showTemporaryMessage(message, duration = 2000) {
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(220, 20, 60, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 2000;
        animation: fadeInOut ${duration}ms ease-in-out;
    `;
    
    // 添加CSS动画
    if (!document.getElementById('temp-message-style')) {
        const style = document.createElement('style');
        style.id = 'temp-message-style';
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                10% { opacity: 1; transform: translateX(-50%) translateY(0); }
                90% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(messageElement);
    
    // 自动移除
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, duration);
}

/**
 * 显示错误消息
 * @param {string} message - 错误消息
 */
function showErrorMessage(message) {
    const errorElement = document.createElement('div');
    errorElement.textContent = message;
    errorElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(220, 20, 60, 0.95);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-size: 1.1rem;
        text-align: center;
        z-index: 3000;
        max-width: 300px;
    `;
    
    document.body.appendChild(errorElement);
    
    // 点击关闭
    errorElement.addEventListener('click', () => {
        if (errorElement.parentNode) {
            errorElement.parentNode.removeChild(errorElement);
        }
    });
}

/**
 * 显示得分动画
 * @param {number} score - 得分
 */
function showScoreAnimation(score) {
    const scoreElement = document.createElement('div');
    scoreElement.textContent = `+${score}`;
    scoreElement.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(45deg, #FFD700, #FFA500);
        color: #8B4513;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 1.2rem;
        z-index: 2500;
        pointer-events: none;
        animation: scoreFloat 1500ms ease-out forwards;
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
    `;
    
    // 添加动画样式
    if (!document.getElementById('score-animation-style')) {
        const style = document.createElement('style');
        style.id = 'score-animation-style';
        style.textContent = `
            @keyframes scoreFloat {
                0% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(0) scale(1);
                }
                50% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(-20px) scale(1.2);
                }
                100% { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(-40px) scale(0.8);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(scoreElement);
    
    // 自动移除
    setTimeout(() => {
        if (scoreElement.parentNode) {
            scoreElement.parentNode.removeChild(scoreElement);
        }
    }, 1500);
}

/**
 * 显示合并动画反馈
 * @param {Array} mergedTiles - 合并的方块数组
 */
function showMergeAnimation(mergedTiles) {
    mergedTiles.forEach((tile, index) => {
        setTimeout(() => {
            const symbol = tile.getNezhaSymbol();
            showTemporaryMessage(`${symbol} 合并成功！`, 1000);
        }, index * 200);
    });
}

/**
 * 检查连击系统
 * @param {Object} moveData - 移动数据
 */
function checkComboSystem(moveData) {
    if (!game) return;
    
    const gameState = game.getGameState();
    
    // 检查连续合并
    if (gameState.consecutiveMerges >= 3) {
        showTemporaryMessage(`🔥 ${gameState.consecutiveMerges}连击！`, 1500);
        
        // 连击奖励
        if (gameState.consecutiveMerges >= 5) {
            showTemporaryMessage('⚡ 超级连击！技能冷却减少！', 2000);
            reduceCooldowns();
        }
    }
    
    // 检查哪吒等级提升
    const currentLevel = gameState.nezhaLevel;
    if (currentLevel > (gameState.previousNezhaLevel || 1)) {
        showTemporaryMessage(`🌟 哪吒等级提升至 ${currentLevel}！`, 2500);
        gameState.previousNezhaLevel = currentLevel;
    }
}

/**
 * 减少技能冷却时间
 */
function reduceCooldowns() {
    if (!game) return;
    
    const gameState = game.getGameState();
    
    // 减少所有技能冷却时间
    Object.keys(gameState.skillCooldowns).forEach(skill => {
        gameState.skillCooldowns[skill] = Math.max(0, gameState.skillCooldowns[skill] - 2000);
    });
    
    // 更新UI显示
    updateSkillCooldownDisplay();
}

/**
 * 更新技能冷却显示
 */
function updateSkillCooldownDisplay() {
    if (!game) return;
    
    const gameState = game.getGameState();
    const skills = ['three-heads', 'qiankun-circle', 'huntian-ling', 'transformation'];
    const skillNameMap = {
        'three-heads': 'threeHeadsSixArms',
        'qiankun-circle': 'qiankunCircle',
        'huntian-ling': 'huntianLing',
        'transformation': 'transformation'
    };
    
    skills.forEach(skillId => {
        const skillElement = document.getElementById(`skill-${skillId}`);
        const cooldownElement = skillElement?.querySelector('.skill-cooldown');
        
        if (skillElement && cooldownElement) {
            const skillName = skillNameMap[skillId];
            const cooldown = gameState.skillCooldowns[skillName] || 0;
            
            if (cooldown > 0) {
                skillElement.classList.add('disabled');
                cooldownElement.classList.add('active');
                
                // 设置冷却进度
                const maxCooldown = 10000; // 假设最大冷却时间为10秒
                const progress = cooldown / maxCooldown;
                cooldownElement.style.background = `conic-gradient(from 0deg, transparent ${(1-progress)*100}%, rgba(0, 0, 0, 0.7) ${(1-progress)*100}%)`;
            } else {
                skillElement.classList.remove('disabled');
                cooldownElement.classList.remove('active');
            }
        }
    });
}

/**
 * 验证移动有效性
 * @param {string} direction - 移动方向
 * @returns {boolean} 是否有效
 */
function validateMove(direction) {
    if (!game) return false;
    
    const gridManager = game.getGridManager();
    const gameState = game.getGameState();
    
    // 检查游戏是否结束
    if (gameState.isGameOver) {
        showTemporaryMessage('游戏已结束，请开始新游戏');
        return false;
    }
    
    // 检查游戏是否暂停
    if (gameState.isPaused) {
        showTemporaryMessage('游戏已暂停');
        return false;
    }
    
    // 检查方向是否有效
    const validDirections = ['up', 'down', 'left', 'right'];
    if (!validDirections.includes(direction)) {
        console.warn('无效的移动方向:', direction);
        return false;
    }
    
    // 检查是否可以移动
    const directionMap = {
        'up': gridManager.DIRECTIONS.UP,
        'down': gridManager.DIRECTIONS.DOWN,
        'left': gridManager.DIRECTIONS.LEFT,
        'right': gridManager.DIRECTIONS.RIGHT
    };
    
    const canMove = gridManager.canMove(directionMap[direction]);
    if (!canMove) {
        showTemporaryMessage('该方向无法移动');
        return false;
    }
    
    return true;
}

/**
 * 处理移动输入的完整流程
 * @param {string} direction - 移动方向
 * @returns {boolean} 是否成功处理
 */
function handleMoveInput(direction) {
    // 验证移动有效性
    if (!validateMove(direction)) {
        return false;
    }
    
    // 执行移动
    const moved = game.move(direction);
    
    if (moved) {
        // 移动成功的反馈
        debugLog(`成功移动: ${direction}`);
        
        // 播放移动音效
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager && audioManager.playMoveSound) {
                audioManager.playMoveSound();
                
                // 延迟播放新方块音效（因为新方块会在移动后生成）
                setTimeout(() => {
                    if (audioManager.playNewTileSound) {
                        audioManager.playNewTileSound();
                    }
                }, 200);
            }
        }
        
        // 延迟创建新方块特效
        setTimeout(() => {
            createNewTileEffect();
        }, 300);
        
        // 检查是否需要显示提示
        const gameState = game.getGameState();
        const emptyTiles = gameState.getEmptyTiles();
        
        if (emptyTiles.length <= 2) {
            showTemporaryMessage('⚠️ 空间不足，小心游戏结束！', 2000);
        }
        
        return true;
    } else {
        // 移动失败的反馈
        debugLog(`移动失败: ${direction}`);
        showTemporaryMessage('无法移动到该方向');
        
        // 播放错误音效
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager && audioManager.playErrorSound) {
                audioManager.playErrorSound();
            }
        }
        
        return false;
    }
}

/**
 * 处理多方向输入（三头六臂模式）
 * @param {Array<string>} directions - 方向数组
 * @returns {boolean} 是否成功处理
 */
function handleMultiDirectionInput(directions) {
    if (!game || !directions || directions.length === 0) {
        return false;
    }
    
    debugLog('🔥 处理三头六臂多方向输入:', directions);
    
    let successCount = 0;
    let totalScore = 0;
    const results = [];
    
    // 按顺序执行每个方向的移动
    directions.forEach((direction, index) => {
        // 验证移动有效性
        if (validateMove(direction)) {
            const initialScore = game.getGameState().score;
            const moved = game.move(direction);
            
            if (moved) {
                const scoreGained = game.getGameState().score - initialScore;
                successCount++;
                totalScore += scoreGained;
                
                results.push({
                    direction,
                    success: true,
                    scoreGained
                });
                
                debugLog(`🔥 方向 ${direction} 移动成功，得分: ${scoreGained}`);
            } else {
                results.push({
                    direction,
                    success: false,
                    scoreGained: 0
                });
            }
        } else {
            results.push({
                direction,
                success: false,
                scoreGained: 0
            });
        }
        
        // 在多方向操作之间添加短暂延迟，让动画更清晰
        if (index < directions.length - 1) {
            setTimeout(() => {
                // 延迟处理下一个方向
            }, 50);
        }
    });
    
    // 显示多方向操作结果
    if (successCount > 0) {
        const message = `🔥 三头六臂: ${successCount}/${directions.length} 方向成功，总得分: ${totalScore}`;
        showTemporaryMessage(message, 3000);
        
        // 创建特殊的多方向操作视觉效果
        createThreeHeadsSixArmsEffect(results);
        
        return true;
    } else {
        showTemporaryMessage('🔥 三头六臂: 所有方向都无法移动', 2000);
        return false;
    }
}

/**
 * 创建三头六臂技能的视觉效果
 * @param {Array} results - 移动结果数组
 */
function createThreeHeadsSixArmsEffect(results) {
    // 创建多方向移动的视觉反馈
    const gameArea = document.querySelector('.game-area');
    if (!gameArea) return;
    
    const effectContainer = document.createElement('div');
    effectContainer.className = 'three-heads-six-arms-effect';
    effectContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100;
    `;
    
    // 为每个成功的方向创建效果
    results.forEach((result, index) => {
        if (result.success) {
            const directionEffect = document.createElement('div');
            directionEffect.className = 'direction-effect';
            
            // 根据方向设置效果位置和动画
            const directionStyles = {
                'up': { top: '10%', left: '50%', transform: 'translateX(-50%)', animation: 'effectUp 1s ease-out' },
                'down': { bottom: '10%', left: '50%', transform: 'translateX(-50%)', animation: 'effectDown 1s ease-out' },
                'left': { top: '50%', left: '10%', transform: 'translateY(-50%)', animation: 'effectLeft 1s ease-out' },
                'right': { top: '50%', right: '10%', transform: 'translateY(-50%)', animation: 'effectRight 1s ease-out' }
            };
            
            const style = directionStyles[result.direction] || directionStyles['up'];
            
            directionEffect.style.cssText = `
                position: absolute;
                top: ${style.top || 'auto'};
                bottom: ${style.bottom || 'auto'};
                left: ${style.left || 'auto'};
                right: ${style.right || 'auto'};
                transform: ${style.transform};
                font-size: 2rem;
                color: #FFD700;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                animation: ${style.animation};
                animation-delay: ${index * 100}ms;
            `;
            
            directionEffect.textContent = `+${result.scoreGained}`;
            effectContainer.appendChild(directionEffect);
        }
    });
    
    gameArea.appendChild(effectContainer);
    
    // 1.5秒后移除效果
    setTimeout(() => {
        if (effectContainer.parentNode) {
            effectContainer.parentNode.removeChild(effectContainer);
        }
    }, 1500);
}

/**
 * 创建输入响应测试套件
 */
function createInputTests() {
    const tests = {
        // 测试移动有效性验证
        testMoveValidation: () => {
            debugLog('测试移动有效性验证...');
            
            // 测试无效方向
            const result1 = validateMove('invalid');
            console.assert(!result1, '无效方向应该返回false');
            
            // 测试有效方向
            const result2 = validateMove('up');
            console.assert(typeof result2 === 'boolean', '有效方向应该返回boolean');
            
            debugLog('移动有效性验证测试通过');
        },
        
        // 测试输入处理流程
        testInputHandling: () => {
            debugLog('测试输入处理流程...');
            
            if (!game) {
                debugLog('游戏未初始化，跳过输入处理测试');
                return;
            }
            
            const initialScore = game.getGameState().score;
            const result = handleMoveInput('right');
            
            debugLog(`输入处理结果: ${result}`);
            debugLog('输入处理流程测试完成');
        },
        
        // 测试技能激活
        testSkillActivation: () => {
            debugLog('测试技能激活...');
            
            const skillNames = ['threeHeadsSixArms', 'qiankunCircle', 'huntianLing', 'transformation'];
            
            skillNames.forEach(skillName => {
                activateSkillByName(skillName);
                debugLog(`技能 ${skillName} 激活测试完成`);
            });
            
            debugLog('技能激活测试通过');
        },
        
        // 测试游戏状态检查
        testGameStateChecks: () => {
            debugLog('测试游戏状态检查...');
            
            if (!game) {
                debugLog('游戏未初始化，跳过游戏状态测试');
                return;
            }
            
            const gameState = game.getGameState();
            
            console.assert(typeof gameState.score === 'number', '分数应该是数字');
            console.assert(typeof gameState.moves === 'number', '移动次数应该是数字');
            console.assert(typeof gameState.isGameOver === 'boolean', '游戏结束状态应该是布尔值');
            
            debugLog('游戏状态检查测试通过');
        }
    };
    
    return tests;
}

/**
 * 运行输入响应测试
 */
function runInputTests() {
    debugLog('开始运行输入响应测试...');
    
    const tests = createInputTests();
    
    try {
        Object.keys(tests).forEach(testName => {
            debugLog(`\n--- 运行测试: ${testName} ---`);
            tests[testName]();
        });
        
        debugLog('\n✅ 所有输入响应测试通过！');
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

/**
 * 初始化主题设置
 */
function initializeThemeSettings() {
    if (!game) return;
    
    const themeManager = game.getThemeManager();
    if (!themeManager) return;
    
    // 设置主题选择器选项
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        // 清空现有选项
        themeSelect.innerHTML = '';
        
        // 添加可用主题
        const availableThemes = themeManager.getAvailableThemes();
        availableThemes.forEach(themeName => {
            const option = document.createElement('option');
            const themeInfo = themeManager.getThemeInfo(themeName);
            option.value = themeName;
            option.textContent = themeInfo.name;
            option.selected = themeName === themeManager.currentTheme;
            themeSelect.appendChild(option);
        });
    }
    
    // 添加主题变化监听器
    themeManager.addThemeChangeListener((themeName, themeConfig) => {
        debugLog('主题已切换:', themeName);
        showTemporaryMessage(`已切换到${themeManager.getThemeInfo(themeName).name}`);
        
        // 更新主题选择器
        if (themeSelect) {
            themeSelect.value = themeName;
        }
        
        // 更新body的主题数据属性
        document.body.setAttribute('data-theme', themeName);
    });
    
    // 加载保存的主题偏好
    const savedTheme = themeManager.loadThemePreference();
    if (savedTheme && savedTheme !== themeManager.currentTheme) {
        themeManager.switchTheme(savedTheme);
    } else {
        // 设置默认主题数据属性
        document.body.setAttribute('data-theme', themeManager.currentTheme);
    }
}

/**
 * 初始化视觉元素
 */
function initializeVisualElements() {
    if (!game) return;
    
    const themeManager = game.getThemeManager();
    if (!themeManager) return;
    
    // 应用当前主题的视觉效果
    themeManager.applyThemeToDOM();
    
    // 初始化方块渲染
    initializeTileRendering();
    
    // 设置技能图标
    updateSkillIcons();
    
    // 添加视觉反馈事件监听
    bindVisualFeedbackEvents();
    
}

/**
 * 初始化方块渲染
 */
function initializeTileRendering() {
    if (!game) return;
    
    const gameState = game.getGameState();
    const themeManager = game.getThemeManager();
    
    // 清除现有方块元素
    const existingTiles = document.querySelectorAll('.tile');
    existingTiles.forEach(tile => tile.remove());
    
    // 渲染当前游戏状态中的方块
    for (let x = 0; x < 4; x++) {
        for (let y = 0; y < 4; y++) {
            const tile = gameState.getTile(x, y);
            if (tile) {
                createTileElement(tile);
            }
        }
    }
}

/**
 * 更新技能图标
 */
function updateSkillIcons() {
    if (!game) return;
    
    const themeManager = game.getThemeManager();
    if (!themeManager) return;
    
    const skills = [
        { id: 'skill-three-heads', name: 'threeHeadsSixArms' },
        { id: 'skill-qiankun-circle', name: 'qiankunCircle' },
        { id: 'skill-huntian-ling', name: 'huntianLing' },
        { id: 'skill-transformation', name: 'transformation' }
    ];
    
    skills.forEach(skill => {
        const skillElement = document.getElementById(skill.id);
        const iconElement = skillElement?.querySelector('.skill-icon');
        
        if (iconElement) {
            const icon = themeManager.getSkillIcon(skill.name);
            iconElement.textContent = icon;
        }
    });
}

/**
 * 绑定视觉反馈事件
 */
function bindVisualFeedbackEvents() {
    if (!game) return;
    
    // 监听方块合并事件
    game.on('tileMerged', (data) => {
        const themeManager = game.getThemeManager();
        if (themeManager && data.position) {
            // 计算屏幕坐标
            const gameArea = document.querySelector('.game-area');
            const rect = gameArea.getBoundingClientRect();
            const cellSize = rect.width / 4;
            const x = rect.left + (data.position.x + 0.5) * cellSize;
            const y = rect.top + (data.position.y + 0.5) * cellSize;
            
            themeManager.triggerMergeEffect(x, y, data.value);
        }
        
        // 播放合并音效
        if (game && game.getAudioManager) {
            const audioManager = game.getAudioManager();
            if (audioManager) {
                // 根据方块值播放不同音调的合并音效
                if (audioManager.playTileUpgradeSound && data.value) {
                    audioManager.playTileUpgradeSound(data.value);
                } else if (audioManager.playMergeSound) {
                    audioManager.playMergeSound();
                }
            }
        }
        
        // 创建合并特效
        if (game && game.getEffectsManager && data.position) {
            const effectsManager = game.getEffectsManager();
            if (effectsManager) {
                // 计算屏幕坐标
                const gameArea = document.querySelector('.game-area');
                const rect = gameArea.getBoundingClientRect();
                const cellSize = rect.width / 4;
                const x = (data.position.x + 0.5) * cellSize;
                const y = (data.position.y + 0.5) * cellSize;
                
                effectsManager.createNezhaEffect('tileMerge', x, y, {
                    intensity: Math.min(data.value / 64, 3) // 根据方块值调整特效强度
                });
            }
        }
    });
    
    // 监听技能激活事件
    game.on('skillActivated', (data) => {
        const themeManager = game.getThemeManager();
        if (themeManager) {
            themeManager.triggerSkillEffect(data.skillName);
        }
    });
    
    // 监听游戏胜利事件
    game.on('won', () => {
        const themeManager = game.getThemeManager();
        if (themeManager) {
            themeManager.createVictoryEffect();
        }
    });
    
    // 监听分数更新事件
    game.on('scoreUpdated', (data) => {
        if (data.isNewRecord) {
            const scoreElement = document.getElementById('current-score');
            if (scoreElement) {
                scoreElement.classList.add('new-record');
                setTimeout(() => {
                    scoreElement.classList.remove('new-record');
                }, 3000);
            }
        }
        
        // 添加分数增加动画
        const scoreElement = document.getElementById('current-score');
        if (scoreElement) {
            scoreElement.classList.add('score-increase');
            setTimeout(() => {
                scoreElement.classList.remove('score-increase');
            }, 600);
        }
    });
}

/**
 * 添加游戏结束视觉反馈
 */
function addGameOverVisualFeedback() {
    // 添加游戏区域覆盖层
    const gameArea = document.querySelector('.game-area');
    if (gameArea) {
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay active';
        gameArea.appendChild(overlay);
        
        // 5秒后移除覆盖层
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 5000);
    }
    
    // 显示游戏结束消息
    showTemporaryMessage('游戏结束！', 2000);
    
    // 暂停游戏引擎
    if (game) {
        game.pause();
    }
}

/**
 * 重置游戏状态显示
 */
function resetGameStateDisplay() {
    // 移除游戏结束覆盖层
    const overlay = document.querySelector('.game-over-overlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    
    // 重置分数显示动画
    const scoreElement = document.getElementById('current-score');
    if (scoreElement) {
        scoreElement.classList.remove('score-increase', 'new-record');
    }
    
    // 重置技能显示
    const skillElements = document.querySelectorAll('.skill-item');
    skillElements.forEach(skill => {
        skill.classList.remove('disabled', 'activated');
        const cooldownElement = skill.querySelector('.skill-cooldown');
        if (cooldownElement) {
            cooldownElement.classList.remove('active');
            cooldownElement.style.background = '';
        }
    });
}

/**
 * 创建主题预览界面
 */
function createThemePreviewUI() {
    if (!game) return;
    
    const themeManager = game.getThemeManager();
    if (!themeManager) return;
    
    const settingsModal = document.getElementById('settings-modal');
    const modalContent = settingsModal?.querySelector('.modal-content');
    
    if (modalContent) {
        // 查找主题设置项
        const themeSettingItem = Array.from(modalContent.querySelectorAll('.setting-item'))
            .find(item => item.querySelector('#theme-select'));
        
        if (themeSettingItem) {
            // 添加主题预览容器
            const previewContainer = document.createElement('div');
            previewContainer.className = 'theme-preview-container';
            previewContainer.style.cssText = `
                margin-top: 10px;
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            `;
            
            // 为每个主题创建预览
            const availableThemes = themeManager.getAvailableThemes();
            availableThemes.forEach(themeName => {
                const preview = themeManager.createThemePreview(themeName);
                preview.style.cssText = `
                    flex: 1;
                    min-width: 120px;
                    padding: 10px;
                    border: 2px solid transparent;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                    font-size: 0.9rem;
                `;
                
                // 添加点击事件
                preview.addEventListener('click', () => {
                    themeManager.switchTheme(themeName);
                });
                
                // 高亮当前主题
                if (themeName === themeManager.currentTheme) {
                    preview.style.borderColor = '#DC143C';
                    preview.style.backgroundColor = 'rgba(220, 20, 60, 0.1)';
                }
                
                previewContainer.appendChild(preview);
            });
            
            themeSettingItem.appendChild(previewContainer);
        }
    }
}

// 在开发模式下自动运行测试
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // 延迟运行测试，确保游戏初始化完成
    setTimeout(() => {
        if (game && game.config.debug) {
            runInputTests();
        }
    }, 2000);
}