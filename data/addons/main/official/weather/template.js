(function(){
  window.WebWord = window.WebWord || {};
  window.WebWord.addons = window.WebWord.addons || {};
  window.WebWord.addons.weather = window.WebWord.addons.weather || {};

  window.WebWord.addons.weather.htmlTemplate =
'<div class="weather-container">' +
'  <canvas class="weather-atmosphere" id="weatherAtmosphere"></canvas>' +
'  <div class="weather-particles" id="weatherParticles"></div>' +
'  <div class="weather-loading" id="weatherLoading">' +
'    <div class="weather-spinner"></div>' +
'    <span class="weather-loading-text" id="weatherLoadingText">\u6b63\u5728\u83b7\u53d6\u4f4d\u7f6e\u4fe1\u606f...</span>' +
'  </div>' +
'  <div class="weather-card" id="weatherCard" style="display:none;">' +
'    <div class="weather-location">' +
'      <span class="weather-location-icon"></span>' +
'      <span class="weather-location-name" id="weatherLocationName">--</span>' +
'      <button class="weather-refresh-btn" id="weatherRefreshBtn" title="\u5237\u65b0"></button>' +
'      <span class="weather-update-time" id="weatherUpdateTime"></span>' +
'    </div>' +
'    <div class="weather-current">' +
'      <div class="weather-current-left">' +
'        <div class="weather-icon" id="weatherIcon"></div>' +
'        <div class="weather-temp" id="weatherTemp">--\u00b0C</div>' +
'      </div>' +
'      <div class="weather-current-right">' +
'        <div class="weather-desc" id="weatherDesc">--</div>' +
'        <div class="weather-feels" id="weatherFeels">\u4f53\u611f --\u00b0C</div>' +
'      </div>' +
'    </div>' +
'    <div class="weather-indices">' +
'      <div class="weather-index-item">' +
'        <span class="weather-index-label">\u6e7f\u5ea6</span>' +
'        <span class="weather-index-value" id="weatherHumidity">--%</span>' +
'      </div>' +
'      <div class="weather-index-item">' +
'        <span class="weather-index-label">\u98ce\u901f</span>' +
'        <span class="weather-index-value" id="weatherWind">--</span>' +
'      </div>' +
'      <div class="weather-index-item">' +
'        <span class="weather-index-label">\u964d\u6c34</span>' +
'        <span class="weather-index-value" id="weatherRain">--</span>' +
'      </div>' +
'      <div class="weather-index-item">' +
'        <span class="weather-index-label">\u7d2b\u5916\u7ebf</span>' +
'        <span class="weather-index-value" id="weatherUV">--</span>' +
'      </div>' +
'      <div class="weather-index-item">' +
'        <span class="weather-index-label">\u6c14\u538b</span>' +
'        <span class="weather-index-value" id="weatherPressure">--</span>' +
'      </div>' +
'      <div class="weather-index-item">' +
'        <span class="weather-index-label">\u80fd\u89c1\u5ea6</span>' +
'        <span class="weather-index-value" id="weatherVisibility">--</span>' +
'      </div>' +
'    </div>' +
'    <div class="weather-forecast" id="weatherForecast">' +
'      <div class="weather-forecast-list" id="weatherForecastList"></div>' +
'    </div>' +
'  </div>' +
'  <div class="weather-error" id="weatherError" style="display:none;">' +
'    <div class="weather-error-icon"></div>' +
'    <div class="weather-error-text" id="weatherErrorText">\u83b7\u53d6\u5929\u6c14\u4fe1\u606f\u5931\u8d25</div>' +
'    <button class="weather-retry-btn" id="weatherRetryBtn">\u91cd\u8bd5</button>' +
'  </div>' +
'</div>';
})();
