(function(){
  window.WebWord = window.WebWord || {};
  window.WebWord.addons = window.WebWord.addons || {};
  window.WebWord.addons.dailyLuck = window.WebWord.addons.dailyLuck || {};

  window.WebWord.addons.dailyLuck.htmlTemplate =
'<div class="daily-luck-container">' +
'  <div class="daily-luck-card">' +
'    <div class="daily-luck-score-section">' +
'      <div class="daily-luck-score" id="dailyLuckScore">?</div>' +
'      <div class="daily-luck-label" id="dailyLuckLabel">点击下方按钮查看今日人品</div>' +
'    </div>' +
'    <div class="daily-luck-bar-section">' +
'      <div class="daily-luck-bar-bg">' +
'        <div class="daily-luck-bar-fill" id="dailyLuckBar"></div>' +
'      </div>' +
'    </div>' +
'    <div class="daily-luck-detail" id="dailyLuckDetail"></div>' +
'    <button class="daily-luck-btn" id="dailyLuckBtn">查看今日人品</button>' +
'    <div class="daily-luck-disclaimer">仅供娱乐，请勿过分解读</div>' +
'  </div>' +
'</div>';
})();
