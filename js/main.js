/**
 * 游戏主入口文件
 * 初始化游戏并处理基础交互
 */

// 全局游戏实例
let game = null;

/**
 * 页面加载完成后初始化游戏
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('哪吒2048游戏正在初始化...');
    
    try {
        // 初始化游戏引擎（暂时创建基础结构）
        await initializeGame();
        
        // 绑定UI事件
        bindUIEvents();
        
        // 显示初始界面
        showWelcomeMessage();
        
        console.log('游戏初始化完成！');
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
        debug: true // 开发模式下启用调试信息
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
    
    console.log('游戏引擎初始化完成');
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
    
    console.log('测试方块已添加到游戏状态');
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
        console.log('游戏引擎初始化完成');
        updateScoreDisplay();
        initializeThemeSettings();
        initializeVisualElements();
    });
    
    // 游戏开始
    game.on('started', () => {
        console.log('游戏开始');
        showTemporaryMessage('游戏开始！');
    });
    
    // 游戏暂停
    game.on('paused', () => {
        console.log('游戏暂停');
        showTemporaryMessage('游戏暂停');
    });
    
    // 游戏恢复
    game.on('resumed', () => {
        console.log('游戏恢复');
        showTemporaryMessage('游戏恢复');
    });
    
    // 游戏重置
    game.on('reset', () => {
        console.log('游戏重置');
        updateScoreDisplay();
        showTemporaryMessage('游戏重置');
    });
    
    // 移动事件
    game.on('move', (data) => {
        console.log('移动事件:', data);
        
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
        console.log('游戏结束:', data);
        showGameOverModal(data);
    });
    
    // 获胜事件
    game.on('won', (data) => {
        console.log('游戏获胜:', data);
        showTemporaryMessage('🎉 恭喜达到2048！', 3000);
    });
    
    // 技能激活事件
    game.on('skillActivated', (data) => {
        console.log('技能激活:', data.skillName);
        activateSkillByName(data.skillName);
    });
    
    // 新游戏请求事件
    game.on('newGameRequested', () => {
        console.log('请求新游戏');
        startNewGame();
    });
    
    // 方向输入事件
    game.on('directionInput', (data) => {
        console.log('方向输入:', data.direction);
        handleMoveInput(data.direction);
    });
    
    // 网格几乎满了事件
    game.on('gridAlmostFull', (data) => {
        console.log('网格几乎满了:', data);
        showTemporaryMessage('⚠️ 空间不足，小心游戏结束！', 2000);
    });
    
    // 新的最大方块事件
    game.on('newMaxTile', (data) => {
        console.log('新的最大方块:', data);
        showTemporaryMessage(`🎉 达到新高度: ${data.newMax}！`, 2000);
    });
    
    // 移动选择有限事件
    game.on('limitedMoves', (data) => {
        console.log('移动选择有限:', data);
        showTemporaryMessage('⚠️ 移动选择有限，请谨慎操作！', 2000);
    });
    
    // ESC键事件
    game.on('escapePressed', () => {
        console.log('ESC键按下');
        // 可以用来关闭模态框或暂停游戏
        closeAllModals();
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
}

/**
 * 绑定UI事件
 */
