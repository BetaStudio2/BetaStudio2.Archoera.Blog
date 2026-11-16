(function(){
  window.WebWord = window.WebWord || {};
  window.WebWord.addons = window.WebWord.addons || {};
  window.WebWord.addons['addon-manager'] = window.WebWord.addons['addon-manager'] || {};

  window.WebWord.addons['addon-manager'].htmlTemplate =
'<div class="addonmgr-container">' +
'  <div class="addonmgr-search-box">' +
'    <svg class="addonmgr-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
'      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>' +
'    </svg>' +
'    <input type="text" class="addonmgr-search-input" id="addonMgrSearch" placeholder="搜索加载项..." autocomplete="off" />' +
'  </div>' +
'  <div class="addonmgr-list" id="addonMgrList"></div>' +
'  <div class="addonmgr-empty" id="addonMgrEmpty" style="display:none;">' +
'    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:36px;height:36px;color:#4a5568;">' +
'      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>' +
'    </svg>' +
'    <span>没有找到匹配的加载项</span>' +
'  </div>' +
'  <div class="addonmgr-footer">' +
'    <span class="addonmgr-count" id="addonMgrCount">共 0 个加载项</span>' +
'  </div>' +
'</div>';
})();
