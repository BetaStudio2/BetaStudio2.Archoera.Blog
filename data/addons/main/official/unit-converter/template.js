(function(){
  window.WebWord = window.WebWord || {};
  window.WebWord.addons = window.WebWord.addons || {};
  window.WebWord.addons.unitConverter = window.WebWord.addons.unitConverter || {};

  window.WebWord.addons.unitConverter.htmlTemplate =
'<div class="unitconv-container">' +
'  <div class="unitconv-category-bar" id="unitconvCategoryBar">' +
'    <button class="unitconv-cat-btn active" data-category="length">长度</button>' +
'    <button class="unitconv-cat-btn" data-category="mass">质量</button>' +
'    <button class="unitconv-cat-btn" data-category="temperature">温度</button>' +
'    <button class="unitconv-cat-btn" data-category="area">面积</button>' +
'    <button class="unitconv-cat-btn" data-category="volume">体积</button>' +
'    <button class="unitconv-cat-btn" data-category="speed">速度</button>' +
'    <button class="unitconv-cat-btn" data-category="time">时间</button>' +
'    <button class="unitconv-cat-btn" data-category="pressure">压强</button>' +
'    <button class="unitconv-cat-btn" data-category="energy">能量</button>' +
'    <button class="unitconv-cat-btn" data-category="angle">角度</button>' +
'  </div>' +
'  <div class="unitconv-converter">' +
'    <div class="unitconv-input-group">' +
'      <input type="text" class="unitconv-input" id="unitconvInput" value="1" autocomplete="off" />' +
'      <div class="unitconv-custom-select" id="unitconvFromSelect">' +
'        <div class="unitconv-select-display">' +
'          <span class="unitconv-select-text" id="unitconvFromText"></span>' +
'          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="6 9 12 15 18 9"/></svg>' +
'        </div>' +
'        <div class="unitconv-select-dropdown" id="unitconvFromDropdown"></div>' +
'      </div>' +
'    </div>' +
'    <div class="unitconv-swap-area">' +
'      <button class="unitconv-swap-btn" id="unitconvSwapBtn" title="交换单位">' +
'        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">' +
'          <path d="M7 16l-4-4 4-4"/><path d="M3 12h18"/><path d="M17 8l4 4-4 4"/><path d="M21 12H3"/>' +
'        </svg>' +
'      </button>' +
'    </div>' +
'    <div class="unitconv-input-group">' +
'      <input type="text" class="unitconv-input unitconv-input-result" id="unitconvOutput" readonly />' +
'      <div class="unitconv-custom-select" id="unitconvToSelect">' +
'        <div class="unitconv-select-display">' +
'          <span class="unitconv-select-text" id="unitconvToText"></span>' +
'          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="6 9 12 15 18 9"/></svg>' +
'        </div>' +
'        <div class="unitconv-select-dropdown" id="unitconvToDropdown"></div>' +
'      </div>' +
'    </div>' +
'  </div>' +
'</div>';
})();
