(function(){
  var WW = window.WebWord = window.WebWord || {};
  var Addons = WW.addons = WW.addons || {};

  var overlayEl = null;
  var dialogEl = null;
  var styleEl = null;

  function getEl(id, container){
    return (container || document).querySelector('#' + id);
  }

  // -------- Web Audio 引擎 --------
  var audioCtx = null;
  var isPlaying = false;
  var currentMode = 'white';
  var sourceNodes = [];
  var gainNode = null;
  var animFrameId = null;
  var analyserNode = null;
  var lowpassFilter = null;
  var highpassFilter = null;
  var stereoPanner = null;

  function getAudioCtx(){
    if(!audioCtx){
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  // 工具：平滑随机游走（产生自然不规则的包络）
  function smoothRandomWalk(len, smoothness, seed){
    var out = new Float32Array(len);
    var val = 0, speed = 0;
    var target = Math.random() * 2 - 1;
    for(var i = 0; i < len; i++){
      if(Math.random() < smoothness){
        target = Math.random() * 2 - 1;
      }
      speed += (target - val) * 0.02;
      speed *= 0.96;
      val += speed;
      out[i] = Math.max(-1, Math.min(1, val));
    }
    return out;
  }

  // 工具：叠加多个不同频率正弦产生非周期波浪（用于海浪等）
  function layeredWaveEnvelope(len, sr, freqs, amps){
    var out = new Float32Array(len);
    for(var i = 0; i < len; i++){
      var t = i / sr;
      var sum = 0;
      for(var f = 0; f < freqs.length; f++){
        sum += amps[f] * Math.sin(2 * Math.PI * freqs[f] * t + freqs[f] * 13.7);
      }
      // 映射到 0~1 范围并取平方增强波峰尖锐度
      out[i] = Math.pow(Math.max(0, (sum + 1) * 0.5), 2);
    }
    return out;
  }

  // 工具：指数衰减脉冲（模拟水滴/雷声）
  function decayPulse(amp, decayRate, duration){
    var len = Math.ceil(duration);
    var out = new Float32Array(len);
    for(var i = 0; i < len; i++){
      out[i] = amp * Math.exp(-decayRate * i);
    }
    return out;
  }

  // 工具：将单声道数据写入双声道 buffer（L/R 有微小差异增强空间感）
  function makeStereoBuffer(ctx, monoData, stereoSpread){
    stereoSpread = stereoSpread || 0.02;
    var len = monoData.length;
    var buffer = ctx.createBuffer(2, len, ctx.sampleRate);
    var left = buffer.getChannelData(0);
    var right = buffer.getChannelData(1);
    var delaySamples = Math.floor(ctx.sampleRate * stereoSpread);
    for(var i = 0; i < len; i++){
      left[i] = monoData[i];
      // 右声道轻微延迟+微小振幅差
      var ri = Math.min(i + delaySamples, len - 1);
      right[i] = monoData[ri] * 0.97;
    }
    return buffer;
  }

  // 基础噪声：白噪（更长的 buffer 减少循环感）
  function createWhiteNoise(ctx, bufferSize){
    bufferSize = bufferSize || ctx.sampleRate * 8;
    var mono = new Float32Array(bufferSize);
    for(var i = 0; i < bufferSize; i++){
      mono[i] = Math.random() * 2 - 1;
    }
    var buffer = makeStereoBuffer(ctx, mono, 0.015);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  // 基础噪声：粉噪（Voss-McCartney 算法，改进振幅缩放）
  function createPinkNoise(ctx, bufferSize){
    bufferSize = bufferSize || ctx.sampleRate * 8;
    var mono = new Float32Array(bufferSize);
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for(var i = 0; i < bufferSize; i++){
      var white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      var pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
      mono[i] = pink * 0.7;  // 降低振幅避免削波
    }
    var buffer = makeStereoBuffer(ctx, mono, 0.02);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  // 基础噪声：布朗噪声（更多低频能量，适合风声/隆隆声）
  function createBrownNoise(ctx, bufferSize){
    bufferSize = bufferSize || ctx.sampleRate * 8;
    var mono = new Float32Array(bufferSize);
    var lastOut = 0;
    for(var i = 0; i < bufferSize; i++){
      var white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      mono[i] = lastOut * 3.5;
    }
    var buffer = makeStereoBuffer(ctx, mono, 0.025);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  // 雨声：粉红噪声基础 + 密集指数衰减水滴脉冲
  function createRainNoise(ctx, bufferSize){
    bufferSize = bufferSize || ctx.sampleRate * 10;
    var sr = ctx.sampleRate;
    var mono = new Float32Array(bufferSize);

    // 1. 粉红噪声基底（模拟密集背景雨滴）
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0;
    for(var i = 0; i < bufferSize; i++){
      var white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.08;
      b1 = 0.94 * b1 + white * 0.18;
      b2 = 0.88 * b2 + white * 0.28;
      b3 = 0.75 * b3 + white * 0.38;
      b4 = 0.55 * b4 + white * 0.48;
      mono[i] = (b0 + b1 + b2 + b3 + b4) * 0.08;
    }

    // 2. 密集水滴脉冲（指数衰减模拟不同大小的水滴）
    for(var d = 0; d < 600; d++){
      var pos = Math.floor(Math.random() * bufferSize);
      var amp = 0.1 + Math.random() * 0.25;
      var decay = 0.008 + Math.random() * 0.025;  // 不同衰减速度 = 不同水滴大小
      var dur = Math.floor((0.5 + Math.random() * 1.5) * sr * 0.05);
      for(var k = 0; k < dur && pos + k < bufferSize; k++){
        mono[pos + k] += amp * Math.exp(-decay * k) * (Math.random() * 0.3 + 0.7);
      }
    }

    // 3. 偶尔的大雨滴
    for(var b = 0; b < 30; b++){
      var pos = Math.floor(Math.random() * bufferSize);
      var amp = 0.2 + Math.random() * 0.3;
      var dur = Math.floor(sr * 0.08);
      for(var k = 0; k < dur && pos + k < bufferSize; k++){
        mono[pos + k] += amp * Math.exp(-0.004 * k);
      }
    }

    // 归一化
    var maxVal = 0;
    for(var i = 0; i < bufferSize; i++){
      if(Math.abs(mono[i]) > maxVal) maxVal = Math.abs(mono[i]);
    }
    if(maxVal > 1){
      for(var i = 0; i < bufferSize; i++) mono[i] /= maxVal;
    }

    var buffer = makeStereoBuffer(ctx, mono, 0.02);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  // 风声：布朗噪声 + 多层不规则随机游走包络 + 阵风
  function createWindNoise(ctx, bufferSize){
    bufferSize = bufferSize || ctx.sampleRate * 12;
    var sr = ctx.sampleRate;
    var mono = new Float32Array(bufferSize);

    // 1. 布朗噪声基础（风声的低频特性）
    var lastOut = 0;
    for(var i = 0; i < bufferSize; i++){
      var white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.015 * white)) / 1.015;
      mono[i] = lastOut * 2.5;
    }

    // 2. 三层不规则包络（取代机械的正弦）
    var envSlow = smoothRandomWalk(bufferSize, 0.003, 1);   // ~30秒尺度
    var envMid  = smoothRandomWalk(bufferSize, 0.008, 2);   // ~10秒尺度
    var envFast = smoothRandomWalk(bufferSize, 0.02, 3);    // ~4秒尺度

    // 3. 偶尔阵风（随机增强）
    var gustEnv = new Float32Array(bufferSize);
    for(var i = 0; i < bufferSize; i++) gustEnv[i] = 1;
    for(var g = 0; g < 8; g++){
      var pos = Math.floor(Math.random() * bufferSize);
      var dur = Math.floor(sr * (2 + Math.random() * 4));
      var peakAmp = 0.4 + Math.random() * 0.5;
      for(var k = 0; k < dur && pos + k < bufferSize; k++){
        var t = k / dur;
        var shape = Math.sin(t * Math.PI);  // 拱形包络
        gustEnv[pos + k] += shape * peakAmp;
      }
    }

    // 合成
    for(var i = 0; i < bufferSize; i++){
      var envelope = (0.5 + 0.5 * envSlow[i]) * (0.6 + 0.4 * envMid[i]) * (0.7 + 0.3 * envFast[i]);
      mono[i] *= envelope * gustEnv[i] * 0.55;
    }

    var buffer = makeStereoBuffer(ctx, mono, 0.03);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  // 溪流：湍流调制 + 多层水流 + 气泡
  function createStreamNoise(ctx, bufferSize){
    bufferSize = bufferSize || ctx.sampleRate * 10;
    var sr = ctx.sampleRate;
    var mono = new Float32Array(bufferSize);

    // 1. 湍流基础：粉红噪声 + 多个频率的振幅调制
    var b0 = 0, b1 = 0, b2 = 0;
    var turbPhases = [0, 0, 0, 0];
    var turbFreqs = [0.3, 0.8, 1.5, 2.7];  // Hz
    for(var i = 0; i < bufferSize; i++){
      var white = Math.random() * 2 - 1;
      b0 = 0.98 * b0 + white * 0.1;
      b1 = 0.9 * b1 + white * 0.25;
      b2 = 0.8 * b2 + white * 0.35;
      var pink = (b0 + b1 + b2) * 0.12;

      // 湍流调制
      var turb = 0;
      for(var t = 0; t < turbFreqs.length; t++){
        turbPhases[t] += turbFreqs[t] * 2 * Math.PI / sr;
        turb += Math.sin(turbPhases[t]) * 0.15;
      }
      var env = 0.5 + 0.3 * turb;
      mono[i] = pink * env;
    }

    // 2. 随机气泡声（高频瞬态）
    for(var b = 0; b < 400; b++){
      var pos = Math.floor(Math.random() * bufferSize);
      var amp = 0.05 + Math.random() * 0.12;
      var dur = Math.floor(sr * 0.02);
      for(var k = 0; k < dur && pos + k < bufferSize; k++){
        mono[pos + k] += amp * Math.exp(-0.05 * k) * (Math.random() * 0.5 + 0.5);
      }
    }

    // 3. 偶尔的较大水花
    for(var s = 0; s < 20; s++){
      var pos = Math.floor(Math.random() * bufferSize);
      var amp = 0.1 + Math.random() * 0.15;
      var dur = Math.floor(sr * 0.06);
      for(var k = 0; k < dur && pos + k < bufferSize; k++){
        mono[pos + k] += amp * Math.exp(-0.015 * k);
      }
    }

    var buffer = makeStereoBuffer(ctx, mono, 0.025);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  // 雷雨：深棕噪声 + 指数衰减雷声脉冲 + 低频隆隆回响
  function createThunderNoise(ctx, bufferSize){
    bufferSize = bufferSize || ctx.sampleRate * 16;  // 更长避免雷声位置重复
    var sr = ctx.sampleRate;
    var mono = new Float32Array(bufferSize);

    // 1. 深棕噪声基底（低频隆隆）
    var lastOut = 0;
    for(var i = 0; i < bufferSize; i++){
      var white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.01 * white)) / 1.01;
      mono[i] = lastOut * 4;
    }

    // 2. 低频不规则隆隆（取代正弦）
    var rumbleEnv = smoothRandomWalk(bufferSize, 0.002, 1);
    for(var i = 0; i < bufferSize; i++){
      mono[i] *= (0.4 + 0.6 * rumbleEnv[i]);
    }

    // 3. 雷声脉冲（带有指数衰减 + 多回声）
    var thunderCount = Math.floor(Math.random() * 3) + 2;  // 2-4 次雷声
    for(var t = 0; t < thunderCount; t++){
      var pos = Math.floor(Math.random() * (bufferSize - sr * 4));
      var mainAmp = 0.6 + Math.random() * 0.4;
      var mainDecay = 0.003 + Math.random() * 0.005;
      var mainDur = Math.floor(sr * (1.5 + Math.random() * 2.5));

      // 主雷声（初始爆裂+快速衰减）
      for(var k = 0; k < mainDur && pos + k < bufferSize; k++){
        var env = Math.exp(-mainDecay * k);
        // 初期高频内容
        var hf = k < sr * 0.1 ? (Math.random() * 2 - 1) * env * 0.3 : 0;
        mono[pos + k] += mainAmp * env + hf;
      }

      // 回声（模拟远处反射）
      var echoCount = Math.floor(Math.random() * 4) + 2;
      for(var e = 0; e < echoCount; e++){
        var echoPos = pos + Math.floor(sr * (0.3 + Math.random() * 1.5));
        var echoAmp = mainAmp * (0.15 + Math.random() * 0.2);
        var echoDecay = mainDecay * (0.5 + Math.random() * 0.5);
        var echoDur = Math.floor(sr * (0.5 + Math.random()));
        for(var k = 0; k < echoDur && echoPos + k < bufferSize; k++){
          mono[echoPos + k] += echoAmp * Math.exp(-echoDecay * k);
        }
      }
    }

    // 归一化
    var maxVal = 0;
    for(var i = 0; i < bufferSize; i++){
      if(Math.abs(mono[i]) > maxVal) maxVal = Math.abs(mono[i]);
    }
    if(maxVal > 1){
      for(var i = 0; i < bufferSize; i++) mono[i] /= maxVal;
    }

    var buffer = makeStereoBuffer(ctx, mono, 0.04);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  // 篝火：火焰噪声基底 + 高频瞬态噼啪 + 爆裂
  function createCampfireNoise(ctx, bufferSize){
    bufferSize = bufferSize || ctx.sampleRate * 10;
    var sr = ctx.sampleRate;
    var mono = new Float32Array(bufferSize);

    // 1. 火焰基底：粉红噪声 + 不规则低频波动（取代正弦嗡嗡）
    var b0 = 0, b1 = 0;
    var flameEnv = smoothRandomWalk(bufferSize, 0.004, 1);
    for(var i = 0; i < bufferSize; i++){
      var white = Math.random() * 2 - 1;
      b0 = 0.95 * b0 + white * 0.15;
      b1 = 0.85 * b1 + white * 0.3;
      var pink = (b0 + b1) * 0.15;
      var env = 0.3 + 0.4 * flameEnv[i];
      mono[i] = pink * env;
    }

    // 2. 噼啪声（高频短瞬态，模拟木头燃烧）
    for(var c = 0; c < 300; c++){
      var pos = Math.floor(Math.random() * bufferSize);
      var amp = 0.08 + Math.random() * 0.15;
      var dur = Math.floor(sr * (0.005 + Math.random() * 0.015));
      for(var k = 0; k < dur && pos + k < bufferSize; k++){
        // 高频内容：交替正负快速衰减
        var sign = (k % 2 === 0) ? 1 : -0.7;
        mono[pos + k] += sign * amp * Math.exp(-0.15 * k);
      }
    }

    // 3. 爆裂声（较大的木头爆裂）
    for(var p = 0; p < 25; p++){
      var pos = Math.floor(Math.random() * bufferSize);
      var amp = 0.15 + Math.random() * 0.25;
      var dur = Math.floor(sr * (0.03 + Math.random() * 0.04));
      for(var k = 0; k < dur && pos + k < bufferSize; k++){
        mono[pos + k] += amp * Math.exp(-0.02 * k) * (Math.random() * 0.4 + 0.6);
      }
    }

    var buffer = makeStereoBuffer(ctx, mono, 0.02);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  // 海浪：非周期波浪包络 + 拍岸水花
  function createOceanNoise(ctx, bufferSize){
    bufferSize = bufferSize || ctx.sampleRate * 16;  // 更长减少循环感
    var sr = ctx.sampleRate;
    var mono = new Float32Array(bufferSize);

    // 1. 粉红噪声基底
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0;
    for(var i = 0; i < bufferSize; i++){
      var white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.06;
      b1 = 0.94 * b1 + white * 0.14;
      b2 = 0.87 * b2 + white * 0.24;
      b3 = 0.78 * b3 + white * 0.32;
      mono[i] = (b0 + b1 + b2 + b3) * 0.1;
    }

    // 2. 非周期波浪包络（5个不同频率正弦叠加，避免完全周期性）
    var waveEnv = layeredWaveEnvelope(bufferSize, sr,
      [0.04, 0.07, 0.11, 0.17, 0.23],   // 频率(Hz)，非常慢
      [0.35, 0.25, 0.20, 0.12, 0.08]    // 振幅
    );

    // 3. 拍岸水花（波峰时的高频瞬态簇）
    // 根据 waveEnv 找到波峰位置添加水花
    var crashCount = 0;
    for(var i = 0; i < bufferSize - sr; i += Math.floor(sr * 0.5)){
      if(waveEnv[i] > 0.65 && Math.random() < 0.6){
        crashCount++;
        var dur = Math.floor(sr * (0.4 + Math.random() * 0.6));
        var amp = 0.08 + waveEnv[i] * 0.15;
        for(var k = 0; k < dur && i + k < bufferSize; k++){
          var decay = Math.exp(-0.008 * k);
          var hf = (Math.random() * 2 - 1) * decay * 0.5;
          mono[i + k] += amp * decay + hf * 0.3;
        }
      }
    }

    // 合成
    for(var i = 0; i < bufferSize; i++){
      mono[i] = mono[i] * (0.3 + 0.7 * waveEnv[i]) * 0.6;
    }

    var buffer = makeStereoBuffer(ctx, mono, 0.035);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  // 鹅毛棒：柔和高频沙沙 + 缓慢不规则包络
  function createFeatherNoise(ctx, bufferSize){
    bufferSize = bufferSize || ctx.sampleRate * 12;
    var sr = ctx.sampleRate;
    var mono = new Float32Array(bufferSize);

    // 1. 柔和高频噪声（浅粉噪偏向高频）
    var b0 = 0, b1 = 0;
    for(var i = 0; i < bufferSize; i++){
      var white = Math.random() * 2 - 1;
      b0 = 0.9 * b0 + white * 0.35;   // 较高截止频率
      b1 = 0.75 * b1 + white * 0.5;
      var sizzle = (b0 + b1) * 0.1;
      mono[i] = sizzle;
    }

    // 2. 非常缓慢的不规则包络（模拟轻柔的扫动节奏）
    var strokeEnv = smoothRandomWalk(bufferSize, 0.0015, 1);
    for(var i = 0; i < bufferSize; i++){
      // 映射到 0.2~1.0 范围，保持始终轻柔
      var env = 0.2 + 0.8 * ((strokeEnv[i] + 1) * 0.5);
      mono[i] *= env * 0.4;
    }

    // 3. 偶尔的轻柔拂动（极稀疏的瞬态）
    for(var t = 0; t < 15; t++){
      var pos = Math.floor(Math.random() * bufferSize);
      var dur = Math.floor(sr * (0.5 + Math.random() * 1.0));
      var amp = 0.05 + Math.random() * 0.08;
      for(var k = 0; k < dur && pos + k < bufferSize; k++){
        var shape = Math.sin((k / dur) * Math.PI);  // 拱形
        mono[pos + k] += amp * shape * (Math.random() * 0.3 + 0.7);
      }
    }

    var buffer = makeStereoBuffer(ctx, mono, 0.02);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  function buildAudioGraph(mode){
    var ctx = getAudioCtx();
    if(ctx.state === 'suspended') ctx.resume();

    // 停止旧的源
    sourceNodes.forEach(function(s){
      try{ s.stop(); }catch(e){}
      try{ s.disconnect(); }catch(e){}
    });
    sourceNodes = [];

    if(gainNode){
      try{ gainNode.disconnect(); }catch(e){}
    }
    if(lowpassFilter){
      try{ lowpassFilter.disconnect(); }catch(e){}
    }
    if(highpassFilter){
      try{ highpassFilter.disconnect(); }catch(e){}
    }
    if(stereoPanner){
      try{ stereoPanner.disconnect(); }catch(e){}
    }

    // 创建增益节点
    gainNode = ctx.createGain();
    gainNode.gain.value = (getEl('wnoiseVolume') ? parseInt(getEl('wnoiseVolume').value) : 50) / 100;

    // 创建高通滤波器 - 去除不必要的低频嗡嗡（如风声/雨声中的 DC 偏移）
    highpassFilter = ctx.createBiquadFilter();
    highpassFilter.type = 'highpass';
    highpassFilter.frequency.value = 40;  // 40Hz 以下切除
    highpassFilter.Q.value = 0.7;

    // 创建低通滤波器 - 让声音更柔和
    lowpassFilter = ctx.createBiquadFilter();
    lowpassFilter.type = 'lowpass';
    // 不同模式使用不同的截止频率（匹配改进后的音效特性）
    var freqMap = {
      white: 12000,  // 白噪音 - 全频但柔和化
      rain: 8000,    // 雨声 - 中高频水滴
      wind: 3000,    // 风声 - 低频为主
      stream: 10000, // 溪流 - 中高频湍流
      thunder: 2500, // 雷雨 - 很低频隆隆
      campfire: 12000, // 篝火 - 中高频噼啪
      ocean: 5000,   // 海浪 - 低频波浪+中频水花
      feather: 15000 // 鹅毛棒 - 高频沙沙
    };
    lowpassFilter.frequency.value = freqMap[mode] || 8000;
    lowpassFilter.Q.value = 0.7;

    // 创建立体声扩展（轻微加宽空间感）
    stereoPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if(stereoPanner){
      stereoPanner.pan.value = 0;
    }

    // 创建分析器
    analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 256;

    var source = null;
    switch(mode){
      case 'white':
        source = createWhiteNoise(ctx);
        break;
      case 'rain':
        source = createRainNoise(ctx);
        break;
      case 'wind':
        source = createWindNoise(ctx);
        break;
      case 'stream':
        source = createStreamNoise(ctx);
        break;
      case 'thunder':
        source = createThunderNoise(ctx);
        break;
      case 'campfire':
        source = createCampfireNoise(ctx);
        break;
      case 'ocean':
        source = createOceanNoise(ctx);
        break;
      case 'feather':
        source = createFeatherNoise(ctx);
        break;
      default:
        source = createWhiteNoise(ctx);
    }

    // 音频图：source → highpass → gain → lowpass → analyser → (stereoPanner) → destination
    source.connect(highpassFilter);
    highpassFilter.connect(gainNode);
    gainNode.connect(lowpassFilter);
    lowpassFilter.connect(analyserNode);
    if(stereoPanner){
      analyserNode.connect(stereoPanner);
      stereoPanner.connect(ctx.destination);
    }else{
      analyserNode.connect(ctx.destination);
    }
    source.start();
    sourceNodes.push(source);
    isPlaying = true;
  }

  function startVisualization(){
    var canvas = getEl('wnoiseCanvas');
    if(!canvas) return;
    var ctx2d = canvas.getContext('2d');
    var analyser = analyserNode;
    if(!analyser) return;

    var W = canvas.width = canvas.clientWidth;
    var H = canvas.height = canvas.clientHeight;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    function draw(){
      if(!isPlaying || !analyser){
        ctx2d.clearRect(0, 0, W, H);
        return;
      }
      animFrameId = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx2d.fillStyle = '#151a28';
      ctx2d.fillRect(0, 0, W, H);

      ctx2d.lineWidth = 2;
      ctx2d.strokeStyle = '#5ea8ff';
      ctx2d.beginPath();

      var sliceWidth = W / bufferLength;
      var x = 0;
      for(var i = 0; i < bufferLength; i++){
        var v = dataArray[i] / 128.0;
        var y = v * H / 2;
        if(i === 0) ctx2d.moveTo(x, y);
        else ctx2d.lineTo(x, y);
        x += sliceWidth;
      }
      ctx2d.lineTo(W, H / 2);
      ctx2d.stroke();

      // 渐变填充
      ctx2d.lineTo(W, H);
      ctx2d.lineTo(0, H);
      ctx2d.closePath();
      var grad = ctx2d.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(94,168,255,0.15)');
      grad.addColorStop(1, 'rgba(94,168,255,0)');
      ctx2d.fillStyle = grad;
      ctx2d.fill();
    }
    draw();
  }

  function stopNoise(){
    sourceNodes.forEach(function(s){
      try{ s.stop(); }catch(e){}
      try{ s.disconnect(); }catch(e){}
    });
    sourceNodes = [];
    isPlaying = false;
    if(animFrameId){
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if(highpassFilter){
      try{ highpassFilter.disconnect(); }catch(e){}
    }
    if(lowpassFilter){
      try{ lowpassFilter.disconnect(); }catch(e){}
    }
    if(gainNode){
      try{ gainNode.disconnect(); }catch(e){}
    }
    if(stereoPanner){
      try{ stereoPanner.disconnect(); }catch(e){}
    }
    var canvas = getEl('wnoiseCanvas');
    if(canvas){
      var ctx2d = canvas.getContext('2d');
      if(ctx2d) ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function switchMode(container, mode){
    currentMode = mode;
    var bar = getEl('wnoiseModes', container);
    if(bar){
      bar.querySelectorAll('.wnoise-mode-btn').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-mode') === mode);
      });
    }
    // 更新模式名称
    var names = { white: '白噪音', rain: '雨声', wind: '风声', stream: '溪流', thunder: '雷雨', campfire: '篝火', ocean: '海浪', feather: '鹅毛棒' };
    var statusText = getEl('wnoiseStatusText');
    if(statusText){
      statusText.textContent = isPlaying ? '正在播放 ' + names[mode] : '就绪';
    }

    if(isPlaying){
      buildAudioGraph(mode);
    }
  }

  function bindEvents(container){
    var bar = getEl('wnoiseModes', container);
    if(bar){
      bar.querySelectorAll('.wnoise-mode-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          var mode = this.getAttribute('data-mode');
          switchMode(container, mode);
        });
      });
    }

    var playBtn = getEl('wnoisePlayBtn', container);
    var stopBtn = getEl('wnoiseStopBtn', container);
    var volumeSlider = getEl('wnoiseVolume', container);
    var rateSlider = getEl('wnoiseRate', container);
    var volumeVal = getEl('wnoiseVolumeVal');
    var rateVal = getEl('wnoiseRateVal');

    if(playBtn){
      playBtn.addEventListener('click', function(){
        if(isPlaying) return;
        var ctx = getAudioCtx();
        if(ctx.state === 'suspended') ctx.resume();
        buildAudioGraph(currentMode);
        startVisualization();
        var names = { white: '白噪音', rain: '雨声', wind: '风声', stream: '溪流', thunder: '雷雨', campfire: '篝火', ocean: '海浪', feather: '鹅毛棒' };
        var statusText = getEl('wnoiseStatusText');
        if(statusText) statusText.textContent = '正在播放 ' + names[currentMode];
        var dot = getEl('wnoiseStatusDot');
        if(dot) dot.classList.add('active');
        playBtn.classList.add('playing');
        playBtn.querySelector('#wnoiseBtnText').textContent = '播放中';
        if(stopBtn) stopBtn.disabled = false;
      });
    }

    if(stopBtn){
      stopBtn.addEventListener('click', function(){
        stopNoise();
        var statusText = getEl('wnoiseStatusText');
        if(statusText) statusText.textContent = '已停止';
        var dot = getEl('wnoiseStatusDot');
        if(dot) dot.classList.remove('active');
        if(playBtn){
          playBtn.classList.remove('playing');
          playBtn.querySelector('#wnoiseBtnText').textContent = '播放';
        }
        stopBtn.disabled = true;
      });
    }

    if(volumeSlider){
      volumeSlider.addEventListener('input', function(){
        var val = parseInt(this.value);
        if(volumeVal) volumeVal.textContent = val + '%';
        if(gainNode){
          gainNode.gain.value = val / 100;
        }
      });
    }

    if(rateSlider){
      rateSlider.addEventListener('input', function(){
        var val = parseFloat(this.value) / 100;
        if(rateVal) rateVal.textContent = val.toFixed(1) + 'x';
        sourceNodes.forEach(function(s){
          try{ s.playbackRate.value = val; }catch(e){}
        });
      });
    }

    // 窗口 resize 时更新 canvas
    var canvas = getEl('wnoiseCanvas', container);
    if(canvas){
      var ro = new ResizeObserver(function(){
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      });
      ro.observe(canvas);
    }
  }

  function showDialog(){
    if(dialogEl) return;
    if(!WW.addons.whiteNoise.htmlTemplate) return;

    overlayEl = document.createElement('div');
    overlayEl.className = 'modal-overlay';

    dialogEl = document.createElement('div');
    dialogEl.className = 'modal wnoise-modal';
    dialogEl.innerHTML =
      '<div class="modal-head">' +
        '<span><i class="addon-icon addon-icon-wnoise" style="width:16px;height:16px;vertical-align:-3px;margin-right:6px;"></i>白噪音</span>' +
        '<button class="modal-close" id="wnoiseDialogClose"><i class="addon-icon addon-icon-close"></i></button>' +
      '</div>' +
      '<div class="modal-body addon-modal-body">' +
        WW.addons.whiteNoise.htmlTemplate +
      '</div>';

    overlayEl.appendChild(dialogEl);
    document.body.appendChild(overlayEl);

    if(!styleEl || !styleEl.parentNode){
      styleEl = document.createElement('link');
      styleEl.rel = 'stylesheet';
      styleEl.href = '/addons/official/white-noise/style.css';
      document.head.appendChild(styleEl);
    }

    requestAnimationFrame(function(){
      overlayEl.classList.add('show');
    });

    var closeBtn = getEl('wnoiseDialogClose');
    if(closeBtn){
      closeBtn.addEventListener('click', closeDialog);
    }

    overlayEl.addEventListener('click', function(e){
      if(e.target === overlayEl) closeDialog();
    });

    // 默认选中白噪音
    var firstBtn = dialogEl.querySelector('.wnoise-mode-btn');
    if(firstBtn) firstBtn.classList.add('active');

    bindEvents(dialogEl);

    // 初始化 canvas 尺寸
    var canvas = getEl('wnoiseCanvas', dialogEl);
    if(canvas){
      setTimeout(function(){
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }, 100);
    }
  }

  function closeDialog(){
    stopNoise();
    if(overlayEl){
      overlayEl.classList.remove('show');
      setTimeout(function(){
        if(overlayEl && overlayEl.parentNode){
          overlayEl.parentNode.removeChild(overlayEl);
        }
        overlayEl = null;
        dialogEl = null;
        if(audioCtx && audioCtx.state !== 'closed'){
          audioCtx.close().catch(function(){});
          audioCtx = null;
        }
      }, 300);
    }
    var btn = document.querySelector('.addon-activate-btn[data-addon-id="white-noise"]');
    if(btn) btn.textContent = '装载';
  }

  // 注册
  Addons._handlers = Addons._handlers || {};
  Addons._handlers['white-noise'] = {
    activate: function(){
      showDialog();
      var btn = document.querySelector('.addon-activate-btn[data-addon-id="white-noise"]');
      if(btn) btn.textContent = '卸载';
    },
    close: function(){
      closeDialog();
    },
    isActive: function(){
      return !!dialogEl;
    }
  };

  if(!Addons.activate){
    Addons.activate = function(addonId){
      if(Addons._handlers[addonId]) Addons._handlers[addonId].activate();
    };
  }
  if(!Addons.isActive){
    Addons.isActive = function(addonId){
      return Addons._handlers[addonId] && Addons._handlers[addonId].isActive ? Addons._handlers[addonId].isActive() : false;
    };
  }
  if(!Addons.close){
    Addons.close = function(){
      for(var key in Addons._handlers){
        if(Addons._handlers[key] && Addons._handlers[key].close) Addons._handlers[key].close();
      }
    };
  }
})();
