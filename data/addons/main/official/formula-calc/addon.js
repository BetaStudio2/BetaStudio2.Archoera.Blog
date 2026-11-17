(function(){
  var WW = window.WebWord = window.WebWord || {};
  var Addons = WW.addons = WW.addons || {};

  var overlayEl = null;
  var dialogEl = null;
  var styleEl = null;

  function getEl(id, container){
    return (container || document).querySelector('#' + id);
  }

  // -------- 表达式解析器 (递归下降) --------
  var _expr = '';
  var _pos = 0;
  var _ch = '';

  function initParser(expr){
    _expr = expr.replace(/\s/g, '');
    _pos = 0;
    _ch = _expr.length > 0 ? _expr[0] : '';
  }

  function peek(){ return _ch; }
  function next(){
    _pos++;
    _ch = _pos < _expr.length ? _expr[_pos] : '';
  }

  function parseError(msg){
    throw new Error(msg + ' at position ' + _pos);
  }

  // 解析顶层
  function parseExpression(){
    var result = parseTerm();
    while(peek() === '+' || peek() === '-'){
      var op = peek(); next();
      var right = parseTerm();
      if(op === '+') result += right;
      else result -= right;
    }
    return result;
  }

  function parseTerm(){
    var result = parsePower();
    while(peek() === '*' || peek() === '/'){
      var op = peek(); next();
      var right = parsePower();
      if(op === '*') result *= right;
      else {
        if(right === 0) parseError('Division by zero');
        result /= right;
      }
    }
    return result;
  }

  function parsePower(){
    var result = parseUnary();
    if(peek() === '^'){
      next();
      var right = parseUnary();
      result = Math.pow(result, right);
    }
    return result;
  }

  function parseUnary(){
    if(peek() === '-'){
      next();
      return -parseAtom();
    }
    if(peek() === '+'){
      next();
      return parseAtom();
    }
    return parseAtom();
  }

  function parseAtom(){
    // 函数调用
    var func = '';
    while((peek() >= 'a' && peek() <= 'z') || (peek() >= 'A' && peek() <= 'Z')){
      func += peek(); next();
    }
    if(func){
      if(func === 'pi') return Math.PI;
      if(func === 'e') return Math.E;
      if(peek() === '('){
        next(); // (
        var arg = parseExpression();
        if(peek() !== ')') parseError('Missing closing parenthesis');
        next(); // )
        switch(func){
          case 'sin': return Math.sin(arg);
          case 'cos': return Math.cos(arg);
          case 'tan': return Math.tan(arg);
          case 'log': return Math.log10(arg);
          case 'ln':  return Math.log(arg);
          case 'sqrt': return Math.sqrt(arg);
          case 'abs':  return Math.abs(arg);
          case 'ceil': return Math.ceil(arg);
          case 'floor': return Math.floor(arg);
          case 'round': return Math.round(arg);
          default: parseError('Unknown function: ' + func);
        }
      } else {
        parseError('Expected ( after ' + func);
      }
    }

    // 括号
    if(peek() === '('){
      next();
      var result = parseExpression();
      if(peek() !== ')') parseError('Missing closing parenthesis');
      next();
      return result;
    }

    // 数字
    var num = '';
    while((peek() >= '0' && peek() <= '9') || peek() === '.'){
      num += peek(); next();
    }
    if(num === '') parseError('Expected number or function');
    return parseFloat(num);
  }

  function calculate(expr){
    try{
      initParser(expr);
      var result = parseExpression();
      if(_pos < _expr.length) parseError('Unexpected character: ' + peek());
      return { value: result, error: null };
    } catch(e){
      return { value: null, error: e.message };
    }
  }

  // -------- 公式模板 --------
  var FORMULA_TEMPLATES = [
    { symbol: 'Δx = v₀t + ½at²', name: '匀变速位移', formula: 'v0*t + 0.5*a*t^2', vars: ['v0', 't', 'a'] },
    { symbol: 'v = v₀ + at', name: '匀变速速度', formula: 'v0 + a*t', vars: ['v0', 'a', 't'] },
    { symbol: 'F = ma', name: '牛顿第二定律', formula: 'm*a', vars: ['m', 'a'] },
    { symbol: 'E_k = ½mv²', name: '动能', formula: '0.5*m*v^2', vars: ['m', 'v'] },
    { symbol: 'E_p = mgh', name: '重力势能', formula: 'm*g*h', vars: ['m', 'g', 'h'] },
    { symbol: 'W = Fd cosθ', name: '功', formula: 'F*d*cos(theta)', vars: ['F', 'd', 'theta'] },
    { symbol: 'P = W/t', name: '功率', formula: 'W/t', vars: ['W', 't'] },
    { symbol: 'F = kx', name: '胡克定律', formula: 'k*x', vars: ['k', 'x'] },
    { symbol: 'p = mv', name: '动量', formula: 'm*v', vars: ['m', 'v'] },
    { symbol: 'F = G·m₁m₂/r²', name: '万有引力', formula: 'G*m1*m2/r^2', vars: ['G', 'm1', 'm2', 'r'] },
    { symbol: 'E = mc²', name: '质能方程', formula: 'm*c^2', vars: ['m', 'c'] },
    { symbol: 'PV = nRT', name: '理想气体状态', formula: 'n*R*T', vars: ['n', 'R', 'T'] },
    { symbol: 'V = IR', name: '欧姆定律', formula: 'I*R', vars: ['I', 'R'] },
    { symbol: 'P = I²R', name: '电功率', formula: 'I^2*R', vars: ['I', 'R'] },
    { symbol: 'F = qE', name: '电场力', formula: 'q*E', vars: ['q', 'E'] },
    { symbol: 'F = qvB', name: '洛伦兹力', formula: 'q*v*B', vars: ['q', 'v', 'B'] },
    { symbol: 'T = 2π√(L/g)', name: '单摆周期', formula: '2*pi*sqrt(L/g)', vars: ['L', 'g'] },
    { symbol: 'λ = h/p', name: '德布罗意波长', formula: 'h/p', vars: ['h', 'p'] },
    { symbol: 'E = hf', name: '光子能量', formula: 'h*f', vars: ['h', 'f'] },
    { symbol: 'c = λf', name: '波速公式', formula: 'lambda*f', vars: ['lambda', 'f'] },
    { symbol: 'n₁sinθ₁ = n₂sinθ₂', name: '斯涅尔定律', formula: 'n1*sin(theta1)/sin(theta2)', vars: ['n1', 'theta1', 'theta2'] },
    { symbol: 'Q = mcΔT', name: '比热容', formula: 'm*c*deltaT', vars: ['m', 'c', 'deltaT'] },
    { symbol: 'Q = mL', name: '相变潜热', formula: 'm*L', vars: ['m', 'L'] }
  ];

  // -------- 显示逻辑 --------
  var displayExpr = '';
  var displayValue = '0';
  var currentTemplate = null;

  function updateDisplay(){
    var exprEl = getEl('fcalcExpr');
    var resultEl = getEl('fcalcResult');
    if(exprEl) exprEl.textContent = displayExpr;
    if(resultEl){
      resultEl.textContent = displayValue;
      resultEl.classList.toggle('error', displayValue === '错误');
    }
  }

  function inputChar(container, val){
    if(val === 'clear'){
      displayExpr = '';
      displayValue = '0';
      updateDisplay();
      return;
    }
    if(val === '='){
      if(displayExpr.trim() === '') return;
      var result = calculate(displayExpr);
      if(result.error){
        displayValue = '错误';
        updateDisplay();
        var resEl = getEl('fcalcResult');
        if(resEl){
          resEl.textContent = result.error;
          resEl.classList.add('error');
        }
      } else {
        displayValue = formatCalcResult(result.value);
        displayExpr = displayValue;
        updateDisplay();
      }
      return;
    }
    displayExpr += val;
    displayValue = displayExpr;
    updateDisplay();
  }

  function formatCalcResult(val){
    if(!isFinite(val)) return '无穷';
    if(Math.abs(val) >= 1e12 || (Math.abs(val) < 1e-6 && val !== 0)){
      return val.toExponential(6);
    }
    var str = val.toPrecision(10);
    if(str.indexOf('.') !== -1) str = str.replace(/\.?0+$/, '');
    return str;
  }

  function renderTemplates(container, searchText){
    var list = getEl('fcalcTemplateList', container);
    if(!list) return;

    var filtered = FORMULA_TEMPLATES;
    if(searchText){
      var kw = searchText.toLowerCase();
      filtered = FORMULA_TEMPLATES.filter(function(t){
        return t.name.toLowerCase().indexOf(kw) !== -1 ||
               t.symbol.toLowerCase().indexOf(kw) !== -1;
      });
    }

    list.innerHTML = '';
    filtered.forEach(function(t){
      var item = document.createElement('div');
      item.className = 'fcalc-template-item';
      item.innerHTML =
        '<span class="fcalc-template-symbol">' + t.symbol.replace(/->/g, '→').split('=')[0] + '</span>' +
        '<span class="fcalc-template-name">' + t.name + '</span>' +
        '<span class="fcalc-template-formula">' + t.formula + '</span>';
      item.addEventListener('click', function(){
        openVarPanel(container, t);
      });
      item.setAttribute('data-formula', t.formula);
      list.appendChild(item);
    });
  }

  function openVarPanel(container, template){
    currentTemplate = template;
    var calcPanel = getEl('fcalcCalcPanel', container);
    var tplPanel = getEl('fcalcTemplatesPanel', container);
    var varPanel = getEl('fcalcVarPanel', container);
    var tabs = getEl('fcalcTabs', container);

    if(tabs) tabs.style.display = 'none';
    if(calcPanel) calcPanel.style.display = 'none';
    if(tplPanel) tplPanel.style.display = 'none';
    if(varPanel) varPanel.style.display = '';

    var title = getEl('fcalcVarTitle', container);
    if(title) title.textContent = template.name + ' (' + template.symbol + ')';

    var list = getEl('fcalcVarList', container);
    if(!list) return;

    list.innerHTML = '';
    var varNames = template.vars || [];
    var varLabels = {
      'm': '质量', 'v': '速度', 'F': '力', 'a': '加速度', 't': '时间',
      's': '位移', 'd': '距离', 'r': '半径', 'h': '高度', 'l': '长度',
      'V': '电压', 'I': '电流', 'R': '电阻', 'P': '功率', 'E': '能量',
      'U': '电压', 'W': '功', 'Q': '热量', 'T': '温度', 'p': '压强',
      'n': '物质的量', 'c': '光速', 'f': '频率', 'λ': '波长', 'k': '常数',
      'g': '重力加速度', 'ρ': '密度', 'μ': '摩擦系数', 'θ': '角度',
      'omega': '角速度', 'alpha': '角加速度', 'L': '电感/摆长', 'C': '电容/比热',
      'B': '磁场', 'G': '引力常数', 'M': '质量', 'e': '元电荷',
      'h_planck': '普朗克常数', 'epsilon': '介电常数', 'sigma': '斯特藩常数',
      'N': '数量', 'A': '面积', 'J': '转动惯量', 'tau': '力矩',
      'lambda_deco': '衰减常数', 'Delta': '变化量', 'eta': '效率', 'Phi': '磁通量',
      'q': '电荷', 'm1': '质量1', 'm2': '质量2', 'v1': '速度1', 'v2': '速度2',
      'r1': '半径1', 'r2': '半径2', 'd1': '距离1', 'd2': '距离2',
      'h1': '高度1', 'h2': '高度2', 'l1': '长度1', 'l2': '长度2',
      'T1': '温度1', 'T2': '温度2', 'p1': '压强1', 'p2': '压强2',
      'V1': '体积1', 'V2': '体积2', 'n1': '物质的量1', 'n2': '物质的量2',
      'v0': '初速度', 'theta': '角度', 'lambda': '波长', 'x': '位移/伸长量',
      'h': '普朗克常数/高度', 'p': '动量'
    };
    var varUnits = {
      'm': 'kg', 'v': 'm/s', 'F': 'N', 'a': 'm/s²', 't': 's',
      's': 'm', 'd': 'm', 'r': 'm', 'h': 'm', 'l': 'm',
      'V': 'V', 'I': 'A', 'R': 'Ω', 'P': 'W', 'E': 'J',
      'U': 'V', 'W': 'J', 'Q': 'J', 'T': 'K', 'p': 'Pa',
      'n': 'mol', 'c': 'm/s', 'f': 'Hz', 'λ': 'm', 'k': '',
      'g': 'm/s²', 'ρ': 'kg/m³', 'μ': '', 'θ': 'rad',
      'omega': 'rad/s', 'alpha': 'rad/s²', 'L': 'H/m', 'C': 'F/J/(kg·K)',
      'B': 'T', 'G': 'N·m²/kg²', 'M': 'kg', 'e': 'C',
      'h_planck': 'J·s', 'epsilon': 'F/m', 'sigma': 'W/(m²·K⁴)',
      'N': '', 'A': 'm²', 'J': 'kg·m²', 'tau': 'N·m',
      'lambda_deco': 's⁻¹', 'Delta': '', 'eta': '', 'Phi': 'Wb',
      'q': 'C', 'm1': 'kg', 'm2': 'kg', 'v1': 'm/s', 'v2': 'm/s',
      'r1': 'm', 'r2': 'm', 'd1': 'm', 'd2': 'm',
      'h1': 'm', 'h2': 'm', 'l1': 'm', 'l2': 'm',
      'T1': 'K', 'T2': 'K', 'p1': 'Pa', 'p2': 'Pa',
      'V1': 'm³', 'V2': 'm³', 'n1': 'mol', 'n2': 'mol',
      'v0': 'm/s', 'theta': 'rad', 'lambda': 'm', 'x': 'm',
      'h': 'J·s/m', 'p': 'kg·m/s'
    };

    varNames.forEach(function(v){
      var item = document.createElement('div');
      item.className = 'fcalc-var-item';
      var label = varLabels[v] || v;
      var unit = varUnits[v] || '';
      item.innerHTML =
        '<span class="fcalc-var-label">' + v + ' (' + label + ')</span>' +
        '<input type="text" class="fcalc-var-input" data-var="' + v + '" placeholder="输入数值" />' +
        (unit ? '<span class="fcalc-var-unit">' + unit + '</span>' : '');
      list.appendChild(item);
    });

    // 聚焦第一个输入框
    setTimeout(function(){
      var firstInput = list.querySelector('.fcalc-var-input');
      if(firstInput) firstInput.focus();
    }, 100);
  }

  function closeVarPanel(container){
    currentTemplate = null;
    var calcPanel = getEl('fcalcCalcPanel', container);
    var tplPanel = getEl('fcalcTemplatesPanel', container);
    var varPanel = getEl('fcalcVarPanel', container);
    var tabs = getEl('fcalcTabs', container);

    if(tabs) tabs.style.display = '';
    if(calcPanel) calcPanel.style.display = '';
    if(tplPanel) tplPanel.style.display = 'none';
    if(varPanel) varPanel.style.display = 'none';
  }

  function calcVarPanel(container){
    if(!currentTemplate) return;

    var inputs = container.querySelectorAll('.fcalc-var-input');
    var varValues = {};
    var allFilled = true;

    inputs.forEach(function(input){
      var varName = input.getAttribute('data-var');
      var val = input.value.trim();
      if(!val){
        allFilled = false;
        input.style.borderColor = '#ef4444';
      } else {
        input.style.borderColor = '#2a3040';
        varValues[varName] = parseFloat(val);
      }
    });

    if(!allFilled){
      var resultEl = getEl('fcalcResult', container);
      if(resultEl){
        resultEl.textContent = '请填写所有变量';
        resultEl.classList.add('error');
      }
      return;
    }

    // 构建表达式并计算
    var formula = currentTemplate.formula;
    var evalExpr = formula;

    // 替换变量
    var varNames = Object.keys(varValues).sort(function(a, b){ return b.length - a.length; });
    varNames.forEach(function(v){
      var regex = new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      evalExpr = evalExpr.replace(regex, '(' + varValues[v] + ')');
    });

    try {
      initParser(evalExpr);
      var result = parseExpression();
      var resultEl = getEl('fcalcResult', container);
      if(resultEl){
        resultEl.textContent = formatCalcResult(result);
        resultEl.classList.remove('error');
      }
      displayExpr = formula + ' = ' + formatCalcResult(result);
      displayValue = formatCalcResult(result);
      updateDisplay();
    } catch(e){
      var resultEl = getEl('fcalcResult', container);
      if(resultEl){
        resultEl.textContent = '计算错误: ' + e.message;
        resultEl.classList.add('error');
      }
    }
  }

  function switchTab(container, tab){
    var bar = getEl('fcalcTabs', container);
    if(bar){
      bar.querySelectorAll('.fcalc-tab').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-tab') === tab);
      });
    }
    var calcPanel = getEl('fcalcCalcPanel', container);
    var tplPanel = getEl('fcalcTemplatesPanel', container);
    if(calcPanel) calcPanel.style.display = tab === 'calc' ? '' : 'none';
    if(tplPanel) tplPanel.style.display = tab === 'templates' ? '' : 'none';
  }

  function bindEvents(container){
    // 按钮
    var buttons = container.querySelectorAll('.fcalc-btn');
    buttons.forEach(function(btn){
      btn.addEventListener('click', function(){
        var val = this.getAttribute('data-val');
        if(val) inputChar(container, val);
      });
    });

    // 键盘支持
    function handleKeyboard(e){
      var key = e.key;
      // 忽略弹窗关闭键
      if(key === 'Escape') return;

      if(key === 'Enter' || key === '='){
        e.preventDefault();
        inputChar(container, '=');
        return;
      }
      if(key === 'Backspace' || key === 'Delete'){
        e.preventDefault();
        displayExpr = displayExpr.slice(0, -1);
        displayValue = displayExpr || '0';
        updateDisplay();
        return;
      }
      if(key === 'Escape'){
        inputChar(container, 'clear');
        return;
      }
      // 允许的字符
      var allowed = '0123456789+-*/.^()';
      if(allowed.indexOf(key) !== -1 || key === ','){
        e.preventDefault();
        inputChar(container, key === ',' ? '.' : key);
        return;
      }
    }

    container.addEventListener('keydown', handleKeyboard);

    // Tab 切换
    var tabs = container.querySelectorAll('.fcalc-tab');
    tabs.forEach(function(tab){
      tab.addEventListener('click', function(){
        var t = this.getAttribute('data-tab');
        switchTab(container, t);
        if(t === 'templates'){
          renderTemplates(container, '');
        }
      });
    });

    // 模板搜索
    var searchInput = getEl('fcalcTemplateSearch', container);
    if(searchInput){
      searchInput.addEventListener('input', function(){
        renderTemplates(container, this.value.trim());
      });
    }

    // 变量面板返回按钮
    var backBtn = getEl('fcalcVarBack', container);
    if(backBtn){
      backBtn.addEventListener('click', function(){
        closeVarPanel(container);
        switchTab(container, 'templates');
      });
    }

    // 变量面板计算按钮
    var calcBtn = getEl('fcalcVarCalcBtn', container);
    if(calcBtn){
      calcBtn.addEventListener('click', function(){
        calcVarPanel(container);
      });
    }

    // 变量输入框回车计算
    container.addEventListener('keydown', function(e){
      if(e.target.classList.contains('fcalc-var-input') && e.key === 'Enter'){
        e.preventDefault();
        calcVarPanel(container);
      }
    });
  }

  function showDialog(){
    if(dialogEl) return;
    if(!WW.addons.formulaCalc.htmlTemplate) return;

    overlayEl = document.createElement('div');
    overlayEl.className = 'modal-overlay';

    dialogEl = document.createElement('div');
    dialogEl.className = 'modal fcalc-modal';
    dialogEl.innerHTML =
      '<div class="modal-head">' +
        '<span><i class="addon-icon addon-icon-fcalc" style="width:16px;height:16px;vertical-align:-3px;margin-right:6px;"></i>公式计算器</span>' +
        '<button class="modal-close" id="fcalcDialogClose"><i class="addon-icon addon-icon-close"></i></button>' +
      '</div>' +
      '<div class="modal-body addon-modal-body">' +
        WW.addons.formulaCalc.htmlTemplate +
      '</div>';

    overlayEl.appendChild(dialogEl);
    document.body.appendChild(overlayEl);

    if(!styleEl || !styleEl.parentNode){
      styleEl = document.createElement('link');
      styleEl.rel = 'stylesheet';
      styleEl.href = '/addons/official/formula-calc/style.css';
      document.head.appendChild(styleEl);
    }

    requestAnimationFrame(function(){
      overlayEl.classList.add('show');
    });

    var closeBtn = getEl('fcalcDialogClose');
    if(closeBtn){
      closeBtn.addEventListener('click', closeDialog);
    }

    overlayEl.addEventListener('click', function(e){
      if(e.target === overlayEl) closeDialog();
    });

    displayExpr = '';
    displayValue = '0';
    updateDisplay();
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
      }, 300);
    }
    var btn = document.querySelector('.addon-activate-btn[data-addon-id="formula-calc"]');
    if(btn) btn.textContent = '装载';
  }

  // 注册
  Addons._handlers = Addons._handlers || {};
  Addons._handlers['formula-calc'] = {
    activate: function(){
      showDialog();
      var btn = document.querySelector('.addon-activate-btn[data-addon-id="formula-calc"]');
      if(btn) btn.textContent = '卸载';
    },
    close: function(){ closeDialog(); },
    isActive: function(){ return !!dialogEl; }
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
