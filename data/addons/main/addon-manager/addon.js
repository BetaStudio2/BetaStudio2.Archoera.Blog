(function(){
  var WW = window.WebWord = window.WebWord || {};
  WW.addons = WW.addons || {};
  WW.addons['addon-manager'] = WW.addons['addon-manager'] || {};

  var overlayEl = null;
  var dialogEl = null;
  var styleEl = null;

  // Addon 托盘 + 多 addon 切换
  var _currentActiveAddon = null;     // 当前对话框显示的 addon
  var _overlayObserver = null;        // MutationObserver 监听 overlay 移除

  function getEl(id){ return document.getElementById(id); }

  // 对外暴露加载和兼容性检测接口，供全局搜索等功能使用
  WW.addons.loadAddonFiles = loadAddonFiles;
  WW.addons.checkAddonCompat = checkAddonCompat;
  WW.addons.getAddonMeta = function(){ return WW.addons._dynamicAddonMeta || []; };
  WW.addons.addTrayButton = addTrayButton;
  WW.addons.removeTrayButton = removeTrayButton;
  // 供外部模块（如全局搜索）通知 addon-manager 刷新 UI
  WW.addons.refreshUI = function(){
    updateFilemenuButtons();
    if(dialogEl && dialogEl.parentNode){
      renderList(getEl('addonMgrSearch') ? getEl('addonMgrSearch').value : '');
    }
  };

  // ── 加载项浏览器兼容性检测（装载前） ─────────────
  // 检查当前浏览器是否满足 addon 声明的 requires 条件
  // 'secure' 为硬性要求（缺失则不兼容，禁止加载）
  // 硬件 API（bluetooth/serial/usb/hid）为功能要求：
  //   全部满足 → ok（可加载）
  //   满足 secure 且至少一个硬件 API 可用但非全部 → partial（可加载，Toast 警告）
  //   其余 → incompatible（禁止加载）
  // 返回 { status: 'ok'|'partial'|'incompatible', missing: [string] }
  function checkAddonCompat(addonId){
    var dynamicMeta = WW.addons._dynamicAddonMeta || [];
    var meta = null;
    for(var i = 0; i < dynamicMeta.length; i++){
      if(dynamicMeta[i].id === addonId){ meta = dynamicMeta[i]; break; }
    }
    if(!meta || !meta.requires || meta.requires.length === 0){
      return { status: 'ok', missing: [] };
    }

    var isSecure = location.protocol === 'https:' ||
                   location.hostname === 'localhost' ||
                   location.hostname === '127.0.0.1' ||
                   location.hostname === '[::1]' ||
                   location.protocol === 'file:';
    var HARDWARE_APIS = { bluetooth: true, serial: true, usb: true, hid: true, geolocation: true };

    var needsSecure = false;
    var hasSecure = true;
    var hardwareRequired = [];
    var hardwareMissing = [];

    for(var j = 0; j < meta.requires.length; j++){
      var req = meta.requires[j];
      if(req === 'secure'){
        needsSecure = true;
        if(!isSecure) hasSecure = false;
      } else if(HARDWARE_APIS[req]){
        hardwareRequired.push(req);
        var available = false;
        switch(req){
          case 'bluetooth': available = !!navigator.bluetooth; break;
          case 'serial':    available = !!navigator.serial;    break;
          case 'usb':       available = !!navigator.usb;       break;
          case 'hid':       available = !!navigator.hid;       break;
          case 'geolocation': available = !!navigator.geolocation; break;
        }
        if(!available) hardwareMissing.push(req);
      }
    }

    // 硬性要求缺失 → 不兼容
    if(needsSecure && !hasSecure){
      return { status: 'incompatible', missing: ['安全环境（HTTPS / localhost / file）'] };
    }

    // 无硬件要求 → 仅看 secure，已满足则 ok
    if(hardwareRequired.length === 0){
      return { status: 'ok', missing: [] };
    }

    // 全部硬件 API 可用 → ok
    if(hardwareMissing.length === 0){
      return { status: 'ok', missing: [] };
    }

    // 至少一个硬件 API 可用 → 部分兼容
    if(hardwareMissing.length < hardwareRequired.length){
      var missingLabels = hardwareMissing.map(function(api){
        switch(api){
          case 'bluetooth': return 'Web Bluetooth API（需 Chrome/Edge + Windows/macOS/Android）';
          case 'serial':    return 'Web Serial API（需 Chrome/Edge + Windows/macOS/Linux）';
          case 'usb':       return 'Web USB API（需 Chrome/Edge + Windows/macOS/Linux）';
          case 'hid':       return 'Web HID API（需 Chrome/Edge + Windows/macOS/Linux）';
          case 'geolocation': return 'Geolocation API（需浏览器支持地理定位）';
        }
        return api;
      });
      return { status: 'partial', missing: missingLabels };
    }

    // 所有硬件 API 均缺失 → 不兼容
    var allMissingLabels = hardwareMissing.map(function(api){
      switch(api){
        case 'bluetooth': return 'Web Bluetooth API（需 Chrome/Edge + Windows/macOS/Android）';
        case 'serial':    return 'Web Serial API（需 Chrome/Edge + Windows/macOS/Linux）';
        case 'usb':       return 'Web USB API（需 Chrome/Edge + Windows/macOS/Linux）';
        case 'hid':       return 'Web HID API（需 Chrome/Edge + Windows/macOS/Linux）';
      }
      return api;
    });
    return { status: 'incompatible', missing: allMissingLabels };
  }

  function renderList(filter){
    var listEl = getEl('addonMgrList');
    var emptyEl = getEl('addonMgrEmpty');
    var countEl = getEl('addonMgrCount');
    if(!listEl) return;

    var keyword = (filter || '').toLowerCase().trim();
    var metaSource = WW.addons._dynamicAddonMeta || [];
    var filtered = metaSource.filter(function(m){
      if(!keyword) return true;
      return m.name.toLowerCase().indexOf(keyword) !== -1 ||
             m.desc.toLowerCase().indexOf(keyword) !== -1;
    });

    if(filtered.length === 0){
      listEl.innerHTML = '';
      if(emptyEl) emptyEl.style.display = '';
      if(countEl) countEl.textContent = '无可用加载项';
      return;
    }

    if(emptyEl) emptyEl.style.display = 'none';

    var html = '';
    for(var i = 0; i < filtered.length; i++){
      var m = filtered[i];
      // 完整性校验：损坏的 addon 版本号显示为"损坏"，禁用装载按钮
      // 超时分级：timeout=1次超时, timeout2=2次超时, timeoutN=3+次反复超时
      var integrity = WW.addons._integrity && WW.addons._integrity[m.id];
      var isCorrupt = integrity === 'corrupt';
      var isTimeout = integrity === 'timeout';
      var isTimeout2 = integrity === 'timeout2';
      var isTimeoutN = integrity === 'timeoutN';
      // 判断是否已装载：检查 handler 是否已注册（而非对话框是否打开）
      var isLoaded = WW.addons._handlers && WW.addons._handlers[m.id];
      // 浏览器兼容性检测（装载前）：
      //   incompatible → 禁用装载按钮（即使已装载也保持不兼容标注）
      //   partial → 允许装载，版本号黄色警告（即使已装载也保持警告）
      // 注意：兼容性警告优先级高于"已装载"状态，不可被覆盖
      var compat = checkAddonCompat(m.id);
      var isIncompat = compat.status === 'incompatible';
      var isPartial = compat.status === 'partial';
      var btnText, btnClass, btnDisabled;
      if(isIncompat){
        btnText = '不兼容';
        btnClass = 'addonmgr-btn-corrupt';
        btnDisabled = true;
      } else if(isCorrupt && !isLoaded){
        btnText = '损坏';
        btnClass = 'addonmgr-btn-corrupt';
        btnDisabled = true;
      } else if(isTimeoutN && !isLoaded){
        btnText = '重试';
        btnClass = 'addonmgr-btn-suspicious';
        btnDisabled = false;
      } else if((isTimeout || isTimeout2) && !isLoaded){
        btnText = '重试';
        btnClass = 'addonmgr-btn-retry';
        btnDisabled = false;
      } else if(isLoaded){
        btnText = '卸载';
        btnClass = 'addonmgr-btn-active';
        btnDisabled = false;
      } else if(isPartial){
        btnText = '装载';
        btnClass = 'addonmgr-btn-retry';
        btnDisabled = false;
      } else {
        btnText = '装载';
        btnClass = 'addonmgr-btn';
        btnDisabled = false;
      }
      // 版本号：不兼容/损坏/超时 替换为状态文字；部分兼容 显示真实版本号但黄色
      var versionText = isIncompat ? '不兼容' : (isCorrupt ? '损坏' : (isTimeoutN ? '反复超时' : (isTimeout2 ? '超时(2)' : (isTimeout ? '超时' : m.version))));
      var disabledAttr = btnDisabled ? ' disabled' : '';
      // 样式类：兼容性警告优先于已装载状态
      var itemExtraClass = isIncompat ? ' addonmgr-item-corrupt' : (isPartial ? ' addonmgr-item-partial' : (isCorrupt ? ' addonmgr-item-corrupt' : (isTimeoutN ? ' addonmgr-item-suspicious' : ((isTimeout || isTimeout2) ? ' addonmgr-item-timeout' : ''))));
      html += '<div class="addonmgr-item' + itemExtraClass + '" data-addon-id="' + m.id + '">' +
        '<div class="addonmgr-item-icon">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' + m.icon + '</svg>' +
        '</div>' +
        '<div class="addonmgr-item-info">' +
          '<div class="addonmgr-item-name">' + m.name + ' <span class="addonmgr-item-version">' + versionText + '</span></div>' +
          '<div class="addonmgr-item-desc">' + m.desc + '</div>' +
        '</div>' +
        '<button class="' + btnClass + ' addonmgr-activate-btn" data-addon-id="' + m.id + '"' + disabledAttr + '>' + btnText + '</button>' +
      '</div>';
    }

    listEl.innerHTML = html;
    if(countEl) countEl.textContent = '共 ' + filtered.length + ' 个加载项';

    // Bind activate buttons
    var btns = listEl.querySelectorAll('.addonmgr-activate-btn');
    for(var j = 0; j < btns.length; j++){
      (function(btn){
        btn.addEventListener('click', function(){
          var aid = this.getAttribute('data-addon-id');
          if(!aid || !WW.addons) return;

          // 浏览器兼容性检测（装载前）：
          //   incompatible → 禁止加载
          //   partial → 允许加载，但 Toast 警告缺失的功能
          var compat = checkAddonCompat(aid);
          if(compat.status === 'incompatible'){
            if(WW.toast) WW.toast.error('浏览器不兼容，缺少：' + compat.missing.join('、'));
            return;
          }
          // 标记本次点击是否弹过警告（用于跳过后续"已装载"成功提示，避免覆盖警告）
          var _warnedThisClick = false;
          if(compat.status === 'partial' && WW.toast){
            WW.toast.warning('部分兼容：缺少 ' + compat.missing.join('、') + '，部分功能不可用', 6000);
            _warnedThisClick = true;
          }

          // 损坏的 addon 不允许装载
          if(WW.addons._integrity && WW.addons._integrity[aid] === 'corrupt'){
            if(WW.toast) WW.toast.warning('该加载项已损坏，无法装载');
            return;
          }

          // 超时的 addon 允许重试：不清除计数器，让计数器在 loadAddonFiles 中递增
          // 超时计数器越大，越可能是异常加载项（区别于大文件/大数据加载）
          if(WW.addons._integrity && (WW.addons._integrity[aid] === 'timeout' ||
              WW.addons._integrity[aid] === 'timeout2' ||
              WW.addons._integrity[aid] === 'timeoutN')){
            // 第3+次重试给出警告
            if(WW.addons._integrity[aid] === 'timeoutN' && WW.toast){
              WW.toast.warning('该加载项已反复超时，可能为异常加载项');
            }
            // 清除 integrity 标记让 loadAddonFiles 重新走完整加载流程
            // 但保留 _timeoutCount，用于下一次超时时递增
            delete WW.addons._integrity[aid];
          }

          // 已装载 → 卸载
          var loaded = WW.addons._handlers && WW.addons._handlers[aid];
          if(loaded){
            unloadAddon(aid);
            renderList(getEl('addonMgrSearch') ? getEl('addonMgrSearch').value : '');
            return;
          }

          // 未装载 → 按需加载（后台装，不弹窗）
          // 检查当前已装载的加载项数量，过多时给出建议（仅提醒一次）
          var loadedCount = 0;
          if(WW.addons._handlers){
            for(var _k in WW.addons._handlers){
              if(_k !== 'addon-manager') loadedCount++;
            }
          }
          if(loadedCount >= 5 && !WW.addons._shownLoadedWarning && WW.toast){
            WW.addons._shownLoadedWarning = true;
            WW.toast.warning('装载过多加载项可能影响性能', 6000);
            _warnedThisClick = true;
          }
          this.textContent = '加载中...';
          this.disabled = true;
          loadAddonFiles(aid).then(function(){
            // 装载成功后：注册 tray 按钮，不自动弹窗
            addTrayButton(aid);
            renderList(getEl('addonMgrSearch') ? getEl('addonMgrSearch').value : '');
            if(WW.toast){
              // 若本次点击刚弹过警告，跳过成功提示避免覆盖
              if(!_warnedThisClick){
                var name = (WW.addons._registry[aid] && WW.addons._registry[aid].name) || aid;
                WW.toast.success('已装载: ' + name);
              }
            }
          }).catch(function(e){
            console.error('加载 addon 失败: ' + aid, e);
            // 根据错误类型显示不同提示
            renderList(getEl('addonMgrSearch') ? getEl('addonMgrSearch').value : '');
            if(WW.toast){
              if(e && e.isTimeout){
                var cnt = WW.addons._timeoutCount && WW.addons._timeoutCount[aid] || 0;
                if(cnt >= 3){
                  WW.toast.error('反复超时，该加载项可能为异常/恶意加载项');
                } else if(cnt === 2){
                  WW.toast.warning('再次超时，若反复超时可能为异常加载项');
                } else {
                  WW.toast.warning('加载超时，该加载项可能资源占用较大，可重试');
                }
              } else {
                WW.toast.error('加载项加载失败，可能已损坏');
              }
            }
          });
        });
      })(btns[j]);
    }
  }

  // ── 按需加载 addon 文件 ──────────────────────
  // 扫描阶段只加载了 addon-manager，实际 addon 的 template.js + addon.js
  // 在用户点击"装载"时才动态加载
  function loadAddonFiles(addonId){
    var registry = WW.addons._registry || {};
    var entry = registry[addonId];
    if(!entry){
      return Promise.reject(new Error('未找到 addon 注册信息: ' + addonId));
    }

    // 若 handler 已存在，说明已加载，直接返回
    if(WW.addons._handlers && WW.addons._handlers[addonId]){
      return Promise.resolve();
    }

    var basePath = WW.addons._basePath || '/addons/';
    var files = entry.files || ['template.js', 'addon.js'];
    var loadedScripts = [];  // 保留引用以便卸载时移除

    function loadScript(src){
      return new Promise(function(resolve, reject){
        var script = document.createElement('script');
        var done = false;
        // 超时保护：5 秒未加载完成视为超时（可能是资源占用大或恶意 addon）
        var timer = setTimeout(function(){
          if(done) return;
          done = true;
          var err = new Error('加载超时: ' + src);
          err.isTimeout = true;  // 标记为超时，区别于损坏
          reject(err);
        }, 5000);
        script.onload = function(){
          if(done) return;
          done = true;
          clearTimeout(timer);
          resolve(script);
        };
        script.onerror = function(){
          if(done) return;
          done = true;
          clearTimeout(timer);
          // 加载失败（404/解析错误等）= 损坏
          var err = new Error('加载失败: ' + src);
          err.isCorrupt = true;
          reject(err);
        };
        script.src = src;
        document.body.appendChild(script);
        loadedScripts.push(script);
      });
    }

    // 串行加载所有文件（template.js 先于 addon.js）
    var chain = Promise.resolve();
    for(var i = 0; i < files.length; i++){
      (function(file){
        chain = chain.then(function(){ return loadScript(basePath + entry.fullPath + '/' + file); });
      })(files[i]);
    }

    return chain.then(function(){
      // 记录已加载的 script 标签，供卸载时清理
      WW.addons._loadedScripts = WW.addons._loadedScripts || {};
      WW.addons._loadedScripts[addonId] = loadedScripts;
      // 标记为完整，清除超时计数
      WW.addons._integrity = WW.addons._integrity || {};
      WW.addons._integrity[addonId] = 'ok';
      if(WW.addons._timeoutCount){
        delete WW.addons._timeoutCount[addonId];
      }
    }).catch(function(err){
      // 根据错误类型区分状态
      WW.addons._integrity = WW.addons._integrity || {};
      if(err && err.isTimeout){
        // 超时计数器：区分大文件/大数据（偶尔超时）与内存爆破（反复超时）
        WW.addons._timeoutCount = WW.addons._timeoutCount || {};
        var cnt = (WW.addons._timeoutCount[addonId] || 0) + 1;
        WW.addons._timeoutCount[addonId] = cnt;
        // 按计数分级标记：
        //   timeout   = 第1次超时（可能文件大）
        //   timeout2  = 第2次超时（可疑）
        //   timeoutN  = 第3+次超时（恶意/异常概率高）
        if(cnt >= 3){
          WW.addons._integrity[addonId] = 'timeoutN';
        } else if(cnt === 2){
          WW.addons._integrity[addonId] = 'timeout2';
        } else {
          WW.addons._integrity[addonId] = 'timeout';
        }
      } else {
        // 加载失败（404/解析错误）：损坏
        WW.addons._integrity[addonId] = 'corrupt';
      }
      // 清理已加载的 script 标签
      for(var i = 0; i < loadedScripts.length; i++){
        if(loadedScripts[i].parentNode){
          loadedScripts[i].parentNode.removeChild(loadedScripts[i]);
        }
      }
      throw err;
    });
  }

  // ── 卸载 addon，释放内存 ─────────────────────
  function unloadAddon(addonId){
    // 1. 调用 addon 的 close handler（清理 DOM、事件、定时器等）
    if(WW.addons.close){
      try { WW.addons.close(addonId); } catch(e){ console.error('关闭 addon 失败: ' + addonId, e); }
    }

    // 2. 删除 handler 注册（切断所有函数引用，使闭包可被 GC 回收）
    if(WW.addons._handlers){
      delete WW.addons._handlers[addonId];
    }

    // 3. 删除 template 数据
    if(WW.addons[addonId]){
      delete WW.addons[addonId];
    }

    // 4. 移除 script 标签（释放 DOM 引用）
    if(WW.addons._loadedScripts && WW.addons._loadedScripts[addonId]){
      var scripts = WW.addons._loadedScripts[addonId];
      for(var i = 0; i < scripts.length; i++){
        if(scripts[i] && scripts[i].parentNode){
          scripts[i].parentNode.removeChild(scripts[i]);
        }
      }
      delete WW.addons._loadedScripts[addonId];
    }

    // 5. 移除 addon 的样式表（如果存在）
    var registry = WW.addons._registry || {};
    var entry = registry[addonId];
    if(entry){
      var links = document.querySelectorAll('link[rel="stylesheet"]');
      for(var k = 0; k < links.length; k++){
        if(links[k].href.indexOf(entry.fullPath + '/style.css') !== -1){
          links[k].parentNode.removeChild(links[k]);
          break;
        }
      }
    }

    // 6. 移除托盘按钮
    removeTrayButton(addonId);

    // 7. 清除完整性标记
    if(WW.addons._integrity){
      delete WW.addons._integrity[addonId];
    }
    if(WW.addons._timeoutCount){
      delete WW.addons._timeoutCount[addonId];
    }

    // 8. 提示用户已卸载
    if(WW.toast){
      WW.toast.info('已卸载加载项: ' + (entry ? entry.name : addonId));
    }
  }

  // ── Addon 托盘管理 ──────────────────────────
  // 获取 addon meta 信息（名称、图标等）
  function getAddonMeta(addonId){
    var dynamicMeta = WW.addons._dynamicAddonMeta || [];
    for(var mi = 0; mi < dynamicMeta.length; mi++){
      if(dynamicMeta[mi].id === addonId) return dynamicMeta[mi];
    }
    return null;
  }

  // 添加托盘按钮
  function addTrayButton(addonId){
    var tray = document.getElementById('addonTray');
    if(!tray) return;
    // 已存在则不重复添加
    if(tray.querySelector('[data-addon-id="' + addonId + '"]')) return;

    var meta = getAddonMeta(addonId);
    if(!meta) return;

    var btn = document.createElement('button');
    btn.className = 'addon-tray-btn';
    btn.setAttribute('data-addon-id', addonId);
    btn.title = meta.name;
    btn.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' + meta.icon + '</svg>';
    btn.addEventListener('click', function(){
      toggleAddonDialog(addonId);
    });
    tray.appendChild(btn);
    tray.classList.add('has-loaded');

    updateTrayButtonStates();
  }

  // 移除托盘按钮
  function removeTrayButton(addonId){
    var tray = document.getElementById('addonTray');
    if(!tray) return;
    var btn = tray.querySelector('[data-addon-id="' + addonId + '"]');
    if(btn) btn.remove();
    // 没有按钮时隐藏托盘
    if(tray.children.length === 0){
      tray.classList.remove('has-loaded');
    }
    updateTrayButtonStates();
  }

  // 更新所有托盘按钮的 active 状态
  function updateTrayButtonStates(){
    var tray = document.getElementById('addonTray');
    if(!tray) return;
    var btns = tray.querySelectorAll('.addon-tray-btn');
    for(var i = 0; i < btns.length; i++){
      var aid = btns[i].getAttribute('data-addon-id');
      btns[i].classList.toggle('active', aid === _currentActiveAddon);
    }
  }

  // MutationObserver：监听 body 中 modal-overlay 的移除
  // 当用户点击 addon 自己的 X 关闭对话框时，overlay 从 DOM 移除，
  // 此观察者检测到后检查当前活跃 addon 是否已关闭，如是则复位托盘
  function initOverlayObserver(){
    if(_overlayObserver || !document.body) return;
    _overlayObserver = new MutationObserver(function(mutations){
      for(var m = 0; m < mutations.length; m++){
        for(var r = 0; r < mutations[m].removedNodes.length; r++){
          var node = mutations[m].removedNodes[r];
          if(node && node.nodeType === 1 && node.classList && node.classList.contains('modal-overlay')){
            // 有 modal-overlay 被移除 → 检查当前活跃 addon 是否还在
            if(_currentActiveAddon && !WW.addons.isActive(_currentActiveAddon)){
              _currentActiveAddon = null;
              updateTrayButtonStates();
            }
          }
        }
      }
    });
    _overlayObserver.observe(document.body, { childList: true });
  }

  // 切换 addon 对话框：显示/隐藏
  function toggleAddonDialog(addonId){
    if(!WW.addons._handlers || !WW.addons._handlers[addonId]){
      // 未装载，提示
      if(WW.toast) WW.toast.warning('加载项未装载');
      return;
    }

    // 情况1：当前就是这个 addon 在显示 → 隐藏
    if(_currentActiveAddon === addonId){
      try { WW.addons.close(addonId); } catch(e){}
      _currentActiveAddon = null;
      updateTrayButtonStates();
      return;
    }

    // 情况2：有其他 addon 在显示 → 先关闭它
    if(_currentActiveAddon){
      try { WW.addons.close(_currentActiveAddon); } catch(e){}
    }

    // 如果管理面板开着，先关掉
    if(dialogEl){
      closeDialog();
    }

    // 情况3：显示新 addon
    _currentActiveAddon = addonId;
    try { WW.addons.activate(addonId); } catch(e){}
    updateTrayButtonStates();
  }

  function bindEvents(container){
    var searchInput = getEl('addonMgrSearch');
    if(searchInput){
      searchInput.addEventListener('input', function(){
        renderList(this.value);
      });
    }
  }

  function showDialog(){
    if(dialogEl) return;
    if(!WW.addons['addon-manager'].htmlTemplate) return;

    // 如果有 addon 对话框开着，先关掉
    if(_currentActiveAddon){
      try { WW.addons.close(_currentActiveAddon); } catch(e){}
      _currentActiveAddon = null;
      updateTrayButtonStates();
    }

    overlayEl = document.createElement('div');
    overlayEl.className = 'modal-overlay addonmgr-overlay';

    dialogEl = document.createElement('div');
    dialogEl.className = 'modal addonmgr-modal';
    dialogEl.innerHTML =
      '<div class="modal-head">' +
        '<span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;vertical-align:-3px;margin-right:6px;"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>加载项管理</span>' +
        '<button class="modal-close" id="addonMgrClose"><i class="addon-icon addon-icon-close"></i></button>' +
      '</div>' +
      '<div class="modal-body addon-modal-body">' +
        WW.addons['addon-manager'].htmlTemplate +
      '</div>';

    overlayEl.appendChild(dialogEl);
    document.body.appendChild(overlayEl);

    if(!styleEl){
      styleEl = document.createElement('link');
      styleEl.rel = 'stylesheet';
      // 使用 _basePath，兼容 /addons（本地服务）与 /static/addons（静态站点）两种部署
      styleEl.href = (WW.addons._basePath || '/addons/') + 'addon-manager/style.css';
      document.head.appendChild(styleEl);
    }

    requestAnimationFrame(function(){
      overlayEl.classList.add('show');
    });

    var closeBtn = getEl('addonMgrClose');
    if(closeBtn){
      closeBtn.addEventListener('click', closeDialog);
    }

    overlayEl.addEventListener('click', function(e){
      if(e.target === overlayEl) closeDialog();
    });

    renderList('');
    bindEvents(dialogEl);
  }

  function closeDialog(){
    if(overlayEl){
      overlayEl.classList.remove('show');
      setTimeout(function(){
        if(overlayEl && overlayEl.parentNode){
          overlayEl.parentNode.removeChild(overlayEl);
        }
        overlayEl = null;
        dialogEl = null;

        // 注意：关闭管理面板时不卸载已装载的 addon
        // addon 需要保持运行状态，用户通过"卸载"按钮主动卸载

        // Update filemenu button states if visible
        updateFilemenuButtons();
      }, 300);
    }
  }

  function updateFilemenuButtons(){
    var btns = document.querySelectorAll('.addon-activate-btn');
    for(var i = 0; i < btns.length; i++){
      var aid = btns[i].getAttribute('data-addon-id');
      if(aid && WW.addons){
        var loaded = WW.addons._handlers && WW.addons._handlers[aid];
        btns[i].textContent = loaded ? '卸载' : '装载';
      }
    }
  }

  // 启动时恢复托盘：如果页面加载时已有装载的 addon，同步到托盘
  function syncTrayFromLoaded(){
    if(!WW.addons._handlers) return;
    for(var id in WW.addons._handlers){
      if(id !== 'addon-manager'){
        addTrayButton(id);
      }
    }
  }

  // Register
  WW.addons._handlers = WW.addons._handlers || {};
  WW.addons._handlers['addon-manager'] = {
    activate: function(){ showDialog(); },
    close: function(){ closeDialog(); },
    isActive: function(){ return !!dialogEl; }
  };
  if(!WW.addons.activate){
    WW.addons.activate = function(id){
      var h = WW.addons._handlers && WW.addons._handlers[id];
      if(h) h.activate();
    };
  }
  if(!WW.addons.isActive){
    WW.addons.isActive = function(id){
      var h = WW.addons._handlers && WW.addons._handlers[id];
      return h ? h.isActive() : false;
    };
  }
  if(!WW.addons.close){
    WW.addons.close = function(id){
      var h = WW.addons._handlers && WW.addons._handlers[id];
      if(h){
        h.close();
        // 如果关闭的是当前活跃的 addon，清除状态并更新托盘
        if(_currentActiveAddon === id){
          _currentActiveAddon = null;
          updateTrayButtonStates();
        }
      }
    };
  }

  // 强制卸载所有已装载的 addon（除 addon-manager 自身外）
  if(!WW.addons.unloadAll){
    WW.addons.unloadAll = function(){
      if(!WW.addons._handlers) return;
      // 先关闭当前显示的 addon 对话框
      if(_currentActiveAddon){
        try { WW.addons.close(_currentActiveAddon); } catch(e){}
        _currentActiveAddon = null;
        updateTrayButtonStates();
      }
      var ids = Object.keys(WW.addons._handlers);
      for(var i = 0; i < ids.length; i++){
        if(ids[i] !== 'addon-manager'){
          unloadAddon(ids[i]);
        }
      }
    };
  }

  // 对外暴露托盘切换方法和卸载方法，供任务视图等模块调用
  window._addonTrayToggle = toggleAddonDialog;
  window._addonTrayUnload = unloadAddon;

  // 启动时同步：如果已有装载的 addon，添加托盘按钮
  // 延迟执行确保状态栏已渲染
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(syncTrayFromLoaded, 100);
      initOverlayObserver();
      // 发出就绪信号
      setTimeout(function(){
        document.dispatchEvent(new CustomEvent('webword:addon-ready'));
      }, 100);
    });
  }else{
    setTimeout(function(){
      syncTrayFromLoaded();
      initOverlayObserver();
      // 发出就绪信号
      document.dispatchEvent(new CustomEvent('webword:addon-ready'));
    }, 100);
  }
})();
