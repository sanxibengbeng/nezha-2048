/**
 * Jest测试环境设置
 * 配置全局测试环境和模拟对象
 */

// 模拟DOM环境
global.document = {
    getElementById: jest.fn(() => null),
    createElement: jest.fn(() => ({
        getContext: jest.fn(() => ({
            clearRect: jest.fn(),
            fillRect: jest.fn(),
            fillText: jest.fn(),
            createLinearGradient: jest.fn(() => ({
                addColorStop: jest.fn()
            })),
            save: jest.fn(),
            restore: jest.fn(),
            translate: jest.fn(),
            scale: jest.fn(),
            rotate: jest.fn(),
            beginPath: jest.fn(),
            closePath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn(),
            stroke: jest.fn(),
            measureText: jest.fn(() => ({ width: 100 })),
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
            textAlign: 'center',
            textBaseline: 'middle',
            fillStyle: '#000000',
            strokeStyle: '#000000',
            lineWidth: 1,
            font: '16px Arial'
        })),
        width: 400,
        height: 400,
        style: {},
        parentElement: {
            clientWidth: 400,
            clientHeight: 400
        }
    })),
    addEventListener: jest.fn()
};

global.window = {
    devicePixelRatio: 1,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

// 模拟Canvas API
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn()
    })),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    textAlign: 'center',
    textBaseline: 'middle',
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '16px Arial'
}));

// 模拟requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// 模拟performance API
global.performance = {
    now: jest.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 1024 * 1024,
        totalJSHeapSize: 2048 * 1024,
        jsHeapSizeLimit: 4096 * 1024
    }
};

// 模拟console方法以避免测试输出过多
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
};

// 模拟调试函数
global.debugLog = jest.fn();
global.engineDebugLog = jest.fn();

// 模拟localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
};
global.localStorage = localStorageMock;

// 模拟sessionStorage
global.sessionStorage = localStorageMock;

// 模拟Web Audio API
global.AudioContext = jest.fn(() => ({
    createOscillator: jest.fn(() => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { value: 440 }
    })),
    createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: { value: 1 }
    })),
    destination: {},
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    suspend: jest.fn(),
    resume: jest.fn(),
    close: jest.fn()
}));

// 模拟Audio元素
global.Audio = jest.fn(() => ({
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    load: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    volume: 1,
    currentTime: 0,
    duration: 100,
    paused: true,
    ended: false,
    readyState: 4
}));

// 模拟DOM事件
global.Event = class Event {
    constructor(type, options = {}) {
        this.type = type;
        this.bubbles = options.bubbles || false;
        this.cancelable = options.cancelable || false;
        this.defaultPrevented = false;
    }
    
    preventDefault() {
        this.defaultPrevented = true;
    }
    
    stopPropagation() {
        // Mock implementation
    }
};

global.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
        super(type, options);
        this.detail = options.detail;
    }
};

// 模拟触摸事件
global.TouchEvent = class TouchEvent extends Event {
    constructor(type, options = {}) {
        super(type, options);
        this.touches = options.touches || [];
        this.changedTouches = options.changedTouches || [];
        this.targetTouches = options.targetTouches || [];
    }
};

// 模拟键盘事件
global.KeyboardEvent = class KeyboardEvent extends Event {
    constructor(type, options = {}) {
        super(type, options);
        this.key = options.key || '';
        this.code = options.code || '';
        this.keyCode = options.keyCode || 0;
        this.which = options.which || 0;
        this.ctrlKey = options.ctrlKey || false;
        this.shiftKey = options.shiftKey || false;
        this.altKey = options.altKey || false;
        this.metaKey = options.metaKey || false;
    }
};

// 设置默认的document和window属性
Object.defineProperty(document, 'hidden', {
    writable: true,
    value: false
});

Object.defineProperty(document, 'visibilityState', {
    writable: true,
    value: 'visible'
});

// 模拟ResizeObserver
global.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
}));

// 模拟IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
}));

// 设置测试超时时间
jest.setTimeout(10000);

// 全局测试工具函数
global.createMockCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    canvas.style.width = '400px';
    canvas.style.height = '400px';
    return canvas;
};

global.createMockGameState = () => ({
    grid: Array(4).fill(null).map(() => Array(4).fill(null)),
    score: 0,
    highScore: 0,
    moves: 0,
    isGameOver: false,
    isWon: false,
    isPaused: false,
    playTime: 0,
    skillCooldowns: {},
    nezhaLevel: 1,
    consecutiveMerges: 0,
    maxConsecutiveMerges: 0,
    mergeCount: 0,
    skillUsageCount: {},
    scoreMultiplier: 1,
    
    getTile: jest.fn((x, y) => null),
    setTile: jest.fn(),
    getEmptyTiles: jest.fn(() => []),
    getAllTiles: jest.fn(() => []),
    reset: jest.fn(),
    incrementMoves: jest.fn(),
    addScore: jest.fn(),
    incrementMergeCount: jest.fn(),
    resetConsecutiveMerges: jest.fn(),
    updatePlayTime: jest.fn(),
    updateSkillCooldowns: jest.fn()
});

global.createMockTile = (x = 0, y = 0, value = 2) => ({
    x,
    y,
    value,
    id: `tile_${Date.now()}_${Math.random()}`,
    isNew: false,
    isMerged: false,
    element: null,
    
    canMergeWith: jest.fn(other => other && other.value === value && !other.isMerged),
    getMergedValue: jest.fn(() => value * 2),
    markAsNew: jest.fn(),
    markAsMerged: jest.fn(),
    resetFlags: jest.fn(),
    updatePosition: jest.fn(),
    render: jest.fn(),
    clone: jest.fn(() => createMockTile(x, y, value))
});

// 清理函数
afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
});