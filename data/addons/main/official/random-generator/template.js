(function(){
  window.WebWord = window.WebWord || {};
  window.WebWord.addons = window.WebWord.addons || {};
  window.WebWord.addons.randomGenerator = window.WebWord.addons.randomGenerator || {};

  window.WebWord.addons.randomGenerator.htmlTemplate =
'<div class="randgen-container">' +
'  <div class="randgen-mode-bar" id="randgenModeBar">' +
'    <button class="randgen-mode-btn active" data-mode="number">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M4 17l4-8 4 8"/><path d="M15 17V9l3 4 3-4v8"/></svg>' +
'      随机数' +
'    </button>' +
'    <button class="randgen-mode-btn" data-mode="dice">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>' +
'      掷骰子' +
'    </button>' +
'    <button class="randgen-mode-btn" data-mode="coin">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 10"/></svg>' +
'      抛硬币' +
'    </button>' +
'  </div>' +
'  <div class="randgen-content" id="randgenContent"></div>' +
'</div>';
})();
