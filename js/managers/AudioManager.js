/**
 * AudioManager类 - 音频管理器
 * 管理游戏音效、背景音乐和音频设置
 */
class AudioManager {
    constructor() {
        // 音频上下文
        this.audioContext = null;
        this.masterGainNode = null;
        
        // 音频支持检测
        this.webAudioSupported = false;
        this.htmlAudioSupported = false;
        
        // 音频资源
        this.sounds = new Map();
        this.music = new Map();
        this.loadedSounds = new Set();
        this.loadedMusic = new Set();
        
        // 音量控制
        this.masterVolume = 0.7;
        this.soundVolume = 0.8;
        this.musicVolume = 0.6;
        this.isMuted = false;
        
        // 当前播放状态
        this.currentMusic = null;
        this.currentMusicSource = null;
        this.musicFadeInterval = null;
        
        // 音频池（用于重复播放的音效）
        this.audioPool = new Map();
        this.maxPoolSize = 5;
        
        // 事件监听器
        this.eventListeners = new Map();
        
        // 用户交互标志（用于自动播放限制）
        this.userInteracted = false;
        this.pendingAudio = [];
        
        // 初始化
        this.init();
        
        // 预加载哪吒主题音效
        this.loadNezhaAudioAssets();
        
        console.log('AudioManager 初始化完成');
    }

    /**
     * 初始化音频管理器
     */
    async init() {
        try {
            // 检测音频支持
            this.detectAudioSupport();
            
            // 初始化Web Audio API
            if (this.webAudioSupported) {
                await this.initWebAudio();
            }
            
            // 绑定用户交互事件
            this.bindUserInteractionEvents();
            
            // 加载音频设置
            this.loadAudioSettings();
            
            console.log('AudioManager 初始化成功');
            this.emit('initialized');
            
        } catch (error) {
            console.error('AudioManager 初始化失败:', error);
            this.emit('error', { type: 'initialization', error });
        }
    }

