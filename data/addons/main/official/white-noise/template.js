(function(){
  window.WebWord = window.WebWord || {};
  window.WebWord.addons = window.WebWord.addons || {};
  window.WebWord.addons.whiteNoise = window.WebWord.addons.whiteNoise || {};

  window.WebWord.addons.whiteNoise.htmlTemplate =
'<div class="wnoise-container">' +
'  <div class="wnoise-modes" id="wnoiseModes">' +
'    <button class="wnoise-mode-btn" data-mode="white">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M12 3v18M3 12h18"/></svg>' +
'      <span>白噪音</span>' +
'    </button>' +
'    <button class="wnoise-mode-btn" data-mode="rain">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M4 14l2-2 2 2 2-2 2 2 2-2 2 2"/><path d="M4 18l2-2 2 2 2-2 2 2 2-2 2 2"/><path d="M4 10l2-2 2 2 2-2 2 2 2-2 2 2"/></svg>' +
'      <span>雨声</span>' +
'    </button>' +
'    <button class="wnoise-mode-btn" data-mode="wind">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>' +
'      <span>风声</span>' +
'    </button>' +
'    <button class="wnoise-mode-btn" data-mode="stream">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M2 16l2-1 2 1 2-1 2 1 2-1 2 1"/><path d="M2 12l2-1 2 1 2-1 2 1 2-1 2 1"/><path d="M2 8l2-1 2 1 2-1 2 1 2-1 2 1"/></svg>' +
'      <span>溪流</span>' +
'    </button>' +
'    <button class="wnoise-mode-btn" data-mode="thunder">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>' +
'      <span>雷雨</span>' +
'    </button>' +
'    <button class="wnoise-mode-btn" data-mode="campfire">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M12 22V8"/><path d="M12 8c-2-3-4-5-4-5s2-1 4 0 4 0 4 0-2 2-4 5"/><path d="M8 22h8"/><path d="M10 18c-1-2-2-3-2-3s1-1 2 0 2 0 2 0-1 1-2 3"/></svg>' +
'      <span>篝火</span>' +
'    </button>' +
'    <button class="wnoise-mode-btn" data-mode="ocean">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/></svg>' +
'      <span>海浪</span>' +
'    </button>' +
'    <button class="wnoise-mode-btn" data-mode="feather">' +
'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M12 3c-3 3-4 9-4 12s1 4 2 4 2-2 2-4 1-6 4-8"/><path d="M10 15c-2 0-4 1-4 3s1 3 3 3c2 0 4-3 5-6"/><path d="M14 7c1-2 2-4 4-5"/></svg>' +
'      <span>鹅毛棒</span>' +
'    </button>' +
'  </div>' +
'  <div class="wnoise-visualizer" id="wnoiseVisualizer">' +
'    <canvas class="wnoise-canvas" id="wnoiseCanvas"></canvas>' +
'  </div>' +
'  <div class="wnoise-controls">' +
'    <div class="wnoise-control-row">' +
'      <span class="wnoise-label">音量</span>' +
'      <input type="range" class="wnoise-slider" id="wnoiseVolume" min="0" max="100" value="50" />' +
'      <span class="wnoise-value" id="wnoiseVolumeVal">50%</span>' +
'    </div>' +
'    <div class="wnoise-control-row">' +
'      <span class="wnoise-label">速率</span>' +
'      <input type="range" class="wnoise-slider" id="wnoiseRate" min="10" max="200" value="100" />' +
'      <span class="wnoise-value" id="wnoiseRateVal">1x</span>' +
'    </div>' +
'  </div>' +
'  <div class="wnoise-actions">' +
'    <button class="wnoise-play-btn" id="wnoisePlayBtn">' +
'      <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;"><polygon points="8,5 19,12 8,19"/></svg>' +
'      <span id="wnoiseBtnText">播放</span>' +
'    </button>' +
'    <button class="wnoise-stop-btn" id="wnoiseStopBtn" disabled>' +
'      <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;"><rect x="6" y="6" width="12" height="12"/></svg>' +
'      停止' +
'    </button>' +
'  </div>' +
'  <div class="wnoise-status">' +
'    <span class="wnoise-status-dot" id="wnoiseStatusDot"></span>' +
'    <span class="wnoise-status-text" id="wnoiseStatusText">就绪</span>' +
'  </div>' +
'</div>';
})();
