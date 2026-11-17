(function(){
  var WW = window.WebWord = window.WebWord || {};
  var Addons = WW.addons = WW.addons || {};

  var overlayEl = null;
  var dialogEl = null;
  var styleEl = null;

  function getEl(id, container){
    return (container || document).querySelector('#' + id);
  }

  // -------- 物理常数数据 --------
  var CATEGORY_ICONS = {
    universal: '<svg class="constants-category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 22a10 10 0 0 1-10-10"/><path d="M2 12h20"/></svg>',
    electromagnetic: '<svg class="constants-category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>',
    thermodynamic: '<svg class="constants-category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0-6 6c0 4 6 9 6 9s6-5 6-9a6 6 0 0 0-6-6z"/><circle cx="12" cy="9" r="1.5"/></svg>',
    atomic: '<svg class="constants-category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/></svg>'
  };

  var CATEGORY_LABELS = {
    all: '全部',
    universal: '普适常数',
    electromagnetic: '电磁学常数',
    thermodynamic: '热力学常数',
    atomic: '原子与核物理常数'
  };

  var CONSTANTS_DATA = [
    // ---- 普适常数 ----
    { name: '真空光速', symbol: 'c', value: '2.998 × 10⁸', unit: 'm·s⁻¹', category: 'universal', precision: '精确值' },
    { name: '引力常数', symbol: 'G', value: '6.674 × 10⁻¹¹', unit: 'N·m²·kg⁻²', category: 'universal', precision: '±0.000030 × 10⁻¹¹' },
    { name: '普朗克常数', symbol: 'h', value: '6.626 × 10⁻³⁴', unit: 'J·Hz⁻¹', category: 'universal', precision: '±0.000015 × 10⁻³⁴' },
    { name: '约化普朗克常数', symbol: 'ħ', value: '1.055 × 10⁻³⁴', unit: 'J·s', category: 'universal', precision: 'ħ = h/2π' },
    { name: '真空介电常数', symbol: 'ε₀', value: '8.854 × 10⁻¹²', unit: 'F·m⁻¹', category: 'universal', precision: '精确值' },
    { name: '真空磁导率', symbol: 'μ₀', value: '1.257 × 10⁻⁶', unit: 'N·A⁻²', category: 'universal', precision: '精确值' },
    { name: '精细结构常数', symbol: 'α', value: '7.297 × 10⁻³', unit: '无量纲', category: 'universal', precision: '±0.000 × 10⁻⁶' },
    { name: '特征阻抗(真空)', symbol: 'Z₀', value: '3.767 × 10²', unit: 'Ω', category: 'universal', precision: '精确值' },

    // ---- 电磁学常数 ----
    { name: '基本电荷', symbol: 'e', value: '1.602 × 10⁻¹⁹', unit: 'C', category: 'electromagnetic', precision: '±0.000 × 10⁻¹⁹' },
    { name: '玻尔磁子', symbol: 'μ_B', value: '9.274 × 10⁻²⁴', unit: 'J·T⁻¹', category: 'electromagnetic', precision: '±0.000 × 10⁻²⁴' },
    { name: '核磁子', symbol: 'μ_N', value: '5.051 × 10⁻²⁷', unit: 'J·T⁻¹', category: 'electromagnetic', precision: '±0.000 × 10⁻²⁷' },
    { name: '约瑟夫逊常数', symbol: 'K_J', value: '4.836 × 10¹⁴', unit: 'Hz·V⁻¹', category: 'electromagnetic', precision: 'K_J = 2e/h' },
    { name: '冯·克利青常数', symbol: 'R_K', value: '2.581 × 10⁴', unit: 'Ω', category: 'electromagnetic', precision: 'R_K = h/e²' },
    { name: '康普顿波长', symbol: 'λ_C', value: '2.426 × 10⁻¹²', unit: 'm', category: 'electromagnetic', precision: '±0.000 × 10⁻¹²' },
    { name: '玻尔半径', symbol: 'a₀', value: '5.292 × 10⁻¹¹', unit: 'm', category: 'electromagnetic', precision: '±0.000 × 10⁻¹¹' },

    // ---- 热力学常数 ----
    { name: '阿伏伽德罗常数', symbol: 'N_A', value: '6.022 × 10²³', unit: 'mol⁻¹', category: 'thermodynamic', precision: '±0.000 × 10²³' },
    { name: '玻尔兹曼常数', symbol: 'k_B', value: '1.381 × 10⁻²³', unit: 'J·K⁻¹', category: 'thermodynamic', precision: '±0.000 × 10⁻²³' },
    { name: '理想气体常数', symbol: 'R', value: '8.314', unit: 'J·mol⁻¹·K⁻¹', category: 'thermodynamic', precision: 'R = N_A·k_B' },
    { name: '斯特藩-玻尔兹曼常数', symbol: 'σ', value: '5.670 × 10⁻⁸', unit: 'W·m⁻²·K⁻⁴', category: 'thermodynamic', precision: '±0.000 × 10⁻⁸' },
    { name: '维恩位移常数', symbol: 'b', value: '2.898 × 10⁻³', unit: 'm·K', category: 'thermodynamic', precision: '±0.000 × 10⁻³' },
    { name: '标准大气压', symbol: 'atm', value: '1.01325 × 10⁵', unit: 'Pa', category: 'thermodynamic', precision: '精确值' },
    { name: '标准摩尔体积', symbol: 'V_m', value: '22.414 × 10⁻³', unit: 'm³·mol⁻¹', category: 'thermodynamic', precision: '273.15 K, 1 atm' },

    // ---- 原子与核物理常数 ----
    { name: '电子静止质量', symbol: 'm_e', value: '9.109 × 10⁻³¹', unit: 'kg', category: 'atomic', precision: '±0.000 × 10⁻³¹' },
    { name: '质子静止质量', symbol: 'm_p', value: '1.673 × 10⁻²⁷', unit: 'kg', category: 'atomic', precision: '±0.000 × 10⁻²⁷' },
    { name: '中子静止质量', symbol: 'm_n', value: '1.675 × 10⁻²⁷', unit: 'kg', category: 'atomic', precision: '±0.000 × 10⁻²⁷' },
    { name: '原子质量单位', symbol: 'u', value: '1.661 × 10⁻²⁷', unit: 'kg', category: 'atomic', precision: '±0.000 × 10⁻²⁷' },
    { name: '电子荷质比', symbol: 'e/m_e', value: '1.759 × 10¹¹', unit: 'C·kg⁻¹', category: 'atomic', precision: '±0.000 × 10¹¹' },
    { name: '里德伯常数', symbol: 'R_∞', value: '1.097 × 10⁷', unit: 'm⁻¹', category: 'atomic', precision: '±0.000 × 10⁷' },
    { name: '费米耦合常数', symbol: 'G_F', value: '1.166 × 10⁻⁵', unit: 'GeV⁻²', category: 'atomic', precision: '±0.000 × 10⁻⁵' },
    { name: '质子磁旋比', symbol: 'γ_p', value: '2.675 × 10⁸', unit: 'rad·s⁻¹·T⁻¹', category: 'atomic', precision: '±0.000 × 10⁸' }
  ];

  function createCategoryIcon(category){
    return CATEGORY_ICONS[category] || '';
  }

  function renderConstantsList(container, filter, searchText){
    var listEl = getEl('constantsList', container);
    var emptyEl = getEl('constantsEmpty', container);
    var countEl = getEl('constantsCount', container);
    if(!listEl) return;

    var filtered = CONSTANTS_DATA.filter(function(item){
      if(filter !== 'all' && item.category !== filter) return false;
      if(searchText){
        var kw = searchText.toLowerCase();
        return item.name.toLowerCase().indexOf(kw) !== -1 ||
               item.symbol.toLowerCase().indexOf(kw) !== -1 ||
               item.unit.toLowerCase().indexOf(kw) !== -1;
      }
      return true;
    });

    if(filtered.length === 0){
      listEl.innerHTML = '';
      if(emptyEl) emptyEl.style.display = 'flex';
      if(countEl) countEl.textContent = '共 0 个常数';
      return;
    }
    if(emptyEl) emptyEl.style.display = 'none';

    // 分组
    var groups = {};
    if(filter !== 'all'){
      groups[filter] = filtered;
    } else {
      filtered.forEach(function(item){
        if(!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
      });
    }

    var html = '';
    var catOrder = ['universal', 'electromagnetic', 'thermodynamic', 'atomic'];
    for(var i = 0; i < catOrder.length; i++){
      var cat = catOrder[i];
      var items = groups[cat];
      if(!items || items.length === 0) continue;
      html += '<div class="constants-category-group">' +
        '<div class="constants-category-header">' +
          createCategoryIcon(cat) +
          '<span>' + CATEGORY_LABELS[cat] + '</span>' +
          '<span style="margin-left:auto;font-weight:400;font-size:11px;color:#4a5568;">' + items.length + '</span>' +
        '</div>';
      items.forEach(function(item){
        html += '<div class="constants-item" data-symbol="' + item.symbol + '" data-name="' + item.name + '">' +
          '<span class="constants-item-symbol">' + item.symbol + '</span>' +
          '<div class="constants-item-info">' +
            '<span class="constants-item-name">' + item.name + '</span>' +
            '<span class="constants-item-value">' + item.value + '</span>' +
          '</div>' +
          '<span class="constants-item-unit">' + item.unit + '</span>' +
        '</div>';
      });
      html += '</div>';
    }

    listEl.innerHTML = html;
    if(countEl) countEl.textContent = '共 ' + filtered.length + ' 个常数';

    // 绑定点击事件 - 显示详情
    listEl.querySelectorAll('.constants-item').forEach(function(el){
      el.addEventListener('click', function(){
        var symbol = this.getAttribute('data-symbol');
        var name = this.getAttribute('data-name');
        var item = null;
        for(var j = 0; j < CONSTANTS_DATA.length; j++){
          if(CONSTANTS_DATA[j].symbol === symbol && CONSTANTS_DATA[j].name === name){
            item = CONSTANTS_DATA[j];
            break;
          }
        }
        if(item) showDetail(item, container);
      });
    });
  }

  function showDetail(item, container){
    // 移除已有的详情弹窗
    var existing = container.querySelector('.constants-detail-overlay');
    if(existing) existing.parentNode.removeChild(existing);

    var overlay = document.createElement('div');
    overlay.className = 'constants-detail-overlay';
    overlay.innerHTML =
      '<div class="constants-detail-card">' +
        '<div class="constants-detail-header">' +
          '<span class="constants-item-symbol">' + item.symbol + '</span>' +
          '<div>' +
            '<div class="constants-detail-title">' + item.name + '</div>' +
            '<div style="font-size:11px;color:#4a5568;margin-top:2px;">' + CATEGORY_LABELS[item.category] + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="constants-detail-row">' +
          '<span class="constants-detail-label">符号</span>' +
          '<span class="constants-detail-value">' + item.symbol + '</span>' +
        '</div>' +
        '<div class="constants-detail-row">' +
          '<span class="constants-detail-label">数值</span>' +
          '<span class="constants-detail-value">' + item.value + '</span>' +
        '</div>' +
        '<div class="constants-detail-row">' +
          '<span class="constants-detail-label">单位</span>' +
          '<span class="constants-detail-value">' + item.unit + '</span>' +
        '</div>' +
        '<div class="constants-detail-row">' +
          '<span class="constants-detail-label">精度/备注</span>' +
          '<span class="constants-detail-value">' + item.precision + '</span>' +
        '</div>' +
        '<button class="constants-detail-close">关闭</button>' +
      '</div>';

    container.appendChild(overlay);

    var closeBtn = overlay.querySelector('.constants-detail-close');
    closeBtn.addEventListener('click', function(){
      overlay.parentNode.removeChild(overlay);
    });
    overlay.addEventListener('click', function(e){
      if(e.target === overlay) overlay.parentNode.removeChild(overlay);
    });
  }

  function bindEvents(container){
    var searchInput = getEl('constantsSearchInput', container);
    if(searchInput){
      searchInput.addEventListener('input', function(){
        var currentFilter = container.querySelector('.constants-filter-btn.active');
        var filter = currentFilter ? currentFilter.getAttribute('data-category') : 'all';
        renderConstantsList(container, filter, this.value.trim());
      });
    }

    var filterBar = getEl('constantsFilterBar', container);
    if(filterBar){
      filterBar.querySelectorAll('.constants-filter-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          filterBar.querySelectorAll('.constants-filter-btn').forEach(function(b){
            b.classList.remove('active');
          });
          this.classList.add('active');
          var filter = this.getAttribute('data-category');
          var searchText = searchInput ? searchInput.value.trim() : '';
          renderConstantsList(container, filter, searchText);
        });
      });
    }
  }

  function showDialog(){
    if(dialogEl) return;
    if(!WW.addons.constants.htmlTemplate) return;

    overlayEl = document.createElement('div');
    overlayEl.className = 'modal-overlay';

    dialogEl = document.createElement('div');
    dialogEl.className = 'modal constants-modal';
    dialogEl.innerHTML =
      '<div class="modal-head">' +
        '<span><i class="addon-icon addon-icon-constants" style="width:16px;height:16px;vertical-align:-3px;margin-right:6px;"></i>物理常数速查</span>' +
        '<button class="modal-close" id="constantsDialogClose"><i class="addon-icon addon-icon-close"></i></button>' +
      '</div>' +
      '<div class="modal-body addon-modal-body">' +
        WW.addons.constants.htmlTemplate +
      '</div>';

    overlayEl.appendChild(dialogEl);
    document.body.appendChild(overlayEl);

    if(!styleEl || !styleEl.parentNode){
      styleEl = document.createElement('link');
      styleEl.rel = 'stylesheet';
      styleEl.href = '/addons/official/constants/style.css';
      document.head.appendChild(styleEl);
    }

    requestAnimationFrame(function(){
      overlayEl.classList.add('show');
    });

    var closeBtn = getEl('constantsDialogClose');
    if(closeBtn){
      closeBtn.addEventListener('click', closeDialog);
    }

    overlayEl.addEventListener('click', function(e){
      if(e.target === overlayEl) closeDialog();
    });

    // 初始渲染
    renderConstantsList(dialogEl, 'all', '');
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
    var btn = document.querySelector('.addon-activate-btn[data-addon-id="constants"]');
    if(btn) btn.textContent = '装载';
  }

  // 注册到统一调度器
  Addons._handlers = Addons._handlers || {};

  Addons._handlers['constants'] = {
    activate: function(){
      showDialog();
      var btn = document.querySelector('.addon-activate-btn[data-addon-id="constants"]');
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