    /**
     * 检测音频支持
     */
    detectAudioSupport() {
        // 检测Web Audio API支持
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.webAudioSupported = true;
                console.log('Web Audio API 支持');
            }
        } catch (error) {
            console.warn('Web Audio API 不支持:', error);
        }
        
        // 检测HTML Audio支持
        try {
            const audio = new Audio();
            if (audio.canPlayType) {
                this.htmlAudioSupported = true;
                console.log('HTML Audio 支持');
            }
        } catch (error) {
            console.warn('HTML Audio 不支持:', error);
        }
        
        if (!this.webAudioSupported && !this.htmlAudioSupported) {
            console.error('没有可用的音频支持');
            this.emit('error', { type: 'noAudioSupport' });
        }
    }

    /**
     * 初始化Web Audio API
     */
    async initWebAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // 创建主音量节点
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);
            this.masterGainNode.gain.value = this.masterVolume;
            
            // 处理音频上下文状态
            if (this.audioContext.state === 'suspended') {
                console.log('音频上下文被暂停，等待用户交互');
            }
            
        } catch (error) {
            console.error('Web Audio API 初始化失败:', error);
            this.webAudioSupported = false;
        }
    }

    /**
     * 绑定用户交互事件
     */
    bindUserInteractionEvents() {
        const handleUserInteraction = () => {
            if (!this.userInteracted) {
                this.userInteracted = true;
                this.resumeAudioContext();
                this.processPendingAudio();
                
                // 移除事件监听器
                document.removeEventListener('click', handleUserInteraction);
                document.removeEventListener('keydown', handleUserInteraction);
                document.removeEventListener('touchstart', handleUserInteraction);
            }
        };
        
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);
        document.addEventListener('touchstart', handleUserInteraction);
    }

    /**
     * 恢复音频上下文
     */
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('音频上下文已恢复');
            } catch (error) {
                console.error('恢复音频上下文失败:', error);
            }
        }
    }

    /**
     * 处理待播放的音频
     */
    processPendingAudio() {
        this.pendingAudio.forEach(audioData => {
            this.playSound(audioData.name, audioData.options);
        });
        this.pendingAudio = [];
    }

    /**
     * 加载音频文件
     * @param {string} name - 音频名称
     * @param {string} url - 音频文件URL
     * @param {string} type - 音频类型 ('sound' 或 'music')
     * @returns {Promise} 加载Promise
     */
    async loadAudio(name, url, type = 'sound') {
        try {
            if (this.webAudioSupported) {
                return await this.loadAudioWebAudio(name, url, type);
            } else if (this.htmlAudioSupported) {
                return await this.loadAudioHTML(name, url, type);
            } else {
                throw new Error('没有可用的音频支持');
            }
        } catch (error) {
            console.error(`加载音频失败 ${name}:`, error);
            this.emit('loadError', { name, url, type, error });
            throw error;
        }
    }

    /**
     * 使用Web Audio API加载音频
     * @param {string} name - 音频名称
     * @param {string} url - 音频文件URL
     * @param {string} type - 音频类型
     */
    async loadAudioWebAudio(name, url, type) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        const audioData = {
            buffer: audioBuffer,
            type: type,
            url: url,
            loaded: true
        };
        
        if (type === 'sound') {
            this.sounds.set(name, audioData);
            this.loadedSounds.add(name);
        } else {
            this.music.set(name, audioData);
            this.loadedMusic.add(name);
        }
        
        console.log(`音频加载成功: ${name} (${type})`);
        this.emit('audioLoaded', { name, type });
    }

    /**
     * 使用HTML Audio加载音频
     * @param {string} name - 音频名称
     * @param {string} url - 音频文件URL
     * @param {string} type - 音频类型
     */
    async loadAudioHTML(name, url, type) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.addEventListener('canplaythrough', () => {
                const audioData = {
                    element: audio,
                    type: type,
                    url: url,
                    loaded: true
                };
                
                if (type === 'sound') {
                    this.sounds.set(name, audioData);
                    this.loadedSounds.add(name);
                } else {
                    this.music.set(name, audioData);
                    this.loadedMusic.add(name);
                }
                
                console.log(`音频加载成功: ${name} (${type})`);
                this.emit('audioLoaded', { name, type });
                resolve(audioData);
            });
            
            audio.addEventListener('error', (error) => {
                reject(error);
            });
            
            audio.src = url;
            audio.load();
        });
    }

    /**
     * 播放音效
     * @param {string} name - 音效名称
     * @param {Object} options - 播放选项
     */
    playSound(name, options = {}) {
        // 如果用户还没有交互，添加到待播放队列
        if (!this.userInteracted) {
            this.pendingAudio.push({ name, options });
            return;
        }
        
        if (this.isMuted) return;
        
        const soundData = this.sounds.get(name);
        if (!soundData || !soundData.loaded) {
            console.warn(`音效不存在或未加载: ${name}`);
            return;
        }
        
        try {
            if (this.webAudioSupported && soundData.buffer) {
                this.playSoundWebAudio(name, soundData, options);
            } else if (soundData.element) {
                this.playSoundHTML(name, soundData, options);
            }
        } catch (error) {
            console.error(`播放音效失败 ${name}:`, error);
        }
    }

    /**
     * 使用Web Audio API播放音效
     * @param {string} name - 音效名称
     * @param {Object} soundData - 音效数据
     * @param {Object} options - 播放选项
     */
    playSoundWebAudio(name, soundData, options) {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = soundData.buffer;
        source.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        // 设置音量
        const volume = (options.volume || 1) * this.soundVolume;
        gainNode.gain.value = volume;
        
        // 设置播放速率
        if (options.playbackRate) {
            source.playbackRate.value = options.playbackRate;
        }
        
        // 播放
        source.start(0);
        
        // 清理资源
        source.addEventListener('ended', () => {
            source.disconnect();
            gainNode.disconnect();
        });
    }

    /**
     * 使用HTML Audio播放音效
     * @param {string} name - 音效名称
     * @param {Object} soundData - 音效数据
     * @param {Object} options - 播放选项
     */
    playSoundHTML(name, soundData, options) {
        // 从音频池获取或创建音频元素
        let audio = this.getAudioFromPool(name);
        
        if (!audio) {
            audio = soundData.element.cloneNode();
        }
        
        // 设置音量
        const volume = (options.volume || 1) * this.soundVolume * this.masterVolume;
        audio.volume = Math.min(1, Math.max(0, volume));
        
        // 设置播放速率
        if (options.playbackRate) {
            audio.playbackRate = options.playbackRate;
        }
        
        // 播放
        audio.currentTime = 0;
        const playPromise = audio.play();
        
        if (playPromise) {
            playPromise.catch(error => {
                console.warn(`播放音效失败 ${name}:`, error);
            });
        }
        
        // 播放结束后返回池中
        audio.addEventListener('ended', () => {
            this.returnAudioToPool(name, audio);
        });
    }

    /**
     * 播放背景音乐
     * @param {string} name - 音乐名称
     * @param {Object} options - 播放选项
     */
    playMusic(name, options = {}) {
        if (this.isMuted) return;
        
        const musicData = this.music.get(name);
        if (!musicData || !musicData.loaded) {
            console.warn(`背景音乐不存在或未加载: ${name}`);
            return;
        }
        
        // 停止当前音乐
        this.stopMusic();
        
        try {
            if (this.webAudioSupported && musicData.buffer) {
                this.playMusicWebAudio(name, musicData, options);
            } else if (musicData.element) {
                this.playMusicHTML(name, musicData, options);
            }
            
            this.currentMusic = name;
        } catch (error) {
            console.error(`播放背景音乐失败 ${name}:`, error);
        }
    }

    /**
     * 使用Web Audio API播放背景音乐
     * @param {string} name - 音乐名称
     * @param {Object} musicData - 音乐数据
     * @param {Object} options - 播放选项
     */
    playMusicWebAudio(name, musicData, options) {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = musicData.buffer;
        source.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        // 设置音量
        const volume = (options.volume || 1) * this.musicVolume;
        gainNode.gain.value = volume;
        
        // 设置循环
        source.loop = options.loop !== false;
        
        // 播放
        source.start(0);
        
        this.currentMusicSource = { source, gainNode };
    }

    /**
     * 使用HTML Audio播放背景音乐
     * @param {string} name - 音乐名称
     * @param {Object} musicData - 音乐数据
     * @param {Object} options - 播放选项
     */
    playMusicHTML(name, musicData, options) {
        const audio = musicData.element;
        
        // 设置音量
        const volume = (options.volume || 1) * this.musicVolume * this.masterVolume;
        audio.volume = Math.min(1, Math.max(0, volume));
        
        // 设置循环
        audio.loop = options.loop !== false;
        
        // 播放
        audio.currentTime = 0;
        const playPromise = audio.play();
        
        if (playPromise) {
            playPromise.catch(error => {
                console.warn(`播放背景音乐失败 ${name}:`, error);
            });
        }
        
        this.currentMusicSource = { element: audio };
    }

    /**
     * 停止背景音乐
     */
    stopMusic() {
        if (this.currentMusicSource) {
            try {
                if (this.currentMusicSource.source) {
                    // Web Audio API
                    this.currentMusicSource.source.stop();
                    this.currentMusicSource.source.disconnect();
                    this.currentMusicSource.gainNode.disconnect();
                } else if (this.currentMusicSource.element) {
                    // HTML Audio
                    this.currentMusicSource.element.pause();
                    this.currentMusicSource.element.currentTime = 0;
                }
            } catch (error) {
                console.warn('停止背景音乐时出错:', error);
            }
            
            this.currentMusicSource = null;
        }
        
        this.currentMusic = null;
    }

    /**
     * 淡入淡出音乐
     * @param {string} newMusic - 新音乐名称
     * @param {number} fadeTime - 淡入淡出时间（毫秒）
     */
    fadeToMusic(newMusic, fadeTime = 1000) {
        if (this.currentMusic === newMusic) return;
        
        // 淡出当前音乐
        if (this.currentMusicSource) {
            this.fadeOutCurrentMusic(fadeTime / 2);
        }
        
        // 延迟播放新音乐
        setTimeout(() => {
            this.playMusic(newMusic);
            this.fadeInCurrentMusic(fadeTime / 2);
        }, fadeTime / 2);
    }

    /**
     * 淡出当前音乐
     * @param {number} fadeTime - 淡出时间（毫秒）
     */
    fadeOutCurrentMusic(fadeTime) {
        if (!this.currentMusicSource) return;
        
        const steps = 20;
        const stepTime = fadeTime / steps;
        let currentStep = 0;
        
        const fadeInterval = setInterval(() => {
            currentStep++;
            const volume = (1 - currentStep / steps) * this.musicVolume;
            
            if (this.currentMusicSource.gainNode) {
                this.currentMusicSource.gainNode.gain.value = volume;
            } else if (this.currentMusicSource.element) {
                this.currentMusicSource.element.volume = volume * this.masterVolume;
            }
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                this.stopMusic();
            }
        }, stepTime);
    }

    /**
     * 淡入当前音乐
     * @param {number} fadeTime - 淡入时间（毫秒）
     */
    fadeInCurrentMusic(fadeTime) {
        if (!this.currentMusicSource) return;
        
        const steps = 20;
        const stepTime = fadeTime / steps;
        let currentStep = 0;
        
        // 从0音量开始
        if (this.currentMusicSource.gainNode) {
            this.currentMusicSource.gainNode.gain.value = 0;
        } else if (this.currentMusicSource.element) {
            this.currentMusicSource.element.volume = 0;
        }
        
        const fadeInterval = setInterval(() => {
            currentStep++;
            const volume = (currentStep / steps) * this.musicVolume;
            
            if (this.currentMusicSource.gainNode) {
                this.currentMusicSource.gainNode.gain.value = volume;
            } else if (this.currentMusicSource.element) {
                this.currentMusicSource.element.volume = volume * this.masterVolume;
            }
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
            }
        }, stepTime);
    }

    /**
     * 从音频池获取音频元素
     * @param {string} name - 音频名称
     * @returns {HTMLAudioElement|null} 音频元素
     */
    getAudioFromPool(name) {
        const pool = this.audioPool.get(name);
        if (pool && pool.length > 0) {
            return pool.pop();
        }
        return null;
    }

    /**
     * 将音频元素返回池中
     * @param {string} name - 音频名称
     * @param {HTMLAudioElement} audio - 音频元素
     */
    returnAudioToPool(name, audio) {
        if (!this.audioPool.has(name)) {
            this.audioPool.set(name, []);
        }
        
        const pool = this.audioPool.get(name);
        if (pool.length < this.maxPoolSize) {
            pool.push(audio);
        }
    }

    /**
     * 设置主音量
     * @param {number} volume - 音量 (0-1)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.min(1, Math.max(0, volume));
        
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.masterVolume;
        }
        
        // 更新HTML Audio元素的音量
        this.updateHTMLAudioVolumes();
        
        this.saveAudioSettings();
        this.emit('volumeChanged', { type: 'master', volume: this.masterVolume });
    }

    /**
     * 设置音效音量
     * @param {number} volume - 音量 (0-1)
     */
    setSoundVolume(volume) {
        this.soundVolume = Math.min(1, Math.max(0, volume));
        this.saveAudioSettings();
        this.emit('volumeChanged', { type: 'sound', volume: this.soundVolume });
    }

    /**
     * 设置音乐音量
     * @param {number} volume - 音量 (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.min(1, Math.max(0, volume));
        
        // 更新当前播放的音乐音量
        if (this.currentMusicSource) {
            if (this.currentMusicSource.gainNode) {
                this.currentMusicSource.gainNode.gain.value = this.musicVolume;
            } else if (this.currentMusicSource.element) {
                this.currentMusicSource.element.volume = this.musicVolume * this.masterVolume;
            }
        }
        
        this.saveAudioSettings();
        this.emit('volumeChanged', { type: 'music', volume: this.musicVolume });
    }

    /**
     * 更新HTML Audio元素的音量
     */
    updateHTMLAudioVolumes() {
        // 更新当前播放的音乐
        if (this.currentMusicSource && this.currentMusicSource.element) {
            this.currentMusicSource.element.volume = this.musicVolume * this.masterVolume;
        }
    }

    /**
     * 静音/取消静音
     * @param {boolean} muted - 是否静音
     */
    setMuted(muted) {
        this.isMuted = muted;
        
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = muted ? 0 : this.masterVolume;
        }
        
        // 更新HTML Audio元素
        if (this.currentMusicSource && this.currentMusicSource.element) {
            this.currentMusicSource.element.muted = muted;
        }
        
        this.saveAudioSettings();
        this.emit('muteChanged', { muted: this.isMuted });
    }

    /**
     * 切换静音状态
     */
    toggleMute() {
        this.setMuted(!this.isMuted);
    }

    /**
     * 保存音频设置
     */
    saveAudioSettings() {
        const settings = {
            masterVolume: this.masterVolume,
            soundVolume: this.soundVolume,
            musicVolume: this.musicVolume,
            isMuted: this.isMuted
        };
        
        try {
            localStorage.setItem('nezha2048_audio_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('保存音频设置失败:', error);
        }
    }

    /**
     * 加载音频设置
     */
    loadAudioSettings() {
        try {
            const saved = localStorage.getItem('nezha2048_audio_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                this.masterVolume = settings.masterVolume || 0.7;
                this.soundVolume = settings.soundVolume || 0.8;
                this.musicVolume = settings.musicVolume || 0.6;
                this.isMuted = settings.isMuted || false;
                
                // 应用设置
                if (this.masterGainNode) {
                    this.masterGainNode.gain.value = this.isMuted ? 0 : this.masterVolume;
                }
            }
        } catch (error) {
            console.warn('加载音频设置失败:', error);
        }
    }

    /**
     * 获取音频信息
     * @returns {Object} 音频信息
     */
    getAudioInfo() {
        return {
            webAudioSupported: this.webAudioSupported,
            htmlAudioSupported: this.htmlAudioSupported,
            userInteracted: this.userInteracted,
            audioContextState: this.audioContext ? this.audioContext.state : null,
            loadedSounds: Array.from(this.loadedSounds),
            loadedMusic: Array.from(this.loadedMusic),
            currentMusic: this.currentMusic,
            volumes: {
                master: this.masterVolume,
                sound: this.soundVolume,
                music: this.musicVolume
            },
            isMuted: this.isMuted
        };
    }

    /**
     * 添加事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
    emit(event, data = null) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`AudioManager事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 加载哪吒主题音频资源
     */
    async loadNezhaAudioAssets() {
        console.log('开始加载哪吒主题音频资源...');
        
        // 定义音频资源映射
        const audioAssets = {
            // 音效
            sounds: {
                'move': this.generateMoveSound(),
                'merge': this.generateMergeSound(),
                'newTile': this.generateNewTileSound(),
                'skillReady': this.generateSkillReadySound(),
                'threeHeads': this.generateThreeHeadsSound(),
                'qiankunCircle': this.generateQiankunCircleSound(),
                'huntianLing': this.generateHuntianLingSound(),
                'transformation': this.generateTransformationSound(),
                'gameOver': this.generateGameOverSound(),
                'victory': this.generateVictorySound(),
                'buttonClick': this.generateButtonClickSound(),
                'error': this.generateErrorSound()
            },
            // 背景音乐
            music: {
                'background': this.generateBackgroundMusic(),
                'transformation': this.generateTransformationMusic(),
                'victory': this.generateVictoryMusic()
            }
        };
        
        // 加载音效
        for (const [name, audioBuffer] of Object.entries(audioAssets.sounds)) {
            try {
                await this.loadGeneratedAudio(name, audioBuffer, 'sound');
            } catch (error) {
                console.warn(`加载音效失败 ${name}:`, error);
            }
        }
        
        // 加载背景音乐
        for (const [name, audioBuffer] of Object.entries(audioAssets.music)) {
            try {
                await this.loadGeneratedAudio(name, audioBuffer, 'music');
            } catch (error) {
                console.warn(`加载背景音乐失败 ${name}:`, error);
            }
        }
        
        console.log('哪吒主题音频资源加载完成');
        this.emit('nezhaAudioLoaded');
    }

    /**
     * 加载生成的音频数据
     * @param {string} name - 音频名称
     * @param {AudioBuffer} audioBuffer - 音频缓冲区
     * @param {string} type - 音频类型
     */
    async loadGeneratedAudio(name, audioBuffer, type) {
        const audioData = {
            buffer: audioBuffer,
            type: type,
            url: 'generated',
            loaded: true
        };
        
        if (type === 'sound') {
            this.sounds.set(name, audioData);
            this.loadedSounds.add(name);
        } else {
            this.music.set(name, audioData);
            this.loadedMusic.add(name);
        }
        
        console.log(`生成音频加载成功: ${name} (${type})`);
        this.emit('audioLoaded', { name, type });
    }

    /**
     * 生成移动音效
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateMoveSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成短促的滑动音效
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 200 + Math.sin(t * 50) * 50;
            const envelope = Math.exp(-t * 10);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.1;
        }
        
        return buffer;
    }

    /**
     * 生成合并音效
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateMergeSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成上升音调的合并音效
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 300 + t * 200;
            const envelope = Math.exp(-t * 3) * (1 - t / duration);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.2;
        }
        
        return buffer;
    }

    /**
     * 生成新方块音效
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateNewTileSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.15;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成清脆的出现音效
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 800;
            const envelope = Math.exp(-t * 8);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.15;
        }
        
        return buffer;
    }

    /**
     * 生成技能准备音效
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateSkillReadySound() {
        if (!this.audioContext) return null;
        
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成神秘的技能准备音效
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 400 + Math.sin(t * 10) * 100;
            const envelope = Math.sin(t * Math.PI / duration) * 0.8;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.2;
        }
        
        return buffer;
    }

    /**
     * 生成三头六臂技能音效
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateThreeHeadsSound() {
        if (!this.audioContext) return null;
        
        const duration = 1.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成威武的三头六臂音效
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 150 + Math.sin(t * 5) * 50;
            const envelope = Math.exp(-t * 2) * Math.sin(t * Math.PI / duration);
            const noise = (Math.random() - 0.5) * 0.1;
            data[i] = (Math.sin(2 * Math.PI * frequency * t) + noise) * envelope * 0.3;
        }
        
        return buffer;
    }

    /**
     * 生成乾坤圈技能音效
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateQiankunCircleSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.8;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成旋转的乾坤圈音效
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 300 + Math.sin(t * 20) * 150;
            const envelope = Math.sin(t * Math.PI / duration) * 0.9;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.25;
        }
        
        return buffer;
    }

    /**
     * 生成混天绫技能音效
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateHuntianLingSound() {
        if (!this.audioContext) return null;
        
        const duration = 1.2;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成飘逸的混天绫音效
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 250 + Math.sin(t * 8) * 100 + Math.sin(t * 3) * 50;
            const envelope = Math.sin(t * Math.PI / duration) * Math.exp(-t * 0.5);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.2;
        }
        
        return buffer;
    }

    /**
     * 生成哪吒变身技能音效
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateTransformationSound() {
        if (!this.audioContext) return null;
        
        const duration = 2.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成震撼的变身音效
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 100 + t * 300 + Math.sin(t * 15) * 100;
            const envelope = Math.sin(t * Math.PI / duration) * (1 + Math.sin(t * 10) * 0.3);
            const harmonics = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
            data[i] = (Math.sin(2 * Math.PI * frequency * t) + harmonics) * envelope * 0.4;
        }
        
        return buffer;
    }

    /**
     * 生成游戏结束音效
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateGameOverSound() {
        if (!this.audioContext) return null;
        
        const duration = 1.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成悲伤的游戏结束音效
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 200 - t * 100;
            const envelope = Math.exp(-t * 2) * Math.sin(t * Math.PI / duration);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
        }
        
        return buffer;
    }

    /**
     * 生成胜利音效
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateVictorySound() {
        if (!this.audioContext) return null;
        
        const duration = 2.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成欢快的胜利音效
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 400 + Math.sin(t * 8) * 200;
            const envelope = Math.sin(t * Math.PI / duration) * 0.8;
            const harmony = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.3;
            data[i] = (Math.sin(2 * Math.PI * frequency * t) + harmony) * envelope * 0.3;
        }
        
        return buffer;
    }

    /**
     * 生成按钮点击音效
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateButtonClickSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成清脆的点击音效
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 1000;
            const envelope = Math.exp(-t * 20);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.1;
        }
        
        return buffer;
    }

    /**
     * 生成错误音效
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateErrorSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成警告的错误音效
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 150 + Math.sin(t * 30) * 50;
            const envelope = Math.exp(-t * 5);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.2;
        }
        
        return buffer;
    }

    /**
     * 生成背景音乐
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateBackgroundMusic() {
        if (!this.audioContext) return null;
        
        const duration = 30.0; // 30秒循环
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成古风背景音乐
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            
            // 主旋律
            const melody = Math.sin(2 * Math.PI * (200 + Math.sin(t * 0.5) * 50) * t);
            
            // 和声
            const harmony = Math.sin(2 * Math.PI * (150 + Math.sin(t * 0.3) * 30) * t) * 0.5;
            
            // 节拍
            const beat = Math.sin(2 * Math.PI * 100 * t) * Math.sin(t * 2) * 0.3;
            
            // 包络
            const envelope = 0.1 + Math.sin(t * 0.1) * 0.05;
            
            data[i] = (melody + harmony + beat) * envelope;
        }
        
        return buffer;
    }

    /**
     * 生成变身背景音乐
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateTransformationMusic() {
        if (!this.audioContext) return null;
        
        const duration = 15.0; // 15秒变身音乐
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成激昂的变身音乐
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            
            // 主旋律 - 更加激昂
            const melody = Math.sin(2 * Math.PI * (300 + Math.sin(t * 2) * 100) * t);
            
            // 和声
            const harmony = Math.sin(2 * Math.PI * (200 + Math.sin(t * 1.5) * 80) * t) * 0.6;
            
            // 低音
            const bass = Math.sin(2 * Math.PI * (80 + Math.sin(t * 0.8) * 20) * t) * 0.4;
            
            // 包络 - 逐渐增强
            const envelope = 0.15 + (t / duration) * 0.1 + Math.sin(t * 3) * 0.05;
            
            data[i] = (melody + harmony + bass) * envelope;
        }
        
        return buffer;
    }

    /**
     * 生成胜利背景音乐
     * @returns {AudioBuffer} 音频缓冲区
     */
    generateVictoryMusic() {
        if (!this.audioContext) return null;
        
        const duration = 10.0; // 10秒胜利音乐
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成欢快的胜利音乐
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            
            // 主旋律 - 欢快上扬
            const melody = Math.sin(2 * Math.PI * (400 + Math.sin(t * 4) * 150) * t);
            
            // 和声
            const harmony = Math.sin(2 * Math.PI * (300 + Math.sin(t * 3) * 100) * t) * 0.5;
            
            // 装饰音
            const decoration = Math.sin(2 * Math.PI * (600 + Math.sin(t * 8) * 200) * t) * 0.3;
            
            // 包络
            const envelope = 0.2 * Math.sin(t * Math.PI / duration);
            
            data[i] = (melody + harmony + decoration) * envelope;
        }
        
        return buffer;
    }

    /**
     * 播放游戏相关音效的便捷方法
     */
    playMoveSound() {
        this.playSound('move', { volume: 0.5 });
    }

    playMergeSound() {
        this.playSound('merge', { volume: 0.7 });
    }

    playNewTileSound() {
        this.playSound('newTile', { volume: 0.6 });
    }

    playSkillReadySound() {
        this.playSound('skillReady', { volume: 0.8 });
    }

    playThreeHeadsSound() {
        this.playSound('threeHeads', { volume: 0.9 });
    }

    playQiankunCircleSound() {
        this.playSound('qiankunCircle', { volume: 0.8 });
    }

    playHuntianLingSound() {
        this.playSound('huntianLing', { volume: 0.8 });
    }

    playTransformationSound() {
        this.playSound('transformation', { volume: 1.0 });
    }

    playGameOverSound() {
        this.playSound('gameOver', { volume: 0.8 });
    }

    playVictorySound() {
        this.playSound('victory', { volume: 0.9 });
    }

    playButtonClickSound() {
        this.playSound('buttonClick', { volume: 0.4 });
    }

    playErrorSound() {
        this.playSound('error', { volume: 0.6 });
    }

    /**
     * 播放背景音乐的便捷方法
     */
    playBackgroundMusic() {
        this.playMusic('background', { loop: true, volume: 0.3 });
    }

    playTransformationMusic() {
        this.playMusic('transformation', { loop: false, volume: 0.5 });
    }

    playVictoryMusic() {
        this.playMusic('victory', { loop: false, volume: 0.6 });
    }

    /**
     * 播放连击音效（根据连击数调整音调）
     * @param {number} comboCount - 连击数
     */
    playComboSound(comboCount) {
        const playbackRate = 1 + (comboCount - 1) * 0.1; // 连击越多音调越高
        const volume = Math.min(1, 0.5 + comboCount * 0.1); // 连击越多音量越大
        this.playSound('merge', { volume, playbackRate });
    }

    /**
     * 播放分数增加音效（根据分数调整音调）
     * @param {number} score - 获得的分数
     */
    playScoreSound(score) {
        const playbackRate = 1 + Math.min(score / 1000, 0.5); // 分数越高音调越高
        const volume = Math.min(1, 0.3 + score / 2000); // 分数越高音量越大
        this.playSound('newTile', { volume, playbackRate });
    }

    /**
     * 播放技能冷却完成音效
     */
    playSkillCooldownCompleteSound() {
        this.playSound('skillReady', { volume: 0.6, playbackRate: 1.2 });
    }

    /**
     * 播放新纪录音效
     */
    playNewRecordSound() {
        this.playSound('victory', { volume: 0.8, playbackRate: 1.1 });
    }

    /**
     * 播放方块升级音效（根据方块值调整）
     * @param {number} tileValue - 方块值
     */
    playTileUpgradeSound(tileValue) {
        const playbackRate = 1 + Math.log2(tileValue / 2) * 0.05; // 方块值越大音调越高
        const volume = Math.min(1, 0.4 + Math.log2(tileValue / 2) * 0.05);
        this.playSound('merge', { volume, playbackRate });
    }

    /**
     * 销毁音频管理器
     */
    destroy() {
        // 停止所有音频
        this.stopMusic();
        
        // 关闭音频上下文
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        // 清理资源
        this.sounds.clear();
        this.music.clear();
        this.audioPool.clear();
        this.eventListeners.clear();
        
        // 清理定时器
        if (this.musicFadeInterval) {
            clearInterval(this.musicFadeInterval);
        }
        
        console.log('AudioManager 已销毁');
    }
}