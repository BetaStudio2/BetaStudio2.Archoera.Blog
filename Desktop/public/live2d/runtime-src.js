import { CubismFramework, Option } from './libs/Framework/dist/live2dcubismframework.js';
import { CubismModelSettingJson } from './libs/Framework/dist/cubismmodelsettingjson.js';
import { CubismMatrix44 } from './libs/Framework/dist/math/cubismmatrix44.js';
import { CubismUserModel } from './libs/Framework/dist/model/cubismusermodel.js';
import { CubismShader_WebGL } from './libs/Framework/dist/rendering/cubismshader_webgl.js';

import vertShaderSrc from './libs/Framework/Shaders/WebGL/vertshadersrc.vert';
import vertShaderSrcMasked from './libs/Framework/Shaders/WebGL/vertshadersrcmasked.vert';
import vertShaderSrcSetupMask from './libs/Framework/Shaders/WebGL/vertshadersrcsetupmask.vert';
import fragShaderSrcSetupMask from './libs/Framework/Shaders/WebGL/fragshadersrcsetupmask.frag';
import fragShaderSrcPremultipliedAlpha from './libs/Framework/Shaders/WebGL/fragshadersrcpremultipliedalpha.frag';
import fragShaderSrcMaskPremultipliedAlpha from './libs/Framework/Shaders/WebGL/fragshadersrcmaskpremultipliedalpha.frag';
import fragShaderSrcMaskInvertedPremultipliedAlpha from './libs/Framework/Shaders/WebGL/fragshadersrcmaskinvertedpremultipliedalpha.frag';
import vertShaderSrcCopy from './libs/Framework/Shaders/WebGL/vertshadersrccopy.vert';
import fragShaderSrcCopy from './libs/Framework/Shaders/WebGL/fragshadersrccopy.frag';
import fragShaderSrcColorBlend from './libs/Framework/Shaders/WebGL/fragshadersrccolorblend.frag';
import fragShaderSrcAlphaBlend from './libs/Framework/Shaders/WebGL/fragshadersrcalphablend.frag';
import vertShaderSrcBlend from './libs/Framework/Shaders/WebGL/vertshadersrcblend.vert';
import fragShaderSrcBlend from './libs/Framework/Shaders/WebGL/fragshadersrcpremultipliedalphablend.frag';
(function(){
  var globalRef = window;
  var frameworkStarted = false;
  var SHADERS = {
    _vertShaderSrc: vertShaderSrc,
    _vertShaderSrcMasked: vertShaderSrcMasked,
    _vertShaderSrcSetupMask: vertShaderSrcSetupMask,
    _fragShaderSrcSetupMask: fragShaderSrcSetupMask,
    _fragShaderSrcPremultipliedAlpha: fragShaderSrcPremultipliedAlpha,
    _fragShaderSrcMaskPremultipliedAlpha: fragShaderSrcMaskPremultipliedAlpha,
    _fragShaderSrcMaskInvertedPremultipliedAlpha: fragShaderSrcMaskInvertedPremultipliedAlpha,
    _vertShaderSrcCopy: vertShaderSrcCopy,
    _fragShaderSrcCopy: fragShaderSrcCopy,
    _fragShaderSrcColorBlend: fragShaderSrcColorBlend,
    _fragShaderSrcAlphaBlend: fragShaderSrcAlphaBlend,
    _vertShaderSrcBlend: vertShaderSrcBlend,
    _fragShaderSrcBlend: fragShaderSrcBlend
  };

  CubismShader_WebGL.prototype.loadShaders = function(){
    var key;
    for(key in SHADERS){
      this[key] = SHADERS[key];
    }
    return Promise.resolve();
  };

  function ensureFramework(){
    if(frameworkStarted){
      return;
    }
    var option = new Option();
    option.logFunction = function(){};
    option.loggingLevel = 0;
    CubismFramework.startUp(option);
    CubismFramework.initialize();
    frameworkStarted = true;
  }

  function base64ToArrayBuffer(base64){
    var binary = atob(base64);
    var length = binary.length;
    var bytes = new Uint8Array(length);
    var i;
    for(i = 0; i < length; i++){
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function base64ToDataUrl(base64, mimeType){
    return 'data:' + mimeType + ';base64,' + base64;
  }

  function arrayBufferToJson(buffer){
    return JSON.parse(new TextDecoder().decode(new Uint8Array(buffer)));
  }

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function loadImage(url){
    return new Promise(function(resolve, reject){
      var image = new Image();
      image.onload = function(){ resolve(image); };
      image.onerror = reject;
      image.src = url;
    });
  }

  function createGlTexture(gl, image){
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }

  function resizeCanvas(canvas){
    var dpr = window.devicePixelRatio || 1;
    var width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    var height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if(canvas.width !== width || canvas.height !== height){
      canvas.width = width;
      canvas.height = height;
    }
  }

  class InlineModel extends CubismUserModel {
    constructor(){
      super();
      this.ready = false;
      this._baseModelMatrix = null;
      this._ids = null;
    }

    async initialize(gl, bundle){
      var model3Buffer = base64ToArrayBuffer(bundle.model3json);
      var model3Json = arrayBufferToJson(model3Buffer);
      var setting = new CubismModelSettingJson(model3Buffer, model3Buffer.byteLength);
      var modelFile = model3Json.FileReferences && model3Json.FileReferences.Moc ? model3Json.FileReferences.Moc : '';
      var physicsFile = model3Json.FileReferences && model3Json.FileReferences.Physics ? model3Json.FileReferences.Physics : '';

      this.loadModel(base64ToArrayBuffer(bundle.moc3));

      if(physicsFile && bundle.physics3json){
        var physicsBuffer = base64ToArrayBuffer(bundle.physics3json);
        this.loadPhysics(physicsBuffer, physicsBuffer.byteLength);
      }

      this._modelSetting = setting;
      this._modelFile = modelFile;
      this._gl = gl;
      this._textureKeys = Object.keys(bundle)
        .filter(function(key){ return /^texture_\d+$/.test(key); })
        .sort(function(a, b){
          return Number(a.split('_')[1]) - Number(b.split('_')[1]);
        });

      this.createRenderer(gl.canvas.width, gl.canvas.height);
      this.getRenderer().startUp(gl);
      this.getRenderer().setIsPremultipliedAlpha(true);

      await this.bindTextures(bundle);
      this.initializeParameterIds();
      this.applyInitialLayout(model3Json);
      this.ready = true;
    }

    initializeParameterIds(){
      var idManager = CubismFramework.getIdManager();
      this._ids = {
        paramAngleX: idManager.getId('ParamAngleX'),
        paramAngleY: idManager.getId('ParamAngleY'),
        paramAngleZ: idManager.getId('ParamAngleZ'),
        headAngleX: idManager.getId('HeadAngleX'),
        headAngleY: idManager.getId('HeadAngleY'),
        headAngleZ: idManager.getId('HeadAngleZ'),
        bodyAngleX: idManager.getId('BodyAngleX'),
        bodyAngleY: idManager.getId('BodyAngleY'),
        bodyAngleZ: idManager.getId('BodyAngleZ'),
        eyeBallX: idManager.getId('ParamEyeBallX'),
        eyeBallY: idManager.getId('ParamEyeBallY'),
        eyeLOpen: idManager.getId('ParamEyeLOpen'),
        eyeROpen: idManager.getId('ParamEyeROpen'),
        breath: idManager.getId('ParamBreath'),
        mouthForm: idManager.getId('ParamMouthForm'),
        mouthOpenY: idManager.getId('ParamMouthOpenY'),
        browLY: idManager.getId('ParamBrowLY'),
        browRY: idManager.getId('ParamBrowRY'),
        eyeSmile: idManager.getId('EYESmile')
      };
    }

    async bindTextures(bundle){
      var renderer = this.getRenderer();
      var i;
      for(i = 0; i < this._textureKeys.length; i++){
        var image = await loadImage(base64ToDataUrl(bundle[this._textureKeys[i]], 'image/png'));
        var texture = createGlTexture(this._gl, image);
        renderer.bindTexture(i, texture);
      }
    }

    applyInitialLayout(model3Json){
      var layout = model3Json.Layout;
      var matrix = this.getModelMatrix();
      if(layout && typeof layout === 'object'){
        matrix.setupFromLayout(Object.entries(layout));
      }else{
        matrix.setHeight(1.68);
        matrix.bottom(-1.12);
        matrix.centerX(0);
      }
      this._baseModelMatrix = new Float32Array(matrix.getArray());
    }

    updateFrame(timeSeconds, pointerX, pointerY){
      if(!this.ready){
        return;
      }

      var blinkCycle = 4.2;
      var blinkPhase = timeSeconds % blinkCycle;
      var blinkValue = 1;
      if(blinkPhase > 3.35 && blinkPhase < 3.5){
        blinkValue = (3.5 - blinkPhase) / 0.15;
      }else if(blinkPhase >= 3.5 && blinkPhase < 3.7){
        blinkValue = (blinkPhase - 3.5) / 0.2;
      }
      blinkValue = clamp(blinkValue, 0, 1);

      var idlePhase = timeSeconds * 0.95;
      var angleX = pointerX * 24 + Math.sin(idlePhase) * 8 + Math.sin(timeSeconds * 0.31) * 2.2;
      var angleY = pointerY * -16 + Math.sin(idlePhase * 0.82) * 5.2;
      var angleZ = pointerX * -7 + Math.sin(idlePhase * 0.58) * 3.8;
      var bodyX = pointerX * 10 + Math.sin(idlePhase * 0.65) * 4.2;
      var bodyY = pointerY * -4 + Math.sin(idlePhase * 0.52) * 1.5;
      var breath = Math.sin(timeSeconds * 1.75) * 0.5 + 0.5;
      var idleFloat = Math.sin(timeSeconds * 1.75) * 0.028;
      var swayX = pointerX * 0.045 + Math.sin(timeSeconds * 0.72) * 0.012;
      var scalePulse = 1 + Math.sin(timeSeconds * 1.75) * 0.015;
      var mouthForm = Math.sin(timeSeconds * 0.42) * 0.22;
      var mouthOpen = Math.max(0, Math.sin(timeSeconds * 0.58)) * 0.16;

      if(this._baseModelMatrix){
        this.getModelMatrix().setMatrix(this._baseModelMatrix);
        this.getModelMatrix().scaleRelative(scalePulse, scalePulse);
        this.getModelMatrix().translateRelative(swayX, idleFloat);
      }

      this._model.loadParameters();
      this._model.setParameterValueById(this._ids.paramAngleX, angleX * 0.75);
      this._model.setParameterValueById(this._ids.paramAngleY, angleY * 0.75);
      this._model.setParameterValueById(this._ids.paramAngleZ, angleZ * 0.75);
      this._model.setParameterValueById(this._ids.headAngleX, angleX);
      this._model.setParameterValueById(this._ids.headAngleY, angleY);
      this._model.setParameterValueById(this._ids.headAngleZ, angleZ);
      this._model.setParameterValueById(this._ids.bodyAngleX, bodyX);
      this._model.setParameterValueById(this._ids.bodyAngleY, bodyY);
      this._model.setParameterValueById(this._ids.bodyAngleZ, angleZ * 0.35);
      this._model.setParameterValueById(this._ids.eyeBallX, pointerX * 0.8);
      this._model.setParameterValueById(this._ids.eyeBallY, pointerY * -0.6);
      this._model.setParameterValueById(this._ids.eyeLOpen, blinkValue);
      this._model.setParameterValueById(this._ids.eyeROpen, blinkValue);
      this._model.setParameterValueById(this._ids.breath, breath);
      this._model.setParameterValueById(this._ids.mouthForm, mouthForm);
      this._model.setParameterValueById(this._ids.mouthOpenY, mouthOpen);
      this._model.setParameterValueById(this._ids.browLY, Math.sin(timeSeconds * 0.55) * 0.18);
      this._model.setParameterValueById(this._ids.browRY, Math.sin(timeSeconds * 0.55 + 0.3) * 0.18);
      this._model.setParameterValueById(this._ids.eyeSmile, Math.max(0, Math.sin(timeSeconds * 0.24)) * 0.18);

      if(this._physics){
        this._physics.evaluate(this._model, 1 / 60);
      }

      this._model.saveParameters();
      this._model.update();
    }

    draw(gl){
      if(!this.ready){
        return;
      }

      var renderer = this.getRenderer();
      var projection = new CubismMatrix44();
      var viewport = [0, 0, gl.canvas.width, gl.canvas.height];
      var width = gl.canvas.width;
      var height = gl.canvas.height;

      if(this.getModel()){
        if(this.getModel().getCanvasWidth() > 1.0 && width < height){
          this.getModelMatrix().setWidth(2.0);
          projection.scale(1.0, width / height);
        }else{
          projection.scale(height / width, 1.0);
        }
      }

      renderer.setRenderTargetSize(gl.canvas.width, gl.canvas.height);
      renderer.setRenderState(gl.getParameter(gl.FRAMEBUFFER_BINDING), viewport);
      renderer.setMvpMatrix(projection);
      renderer.drawModel();
    }
  }

  class Live2DWidget {
    constructor(host, options){
      this.host = host;
      this.options = options || {};
      this.pointer = { x: 0, y: 0 };
      this.pointerTarget = { x: 0, y: 0 };
      this.running = false;
      this.disposed = false;
      this.paused = false;
      this.model = null;
      this.canvas = host.querySelector('canvas');
      this.fallback = host.querySelector('[data-live2d-fallback]');
      this.overlayTarget = this.options.pointerTarget || host.parentElement || host;
      this.resizeObserver = null;
      this.animationFrame = 0;
      this.onPointerMove = this.handlePointerMove.bind(this);
      this.onPointerLeave = this.handlePointerLeave.bind(this);
      this.start();
    }

    async start(){
      try{
        ensureFramework();
        resizeCanvas(this.canvas);
        var gl = this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true })
          || this.canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: true, antialias: true });

        if(!gl){
          throw new Error('WebGL is unavailable');
        }

        this.gl = gl;
        this.model = new InlineModel();
        await this.model.initialize(gl, globalRef.__LIVE2D_MODEL_BUNDLE);

        this.host.classList.remove('is-loading');
        this.host.classList.add('is-ready');
        if(this.fallback){
          this.fallback.style.display = 'none';
        }

        this.bindEvents();
        this.running = true;
        this.loop();
      }catch(error){
        console.error('[WebWord Live2D] Failed to initialize:', error);
        this.host.classList.add('is-fallback');
      }
    }

    bindEvents(){
      if(this.overlayTarget){
        this.overlayTarget.addEventListener('mousemove', this.onPointerMove, { passive: true });
        this.overlayTarget.addEventListener('mouseleave', this.onPointerLeave, { passive: true });
      }
      this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
      this.resizeObserver.observe(this.host);
    }

    handleResize(){
      if(!this.canvas || !this.gl || this.disposed){
        return;
      }
      resizeCanvas(this.canvas);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    handlePointerMove(event){
      var rect = this.host.getBoundingClientRect();
      if(!rect.width || !rect.height){
        return;
      }
      var x = (event.clientX - rect.left) / rect.width;
      var y = (event.clientY - rect.top) / rect.height;
      this.pointerTarget.x = clamp(x * 2 - 1, -1, 1);
      this.pointerTarget.y = clamp(y * 2 - 1, -1, 1);
    }

    handlePointerLeave(){
      this.pointerTarget.x = 0;
      this.pointerTarget.y = 0;
    }

    loop(){
      if(!this.running || this.disposed || this.paused){
        return;
      }

      resizeCanvas(this.canvas);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.depthFunc(this.gl.LEQUAL);

      var now = performance.now() / 1000;
      this.pointer.x += (this.pointerTarget.x - this.pointer.x) * 0.12;
      this.pointer.y += (this.pointerTarget.y - this.pointer.y) * 0.12;

      if(this.model){
        this.model.updateFrame(now, this.pointer.x, this.pointer.y);
        this.model.draw(this.gl);
      }

      this.animationFrame = requestAnimationFrame(this.loop.bind(this));
    }

    destroy(){
      this.disposed = true;
      this.running = false;
      cancelAnimationFrame(this.animationFrame);
      if(this.resizeObserver){
        this.resizeObserver.disconnect();
      }
      if(this.overlayTarget){
        this.overlayTarget.removeEventListener('mousemove', this.onPointerMove);
        this.overlayTarget.removeEventListener('mouseleave', this.onPointerLeave);
      }
    }

    setPaused(paused){
      if(this.disposed){
        return;
      }
      this.paused = !!paused;
      this.host.classList.toggle('is-paused', this.paused);
      if(!this.paused && this.running){
        cancelAnimationFrame(this.animationFrame);
        this.loop();
      }
    }
  }

  globalRef.WebWordLive2D = {
    mount: function(host, options){
      if(!host){
        throw new Error('Live2D host is required.');
      }
      if(host.__live2dWidget){
        return host.__live2dWidget;
      }
      host.__live2dWidget = new Live2DWidget(host, options || {});
      return host.__live2dWidget;
    }
  };
})();
