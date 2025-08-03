/**
 * 游戏主入口文件
 * 初始化游戏并处理基础交互
 */

// 全局游戏实例
let game = null;

/**
 * 页面加载完成后初始化游戏
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('哪吒2048游戏正在初始化...');
    
    try {
        // 初始化游戏引擎（暂时创建基础结构）
        initializeGame();
        
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
function initializeGame() {
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
    if (!game.init(canvas)) {
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
    tileElement.className = tile.getCSSClass();
    tileElement.textContent = tile.getNezhaSymbol();
    
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
    
    // 保存元素引用
    tile.element = tileElement;
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
        if (data.score > 0) {
            showTemporaryMessage(`+${data.score}分！`);
        }
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
    
    // 键盘事件（临时简单处理）
    document.addEventListener('keydown', handleKeyPress);
    
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
 * 处理键盘按键
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeyPress(event) {
    if (!game) return;
    
    // 防止默认行为
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        
        // 映射按键到移动方向
        const keyToDirection = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };
        
        const direction = keyToDirection[event.key];
        console.log('按键:', event.key, '方向:', direction);
        
        // 执行移动
        const moved = game.move(direction);
        
        if (moved) {
            // 更新分数显示
            updateScoreDisplay();
        } else {
            showTemporaryMessage('无法移动到该方向');
        }
    }
}

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