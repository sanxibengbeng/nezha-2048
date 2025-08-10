/**
 * InputManager类 - 输入管理器
 * 统一处理键盘和触摸输入，支持手势识别和输入防抖
 */
class InputManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // 输入状态
        this.isEnabled = true;
        this.lastInputTime = 0;
        this.inputCooldown = 100; // 输入冷却时间（毫秒）
        
        // 键盘输入相关
        this.keyboardEnabled = true;
        this.pressedKeys = new Set();
        
        // 触摸输入相关
        this.touchEnabled = true;
        this.touchStartPos = null;
        this.touchEndPos = null;
        this.minSwipeDistance = 30; // 最小滑动距离
        this.maxSwipeTime = 1000; // 最大滑动时间（毫秒）
        this.touchStartTime = 0;
        
        // 鼠标输入相关（用于桌面测试）
        this.mouseEnabled = true;
        this.mouseStartPos = null;
        this.isMouseDown = false;
        
        // 手势识别
        this.gestureThreshold = {
            minDistance: 30,
            maxTime: 1000,
            minVelocity: 0.1
        };
        
        // 事件监听器引用（用于清理）
        this.eventListeners = [];
        
        // 特殊技能输入
        this.skillInputEnabled = true;
        this.skillCombinations = {
            'KeyQ': 'threeHeadsSixArms',
            'KeyW': 'qiankunCircle', 
            'KeyE': 'huntianLing',
            'KeyR': 'transformation'
        };
        
        // 三头六臂多方向操作模式
        this.multiDirectionMode = false;
        this.multiDirectionBuffer = [];
        this.multiDirectionTimeout = null;
        this.multiDirectionDelay = 200; // 多方向操作的延迟时间（毫秒）
        this.maxSimultaneousDirections = 3; // 最大同时方向数
        
        console.log('InputManager 初始化完成');
    }

    /**
     * 初始化输入管理器
     */
    init() {
        this.bindKeyboardEvents();
        this.bindTouchEvents();
        this.bindMouseEvents();
        
        // 检测设备类型
        this.detectDeviceType();
        
        console.log('InputManager 事件绑定完成');
    }

    /**
     * 检测设备类型
     */
    detectDeviceType() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isMobile || hasTouch) {
            console.log('检测到移动设备，启用触摸控制');
            this.showMobileInstructions();
        } else {
            console.log('检测到桌面设备，启用键盘控制');
            this.hideMobileInstructions();
        }
    }

    /**
     * 显示移动设备操作提示
     */
    showMobileInstructions() {
        const instructions = document.querySelector('.mobile-instructions');
        if (instructions) {
            instructions.style.display = 'block';
        }
    }

    /**
     * 隐藏移动设备操作提示
     */
    hideMobileInstructions() {
        const instructions = document.querySelector('.mobile-instructions');
        if (instructions) {
            instructions.style.display = 'none';
        }
    }

    /**
     * 绑定键盘事件
     */
    bindKeyboardEvents() {
        const keydownHandler = (event) => this.handleKeyDown(event);
        const keyupHandler = (event) => this.handleKeyUp(event);
        
        document.addEventListener('keydown', keydownHandler);
        document.addEventListener('keyup', keyupHandler);
        
        this.eventListeners.push(
            { element: document, event: 'keydown', handler: keydownHandler },
            { element: document, event: 'keyup', handler: keyupHandler }
        );
    }

    /**
     * 绑定触摸事件
     */
    bindTouchEvents() {
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        
        const touchStartHandler = (event) => this.handleTouchStart(event);
        const touchMoveHandler = (event) => this.handleTouchMove(event);
        const touchEndHandler = (event) => this.handleTouchEnd(event);
        
        gameArea.addEventListener('touchstart', touchStartHandler, { passive: false });
        gameArea.addEventListener('touchmove', touchMoveHandler, { passive: false });
        gameArea.addEventListener('touchend', touchEndHandler, { passive: false });
        
        this.eventListeners.push(
            { element: gameArea, event: 'touchstart', handler: touchStartHandler },
            { element: gameArea, event: 'touchmove', handler: touchMoveHandler },
            { element: gameArea, event: 'touchend', handler: touchEndHandler }
        );
    }

    /**
     * 绑定鼠标事件（用于桌面测试滑动）
     */
    bindMouseEvents() {
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        
        const mouseDownHandler = (event) => this.handleMouseDown(event);
        const mouseMoveHandler = (event) => this.handleMouseMove(event);
        const mouseUpHandler = (event) => this.handleMouseUp(event);
        
        gameArea.addEventListener('mousedown', mouseDownHandler);
        gameArea.addEventListener('mousemove', mouseMoveHandler);
        gameArea.addEventListener('mouseup', mouseUpHandler);
        
        this.eventListeners.push(
            { element: gameArea, event: 'mousedown', handler: mouseDownHandler },
            { element: gameArea, event: 'mousemove', handler: mouseMoveHandler },
            { element: gameArea, event: 'mouseup', handler: mouseUpHandler }
        );
    }

    /**
     * 处理键盘按下事件
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyDown(event) {
        if (!this.isEnabled || !this.keyboardEnabled) return;
        
        // 防止重复触发
        if (this.pressedKeys.has(event.code)) return;
        this.pressedKeys.add(event.code);
        
        // 处理方向键
        const directionKeys = {
            'ArrowUp': 'up',
            'ArrowDown': 'down', 
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'KeyW': 'up',
            'KeyS': 'down',
            'KeyA': 'left',
            'KeyD': 'right'
        };
        
        if (directionKeys[event.code]) {
            event.preventDefault();
            this.processDirectionInput(directionKeys[event.code]);
            return;
        }
        
        // 处理技能快捷键
        if (this.skillInputEnabled && this.skillCombinations[event.code]) {
            event.preventDefault();
            this.processSkillInput(this.skillCombinations[event.code]);
            return;
        }
        
        // 处理其他快捷键
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.processPauseInput();
                break;
            case 'KeyN':
                event.preventDefault();
                this.processNewGameInput();
                break;
            case 'Escape':
                event.preventDefault();
                this.processEscapeInput();
                break;
        }
    }

    /**
     * 处理键盘释放事件
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyUp(event) {
        this.pressedKeys.delete(event.code);
    }

    /**
     * 处理触摸开始事件
     * @param {TouchEvent} event - 触摸事件
     */
    handleTouchStart(event) {
        if (!this.isEnabled || !this.touchEnabled) return;
        
        event.preventDefault();
        
        const touch = event.touches[0];
        this.touchStartPos = {
            x: touch.clientX,
            y: touch.clientY
        };
        this.touchStartTime = Date.now();
    }

    /**
     * 处理触摸移动事件
     * @param {TouchEvent} event - 触摸事件
     */
    handleTouchMove(event) {
        if (!this.isEnabled || !this.touchEnabled || !this.touchStartPos) return;
        
        event.preventDefault();
    }

    /**
     * 处理触摸结束事件
     * @param {TouchEvent} event - 触摸事件
     */
    handleTouchEnd(event) {
        if (!this.isEnabled || !this.touchEnabled || !this.touchStartPos) return;
        
        event.preventDefault();
        
        const touch = event.changedTouches[0];
        this.touchEndPos = {
            x: touch.clientX,
            y: touch.clientY
        };
        
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - this.touchStartTime;
        
        // 检查是否是有效的滑动手势
        if (touchDuration <= this.maxSwipeTime) {
            const direction = this.detectSwipeDirection();
            if (direction) {
                this.processDirectionInput(direction);
            }
        }
        
        // 重置触摸状态
        this.touchStartPos = null;
        this.touchEndPos = null;
    }

    /**
     * 处理鼠标按下事件
     * @param {MouseEvent} event - 鼠标事件
     */
    handleMouseDown(event) {
        if (!this.isEnabled || !this.mouseEnabled) return;
        
        this.isMouseDown = true;
        this.mouseStartPos = {
            x: event.clientX,
            y: event.clientY
        };
    }

    /**
     * 处理鼠标移动事件
     * @param {MouseEvent} event - 鼠标事件
     */
    handleMouseMove(event) {
        // 鼠标移动时不做处理，等待鼠标释放
    }

    /**
     * 处理鼠标释放事件
     * @param {MouseEvent} event - 鼠标事件
     */
    handleMouseUp(event) {
        if (!this.isEnabled || !this.mouseEnabled || !this.isMouseDown || !this.mouseStartPos) return;
        
        const mouseEndPos = {
            x: event.clientX,
            y: event.clientY
        };
        
        const direction = this.detectMouseSwipeDirection(this.mouseStartPos, mouseEndPos);
        if (direction) {
            this.processDirectionInput(direction);
        }
        
        // 重置鼠标状态
        this.isMouseDown = false;
        this.mouseStartPos = null;
    }

    /**
     * 检测滑动方向
     * @returns {string|null} 滑动方向或null
     */
    detectSwipeDirection() {
        if (!this.touchStartPos || !this.touchEndPos) return null;
        
        const deltaX = this.touchEndPos.x - this.touchStartPos.x;
        const deltaY = this.touchEndPos.y - this.touchStartPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 检查滑动距离是否足够
        if (distance < this.minSwipeDistance) return null;
        
        // 确定主要方向
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        if (absDeltaX > absDeltaY) {
            // 水平滑动
            return deltaX > 0 ? 'right' : 'left';
        } else {
            // 垂直滑动
            return deltaY > 0 ? 'down' : 'up';
        }
    }

    /**
     * 检测鼠标滑动方向
     * @param {Object} startPos - 开始位置
     * @param {Object} endPos - 结束位置
     * @returns {string|null} 滑动方向或null
     */
    detectMouseSwipeDirection(startPos, endPos) {
        const deltaX = endPos.x - startPos.x;
        const deltaY = endPos.y - startPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 检查滑动距离是否足够
        if (distance < this.minSwipeDistance) return null;
        
        // 确定主要方向
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        if (absDeltaX > absDeltaY) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }

    /**
     * 处理方向输入
     * @param {string} direction - 方向
     */
    processDirectionInput(direction) {
        if (!this.canProcessInput()) return;
        
        console.log('输入方向:', direction);
        
        if (this.multiDirectionMode) {
            // 三头六臂模式：支持多方向操作
            this.processMultiDirectionInput(direction);
        } else {
            // 普通模式：单方向操作
            this.processSingleDirectionInput(direction);
        }
    }

    /**
     * 处理单方向输入
     * @param {string} direction - 方向
     */
    processSingleDirectionInput(direction) {
        if (this.gameEngine) {
            this.gameEngine.emit('directionInput', { direction });
            this.lastInputTime = Date.now();
        }
    }

    /**
     * 处理多方向输入（三头六臂模式）
     * @param {string} direction - 方向
     */
    processMultiDirectionInput(direction) {
        // 检查是否已经在缓冲区中
        if (this.multiDirectionBuffer.includes(direction)) {
            return;
        }
        
        // 添加到缓冲区
        this.multiDirectionBuffer.push(direction);
        
        // 限制最大同时方向数
        if (this.multiDirectionBuffer.length > this.maxSimultaneousDirections) {
            this.multiDirectionBuffer.shift(); // 移除最早的方向
        }
        
        console.log('🔥 多方向输入缓冲:', this.multiDirectionBuffer);
        
        // 清除之前的超时
        if (this.multiDirectionTimeout) {
            clearTimeout(this.multiDirectionTimeout);
        }
        
        // 设置延迟执行，允许收集更多方向
        this.multiDirectionTimeout = setTimeout(() => {
            this.executeMultiDirectionMoves();
        }, this.multiDirectionDelay);
        
        // 更新多方向指示器
        this.updateMultiDirectionIndicator();
    }

    /**
     * 执行多方向移动
     */
    executeMultiDirectionMoves() {
        if (this.multiDirectionBuffer.length === 0) return;
        
        console.log('🔥 执行多方向移动:', this.multiDirectionBuffer);
        
        if (this.gameEngine) {
            // 发送多方向输入事件
            this.gameEngine.emit('multiDirectionInput', { 
                directions: [...this.multiDirectionBuffer],
                isThreeHeadsSixArms: true
            });
            
            this.lastInputTime = Date.now();
        }
        
        // 清除缓冲区
        this.clearMultiDirectionBuffer();
        this.updateMultiDirectionIndicator();
    }

    /**
     * 更新多方向操作指示器
     */
    updateMultiDirectionIndicator() {
        const indicator = document.getElementById('multi-direction-indicator');
        if (!indicator) return;
        
        const content = indicator.querySelector('.indicator-content');
        if (!content) return;
        
        // 显示当前缓冲的方向
        if (this.multiDirectionBuffer.length > 0) {
            const directionIcons = {
                'up': '⬆️',
                'down': '⬇️',
                'left': '⬅️',
                'right': '➡️'
            };
            
            const icons = this.multiDirectionBuffer.map(dir => directionIcons[dir] || '❓').join(' ');
            
            content.innerHTML = `
                <div class="indicator-icon">🔥</div>
                <div class="indicator-text">三头六臂模式</div>
                <div class="indicator-desc">准备执行: ${icons}</div>
            `;
            
            indicator.classList.add('charging');
        } else {
            content.innerHTML = `
                <div class="indicator-icon">🔥</div>
                <div class="indicator-text">三头六臂模式</div>
                <div class="indicator-desc">可同时多方向操作</div>
            `;
            
            indicator.classList.remove('charging');
        }
    }

    /**
     * 处理技能输入
     * @param {string} skillName - 技能名称
     */
    processSkillInput(skillName) {
        if (!this.canProcessInput()) return;
        
        console.log('激活技能:', skillName);
        
        // 触发技能激活事件
        if (this.gameEngine) {
            this.gameEngine.emit('skillInput', { skillName });
        }
        
        this.lastInputTime = Date.now();
    }

    /**
     * 处理暂停输入
     */
    processPauseInput() {
        console.log('暂停/继续游戏');
        
        if (this.gameEngine) {
            if (this.gameEngine.isPaused) {
                this.gameEngine.resume();
            } else {
                this.gameEngine.pause();
            }
        }
    }

    /**
     * 处理新游戏输入
     */
    processNewGameInput() {
        console.log('开始新游戏');
        
        if (this.gameEngine) {
            this.gameEngine.emit('newGameInput');
        }
    }

    /**
     * 处理ESC键输入
     */
    processEscapeInput() {
        console.log('ESC键按下');
        
        if (this.gameEngine) {
            this.gameEngine.emit('escapeInput');
        }
    }

    /**
     * 检查是否可以处理输入
     * @returns {boolean} 是否可以处理
     */
    canProcessInput() {
        const now = Date.now();
        return this.isEnabled && (now - this.lastInputTime) >= this.inputCooldown;
    }

    /**
     * 启用输入
     */
    enable() {
        this.isEnabled = true;
        console.log('输入已启用');
    }

    /**
     * 禁用输入
     */
    disable() {
        this.isEnabled = false;
        console.log('输入已禁用');
    }

    /**
     * 设置输入冷却时间
     * @param {number} cooldown - 冷却时间（毫秒）
     */
    setInputCooldown(cooldown) {
        this.inputCooldown = Math.max(0, cooldown);
    }

    /**
     * 启用/禁用键盘输入
     * @param {boolean} enabled - 是否启用
     */
    setKeyboardEnabled(enabled) {
        this.keyboardEnabled = enabled;
        console.log('键盘输入', enabled ? '已启用' : '已禁用');
    }

    /**
     * 启用/禁用触摸输入
     * @param {boolean} enabled - 是否启用
     */
    setTouchEnabled(enabled) {
        this.touchEnabled = enabled;
        console.log('触摸输入', enabled ? '已启用' : '已禁用');
    }

    /**
     * 启用/禁用技能输入
     * @param {boolean} enabled - 是否启用
     */
    setSkillInputEnabled(enabled) {
        this.skillInputEnabled = enabled;
        console.log('技能输入', enabled ? '已启用' : '已禁用');
    }

    /**
     * 设置滑动手势参数
     * @param {Object} params - 参数对象
     */
    setGestureParams(params) {
        if (params.minDistance !== undefined) {
            this.minSwipeDistance = params.minDistance;
        }
        if (params.maxTime !== undefined) {
            this.maxSwipeTime = params.maxTime;
        }
        
        console.log('手势参数已更新:', params);
    }

    /**
     * 启用/禁用多方向操作模式（三头六臂技能）
     * @param {boolean} enabled - 是否启用
     */
    enableMultiDirectionMode(enabled) {
        this.multiDirectionMode = enabled;
        
        if (enabled) {
            console.log('🔥 三头六臂模式已激活 - 支持多方向同时操作');
            this.showMultiDirectionIndicator();
        } else {
            console.log('三头六臂模式已关闭');
            this.hideMultiDirectionIndicator();
            this.clearMultiDirectionBuffer();
        }
    }

    /**
     * 显示多方向操作指示器
     */
    showMultiDirectionIndicator() {
        // 创建或显示多方向操作提示
        let indicator = document.getElementById('multi-direction-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'multi-direction-indicator';
            indicator.className = 'multi-direction-indicator';
            indicator.innerHTML = `
                <div class="indicator-content">
                    <div class="indicator-icon">🔥</div>
                    <div class="indicator-text">三头六臂模式</div>
                    <div class="indicator-desc">可同时多方向操作</div>
                </div>
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.classList.add('active');
        
        // 添加脉冲动画
        indicator.classList.add('pulse-animation');
    }

    /**
     * 隐藏多方向操作指示器
     */
    hideMultiDirectionIndicator() {
        const indicator = document.getElementById('multi-direction-indicator');
        if (indicator) {
            indicator.classList.remove('active', 'pulse-animation');
        }
    }

    /**
     * 清除多方向操作缓冲区
     */
    clearMultiDirectionBuffer() {
        this.multiDirectionBuffer = [];
        
        if (this.multiDirectionTimeout) {
            clearTimeout(this.multiDirectionTimeout);
            this.multiDirectionTimeout = null;
        }
    }

    /**
     * 获取输入统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        return {
            isEnabled: this.isEnabled,
            keyboardEnabled: this.keyboardEnabled,
            touchEnabled: this.touchEnabled,
            skillInputEnabled: this.skillInputEnabled,
            inputCooldown: this.inputCooldown,
            lastInputTime: this.lastInputTime,
            pressedKeysCount: this.pressedKeys.size
        };
    }

    /**
     * 销毁输入管理器
     */
    destroy() {
        // 移除所有事件监听器
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        
        this.eventListeners = [];
        this.pressedKeys.clear();
        
        // 清理多方向模式资源
        this.clearMultiDirectionBuffer();
        this.hideMultiDirectionIndicator();
        
        // 移除多方向指示器元素
        const indicator = document.getElementById('multi-direction-indicator');
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
        
        console.log('InputManager 已销毁');
    }
}