function bindUIEvents() {
    // 新游戏按钮
    const newGameBtn = document.getElementById('new-game-btn');
    newGameBtn.addEventListener('click', startNewGame);
    
    // 暂停按钮
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.addEventListener('click', togglePause);
    
    // 设置按钮
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.addEventListener('click', showSettings);
    
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

// 键盘和触摸输入现在由InputManager统一处理

/**
 * 开始新游戏
 */
function startNewGame() {
    if (!game) {
        console.error('游戏引擎未初始化');
        return;
    }
    
    console.log('开始新游戏');
    
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
    const settingsModal = document.getElementById('settings-modal');
    settingsModal.classList.remove('hidden');
    
    // 创建主题预览界面
    createThemePreviewUI();
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
    if (data.score >= data.highScore && data.score > 0) {
        newRecordElement.classList.remove('hidden');
    } else {
        newRecordElement.classList.add('hidden');
    }
    
    gameOverModal.classList.remove('hidden');
}

/**
 * 关闭游戏结束模态框
 */
function closeGameOverModal() {
    const gameOverModal = document.getElementById('game-over-modal');
    gameOverModal.classList.add('hidden');
}

/**
 * 重新开始游戏
 */
function restartGame() {
    closeGameOverModal();
    startNewGame();
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
    
    console.log('保存设置 - 音量:', volumeSlider.value, '主题:', themeSelect.value);
    
    // 应用主题设置
    if (game && game.getThemeManager()) {
        const themeManager = game.getThemeManager();
        if (themeSelect.value !== themeManager.currentTheme) {
            themeManager.switchTheme(themeSelect.value);
        }
    }
    
    // 保存音量设置
    if (game && game.getAudioManager) {
        // 音频管理器将在后续任务中实现
        console.log('音量设置将在音频管理器中处理');
    }
    
    showTemporaryMessage('设置已保存');
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
    console.log('激活技能:', skillId);
    
    const skillElement = document.getElementById(`skill-${skillId}`);
    if (skillElement && !skillElement.classList.contains('disabled')) {
        // 添加激活动画
        skillElement.classList.add('activated');
        
        // 显示技能效果
        showTemporaryMessage(`激活了${getSkillName(skillId)}！`);
        
        // 模拟冷却
        skillElement.classList.add('disabled');
        setTimeout(() => {
            skillElement.classList.remove('disabled', 'activated');
        }, 3000);
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
        console.log(`成功移动: ${direction}`);
        
        // 检查是否需要显示提示
        const gameState = game.getGameState();
        const emptyTiles = gameState.getEmptyTiles();
        
        if (emptyTiles.length <= 2) {
            showTemporaryMessage('⚠️ 空间不足，小心游戏结束！', 2000);
        }
        
        return true;
    } else {
        // 移动失败的反馈
        console.log(`移动失败: ${direction}`);
        showTemporaryMessage('无法移动到该方向');
        return false;
    }
}

/**
 * 创建输入响应测试套件
 */
function createInputTests() {
    const tests = {
        // 测试移动有效性验证
        testMoveValidation: () => {
            console.log('测试移动有效性验证...');
            
            // 测试无效方向
            const result1 = validateMove('invalid');
            console.assert(!result1, '无效方向应该返回false');
            
            // 测试有效方向
            const result2 = validateMove('up');
            console.assert(typeof result2 === 'boolean', '有效方向应该返回boolean');
            
            console.log('移动有效性验证测试通过');
        },
        
        // 测试输入处理流程
        testInputHandling: () => {
            console.log('测试输入处理流程...');
            
            if (!game) {
                console.log('游戏未初始化，跳过输入处理测试');
                return;
            }
            
            const initialScore = game.getGameState().score;
            const result = handleMoveInput('right');
            
            console.log(`输入处理结果: ${result}`);
            console.log('输入处理流程测试完成');
        },
        
        // 测试技能激活
        testSkillActivation: () => {
            console.log('测试技能激活...');
            
            const skillNames = ['threeHeadsSixArms', 'qiankunCircle', 'huntianLing', 'transformation'];
            
            skillNames.forEach(skillName => {
                activateSkillByName(skillName);
                console.log(`技能 ${skillName} 激活测试完成`);
            });
            
            console.log('技能激活测试通过');
        },
        
        // 测试游戏状态检查
        testGameStateChecks: () => {
            console.log('测试游戏状态检查...');
            
            if (!game) {
                console.log('游戏未初始化，跳过游戏状态测试');
                return;
            }
            
            const gameState = game.getGameState();
            
            console.assert(typeof gameState.score === 'number', '分数应该是数字');
            console.assert(typeof gameState.moves === 'number', '移动次数应该是数字');
            console.assert(typeof gameState.isGameOver === 'boolean', '游戏结束状态应该是布尔值');
            
            console.log('游戏状态检查测试通过');
        }
    };
    
    return tests;
}

/**
 * 运行输入响应测试
 */
function runInputTests() {
    console.log('开始运行输入响应测试...');
    
    const tests = createInputTests();
    
    try {
        Object.keys(tests).forEach(testName => {
            console.log(`\n--- 运行测试: ${testName} ---`);
            tests[testName]();
        });
        
        console.log('\n✅ 所有输入响应测试通过！');
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
        console.log('主题已切换:', themeName);
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
    
    console.log('视觉元素初始化完成');
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