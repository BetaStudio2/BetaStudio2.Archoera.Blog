(function(){
  var WW = window.WebWord = window.WebWord || {};
  var Addons = WW.addons = WW.addons || {};

  var overlayEl = null;
  var dialogEl = null;
  var styleEl = null;

  function getEl(id, container){
    return (container || document).querySelector('#' + id);
  }

  var currentMode = 'number';
  var history = [];
  var MAX_HISTORY = 12;

  // -------- 安全的随机数生成 --------
  function secureRandom(){
    var arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / 4294967296;
  }

  function randInt(min, max){
    min = Math.ceil(min);
    max = Math.floor(max);
    if(min > max){ var t = min; min = max; max = t; }
    return Math.floor(secureRandom() * (max - min + 1)) + min;
  }

  // -------- 数字模式 --------
  function renderNumberMode(container){
    var content = getEl('randgenContent', container);
    if(!content) return;
    content.innerHTML =
      '<div class="randgen-control-row">' +
        '<span class="randgen-label">范围</span>' +
        '<input type="number" class="randgen-input randgen-input-sm" id="randgenMin" value="1" min="-999999" />' +
        '<span style="color:#4a5568;font-size:13px;">~</span>' +
        '<input type="number" class="randgen-input randgen-input-sm" id="randgenMax" value="100" min="-999999" />' +
      '</div>' +
      '<div class="randgen-control-row">' +
        '<span class="randgen-label">数量</span>' +
        '<input type="number" class="randgen-input" id="randgenCount" value="1" min="1" max="100" style="width:60px;" />' +
      '</div>' +
      '<div class="randgen-checkbox-row">' +
        '<label class="randgen-checkbox-label">' +
          '<input type="checkbox" class="randgen-checkbox" id="randgenUnique" /> 不重复' +
        '</label>' +
        '<label class="randgen-checkbox-label">' +
          '<input type="checkbox" class="randgen-checkbox" id="randgenSorted" /> 排序' +
        '</label>' +
      '</div>' +
      '<button class="randgen-generate-btn" id="randgenGenerateBtn">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M4 17l4-8 4 8"/><path d="M15 17V9l3 4 3-4v8"/></svg>' +
        '生成随机数' +
      '</button>' +
      '<div class="randgen-result-box" id="randgenResultBox">' +
        '<span class="randgen-result-empty">点击上方按钮生成随机数</span>' +
      '</div>';

    // 绑定事件
    var btn = getEl('randgenGenerateBtn', container);
    if(btn){
      btn.addEventListener('click', function(){ generateNumbers(container); });
    }
    // 回车触发
    var inputs = [getEl('randgenMin', container), getEl('randgenMax', container), getEl('randgenCount', container)];
    inputs.forEach(function(inp){
      if(inp){
        inp.addEventListener('keydown', function(e){
          if(e.key === 'Enter') generateNumbers(container);
        });
      }
    });
  }

  function generateNumbers(container){
    var minEl = getEl('randgenMin', container);
    var maxEl = getEl('randgenMax', container);
    var countEl = getEl('randgenCount', container);
    var uniqueEl = getEl('randgenUnique', container);
    var sortedEl = getEl('randgenSorted', container);
    var resultBox = getEl('randgenResultBox', container);
    if(!resultBox) return;

    var min = parseInt(minEl ? minEl.value : 1, 10);
    var max = parseInt(maxEl ? maxEl.value : 100, 10);
    var count = parseInt(countEl ? countEl.value : 1, 10);
    var unique = uniqueEl ? uniqueEl.checked : false;
    var sorted = sortedEl ? sortedEl.checked : false;

    if(isNaN(min) || isNaN(max) || isNaN(count)){
      resultBox.innerHTML = '<span class="randgen-result-empty" style="color:#ef4444;">请输入有效的数字</span>';
      return;
    }

    if(min > max){
      resultBox.innerHTML = '<span class="randgen-result-empty" style="color:#ef4444;">最小值不能大于最大值</span>';
      return;
    }

    if(unique && (max - min + 1) < count){
      resultBox.innerHTML = '<span class="randgen-result-empty" style="color:#ef4444;">范围内不重复的数不够</span>';
      return;
    }

    if(count > 100) count = 100;
    if(count < 1) count = 1;

    var results = [];
    if(unique){
      // 不重复
      var pool = [];
      for(var i = min; i <= max; i++) pool.push(i);
      for(var j = 0; j < count && pool.length > 0; j++){
        var idx = Math.floor(secureRandom() * pool.length);
        results.push(pool[idx]);
        pool.splice(idx, 1);
      }
    } else {
      for(var k = 0; k < count; k++){
        results.push(randInt(min, max));
      }
    }

    if(sorted) results.sort(function(a, b){ return a - b; });

    renderNumberResult(resultBox, results, min, max);
    addHistory('随机数 [' + min + '~' + max + '] x' + count + ' → ' + results.slice(0, 5).join(', ') + (results.length > 5 ? '...' : ''));
  }

  function renderNumberResult(resultBox, results, min, max){
    if(results.length === 0){
      resultBox.innerHTML = '<span class="randgen-result-empty">无结果</span>';
      return;
    }

    var sum = results.reduce(function(a, b){ return a + b; }, 0);
    var avg = sum / results.length;

    var numsHtml = results.map(function(n){
      return '<span class="randgen-result-num">' + n + '</span>';
    }).join('');

    resultBox.innerHTML = numsHtml +
      '<div class="randgen-result-stats">' +
        '<span class="randgen-stat-item">总和 <span class="randgen-stat-value">' + sum + '</span></span>' +
        '<span class="randgen-stat-item">平均 <span class="randgen-stat-value">' + avg.toFixed(2) + '</span></span>' +
        '<span class="randgen-stat-item">范围 <span class="randgen-stat-value">' + min + '~' + max + '</span></span>' +
      '</div>';
  }

  // -------- 骰子模式 --------
  function renderDiceMode(container){
    var content = getEl('randgenContent', container);
    if(!content) return;
    content.innerHTML =
      '<div class="randgen-control-row">' +
        '<span class="randgen-label">骰子</span>' +
        '<div class="randgen-custom-select" id="randgenDiceSelect">' +
          '<div class="randgen-select-display">' +
            '<span class="randgen-select-text" id="randgenDiceSelectText">D6（六面）</span>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="6 9 12 15 18 9"/></svg>' +
          '</div>' +
          '<div class="randgen-select-dropdown" id="randgenDiceSelectDropdown">' +
            '<div class="randgen-select-option active" data-value="d6">D6（六面）</div>' +
            '<div class="randgen-select-option" data-value="d4">D4（四面）</div>' +
            '<div class="randgen-select-option" data-value="d8">D8（八面）</div>' +
            '<div class="randgen-select-option" data-value="d10">D10（十面）</div>' +
            '<div class="randgen-select-option" data-value="d12">D12（十二面）</div>' +
            '<div class="randgen-select-option" data-value="d20">D20（二十面）</div>' +
            '<div class="randgen-select-option" data-value="d100">D100（百面）</div>' +
          '</div>' +
        '</div>' +
        '<span class="randgen-label" style="min-width:30px;text-align:center;">×</span>' +
        '<input type="number" class="randgen-input" id="randgenDiceCount" value="1" min="1" max="20" style="width:50px;" />' +
      '</div>' +
      '<button class="randgen-generate-btn" id="randgenDiceBtn">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>' +
        '掷骰子' +
      '</button>' +
      '<div class="randgen-dice-area" id="randgenDiceArea"></div>' +
      '<div class="randgen-result-box" id="randgenDiceResultBox">' +
        '<span class="randgen-result-empty">点击按钮掷骰子</span>' +
      '</div>';

    // 绑定自定义下拉栏
    bindCustomSelect(container, 'randgenDiceSelect', 'randgenDiceSelectText', 'randgenDiceSelectDropdown');

    var btn = getEl('randgenDiceBtn', container);
    if(btn){
      btn.addEventListener('click', function(){ rollDice(container); });
    }
    var diceInput = getEl('randgenDiceCount', container);
    if(diceInput){
      diceInput.addEventListener('keydown', function(e){
        if(e.key === 'Enter') rollDice(container);
      });
    }
  }

  function bindCustomSelect(container, selectId, textId, dropdownId){
    var select = getEl(selectId, container);
    var text = getEl(textId, container);
    var dropdown = getEl(dropdownId, container);
    if(!select || !text || !dropdown) return;

    // 点击显示/隐藏下拉
    select.addEventListener('click', function(e){
      e.stopPropagation();
      var isOpen = dropdown.classList.contains('open');
      // 关闭所有其他下拉
      document.querySelectorAll('.randgen-select-dropdown.open').forEach(function(d){
        d.classList.remove('open');
      });
      if(!isOpen){
        dropdown.classList.add('open');
      }
    });

    // 选项点击
    dropdown.querySelectorAll('.randgen-select-option').forEach(function(opt){
      opt.addEventListener('click', function(e){
        e.stopPropagation();
        var value = this.getAttribute('data-value');
        text.textContent = this.textContent;
        // 更新active状态
        dropdown.querySelectorAll('.randgen-select-option').forEach(function(o){
          o.classList.remove('active');
        });
        this.classList.add('active');
        dropdown.classList.remove('open');
      });
    });

    // 点击外部关闭
    document.addEventListener('click', function(){
      dropdown.classList.remove('open');
    });
  }

  function rollDice(container){
    var selectText = getEl('randgenDiceSelectText', container);
    var countEl = getEl('randgenDiceCount', container);
    var diceArea = getEl('randgenDiceArea', container);
    var resultBox = getEl('randgenDiceResultBox', container);

    // 从显示文本中获取骰子类型
    var displayText = selectText ? selectText.textContent : 'D6（六面）';
    var diceType = 'd6';
    if(displayText.indexOf('D4') !== -1) diceType = 'd4';
    else if(displayText.indexOf('D6') !== -1) diceType = 'd6';
    else if(displayText.indexOf('D8') !== -1) diceType = 'd8';
    else if(displayText.indexOf('D10') !== -1) diceType = 'd10';
    else if(displayText.indexOf('D12') !== -1) diceType = 'd12';
    else if(displayText.indexOf('D20') !== -1) diceType = 'd20';
    else if(displayText.indexOf('D100') !== -1) diceType = 'd100';
    var count = parseInt(countEl ? countEl.value : 1, 10);
    if(isNaN(count) || count < 1) count = 1;
    if(count > 20) count = 20;

    var sides = parseInt(diceType.substring(1), 10);

    // 骰子动画 - 先显示问号
    if(diceArea){
      var placeholders = [];
      for(var i = 0; i < count; i++){
        placeholders.push('<div class="randgen-dice rolling">?</div>');
      }
      diceArea.innerHTML = placeholders.join('');
    }
    if(resultBox){
      resultBox.innerHTML = '<span class="randgen-result-empty">掷骰中...</span>';
    }

    // 延迟模拟掷骰效果
    setTimeout(function(){
      var results = [];
      for(var i = 0; i < count; i++){
        results.push(randInt(1, sides));
      }
      var sum = results.reduce(function(a, b){ return a + b; }, 0);

      if(diceArea){
        diceArea.innerHTML = results.map(function(r){
          return '<div class="randgen-dice">' + r + '</div>';
        }).join('') +
        '<span class="randgen-dice-sum">总和: ' + sum + '</span>';
      }

      if(resultBox){
        resultBox.innerHTML = results.map(function(r){
          return '<span class="randgen-result-num">' + r + '</span>';
        }).join('') +
        '<div class="randgen-result-stats">' +
          '<span class="randgen-stat-item">骰子 <span class="randgen-stat-value">' + count + diceType + '</span></span>' +
          '<span class="randgen-stat-item">总和 <span class="randgen-stat-value">' + sum + '</span></span>' +
          '<span class="randgen-stat-item">平均 <span class="randgen-stat-value">' + (sum / count).toFixed(2) + '</span></span>' +
        '</div>';
      }

      addHistory('掷骰 ' + count + diceType + ' → ' + results.join(', ') + ' (总和: ' + sum + ')');
    }, 400);
  }

  // -------- 硬币模式 --------
  function renderCoinMode(container){
    var content = getEl('randgenContent', container);
    if(!content) return;
    content.innerHTML =
      '<div class="randgen-coin-result">' +
        '<div class="randgen-coin" id="randgenCoin">' +
          '<svg viewBox="0 0 100 100" style="width:50px;height:50px;">' +
            '<defs>' +
              '<radialGradient id="coinGrad" cx="50%" cy="40%" r="60%">' +
                '<stop offset="0%" stop-color="#f5e6a3"/>' +
                '<stop offset="60%" stop-color="#d4a017"/>' +
                '<stop offset="100%" stop-color="#b8860b"/>' +
              '</radialGradient>' +
            '</defs>' +
            '<circle cx="50" cy="50" r="45" fill="url(#coinGrad)" stroke="#8b6914" stroke-width="2"/>' +
            '<circle cx="50" cy="50" r="38" fill="none" stroke="#8b6914" stroke-width="1.5" opacity="0.6"/>' +
            '<text x="50" y="58" text-anchor="middle" font-size="36" font-weight="bold" fill="#8b6914" font-family="serif">?</text>' +
          '</svg>' +
        '</div>' +
        '<div class="randgen-coin-text" id="randgenCoinText">点击下方按钮抛硬币</div>' +
      '</div>' +
      '<div class="randgen-control-row" style="justify-content:center;">' +
        '<label class="randgen-checkbox-label">' +
          '<input type="checkbox" class="randgen-checkbox" id="randgenCoinFlipAnim" checked /> 翻转动画' +
        '</label>' +
      '</div>' +
      '<div class="randgen-control-row" style="justify-content:center;">' +
        '<button class="randgen-generate-btn" id="randgenCoinBtn">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 10"/></svg>' +
          '抛硬币' +
        '</button>' +
      '</div>' +
      '<div class="randgen-result-box" id="randgenCoinResult" style="min-height:30px;padding:10px 16px;">' +
        '<span class="randgen-result-empty">点击按钮抛硬币</span>' +
      '</div>';

    var btn = getEl('randgenCoinBtn', container);
    if(btn){
      btn.addEventListener('click', function(){ flipCoin(container); });
    }
  }

  function flipCoin(container){
    var coin = getEl('randgenCoin', container);
    var text = getEl('randgenCoinText', container);
    var animCb = getEl('randgenCoinFlipAnim', container);
    var resultBox = getEl('randgenCoinResult', container);

    var result = secureRandom() >= 0.5 ? '正面' : '反面';
    var isHeads = result === '正面';

    if(animCb && animCb.checked){
      // 带翻转动画
      if(coin){
        coin.classList.add('flipping');
        coin.innerHTML = isHeads
          ? '<svg viewBox="0 0 100 100" style="width:50px;height:50px;">' +
              '<defs><radialGradient id="coinGradH" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#f5e6a3"/><stop offset="60%" stop-color="#d4a017"/><stop offset="100%" stop-color="#b8860b"/></radialGradient></defs>' +
              '<circle cx="50" cy="50" r="45" fill="url(#coinGradH)" stroke="#8b6914" stroke-width="2"/>' +
              '<circle cx="50" cy="50" r="38" fill="none" stroke="#8b6914" stroke-width="1.5" opacity="0.6"/>' +
              '<text x="50" y="60" text-anchor="middle" font-size="40" font-weight="bold" fill="#8b6914" font-family="serif">正</text>' +
            '</svg>'
          : '<svg viewBox="0 0 100 100" style="width:50px;height:50px;">' +
              '<defs><radialGradient id="coinGradT" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#f5e6a3"/><stop offset="60%" stop-color="#d4a017"/><stop offset="100%" stop-color="#b8860b"/></radialGradient></defs>' +
              '<circle cx="50" cy="50" r="45" fill="url(#coinGradT)" stroke="#8b6914" stroke-width="2"/>' +
              '<circle cx="50" cy="50" r="38" fill="none" stroke="#8b6914" stroke-width="1.5" opacity="0.6"/>' +
              '<text x="50" y="60" text-anchor="middle" font-size="40" font-weight="bold" fill="#8b6914" font-family="serif">反</text>' +
            '</svg>';
      }
      if(text) text.textContent = '抛掷中...';

      var tally = { 正面: 0, 反面: 0 };
      var historyEntries = getCoinHistory();
      historyEntries.forEach(function(h){ tally[h] = (tally[h] || 0) + 1; });
      var headsPct = historyEntries.length > 0 ? ((tally['正面'] || 0) / historyEntries.length * 100).toFixed(1) : 0;

      setTimeout(function(){
        if(coin) coin.classList.remove('flipping');
        if(text) text.textContent = result + '！';

        if(resultBox){
          resultBox.innerHTML = '<span class="randgen-result-num" style="font-size:16px;">' + result + '</span>' +
            '<div class="randgen-result-stats">' +
              '<span class="randgen-stat-item">正面 <span class="randgen-stat-value">' + (tally['正面'] || 0) + ' 次</span></span>' +
              '<span class="randgen-stat-item">反面 <span class="randgen-stat-value">' + (tally['反面'] || 0) + ' 次</span></span>' +
              '<span class="randgen-stat-item">历史 <span class="randgen-stat-value">' + (historyEntries.length + 1) + ' 次</span></span>' +
            '</div>';
        }

        addHistory('抛硬币 → ' + result);
      }, 700);
    } else {
      // 无动画
      if(coin){
        coin.innerHTML = isHeads
          ? '<svg viewBox="0 0 100 100" style="width:50px;height:50px;">' +
              '<defs><radialGradient id="coinGradH2" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#f5e6a3"/><stop offset="60%" stop-color="#d4a017"/><stop offset="100%" stop-color="#b8860b"/></radialGradient></defs>' +
              '<circle cx="50" cy="50" r="45" fill="url(#coinGradH2)" stroke="#8b6914" stroke-width="2"/>' +
              '<circle cx="50" cy="50" r="38" fill="none" stroke="#8b6914" stroke-width="1.5" opacity="0.6"/>' +
              '<text x="50" y="60" text-anchor="middle" font-size="40" font-weight="bold" fill="#8b6914" font-family="serif">正</text>' +
            '</svg>'
          : '<svg viewBox="0 0 100 100" style="width:50px;height:50px;">' +
              '<defs><radialGradient id="coinGradT2" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#f5e6a3"/><stop offset="60%" stop-color="#d4a017"/><stop offset="100%" stop-color="#b8860b"/></radialGradient></defs>' +
              '<circle cx="50" cy="50" r="45" fill="url(#coinGradT2)" stroke="#8b6914" stroke-width="2"/>' +
              '<circle cx="50" cy="50" r="38" fill="none" stroke="#8b6914" stroke-width="1.5" opacity="0.6"/>' +
              '<text x="50" y="60" text-anchor="middle" font-size="40" font-weight="bold" fill="#8b6914" font-family="serif">反</text>' +
            '</svg>';
      }
      if(text) text.textContent = result + '！';

      var tally2 = { 正面: 0, 反面: 0 };
      var hist2 = getCoinHistory();
      hist2.forEach(function(h){ tally2[h] = (tally2[h] || 0) + 1; });

      if(resultBox){
        resultBox.innerHTML = '<span class="randgen-result-num" style="font-size:16px;">' + result + '</span>' +
          '<div class="randgen-result-stats">' +
            '<span class="randgen-stat-item">正面 <span class="randgen-stat-value">' + (tally2['正面'] || 0) + ' 次</span></span>' +
            '<span class="randgen-stat-item">反面 <span class="randgen-stat-value">' + (tally2['反面'] || 0) + ' 次</span></span>' +
          '</div>';
      }

      addHistory('抛硬币 → ' + result);
    }
  }

  function getCoinHistory(){
    return history.filter(function(h){ return h.indexOf('抛硬币') === 0; }).map(function(h){
      return h.indexOf('正面') !== -1 ? '正面' : '反面';
    });
  }

  // -------- 历史记录 --------
  function addHistory(entry){
    history.unshift(entry);
    if(history.length > MAX_HISTORY) history.pop();
    renderHistory();
  }

  function renderHistory(){
    // 在内容区底部渲染历史
    var content = getEl('randgenContent', container);
    if(!content) return;
    // 移除旧的历史
    var oldHist = content.querySelector('.randgen-history');
    if(oldHist) oldHist.parentNode.removeChild(oldHist);

    if(history.length === 0) return;

    var histDiv = document.createElement('div');
    histDiv.className = 'randgen-history';
    histDiv.innerHTML =
      '<div class="randgen-history-title">历史记录</div>' +
      '<div class="randgen-history-list">' +
        history.slice(0, 8).map(function(h){
          return '<span class="randgen-history-tag">' + escapeHtml(h) + '</span>';
        }).join('') +
      '</div>';
    content.appendChild(histDiv);
  }

  function escapeHtml(str){
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // -------- 模式切换 --------
  function switchMode(container, mode){
    currentMode = mode;
    var bar = getEl('randgenModeBar', container);
    if(bar){
      bar.querySelectorAll('.randgen-mode-btn').forEach(function(btn){
        btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
      });
    }

    if(mode === 'number') renderNumberMode(container);
    else if(mode === 'dice') renderDiceMode(container);
    else if(mode === 'coin') renderCoinMode(container);

    var content = getEl('randgenContent', container);
    if(content){
      // 重新添加历史
      renderHistory();
    }
  }

  function bindEvents(container){
    var bar = getEl('randgenModeBar', container);
    if(bar){
      bar.querySelectorAll('.randgen-mode-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          var mode = this.getAttribute('data-mode');
          switchMode(container, mode);
        });
      });
    }
  }

  // 在 addhistory 中引用 container
  var container = null;

  function showDialog(){
    if(dialogEl) return;
    if(!WW.addons.randomGenerator.htmlTemplate) return;

    overlayEl = document.createElement('div');
    overlayEl.className = 'modal-overlay';

    dialogEl = document.createElement('div');
    dialogEl.className = 'modal randgen-modal';
    dialogEl.innerHTML =
      '<div class="modal-head">' +
        '<span><i class="addon-icon addon-icon-randgen" style="width:16px;height:16px;vertical-align:-3px;margin-right:6px;"></i>随机工具</span>' +
        '<button class="modal-close" id="randgenDialogClose"><i class="addon-icon addon-icon-close"></i></button>' +
      '</div>' +
      '<div class="modal-body addon-modal-body">' +
        WW.addons.randomGenerator.htmlTemplate +
      '</div>';

    overlayEl.appendChild(dialogEl);
    document.body.appendChild(overlayEl);

    if(!styleEl || !styleEl.parentNode){
      styleEl = document.createElement('link');
      styleEl.rel = 'stylesheet';
      styleEl.href = '/addons/official/random-generator/style.css';
      document.head.appendChild(styleEl);
    }

    requestAnimationFrame(function(){
      overlayEl.classList.add('show');
    });

    var closeBtn = getEl('randgenDialogClose');
    if(closeBtn){
      closeBtn.addEventListener('click', closeDialog);
    }

    overlayEl.addEventListener('click', function(e){
      if(e.target === overlayEl) closeDialog();
    });

    // 初始化
    container = dialogEl;
    currentMode = 'number';
    renderNumberMode(dialogEl);
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
        container = null;
      }, 300);
    }
    var btn = document.querySelector('.addon-activate-btn[data-addon-id="random-generator"]');
    if(btn) btn.textContent = '装载';
  }

  // 注册到统一调度器
  Addons._handlers = Addons._handlers || {};

  Addons._handlers['random-generator'] = {
    activate: function(){
      showDialog();
      var btn = document.querySelector('.addon-activate-btn[data-addon-id="random-generator"]');
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
      if(Addons._handlers[addonId]){
        Addons._handlers[addonId].activate();
      }
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
        if(Addons._handlers[key] && Addons._handlers[key].close){
          Addons._handlers[key].close();
        }
      }
    };
  }
})();
