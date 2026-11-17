(function(){
  window.WebWord = window.WebWord || {};
  window.WebWord.addons = window.WebWord.addons || {};
  window.WebWord.addons.constants = window.WebWord.addons.constants || {};

  window.WebWord.addons.constants.htmlTemplate =
'<div class="constants-container">' +
'  <div class="constants-search-section">' +
'    <div class="constants-search-box">' +
'      <svg class="constants-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
'        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>' +
'      </svg>' +
'      <input type="text" class="constants-search-input" id="constantsSearchInput" placeholder="搜索物理常数..." autocomplete="off" />' +
'    </div>' +
'    <div class="constants-filter-bar" id="constantsFilterBar">' +
'      <button class="constants-filter-btn active" data-category="all">全部</button>' +
'      <button class="constants-filter-btn" data-category="universal">普适</button>' +
'      <button class="constants-filter-btn" data-category="electromagnetic">电磁</button>' +
'      <button class="constants-filter-btn" data-category="thermodynamic">热力学</button>' +
'      <button class="constants-filter-btn" data-category="atomic">原子&核</button>' +
'    </div>' +
'  </div>' +
'  <div class="constants-list" id="constantsList"></div>' +
'  <div class="constants-empty" id="constantsEmpty" style="display:none;">' +
'    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;height:40px;color:#4a5568;">' +
'      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>' +
'    </svg>' +
'    <span>没有找到匹配的常数</span>' +
'  </div>' +
'  <div class="constants-footer">' +
'    <span class="constants-count" id="constantsCount">共 0 个常数</span>' +
'  </div>' +
'</div>';
})();
