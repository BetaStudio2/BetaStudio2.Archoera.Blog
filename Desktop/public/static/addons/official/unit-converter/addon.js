(function(){
  var WW = window.WebWord = window.WebWord || {};
  var Addons = WW.addons = WW.addons || {};

  var overlayEl = null;
  var dialogEl = null;
  var styleEl = null;

  function getEl(id, container){
    return (container || document).querySelector('#' + id);
  }

  // -------- 单位换算数据 --------
  var UNIT_DEFS = {
    length: {
      label: '长度',
      units: {
        m:     { label: '米 (m)', toBase: 1 },
        km:    { label: '千米 (km)', toBase: 1000 },
        cm:    { label: '厘米 (cm)', toBase: 0.01 },
        mm:    { label: '毫米 (mm)', toBase: 0.001 },
        um:    { label: '微米 (µm)', toBase: 1e-6 },
        nm:    { label: '纳米 (nm)', toBase: 1e-9 },
        mile:  { label: '英里 (mi)', toBase: 1609.344 },
        yard:  { label: '码 (yd)', toBase: 0.9144 },
        foot:  { label: '英尺 (ft)', toBase: 0.3048 },
        inch:  { label: '英寸 (in)', toBase: 0.0254 },
        naut_mile: { label: '海里 (nmi)', toBase: 1852 },
        au:    { label: '天文单位 (AU)', toBase: 1.495978707e11 },
        ly:    { label: '光年 (ly)', toBase: 9.460730472e15 },
        pc:    { label: '秒差距 (pc)', toBase: 3.085677581e16 }
      }
    },
    mass: {
      label: '质量',
      units: {
        kg:    { label: '千克 (kg)', toBase: 1 },
        g:     { label: '克 (g)', toBase: 0.001 },
        mg:    { label: '毫克 (mg)', toBase: 1e-6 },
        ug:    { label: '微克 (µg)', toBase: 1e-9 },
        t:     { label: '吨 (t)', toBase: 1000 },
        lb:    { label: '磅 (lb)', toBase: 0.45359237 },
        oz:    { label: '盎司 (oz)', toBase: 0.028349523125 },
        stone: { label: '英石 (st)', toBase: 6.35029318 },
        slug:  { label: '斯勒格 (slug)', toBase: 14.593903 },
        u:     { label: '原子质量单位 (u)', toBase: 1.66053906660e-27 }
      }
    },
    temperature: {
      label: '温度',
      custom: true,
      units: {
        K:     { label: '开尔文 (K)' },
        C:     { label: '摄氏度 (°C)' },
        F:     { label: '华氏度 (°F)' }
      },
      toBase: function(value, fromUnit){
        if(fromUnit === 'C') return value + 273.15;
        if(fromUnit === 'F') return (value - 32) * 5/9 + 273.15;
        return value;
      },
      fromBase: function(value, toUnit){
        if(toUnit === 'C') return value - 273.15;
        if(toUnit === 'F') return (value - 273.15) * 9/5 + 32;
        return value;
      }
    },
    area: {
      label: '面积',
      units: {
        m2:    { label: '平方米 (m²)', toBase: 1 },
        km2:   { label: '平方千米 (km²)', toBase: 1e6 },
        cm2:   { label: '平方厘米 (cm²)', toBase: 1e-4 },
        mm2:   { label: '平方毫米 (mm²)', toBase: 1e-6 },
        ha:    { label: '公顷 (ha)', toBase: 10000 },
        acre:  { label: '英亩 (acre)', toBase: 4046.856422 },
        sqft:  { label: '平方英尺 (ft²)', toBase: 0.09290304 },
        sqin:  { label: '平方英寸 (in²)', toBase: 0.00064516 },
        sqmi:  { label: '平方英里 (mi²)', toBase: 2589988.110336 },
        sqyd:  { label: '平方码 (yd²)', toBase: 0.83612736 }
      }
    },
    volume: {
      label: '体积',
      units: {
        m3:    { label: '立方米 (m³)', toBase: 1 },
        L:     { label: '升 (L)', toBase: 0.001 },
        mL:    { label: '毫升 (mL)', toBase: 1e-6 },
        cm3:   { label: '立方厘米 (cm³)', toBase: 1e-6 },
        gal:   { label: '加仑 (gal)', toBase: 0.003785411784 },
        qt:    { label: '夸脱 (qt)', toBase: 0.000946352946 },
        pt:    { label: '品脱 (pt)', toBase: 0.000473176473 },
        cup:   { label: '杯 (cup)', toBase: 0.0002365882365 },
        floz:  { label: '液体盎司 (fl oz)', toBase: 0.0000295735295625 },
        tbsp:  { label: '汤匙 (tbsp)', toBase: 0.00001478676478125 },
        tsp:   { label: '茶匙 (tsp)', toBase: 0.00000492892159375 }
      }
    },
    speed: {
      label: '速度',
      units: {
        mps:   { label: '米/秒 (m/s)', toBase: 1 },
        kmph:  { label: '千米/时 (km/h)', toBase: 0.27777777777778 },
        mph:   { label: '英里/时 (mph)', toBase: 0.44704 },
        knot:  { label: '节 (kn)', toBase: 0.51444444444444 },
        fps:   { label: '英尺/秒 (ft/s)', toBase: 0.3048 },
        c:     { label: '光速 (c)', toBase: 299792458 },
        mach:  { label: '马赫 (Mach)', toBase: 340.3 }
      }
    },
    time: {
      label: '时间',
      units: {
        s:     { label: '秒 (s)', toBase: 1 },
        ms:    { label: '毫秒 (ms)', toBase: 0.001 },
        us:    { label: '微秒 (µs)', toBase: 1e-6 },
        ns:    { label: '纳秒 (ns)', toBase: 1e-9 },
        min:   { label: '分钟 (min)', toBase: 60 },
        h:     { label: '小时 (h)', toBase: 3600 },
        d:     { label: '天 (d)', toBase: 86400 },
        wk:    { label: '周 (wk)', toBase: 604800 },
        mo:    { label: '月 (30天)', toBase: 2592000 },
        yr:    { label: '年 (365天)', toBase: 31536000 }
      }
    },
    pressure: {
      label: '压强',
      units: {
        Pa:    { label: '帕斯卡 (Pa)', toBase: 1 },
        kPa:   { label: '千帕 (kPa)', toBase: 1000 },
        MPa:   { label: '兆帕 (MPa)', toBase: 1e6 },
        bar:   { label: '巴 (bar)', toBase: 1e5 },
        mbar:  { label: '毫巴 (mbar)', toBase: 100 },
        atm:   { label: '标准大气压 (atm)', toBase: 101325 },
        torr:  { label: '托 (Torr)', toBase: 133.32236842105 },
        mmHg:  { label: '毫米汞柱 (mmHg)', toBase: 133.322387415 },
        psi:   { label: '磅力/平方英寸 (psi)', toBase: 6894.7572931783 }
      }
    },
    energy: {
      label: '能量',
      units: {
        J:     { label: '焦耳 (J)', toBase: 1 },
        kJ:    { label: '千焦 (kJ)', toBase: 1000 },
        cal:   { label: '卡路里 (cal)', toBase: 4.184 },
        kcal:  { label: '千卡 (kcal)', toBase: 4184 },
        Wh:    { label: '瓦时 (Wh)', toBase: 3600 },
        kWh:   { label: '千瓦时 (kWh)', toBase: 3600000 },
        eV:    { label: '电子伏 (eV)', toBase: 1.602176634e-19 },
        MeV:   { label: '兆电子伏 (MeV)', toBase: 1.602176634e-13 },
        erg:   { label: '尔格 (erg)', toBase: 1e-7 },
        ftlb:  { label: '英尺磅力 (ft·lbf)', toBase: 1.3558179483314 },
        BTU:   { label: '英热单位 (BTU)', toBase: 1055.05585262 }
      }
    },
    angle: {
      label: '角度',
      units: {
        deg:   { label: '度 (°)', toBase: 1 },
        rad:   { label: '弧度 (rad)', toBase: 180 / Math.PI },
        grad:  { label: '梯度 (grad)', toBase: 0.9 },
        arcmin:{ label: '角分 (\')', toBase: 1/60 },
        arcsec:{ label: '角秒 (")', toBase: 1/3600 }
      }
    }
  };

  // 当前状态
  var currentCategory = 'length';
  var fromUnitValue = '';
  var toUnitValue = '';

  function convert(category, value, fromUnit, toUnit){
    var def = UNIT_DEFS[category];
    if(!def) return null;
    if(fromUnit === toUnit) return value;

    var baseValue;
    if(def.custom){
      if(!def.toBase || !def.fromBase) return null;
      baseValue = def.toBase(value, fromUnit);
      if(baseValue === undefined || baseValue === null || isNaN(baseValue)) return null;
      return def.fromBase(baseValue, toUnit);
    } else {
      var fromDef = def.units[fromUnit];
      var toDef = def.units[toUnit];
      if(!fromDef || !toDef) return null;
      baseValue = value * fromDef.toBase;
      return baseValue / toDef.toBase;
    }
  }

  function formatResult(value){
    if(value === null || value === undefined || isNaN(value)) return '';
    // 科学计数法处理
    if(Math.abs(value) >= 1e10 || (Math.abs(value) < 1e-6 && value !== 0)){
      return value.toExponential(10);
    }
    // 常规: 根据大小决定小数位数
    var precision = 10;
    var str = value.toPrecision(precision);
    // 移除多余的尾随零
    if(str.indexOf('.') !== -1){
      str = str.replace(/\.?0+$/, '');
    }
    // 如果太长则截断
    if(str.length > 14){
      return value.toExponential(6);
    }
    return str;
  }

  function populateUnits(container, category){
    var def = UNIT_DEFS[category];
    if(!def) return;

    var keys = Object.keys(def.units);

    // 渲染 from 下拉
    var fromText = getEl('unitconvFromText', container);
    var fromDropdown = getEl('unitconvFromDropdown', container);
    if(fromText && fromDropdown){
      var fromHtml = '';
      keys.forEach(function(key){
        var unit = def.units[key];
        fromHtml += '<div class="unitconv-select-option" data-value="' + key + '">' + unit.label + '</div>';
      });
      fromDropdown.innerHTML = fromHtml;
      // 默认选择第一个
      fromUnitValue = keys[0];
      fromText.textContent = def.units[keys[0]].label;
      fromDropdown.querySelector('.unitconv-select-option').classList.add('active');
    }

    // 渲染 to 下拉
    var toText = getEl('unitconvToText', container);
    var toDropdown = getEl('unitconvToDropdown', container);
    if(toText && toDropdown){
      var toHtml = '';
      keys.forEach(function(key){
        var unit = def.units[key];
        toHtml += '<div class="unitconv-select-option" data-value="' + key + '">' + unit.label + '</div>';
      });
      toDropdown.innerHTML = toHtml;
      // 默认选择第二个
      toUnitValue = keys.length >= 2 ? keys[1] : keys[0];
      toText.textContent = def.units[toUnitValue].label;
      toDropdown.querySelector('.unitconv-select-option[data-value="' + toUnitValue + '"]').classList.add('active');
    }
  }

  function doConvert(container){
    var input = getEl('unitconvInput', container);
    var output = getEl('unitconvOutput', container);
    if(!input || !output) return;

    var val = parseFloat(input.value);
    if(isNaN(val)){
      output.value = '';
      return;
    }

    var result = convert(currentCategory, val, fromUnitValue, toUnitValue);
    output.value = result !== null ? formatResult(result) : '';
  }

  function switchCategory(container, category){
    currentCategory = category;

    // 更新分类按钮状态
    var bar = getEl('unitconvCategoryBar', container);
    if(bar){
      bar.querySelectorAll('.unitconv-cat-btn').forEach(function(btn){
        btn.classList.toggle('active', btn.getAttribute('data-category') === category);
      });
    }

    // 插入 - 更新所有 unitconv-cat-btn
    populateUnits(container, category);

    // 清空输入/输出
    var input = getEl('unitconvInput', container);
    var output = getEl('unitconvOutput', container);
    if(input) input.value = '1';
    if(output) output.value = '';

    doConvert(container);
  }

  function bindEvents(container){
    var input = getEl('unitconvInput', container);
    var swapBtn = getEl('unitconvSwapBtn', container);
    var bar = getEl('unitconvCategoryBar', container);

    function onInputChange(){ doConvert(container); }

    if(input){
      input.addEventListener('input', onInputChange);
    }

    // 绑定自定义下拉栏
    bindCustomSelect(container, 'unitconvFromSelect', 'unitconvFromText', 'unitconvFromDropdown', function(value){
      fromUnitValue = value;
      doConvert(container);
    });
    bindCustomSelect(container, 'unitconvToSelect', 'unitconvToText', 'unitconvToDropdown', function(value){
      toUnitValue = value;
      doConvert(container);
    });

    if(swapBtn){
      swapBtn.addEventListener('click', function(){
        var temp = fromUnitValue;
        fromUnitValue = toUnitValue;
        toUnitValue = temp;

        // 更新显示
        var def = UNIT_DEFS[currentCategory];
        if(def){
          var fromText = getEl('unitconvFromText', container);
          var toText = getEl('unitconvToText', container);
          if(fromText) fromText.textContent = def.units[fromUnitValue].label;
          if(toText) toText.textContent = def.units[toUnitValue].label;

          // 更新active状态
          var fromDropdown = getEl('unitconvFromDropdown', container);
          var toDropdown = getEl('unitconvToDropdown', container);
          if(fromDropdown){
            fromDropdown.querySelectorAll('.unitconv-select-option').forEach(function(o){
              o.classList.toggle('active', o.getAttribute('data-value') === fromUnitValue);
            });
          }
          if(toDropdown){
            toDropdown.querySelectorAll('.unitconv-select-option').forEach(function(o){
              o.classList.toggle('active', o.getAttribute('data-value') === toUnitValue);
            });
          }
        }

        doConvert(container);
      });
    }

    if(bar){
      bar.querySelectorAll('.unitconv-cat-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          var cat = this.getAttribute('data-category');
          switchCategory(container, cat);
        });
      });
    }
  }

  function bindCustomSelect(container, selectId, textId, dropdownId, onChange){
    var select = getEl(selectId, container);
    var text = getEl(textId, container);
    var dropdown = getEl(dropdownId, container);
    if(!select || !text || !dropdown) return;

    // 点击显示/隐藏下拉
    select.addEventListener('click', function(e){
      e.stopPropagation();
      var isOpen = dropdown.classList.contains('open');
      // 关闭所有其他下拉
      document.querySelectorAll('.unitconv-select-dropdown.open').forEach(function(d){
        d.classList.remove('open');
      });
      if(!isOpen){
        dropdown.classList.add('open');
      }
    });

    // 选项点击
    dropdown.querySelectorAll('.unitconv-select-option').forEach(function(opt){
      opt.addEventListener('click', function(e){
        e.stopPropagation();
        var value = this.getAttribute('data-value');
        text.textContent = this.textContent;
        // 更新active状态
        dropdown.querySelectorAll('.unitconv-select-option').forEach(function(o){
          o.classList.remove('active');
        });
        this.classList.add('active');
        dropdown.classList.remove('open');
        if(onChange) onChange(value);
      });
    });

    // 点击外部关闭
    document.addEventListener('click', function(){
      dropdown.classList.remove('open');
    });
  }

  function showDialog(){
    if(dialogEl) return;
    if(!WW.addons.unitConverter.htmlTemplate) return;

    overlayEl = document.createElement('div');
    overlayEl.className = 'modal-overlay';

    dialogEl = document.createElement('div');
    dialogEl.className = 'modal unitconv-modal';
    dialogEl.innerHTML =
      '<div class="modal-head">' +
        '<span><i class="addon-icon addon-icon-unitconv" style="width:16px;height:16px;vertical-align:-3px;margin-right:6px;"></i>单位换算</span>' +
        '<button class="modal-close" id="unitconvDialogClose"><i class="addon-icon addon-icon-close"></i></button>' +
      '</div>' +
      '<div class="modal-body addon-modal-body">' +
        WW.addons.unitConverter.htmlTemplate +
      '</div>';

    overlayEl.appendChild(dialogEl);
    document.body.appendChild(overlayEl);

    if(!styleEl || !styleEl.parentNode){
      styleEl = document.createElement('link');
      styleEl.rel = 'stylesheet';
      styleEl.href = '/addons/official/unit-converter/style.css';
      document.head.appendChild(styleEl);
    }

    requestAnimationFrame(function(){
      overlayEl.classList.add('show');
    });

    var closeBtn = getEl('unitconvDialogClose');
    if(closeBtn){
      closeBtn.addEventListener('click', closeDialog);
    }

    overlayEl.addEventListener('click', function(e){
      if(e.target === overlayEl) closeDialog();
    });

    // 初始化
    currentCategory = 'length';
    populateUnits(dialogEl, 'length');
    bindEvents(dialogEl);
    doConvert(dialogEl);
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
    var btn = document.querySelector('.addon-activate-btn[data-addon-id="unit-converter"]');
    if(btn) btn.textContent = '装载';
  }

  // 注册到统一调度器
  Addons._handlers = Addons._handlers || {};

  Addons._handlers['unit-converter'] = {
    activate: function(){
      showDialog();
      var btn = document.querySelector('.addon-activate-btn[data-addon-id="unit-converter"]');
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
