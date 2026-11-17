(function(){
  window.WebWord = window.WebWord || {};
  window.WebWord.addons = window.WebWord.addons || {};
  window.WebWord.addons.periodicTable = window.WebWord.addons.periodicTable || {};

  window.WebWord.addons.periodicTable.htmlTemplate =
'<div class="ptable-container">' +
'  <div class="ptable-toolbar">' +
'    <div class="ptable-search-box">' +
'      <svg class="ptable-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
'      <input type="text" class="ptable-search-input" id="ptableSearch" placeholder="搜索元素..." />' +
'    </div>' +
'    <div class="ptable-legend" id="ptableLegend"></div>' +
'  </div>' +
'  <div class="ptable-body">' +
'    <div class="ptable-grid-wrapper" id="ptableGridWrapper">' +
'      <div class="ptable-grid" id="ptableGrid"></div>' +
'      <div class="ptable-series-container" id="ptableSeriesContainer">' +
'        <div class="ptable-series" data-series="lanthanide">' +
'          <div class="ptable-series-header">镧系元素 <span class="ptable-series-note">57-71</span></div>' +
'          <div class="ptable-series-grid" id="ptableLanthanide"></div>' +
'        </div>' +
'        <div class="ptable-series" data-series="actinide">' +
'          <div class="ptable-series-header">锕系元素 <span class="ptable-series-note">89-103</span></div>' +
'          <div class="ptable-series-grid" id="ptableActinide"></div>' +
'        </div>' +
'      </div>' +
'    </div>' +
'    <div class="ptable-detail" id="ptableDetail">' +
'      <div class="ptable-detail-placeholder" id="ptDetailPlaceholder">' +
'        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="width:40px;height:40px;color:#3a4250;"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>' +
'        <span>选择一个元素</span>' +
'      </div>' +
'      <div class="ptable-detail-content" id="ptDetailContent" style="display:none;">' +
'        <div class="ptable-detail-header">' +
'          <span class="ptable-detail-symbol" id="ptDetailSymbol">H</span>' +
'          <div class="ptable-detail-name-box">' +
'            <div class="ptable-detail-name" id="ptDetailName">氢</div>' +
'            <div class="ptable-detail-sub" id="ptDetailSub">Hydrogen</div>' +
'          </div>' +
'          <button class="ptable-detail-close" id="ptDetailClose">' +
'            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
'          </button>' +
'        </div>' +
'        <div class="ptable-detail-body" id="ptDetailBody"></div>' +
'      </div>' +
'    </div>' +
'  </div>' +
'</div>';
})();
