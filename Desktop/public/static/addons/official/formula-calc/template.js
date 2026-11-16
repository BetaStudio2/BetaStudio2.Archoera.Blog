(function(){
  window.WebWord = window.WebWord || {};
  window.WebWord.addons = window.WebWord.addons || {};
  window.WebWord.addons.formulaCalc = window.WebWord.addons.formulaCalc || {};

  window.WebWord.addons.formulaCalc.htmlTemplate =
'<div class="fcalc-container">' +
'  <div class="fcalc-tabs" id="fcalcTabs">' +
'    <button class="fcalc-tab active" data-tab="calc">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h4"/></svg>' +
'      计算器' +
'    </button>' +
'    <button class="fcalc-tab" data-tab="templates">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
'      公式模板' +
'    </button>' +
'  </div>' +

'  <div class="fcalc-panel" id="fcalcCalcPanel">' +
'    <div class="fcalc-display" id="fcalcDisplay">' +
'      <div class="fcalc-expr" id="fcalcExpr"></div>' +
'      <div class="fcalc-result" id="fcalcResult">0</div>' +
'    </div>' +
'    <div class="fcalc-buttons">' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="sin(">sin</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="cos(">cos</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="tan(">tan</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="log(">log</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="ln(">ln</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="sqrt(">√</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="^">xʸ</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="pi">π</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="e">e</button>' +
'      <button class="fcalc-btn fcalc-btn-clear" data-val="clear">AC</button>' +

'      <button class="fcalc-btn fcalc-btn-num" data-val="7">7</button>' +
'      <button class="fcalc-btn fcalc-btn-num" data-val="8">8</button>' +
'      <button class="fcalc-btn fcalc-btn-num" data-val="9">9</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="/">÷</button>' +

'      <button class="fcalc-btn fcalc-btn-num" data-val="4">4</button>' +
'      <button class="fcalc-btn fcalc-btn-num" data-val="5">5</button>' +
'      <button class="fcalc-btn fcalc-btn-num" data-val="6">6</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="*">×</button>' +

'      <button class="fcalc-btn fcalc-btn-num" data-val="1">1</button>' +
'      <button class="fcalc-btn fcalc-btn-num" data-val="2">2</button>' +
'      <button class="fcalc-btn fcalc-btn-num" data-val="3">3</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="-">−</button>' +

'      <button class="fcalc-btn fcalc-btn-num" data-val="0">0</button>' +
'      <button class="fcalc-btn fcalc-btn-num" data-val=".">.</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="(">(</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val=")">)</button>' +
'      <button class="fcalc-btn fcalc-btn-op" data-val="+">+</button>' +
'      <button class="fcalc-btn fcalc-btn-eq" data-val="=">=</button>' +
'    </div>' +
'  </div>' +

'  <div class="fcalc-panel" id="fcalcTemplatesPanel" style="display:none;">' +
'    <div class="fcalc-template-search">' +
'      <input type="text" class="fcalc-search-input" id="fcalcTemplateSearch" placeholder="搜索公式..." />' +
'    </div>' +
'    <div class="fcalc-template-list" id="fcalcTemplateList"></div>' +
'  </div>' +

'  <div class="fcalc-panel" id="fcalcVarPanel" style="display:none;">' +
'    <div class="fcalc-var-header" id="fcalcVarHeader">' +
'      <button class="fcalc-var-back" id="fcalcVarBack">' +
'        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="15 18 9 12 15 6"/></svg>' +
'        返回' +
'      </button>' +
'      <span class="fcalc-var-title" id="fcalcVarTitle"></span>' +
'    </div>' +
'    <div class="fcalc-var-list" id="fcalcVarList"></div>' +
'    <button class="fcalc-var-calc-btn" id="fcalcVarCalcBtn">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M4 17l4-8 4 8"/><path d="M15 17V9l3 4 3-4v8"/></svg>' +
'      计算' +
'     </button>' +
'  </div>' +
'</div>';
})();
