(function(){
  var WW = window.WebWord = window.WebWord || {};
  var Addons = WW.addons = WW.addons || {};

  var overlayEl = null;
  var dialogEl = null;
  var styleEl = null;
  var refreshTimer = null;
  var CACHE_VERSION = 2;
  var atmosphereAnimId = null;
  var particlesTimer = null;
  var atmosphereObserver = null;
  var shootingStars = [];

  function getEl(id, container){
    return (container || document).querySelector('#' + id);
  }

  var WEEKDAY_NAMES = ['\u65e5', '\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d'];

  var WEATHER_CODES = {
    0: { desc: '\u6674\u5929', icon: 'clear-day' },
    1: { desc: '\u591a\u4e91', icon: 'clear-day' },
    2: { desc: '\u591a\u4e91', icon: 'cloudy' },
    3: { desc: '\u9634\u5929', icon: 'cloudy' },
    45: { desc: '\u96fe', icon: 'fog' },
    48: { desc: '\u971c', icon: 'fog' },
    51: { desc: '\u5c0f\u96e8', icon: 'rain' },
    53: { desc: '\u4e2d\u96e8', icon: 'rain' },
    55: { desc: '\u5927\u96e8', icon: 'rain' },
    56: { desc: '\u51bb\u96e8', icon: 'snow' },
    57: { desc: '\u51bb\u96e8', icon: 'snow' },
    61: { desc: '\u5c0f\u96e8', icon: 'rain' },
    63: { desc: '\u4e2d\u96e8', icon: 'rain' },
    65: { desc: '\u5927\u96e8', icon: 'rain' },
    66: { desc: '\u51bb\u96e8', icon: 'snow' },
    67: { desc: '\u51bb\u96e8', icon: 'snow' },
    71: { desc: '\u5c0f\u96ea', icon: 'snow' },
    73: { desc: '\u4e2d\u96ea', icon: 'snow' },
    75: { desc: '\u5927\u96ea', icon: 'snow' },
    77: { desc: '\u96f9', icon: 'snow' },
    80: { desc: '\u9663\u96e8', icon: 'rain' },
    81: { desc: '\u9663\u96e8', icon: 'rain' },
    82: { desc: '\u66b4\u96e8', icon: 'rain' },
    85: { desc: '\u9663\u96ea', icon: 'snow' },
    86: { desc: '\u66b4\u96ea', icon: 'snow' },
    95: { desc: '\u96f7\u66b4\u96e8', icon: 'storm' },
    96: { desc: '\u96f7\u66b4\u96e8\u964d\u96f9', icon: 'storm' },
    99: { desc: '\u96f7\u66b4\u96e8\u964d\u96f9', icon: 'storm' }
  };

  function getWeatherInfo(code){
    return WEATHER_CODES[code] || { desc: '\u672a\u77e5', icon: 'cloudy' };
  }

  function getUVLevel(index){
    if(index === undefined || index === null) return '--';
    if(index <= 2) return '\u4f4e';
    if(index <= 5) return '\u4e2d';
    if(index <= 7) return '\u9ad8';
    if(index <= 10) return '\u5f88\u9ad8';
    return '\u6781\u9ad8';
  }

  function showDialog(){
    if(dialogEl) return;
    if(!WW.addons.weather.htmlTemplate) return;

    overlayEl = document.createElement('div');
    overlayEl.className = 'modal-overlay';

    dialogEl = document.createElement('div');
    dialogEl.className = 'modal weather-modal';
    dialogEl.innerHTML =
      '<div class="modal-head">' +
        '<span><i class="addon-icon addon-icon-weather" style="width:16px;height:16px;vertical-align:-3px;margin-right:6px;"></i>\u5929\u6c14</span>' +
        '<button class="modal-close" id="weatherDialogClose"><i class="addon-icon addon-icon-close"></i></button>' +
      '</div>' +
      '<div class="modal-body addon-modal-body">' +
        WW.addons.weather.htmlTemplate +
      '</div>';

    overlayEl.appendChild(dialogEl);
    document.body.appendChild(overlayEl);

    if(!styleEl || !styleEl.parentNode){
      styleEl = document.createElement('link');
      styleEl.rel = 'stylesheet';
      styleEl.href = '/addons/official/weather/style.css';
      document.head.appendChild(styleEl);
    }

    requestAnimationFrame(function(){
      overlayEl.classList.add('show');
    });

    var closeBtn = getEl('weatherDialogClose');
    if(closeBtn){
      closeBtn.addEventListener('click', closeDialog);
    }

    overlayEl.addEventListener('click', function(e){
      if(e.target === overlayEl) closeDialog();
    });

    bindEvents(overlayEl);
    fetchWeather(overlayEl);

    // 10分钟自动刷新
    if(refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(function(){
      if(overlayEl) fetchWeather(overlayEl);
    }, 10 * 60 * 1000);
  }

  function closeDialog(){
    stopAtmosphere();
    if(refreshTimer){
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
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
    var btn = document.querySelector('.addon-activate-btn[data-addon-id="weather"]');
    if(btn) btn.textContent = '\u88c5\u8f7d';
  }

  function bindEvents(container){
    var refreshBtn = getEl('weatherRefreshBtn', container);
    if(refreshBtn){
      refreshBtn.addEventListener('click', function(){
        var loadingEl = getEl('weatherLoading', container);
        var loadingText = getEl('weatherLoadingText', container);
        if(loadingEl) loadingEl.style.display = 'flex';
        if(loadingText) loadingText.textContent = '\u6b63\u5728\u5237\u65b0\u5929\u6c14\u6570\u636e...';
        var cardEl = getEl('weatherCard', container);
        if(cardEl) cardEl.style.display = 'none';
        refreshBtn.classList.add('spinning');
        startFetch(container);
      });
    }

    var retryBtn = getEl('weatherRetryBtn', container);
    if(retryBtn){
      retryBtn.addEventListener('click', function(){
        var loadingEl = getEl('weatherLoading', container);
        if(loadingEl) loadingEl.style.display = 'flex';
        var errorEl = getEl('weatherError', container);
        if(errorEl) errorEl.style.display = 'none';
        startFetch(container);
      });
    }
  }

  function fetchWeather(container){
    var loadingEl = getEl('weatherLoading', container);
    var cardEl = getEl('weatherCard', container);
    var errorEl = getEl('weatherError', container);

    if(loadingEl) loadingEl.style.display = 'flex';
    if(cardEl) cardEl.style.display = 'none';
    if(errorEl) errorEl.style.display = 'none';

    // 检查缓存（10分钟内有效）
    var cached = getCachedWeather();
    if(cached){
      // 使用缓存渲染，同时后台静默刷新
      renderWeather(cached, container);
      // 静默刷新（不阻塞显示）
      setTimeout(function(){ refreshSilently(container); }, 100);
      return;
    }

    startFetch(container);
  }

  // 静默刷新：不显示加载动画，直接更新数据
  function refreshSilently(container){
    if(!container) return;
    if(!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      function(position){
        fetchSilently(position.coords.latitude, position.coords.longitude, container);
      },
      function(){
        // 定位失败，不做处理，保留缓存数据
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }

  function fetchSilently(lat, lon, container){
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index,precipitation,surface_pressure,visibility,is_day' +
      '&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max,uv_index_max' +
      '&timezone=auto' +
      '&forecast_days=7';

    fetch(url)
      .then(function(res){ return res.json(); })
      .then(function(data){
        if(!data || !data.current || !data.daily) return;
        var weatherData = {
          temp: data.current.temperature_2m,
          feelsLike: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          wind: data.current.wind_speed_10m,
          rain: data.current.precipitation || 0,
          uv: data.current.uv_index,
          code: data.current.weather_code,
          pressure: data.current.surface_pressure,
          visibility: data.current.visibility,
          is_day: data.current.is_day,
          daily: data.daily,
          lat: lat,
          lon: lon,
          timestamp: Date.now()
        };
        // 静默刷新也需要获取位置名称
        fetchLocationName(lat, lon, weatherData, container);
      })
      .catch(function(){});
  }

  function startFetch(container){

    if(!navigator.geolocation){
      showError('\u5f53\u524d\u73af\u5883\u4e0d\u652f\u6301\u5730\u7406\u4f4d\u7f6e\u83b7\u53d6\uff0c\u8bf7\u4f7f\u7528 Chrome / Edge \u6216\u542f\u7528\u5730\u7406\u5b9a\u4f4d\u6743\u9650', container);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function(position){
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        fetchWeatherData(lat, lon, container);
      },
      function(err){
        console.warn('Geolocation error:', err.message);
        // 定位失败时使用默认位置（北京），显示警告
        fetchWeatherData(39.9042, 116.4074, container, true);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }

  function fetchWeatherData(lat, lon, container, locationGuess){
    var loadingText = getEl('weatherLoadingText', container);
    if(loadingText) loadingText.textContent = '\u6b63\u5728\u83b7\u53d6\u5929\u6c14\u6570\u636e...';

    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index,precipitation,surface_pressure,visibility,is_day' +
      '&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max,uv_index_max' +
      '&timezone=auto' +
      '&forecast_days=7';

    fetch(url)
      .then(function(res){
        if(!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data){
        if(!data || !data.current){
          throw new Error('\u65e0\u6548\u7684\u5929\u6c14\u6570\u636e');
        }

        var weatherData = {
      temp: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      wind: data.current.wind_speed_10m,
      rain: data.current.precipitation || 0,
      uv: data.current.uv_index,
      code: data.current.weather_code,
      pressure: data.current.surface_pressure,
      visibility: data.current.visibility,
      is_day: data.current.is_day,
      daily: data.daily,
      lat: lat,
      lon: lon,
      locationGuess: locationGuess || false,
      timestamp: Date.now()
    };

    // 先缓存，并用近似位置快速渲染天气数据
    cacheWeather(weatherData);
    var approxLoc = getApproximateLocation(lat, lon);
    if(approxLoc !== '\u672a\u77e5\u5730\u70b9'){
      weatherData.city = approxLoc;
    }
    renderWeather(weatherData, container);

    // 后台获取精确位置，成功后自动更新界面
    fetchLocationName(lat, lon, weatherData, container);
      })
      .catch(function(err){
        console.error('Weather fetch error:', err);
        showError('\u83b7\u53d6\u5929\u6c14\u6570\u636e\u5931\u8d25\uff1a' + err.message, container);
      });
  }

  function fetchLocationName(lat, lon, weatherData, container){
    // 更新加载状态文本
    var loadingText = getEl('weatherLoadingText', container);
    if(loadingText) loadingText.textContent = '\u6b63\u5728\u83b7\u53d6\u4f4d\u7f6e\u4fe1\u606f...';

    // 使用 BigDataCloud 免费 API（无需 Key）
    var url = 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lon + '&localityLanguage=zh';

    var fetchPromise = fetch(url, { mode: 'cors' });
    // 4秒超时
    var timeoutPromise = new Promise(function(resolve, reject){
      setTimeout(function(){ reject(new Error('timeout')); }, 4000);
    });

    Promise.race([fetchPromise, timeoutPromise])
      .then(function(res){
        if(!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data){
        if(data){
          // BigDataCloud 多种响应格式兼容
          var cityName = data.city || data.locality || '';
          // 如果顶级字段为空，尝试从 localityInfo 获取
          if(!cityName && data.localityInfo && data.localityInfo.administrative){
            var admins = data.localityInfo.administrative;
            for(var i = admins.length - 1; i >= 0; i--){
              if(admins[i].name && admins[i].name !== data.principalSubdivision && admins[i].adminLevel === 8){
                cityName = admins[i].name;
                break;
              }
            }
            if(!cityName){
              for(var i = admins.length - 1; i >= 0; i--){
                if(admins[i].name && admins[i].adminLevel >= 6){
                  cityName = admins[i].name;
                  break;
                }
              }
            }
          }
          weatherData.city = cityName || data.principalSubdivision || '\u672a\u77e5\u5730\u70b9';
          weatherData.region = data.principalSubdivision || '';
          if(weatherData.region === weatherData.city) weatherData.region = '';
        } else {
          weatherData.city = '\u672a\u77e5\u5730\u70b9';
        }
        if(loadingText) loadingText.textContent = '\u6b63\u5728\u52a0\u8f7d\u5929\u6c14\u6570\u636e...';
        cacheWeather(weatherData);
        renderWeather(weatherData, container);
      })
      .catch(function(){
        // 主 API 失败，回退到 Nominatim
        fallbackLocationName(lat, lon, weatherData, container);
      });
  }

  // 备选：Nominatim（OpenStreetMap）
  function fallbackLocationName(lat, lon, weatherData, container){
    var url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lon + '&zoom=10&accept-language=zh';

    var fetchPromise = fetch(url, { headers: { 'User-Agent': 'WebWord-Weather/1.0' } });
    var timeoutPromise = new Promise(function(resolve, reject){
      setTimeout(function(){ reject(new Error('timeout')); }, 4000);
    });

    Promise.race([fetchPromise, timeoutPromise])
      .then(function(res){
        if(!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data){
        if(data && data.address){
          weatherData.city = data.address.city || data.address.town || data.address.village || data.address.county || '\u672a\u77e5\u5730\u70b9';
          weatherData.region = data.address.state || data.address.province || '';
        } else {
          weatherData.city = '\u672a\u77e5\u5730\u70b9';
        }
        cacheWeather(weatherData);
        renderWeather(weatherData, container);
      })
      .catch(function(){
        // 最终回退：仅显示坐标附近的大致区域
        weatherData.city = getApproximateLocation(lat, lon);
        weatherData.region = '';
        cacheWeather(weatherData);
        renderWeather(weatherData, container);
      });
  }

  // 最终回退：根据经纬度范围推断城市名（覆盖主要中国城市 + 全球主要都市）
  function getApproximateLocation(lat, lon){
    // 中国主要城市范围
    var cities = [
      { name: '\u5317\u4eac', latMin: 39.4, latMax: 40.3, lonMin: 116.0, lonMax: 116.8 },
      { name: '\u4e0a\u6d77', latMin: 30.7, latMax: 31.5, lonMin: 121.1, lonMax: 121.9 },
      { name: '\u5e7f\u5dde', latMin: 22.8, latMax: 23.5, lonMin: 113.0, lonMax: 113.8 },
      { name: '\u6df1\u5733', latMin: 22.4, latMax: 22.9, lonMin: 113.7, lonMax: 114.4 },
      { name: '\u676d\u5dde', latMin: 29.9, latMax: 30.5, lonMin: 119.9, lonMax: 120.6 },
      { name: '\u6210\u90fd', latMin: 30.3, latMax: 30.9, lonMin: 103.8, lonMax: 104.3 },
      { name: '\u6b66\u6c49', latMin: 30.3, latMax: 30.8, lonMin: 114.0, lonMax: 114.6 },
      { name: '\u5357\u4eac', latMin: 31.9, latMax: 32.3, lonMin: 118.6, lonMax: 119.0 },
      { name: '\u897f\u5b89', latMin: 34.1, latMax: 34.5, lonMin: 108.7, lonMax: 109.1 },
      { name: '\u91cd\u5e86', latMin: 29.3, latMax: 29.8, lonMin: 106.3, lonMax: 106.8 },
      { name: '\u5929\u6d25', latMin: 38.9, latMax: 39.3, lonMin: 117.0, lonMax: 117.5 },
      { name: '\u82cf\u5dde', latMin: 31.1, latMax: 31.5, lonMin: 120.4, lonMax: 120.8 },
      { name: '\u9752\u5c9b', latMin: 35.9, latMax: 36.3, lonMin: 120.2, lonMax: 120.6 },
      { name: '\u5927\u8fde', latMin: 38.7, latMax: 39.2, lonMin: 121.4, lonMax: 121.8 },
      { name: '\u6d4e\u5357', latMin: 36.4, latMax: 36.9, lonMin: 116.7, lonMax: 117.2 },
      { name: '\u53a6\u95e8', latMin: 24.3, latMax: 24.7, lonMin: 117.9, lonMax: 118.4 },
      { name: '\u6e29\u5dde', latMin: 27.8, latMax: 28.2, lonMin: 120.4, lonMax: 120.9 },
      { name: '\u5609\u5174', latMin: 30.6, latMax: 30.9, lonMin: 120.5, lonMax: 120.9 },
      { name: '\u5b81\u6ce2', latMin: 29.6, latMax: 30.1, lonMin: 121.3, lonMax: 121.8 },
      { name: '\u5408\u80a5', latMin: 31.6, latMax: 31.9, lonMin: 117.1, lonMax: 117.4 },
      { name: '\u5357\u660c', latMin: 28.4, latMax: 28.8, lonMin: 115.7, lonMax: 116.0 },
      { name: '\u6d4e\u5b81', latMin: 35.2, latMax: 35.6, lonMin: 116.4, lonMax: 116.8 },
      { name: '\u73e0\u6d77', latMin: 22.0, latMax: 22.4, lonMin: 113.3, lonMax: 113.7 },
      { name: '\u6885\u5dde', latMin: 24.1, latMax: 24.5, lonMin: 115.9, lonMax: 116.4 },
      { name: '\u7ec5\u5fb7', latMin: 23.2, latMax: 23.6, lonMin: 113.1, lonMax: 113.5 },
      { name: '\u60e0\u5dde', latMin: 22.9, latMax: 23.3, lonMin: 114.2, lonMax: 114.6 },
      { name: '\u4f5b\u5c71', latMin: 22.9, latMax: 23.3, lonMin: 112.9, lonMax: 113.3 },
      { name: '\u4e1c\u839e', latMin: 22.8, latMax: 23.2, lonMin: 113.5, lonMax: 114.0 },
      { name: '\u4e2d\u5c71', latMin: 22.3, latMax: 22.7, lonMin: 113.2, lonMax: 113.6 },
      { name: '\u6e05\u8fdc', latMin: 23.5, latMax: 23.9, lonMin: 112.8, lonMax: 113.3 },
      { name: '\u63ed\u9633', latMin: 23.2, latMax: 23.6, lonMin: 116.1, lonMax: 116.6 },
      { name: '\u6f33\u5dde', latMin: 24.3, latMax: 24.7, lonMin: 117.4, lonMax: 117.9 },
      { name: '\u798f\u5dde', latMin: 25.8, latMax: 26.3, lonMin: 119.1, lonMax: 119.6 },
      { name: '\u6c55\u5934', latMin: 23.2, latMax: 23.5, lonMin: 116.5, lonMax: 116.9 },
      { name: '\u6c55\u5c3e', latMin: 22.6, latMax: 23.0, lonMin: 115.2, lonMax: 115.7 },
      { name: '\u6d77\u53e3', latMin: 19.9, latMax: 20.2, lonMin: 110.1, lonMax: 110.5 },
      { name: '\u4e09\u4e9a', latMin: 18.1, latMax: 18.4, lonMin: 109.3, lonMax: 109.7 },
      { name: '\u6842\u6797', latMin: 25.0, latMax: 25.4, lonMin: 110.1, lonMax: 110.5 },
      { name: '\u82cf\u5dde', latMin: 31.1, latMax: 31.5, lonMin: 120.4, lonMax: 120.8 },
      { name: '\u65e0\u9521', latMin: 31.3, latMax: 31.7, lonMin: 120.1, lonMax: 120.5 },
      { name: '\u5e38\u5dde', latMin: 31.6, latMax: 32.0, lonMin: 119.8, lonMax: 120.2 },
      { name: '\u5357\u901a', latMin: 31.8, latMax: 32.2, lonMin: 120.6, lonMax: 121.0 },
      { name: '\u63ef\u5dde', latMin: 29.4, latMax: 29.7, lonMin: 106.0, lonMax: 106.4 },
      { name: '\u592a\u539f', latMin: 37.7, latMax: 38.0, lonMin: 112.4, lonMax: 112.7 },
      { name: '\u90d1\u5dde', latMin: 34.6, latMax: 34.9, lonMin: 113.5, lonMax: 113.8 },
      { name: '\u54c8\u5c14\u6ee8', latMin: 45.6, latMax: 45.9, lonMin: 126.4, lonMax: 126.8 },
      { name: '\u957f\u6625', latMin: 43.7, latMax: 44.0, lonMin: 125.1, lonMax: 125.5 },
      { name: '\u6c88\u9633', latMin: 41.6, latMax: 41.9, lonMin: 123.2, lonMax: 123.6 },
      { name: '\u7389\u6797', latMin: 22.4, latMax: 22.7, lonMin: 109.9, lonMax: 110.3 },
      // 全球主要都市
      { name: 'Tokyo', latMin: 35.4, latMax: 35.8, lonMin: 139.5, lonMax: 139.9 },
      { name: 'Seoul', latMin: 37.4, latMax: 37.7, lonMin: 126.8, lonMax: 127.2 },
      { name: 'New York', latMin: 40.5, latMax: 40.9, lonMin: -74.1, lonMax: -73.7 },
      { name: 'London', latMin: 51.3, latMax: 51.6, lonMin: -0.3, lonMax: 0.1 },
      { name: 'Paris', latMin: 48.7, latMax: 49.0, lonMin: 2.2, lonMax: 2.5 }
    ];

    for(var i = 0; i < cities.length; i++){
      var c = cities[i];
      if(lat >= c.latMin && lat <= c.latMax && lon >= c.lonMin && lon <= c.lonMax){
        return c.name;
      }
    }
    return '\u672a\u77e5\u5730\u70b9';
  }

  function renderWeather(data, container){
    var loadingEl = getEl('weatherLoading', container);
    var cardEl = getEl('weatherCard', container);
    var errorEl = getEl('weatherError', container);

    if(loadingEl) loadingEl.style.display = 'none';
    if(cardEl) cardEl.style.display = '';
    if(errorEl) errorEl.style.display = 'none';

    // 移除刷新按钮旋转动画
    var refreshBtn = getEl('weatherRefreshBtn', container);
    if(refreshBtn) refreshBtn.classList.remove('spinning');

    // 位置
    var locName = getEl('weatherLocationName', container);
    if(locName){
      var text = data.city || '\u672a\u77e5\u5730\u70b9';
      if(data.region && data.city !== '\u672a\u77e5\u5730\u70b9') text += ', ' + data.region;
      locName.textContent = text;
    }

    // 位置警告（定位失败时）
    var locWarn = getEl('weatherLocationWarn', container);
    if(data.locationGuess){
      if(!locWarn){
        locWarn = document.createElement('div');
        locWarn.id = 'weatherLocationWarn';
        locWarn.className = 'weather-location-warn';
        locWarn.innerHTML = '<span>\u26a0 \u65e0\u6cd5\u83b7\u53d6\u60a8\u7684\u4f4d\u7f6e\uff0c\u5df2\u4f7f\u7528\u9ed8\u8ba4\u4f4d\u7f6e\u663e\u793a\u5929\u6c14\u6570\u636e</span>';
        if(locName && locName.parentNode){
          locName.parentNode.parentNode.insertBefore(locWarn, locName.parentNode.nextSibling);
        }
      }
      locWarn.style.display = '';
    } else {
      if(locWarn) locWarn.style.display = 'none';
    }

    // 当前温度
    var tempEl = getEl('weatherTemp', container);
    if(tempEl) tempEl.textContent = Math.round(data.temp) + '\u00b0C';

    // 天气描述
    var info = getWeatherInfo(data.code);
    var descEl = getEl('weatherDesc', container);
    if(descEl) descEl.textContent = info.desc;

    // 体感温度
    var feelsEl = getEl('weatherFeels', container);
    if(feelsEl) feelsEl.textContent = '\u4f53\u611f ' + Math.round(data.feelsLike) + '\u00b0C';

    // 图标
    var iconEl = getEl('weatherIcon', container);
    if(iconEl){
      var iconClass = info.icon;
      // 夜晚时如果是晴天，显示月亮图标
      if((data.is_day === 0 || data.is_day === false) && iconClass === 'clear-day'){
        iconClass = 'clear-night';
      }
      iconEl.className = 'weather-icon weather-icon-' + iconClass;
    }

    // 启动 Noctalia 氛围背景
    startAtmosphere(container, data.code, data.is_day);

    // 详细指数
    setText('weatherHumidity', data.humidity + '%', container);
    setText('weatherWind', data.wind.toFixed(1) + ' km/h', container);
    var rainVal = typeof data.rain === 'number' ? data.rain : 0;
    setText('weatherRain', rainVal.toFixed(1) + ' mm', container);
    setText('weatherUV', getUVLevel(data.uv), container);

    // 气压 (hPa)
    if(data.pressure !== undefined && data.pressure !== null){
      setText('weatherPressure', Math.round(data.pressure) + ' hPa', container);
    } else {
      setText('weatherPressure', '--', container);
    }

    // 能见度 (km)
    if(data.visibility !== undefined && data.visibility !== null){
      var visKm = (data.visibility / 1000).toFixed(1);
      setText('weatherVisibility', visKm + ' km', container);
    } else {
      setText('weatherVisibility', '--', container);
    }

    // 更新时间
    var now = new Date();
    var timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0') + ':' + now.getSeconds().toString().padStart(2,'0');
    setText('weatherUpdateTime', timeStr, container);

    // 7天预报
    if(data.daily){
      // 存储坐标供详情弹窗使用
      var weatherContainer = container.querySelector('.weather-container');
      if(weatherContainer){
        weatherContainer.setAttribute('data-fc-lat', data.lat || '');
        weatherContainer.setAttribute('data-fc-lon', data.lon || '');
      }
      renderForecast(data.daily, container);
    }
  }

  function renderForecast(daily, container){
    var listEl = getEl('weatherForecastList', container);
    if(!listEl) return;
    if(!daily || !daily.time || !daily.time.length) return;

    var today = new Date();
    today.setHours(0,0,0,0);

    // 找出7天中最高温和最低温，用于温度条比例
    var allTemps = [];
    for(var i = 0; i < daily.time.length; i++){
      allTemps.push(daily.temperature_2m_max[i]);
      allTemps.push(daily.temperature_2m_min[i]);
    }
    var globalMin = Math.min.apply(null, allTemps);
    var globalMax = Math.max.apply(null, allTemps);
    var range = globalMax - globalMin || 1;

    var html = '';
    for(var i = 0; i < daily.time.length; i++){
      var dateStr = daily.time[i];
      var parts = dateStr.split('-');
      var d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
      var isToday = d.getTime() === today.getTime();

      var dayName = isToday ? '\u4eca\u5929' : '\u5468' + WEEKDAY_NAMES[d.getDay()];
      var high = Math.round(daily.temperature_2m_max[i]);
      var low = Math.round(daily.temperature_2m_min[i]);
      var wInfo = getWeatherInfo(daily.weather_code[i]);
      var precip = daily.precipitation_sum ? daily.precipitation_sum[i] : 0;
      var windMax = daily.wind_speed_10m_max ? daily.wind_speed_10m_max[i] : 0;
      var uvMax = daily.uv_index_max ? daily.uv_index_max[i] : 0;

      // 温度条位置
      var barLeft = ((low - globalMin) / range) * 100;
      var barWidth = ((high - low) / range) * 100;
      if(barWidth < 6) barWidth = 6;
      if(barLeft < 0) barLeft = 0;
      if(barLeft + barWidth > 100) barWidth = 100 - barLeft;

      html +=
        '<div class="weather-forecast-day" data-index="' + i + '">' +
          '<div class="weather-fc-icon weather-icon weather-icon-' + wInfo.icon + '"></div>' +
          '<div class="weather-fc-dayname' + (isToday ? ' today' : '') + '">' + dayName + '</div>' +
          '<div class="weather-fc-low">' + low + '\u00b0</div>' +
          '<div class="weather-fc-bar-wrap">' +
            '<div class="weather-fc-bar-fill" style="left:' + barLeft + '%;width:' + barWidth + '%;"></div>' +
          '</div>' +
          '<div class="weather-fc-high">' + high + '\u00b0</div>' +
          '<div class="weather-fc-extra">' +
            '<span class="weather-fc-precip">\u964d\u6c34 ' + (precip !== null && precip !== undefined ? precip.toFixed(1) : '0.0') + 'mm</span>' +
          '</div>' +
        '</div>';
    }
    listEl.innerHTML = html;

    // 滚动优先级：滚动后的 200ms 内不触发点击
    var forecastEl = getEl('weatherForecast', container);
    var scrollTimer = null;
    forecastEl.onscroll = function(){
      forecastEl.setAttribute('data-scrolled', '1');
      if(scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function(){
        forecastEl.removeAttribute('data-scrolled');
      }, 200);
    };

    // 点击事件（委托）
    listEl.onclick = function(e){
      if(forecastEl.getAttribute('data-scrolled') === '1') return;
      var dayEl = e.target.closest('.weather-forecast-day');
      if(!dayEl) return;
      var idx = parseInt(dayEl.getAttribute('data-index'), 10);
      if(isNaN(idx) || !daily.time[idx]) return;
      showForecastDetail(daily, idx, container);
    };
  }

  function showForecastDetail(daily, idx, container){
    if(!daily || !daily.time || !daily.time[idx]) return;

    // 在天气容器内显示详情，而不是整个模态框
    var weatherContainer = container.querySelector('.weather-container') || container;

    var dateStr = daily.time[idx];
    var parts = dateStr.split('-');
    var d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    var today = new Date();
    today.setHours(0,0,0,0);
    var isToday = d.getTime() === today.getTime();
    var dayName = isToday ? '\u4eca\u5929' : '\u5468' + WEEKDAY_NAMES[d.getDay()];

    var high = Math.round(daily.temperature_2m_max[idx]);
    var low = Math.round(daily.temperature_2m_min[idx]);
    var wInfo = getWeatherInfo(daily.weather_code[idx]);
    var precip = daily.precipitation_sum ? daily.precipitation_sum[idx] : 0;
    var windMax = daily.wind_speed_10m_max ? daily.wind_speed_10m_max[idx] : 0;
    var uvMax = daily.uv_index_max ? daily.uv_index_max[idx] : 0;

    // 先移除已存在的详情弹窗
    var existing = weatherContainer.querySelector('.weather-fc-detail-overlay');
    if(existing) existing.remove();

    // 构建详情弹窗
    var detailOverlay = document.createElement('div');
    detailOverlay.className = 'weather-fc-detail-overlay';
    detailOverlay.innerHTML =
      '<div class="weather-fc-detail-card">' +
        '<div class="weather-fc-detail-header">' +
          '<div class="weather-fc-detail-icon weather-icon weather-icon-' + wInfo.icon + '"></div>' +
          '<div class="weather-fc-detail-title">' + dayName + ' ' + wInfo.desc + '</div>' +
          '<button class="weather-fc-detail-close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '</div>' +
        '<div class="weather-fc-detail-body">' +
          '<div class="weather-fc-detail-row">' +
            '<span class="weather-fc-detail-label">\u6700\u9ad8\u6e29\u5ea6</span>' +
            '<span class="weather-fc-detail-val">' + high + '\u00b0C</span>' +
          '</div>' +
          '<div class="weather-fc-detail-row">' +
            '<span class="weather-fc-detail-label">\u6700\u4f4e\u6e29\u5ea6</span>' +
            '<span class="weather-fc-detail-val">' + low + '\u00b0C</span>' +
          '</div>' +
          '<div class="weather-fc-detail-row">' +
            '<span class="weather-fc-detail-label">\u964d\u6c34\u91cf</span>' +
            '<span class="weather-fc-detail-val">' + (precip !== null ? precip.toFixed(1) : '0.0') + ' mm</span>' +
          '</div>' +
          '<div class="weather-fc-detail-row">' +
            '<span class="weather-fc-detail-label">\u6700\u5927\u98ce\u901f</span>' +
            '<span class="weather-fc-detail-val">' + (windMax !== null ? windMax.toFixed(1) : '--') + ' km/h</span>' +
          '</div>' +
          '<div class="weather-fc-detail-row">' +
            '<span class="weather-fc-detail-label">\u7d2b\u5916\u7ebf\u6307\u6570</span>' +
            '<span class="weather-fc-detail-val">' + (uvMax !== null ? uvMax.toFixed(1) + ' (' + getUVLevel(uvMax) + ')' : '--') + '</span>' +
          '</div>' +
          '<div class="weather-fc-detail-row">' +
            '<span class="weather-fc-detail-label">\u5929\u6c14</span>' +
            '<span class="weather-fc-detail-val">' + wInfo.desc + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="weather-fc-detail-foot">' +
          '<a href="https://weather.com/zh-CN/weather/today/l/' + (weatherContainer ? weatherContainer.getAttribute('data-fc-lat') || '' : '') + ',' + (weatherContainer ? weatherContainer.getAttribute('data-fc-lon') || '' : '') + '" target="_blank" class="weather-fc-detail-link">\u67e5\u770b\u5b8c\u6574\u5929\u6c14\u9884\u62a5 \u2192</a>' +
        '</div>' +
      '</div>';

    detailOverlay.addEventListener('click', function(e){
      if(e.target === detailOverlay || e.target.closest('.weather-fc-detail-close')){
        detailOverlay.classList.remove('show');
        detailOverlay.classList.add('closing');
        weatherContainer.classList.remove('fc-detail-open');
        setTimeout(function(){
          if(detailOverlay.parentNode) detailOverlay.parentNode.removeChild(detailOverlay);
        }, 200);
      }
    });

    weatherContainer.classList.add('fc-detail-open');
    weatherContainer.appendChild(detailOverlay);
    requestAnimationFrame(function(){
      detailOverlay.classList.add('show');
    });
  }

  function setText(id, text, container){
    var el = getEl(id, container);
    if(el) el.textContent = text;
  }

  function showError(message, container){
    var loadingEl = getEl('weatherLoading', container);
    var cardEl = getEl('weatherCard', container);
    var errorEl = getEl('weatherError', container);

    if(loadingEl) loadingEl.style.display = 'none';
    if(cardEl) cardEl.style.display = 'none';
    if(errorEl) errorEl.style.display = 'flex';

    // 移除刷新按钮旋转动画
    var refreshBtn = getEl('weatherRefreshBtn', container);
    if(refreshBtn) refreshBtn.classList.remove('spinning');

    var errText = getEl('weatherErrorText', container);
    if(errText) errText.textContent = message;
  }

  // 缓存（10分钟）
  function getCachedWeather(){
    try {
      var data = localStorage.getItem('weather_cache_v2');
      if(!data) return null;
      var parsed = JSON.parse(data);
      if(Date.now() - parsed.timestamp < 10 * 60 * 1000){
        // 确保缓存包含 daily 字段（旧版本缓存不含 daily）
        if(parsed.daily && parsed.daily.time && parsed.daily.time.length > 0){
          return parsed;
        }
      }
      return null;
    } catch(e){
      return null;
    }
  }

  function cacheWeather(data){
    try {
      data._cacheVer = CACHE_VERSION;
      localStorage.setItem('weather_cache_v2', JSON.stringify(data));
    } catch(e){}
  }

  /* ---- Noctalia 风格天气氛围引擎 ---- */

  // 字符串 hash 为 32 位整数种子
  function hashStr(str){
    var h = 0;
    for(var i = 0; i < str.length; i++){
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return h;
  }

  // 基于 Mulberry32 的种子随机数生成器
  function createRNG(seed){
    var s = seed | 0;
    return function(){
      s = (s * 1664525 + 1013904223) | 0;
      return (s >>> 0) / 4294967296;
    };
  }

  // 天气 -> 渐变配色方案
  var ATMOSPHERE_COLORS = {
    'clear-day':   { top: '#1a6dd4', mid: '#4a9eff', bot: '#87ceeb', glow: 'rgba(255,200,50,0.12)' },
    'clear-night': { top: '#010103', mid: '#04060e', bot: '#0a0d1a', glow: 'rgba(180,160,255,0.03)' },
    'cloudy':      { top: '#3a4a5a', mid: '#5a6a7a', bot: '#7a8a9a', glow: 'rgba(200,200,220,0.06)' },
    'cloudy-night':{ top: '#05060a', mid: '#0a0e16', bot: '#111624', glow: 'rgba(100,120,160,0.03)' },
    'rain':        { top: '#1a2a3a', mid: '#2a3a4a', bot: '#4a5a6a', glow: 'rgba(100,150,220,0.10)' },
    'rain-night':  { top: '#030508', mid: '#080a12', bot: '#0e121e', glow: 'rgba(40,80,160,0.05)' },
    'snow':        { top: '#4a5a6a', mid: '#7a8a9a', bot: '#b0c0d0', glow: 'rgba(220,240,255,0.12)' },
    'snow-night':  { top: '#080a12', mid: '#0f121e', bot: '#1a1e2e', glow: 'rgba(140,170,210,0.05)' },
    'fog':         { top: '#3a4048', mid: '#5a6068', bot: '#7a8088', glow: 'rgba(180,190,200,0.06)' },
    'fog-night':   { top: '#06070a', mid: '#0b0d12', bot: '#12151c', glow: 'rgba(80,100,130,0.03)' },
    'storm':       { top: '#0f1218', mid: '#1a1f2a', bot: '#2a3040', glow: 'rgba(180,120,200,0.08)' },
    'storm-night': { top: '#020204', mid: '#060810', bot: '#0c0e18', glow: 'rgba(80,50,120,0.06)' }
  };

  function startAtmosphere(container, weatherCode, isDay){
    var canvas = getEl('weatherAtmosphere', container);
    if(!canvas) return;
    var particlesContainer = getEl('weatherParticles', container);
    if(!particlesContainer) return;

    // 清除旧的动画
    stopAtmosphere();

    var ctx = canvas.getContext('2d');
    var info = getWeatherInfo(weatherCode);
    var iconKey = info.icon;
    var isNight = isDay === 0 || isDay === false;
    // 如果 isDay 未定义（旧缓存等），根据当前时间判断
    if(isDay === undefined){
      var hour = new Date().getHours();
      isNight = hour < 6 || hour >= 18;
    }
    // 使用夜晚的大气配色
    var nightKey = (iconKey === 'clear-day' ? 'clear' : iconKey) + '-night';
    if(isNight && ATMOSPHERE_COLORS[nightKey]){
      iconKey = nightKey;
    }
    var colors = ATMOSPHERE_COLORS[iconKey] || ATMOSPHERE_COLORS['cloudy'];

    // 调整canvas大小
    function resize(){
      var parent = canvas.parentElement;
      if(parent){
        canvas.width = parent.offsetWidth || 400;
        canvas.height = parent.offsetHeight || 400;
      }
    }
    resize();
    // 监听容器大小变化
    atmosphereObserver = new ResizeObserver(function(){ resize(); });
    atmosphereObserver.observe(canvas.parentElement);

    // 渐变背景绘制循环
    var phase = 0;
    function drawAtmosphere(){
      var w = canvas.width, h = canvas.height;
      if(w === 0 || h === 0){ atmosphereAnimId = requestAnimationFrame(drawAtmosphere); return; }

      ctx.clearRect(0, 0, w, h);

      // 主渐变
      var grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, colors.top);
      grad.addColorStop(0.5, colors.mid);
      grad.addColorStop(1, colors.bot);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 发光光晕（缓慢呼吸）
      phase += 0.005;
      var glowAlpha = 0.06 + 0.04 * Math.sin(phase);
      if(colors.glow){
        // 夜晚时发光位置偏上（模拟月光），白天偏左
        var gx, gy;
        if(isNight){
          gx = w * (0.5 + 0.08 * Math.sin(phase * 0.5));
          gy = h * 0.12;
        } else {
          gx = w * (0.3 + 0.1 * Math.sin(phase * 0.7));
          gy = h * 0.25;
        }
        var grd = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * 0.5);
        grd.addColorStop(0, colors.glow.replace(/[\d.]+\)$/, glowAlpha + ')'));
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      }

      // 夜晚效果
      if(isNight){
        // 提取基础天气类型（移除 -night 后缀）
        var baseWeather = iconKey.replace('-night', '');
        var weatherRNG = createRNG(weatherCode * 137 + 777);

        // ---- 晴夜：璀璨星空 + 月亮 + 银河 + 流星 ----
        if(baseWeather === 'clear' || baseWeather === 'clear-day'){
          // 银河带（放在最下层）
          var milkyRNG = createRNG(weatherCode * 331 + 999);
          for(var i = 0; i < 300; i++){
            var mx = milkyRNG() * w;
            var my = milkyRNG() * h * 0.5 + h * 0.05;
            var md = Math.abs(my - h * 0.3) / (h * 0.3);
            if(md < 0.4){
              var mAlpha = (0.15 - md * 0.4) * (0.4 + 0.3 * Math.sin(phase * 0.3 + mx * 0.01));
              ctx.beginPath();
              ctx.arc(mx, my, 0.8 + milkyRNG() * 1.2, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(160,190,240,' + Math.max(0, mAlpha) + ')';
              ctx.fill();
            }
          }
          // 月亮 — 缩小月晕范围，提高清晰度
          var moonX = w * 0.82, moonY = h * 0.12;
          var moonR = 14 + 2 * Math.sin(phase * 0.5);
          var moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, w * 0.12);
          var moonAlpha = 0.08 + 0.04 * Math.sin(phase * 0.6);
          moonGlow.addColorStop(0, 'rgba(200,210,255,' + moonAlpha + ')');
          moonGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = moonGlow;
          ctx.fillRect(0, 0, w, h);
          // 月面
          ctx.beginPath();
          ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(230,235,250,0.95)';
          ctx.fill();
          // 星星（密集高亮）
          for(var i = 0; i < 200; i++){
            var sx = weatherRNG() * w;
            var sy = weatherRNG() * (h * 0.85);
            var sr = 0.4 + weatherRNG() * 1.8;
            var twinkle = 0.7 + 0.3 * Math.sin(phase * 2.0 + i * 3.1 + sx * 0.05);
            var starColor = weatherRNG() < 0.12 ? '180,200,255' : (weatherRNG() < 0.08 ? '255,230,180' : '255,255,255');
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + starColor + ',' + twinkle + ')';
            ctx.fill();
          }
          // 流星
          if(Math.random() < 0.003){
            shootingStars.push({
              x: Math.random() * w * 0.8,
              y: Math.random() * h * 0.3,
              vx: 5 + Math.random() * 7,
              vy: 2 + Math.random() * 3,
              life: 1.0,
              len: 40 + Math.random() * 50
            });
          }
          for(var si = shootingStars.length - 1; si >= 0; si--){
            var s = shootingStars[si];
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * s.len * 0.04, s.y - s.vy * s.len * 0.04);
            ctx.strokeStyle = 'rgba(255,255,255,' + (s.life * 0.9) + ')';
            ctx.lineWidth = 1.5 * s.life;
            ctx.stroke();
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.018;
            if(s.life <= 0) shootingStars.splice(si, 1);
          }
        }

        // ---- 多云夜：稀疏星星 + 云隙月光 ----
        if(baseWeather === 'cloudy' || baseWeather === 'cloudy-day'){
          // 少量暗星
          for(var i = 0; i < 20; i++){
            var sx = weatherRNG() * w;
            var sy = weatherRNG() * (h * 0.4);
            var sr = 0.5 + weatherRNG() * 1.0;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200,210,230,' + (0.15 + 0.15 * Math.sin(phase + i)) + ')';
            ctx.fill();
          }
          // 云隙月光
          var gapX = w * (0.6 + 0.15 * Math.sin(phase * 0.4));
          var gapY = h * 0.08;
          var gapGlow = ctx.createRadialGradient(gapX, gapY, 0, gapX, gapY, w * 0.25);
          gapGlow.addColorStop(0, 'rgba(160,180,220,0.04)');
          gapGlow.addColorStop(0.5, 'rgba(140,160,200,0.02)');
          gapGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = gapGlow;
          ctx.fillRect(0, 0, w, h);
        }

        // ---- 雨夜：闪电 + 暗云 ----
        if(baseWeather === 'rain' || baseWeather === 'storm'){
          // 星星极少
          if(baseWeather === 'rain'){
            for(var i = 0; i < 8; i++){
              var sx = weatherRNG() * w;
              var sy = weatherRNG() * (h * 0.3);
              ctx.beginPath();
              ctx.arc(sx, sy, 0.4, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(180,200,230,0.1)';
              ctx.fill();
            }
          }
          // 闪电闪白
          var lightningFlash = 0;
          if(Math.random() < 0.008){
            lightningFlash = 0.06 + Math.random() * 0.08;
            // 闪电分支
            var lx = w * (0.2 + Math.random() * 0.6);
            var ly = h * 0.05;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            var cx = lx, cy = ly;
            for(var j = 0; j < 6; j++){
              cx += (Math.random() - 0.3) * w * 0.08;
              cy += h * (0.08 + Math.random() * 0.06);
              ctx.lineTo(cx, cy);
              // 小分支
              if(Math.random() < 0.4){
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + (Math.random() - 0.5) * w * 0.04, cy + h * 0.03);
              }
            }
            ctx.strokeStyle = 'rgba(200,220,255,' + (lightningFlash * 0.8) + ')';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          // 闪电照亮全屏
          if(lightningFlash > 0){
            ctx.fillStyle = 'rgba(180,200,255,' + (lightningFlash * 0.08) + ')';
            ctx.fillRect(0, 0, w, h);
          }
        }

        // ---- 雪夜：极光 ----
        if(baseWeather === 'snow' || baseWeather === 'snow-day'){
          var auroraRNG = createRNG(weatherCode * 523 + 111);
          for(var i = 0; i < 3; i++){
            var aPhase = phase * 0.2 + i * 2.1;
            var ax = w * (0.15 + 0.35 * i + 0.1 * Math.sin(aPhase));
            var aw = w * (0.25 + 0.1 * Math.sin(aPhase * 0.7));
            var aColors = [
              ['rgba(100,255,180,', 'rgba(60,200,150,'],
              ['rgba(80,200,255,', 'rgba(40,150,220,'],
              ['rgba(160,140,255,', 'rgba(100,80,200,']
            ];
            var auroraColors = aColors[i];
            for(var j = 0; j < 20; j++){
              var layer = j / 20;
              var lx = ax - aw/2 + (auroraRNG() * aw);
              var ly = h * 0.05 + layer * h * 0.3 + 0.03 * h * Math.sin(aPhase * 2 + j * 0.5);
              var lw = aw * 0.15;
              var lh = h * 0.015;
              var alpha = (0.12 - layer * 0.1) * (0.5 + 0.5 * Math.sin(aPhase + j * 0.3));
              if(alpha > 0){
                ctx.beginPath();
                ctx.ellipse ? ctx.ellipse(lx, ly, lw, lh, 0, 0, Math.PI * 2) : ctx.arc(lx, ly, lw, 0, Math.PI * 2);
                ctx.fillStyle = auroraColors[0] + alpha + ')';
                ctx.fill();
              }
            }
          }
          // 少量星星
          for(var i = 0; i < 30; i++){
            var sx = auroraRNG() * w;
            var sy = auroraRNG() * (h * 0.5);
            var sr = 0.5 + auroraRNG() * 1.2;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(220,235,255,' + (0.15 + 0.2 * Math.sin(phase * 1.2 + i * 2.5)) + ')';
            ctx.fill();
          }
        }

        // ---- 雾夜：微光 ----
        if(baseWeather === 'fog' || baseWeather === 'fog-day'){
          // 几乎无星，仅微弱的光晕
          for(var i = 0; i < 5; i++){
            var sx = weatherRNG() * w;
            var sy = weatherRNG() * (h * 0.2);
            ctx.beginPath();
            ctx.arc(sx, sy, 0.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200,210,230,0.06)';
            ctx.fill();
          }
          // 雾中微光
          var mistLightX = w * (0.3 + 0.2 * Math.sin(phase * 0.2));
          var mistLightY = h * 0.3;
          var mistGlow = ctx.createRadialGradient(mistLightX, mistLightY, 0, mistLightX, mistLightY, w * 0.4);
          mistGlow.addColorStop(0, 'rgba(150,170,200,0.02)');
          mistGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = mistGlow;
          ctx.fillRect(0, 0, w, h);
        }
      }

      atmosphereAnimId = requestAnimationFrame(drawAtmosphere);
    }
    drawAtmosphere();

    // 粒子系统
    spawnParticles(particlesContainer, iconKey, isNight);
  }

  function spawnParticles(container, iconKey, isNight){
    if(!container) return;

    // 在 weather-container 上标记昼夜和天气类型，供 CSS 选择器统一适配
    var weatherContainer = container.parentElement;
    if(weatherContainer){
      if(isNight){
        weatherContainer.setAttribute('data-night', '');
      } else {
        weatherContainer.removeAttribute('data-night');
      }
      // 设置基础天气类型（移除 -night 后缀）用于 CSS 定制
      var baseKey = iconKey.replace('-night', '');
      weatherContainer.setAttribute('data-weather', baseKey);
    }

    // 使用基础天气类型（无 -night 后缀）匹配粒子规则
    var particleKey = iconKey.replace('-night', '');

    var particleTypes = [];
    if(particleKey === 'rain' || particleKey === 'storm'){
      for(var i = 0; i < 60; i++) particleTypes.push('rain');
    }
    if(particleKey === 'snow'){
      for(var i = 0; i < 50; i++) particleTypes.push('snow');
    }
    if(particleKey === 'cloudy' || particleKey === 'fog' || particleKey === 'rain' || particleKey === 'snow'){
      for(var i = 0; i < 3; i++) particleTypes.push('cloud');
    }
    if(particleKey === 'fog' || particleKey === 'cloudy'){
      for(var i = 0; i < 4; i++) particleTypes.push('mist');
    }
    if(particleKey === 'clear-day'){
      for(var i = 0; i < 2; i++) particleTypes.push('cloud');
    }

    // 基于基础天气类型种子随机，同一天气类型粒子布局一致
    var rng = createRNG(hashStr(particleKey));

    var html = '';
    for(var i = 0; i < particleTypes.length; i++){
      var type = particleTypes[i];
      if(type === 'rain'){
        var rd = (0.6 + rng() * 0.4).toFixed(2);
        var rl = (rng() * 2).toFixed(2);
        var rx = (rng() * 100).toFixed(1);
        html += '<div class="weather-particle rain" style="left:' + rx + '%;animation-duration:' + rd + 's;animation-delay:' + rl + 's;"></div>';
      } else if(type === 'snow'){
        var sd = (3 + rng() * 4).toFixed(2);
        var sl = (rng() * 3).toFixed(2);
        var sx = (rng() * 100).toFixed(1);
        var sw = (4 + rng() * 5).toFixed(0);
        var sh = (4 + rng() * 5).toFixed(0);
        html += '<div class="weather-particle snow" style="left:' + sx + '%;animation-duration:' + sd + 's;animation-delay:' + sl + 's;width:' + sw + 'px;height:' + sh + 'px;"></div>';
      } else if(type === 'cloud'){
        var cd = (15 + rng() * 20).toFixed(2);
        var cl = (-(rng() * 30)).toFixed(2);
        var cy = (5 + rng() * 30).toFixed(1);
        var cw = (50 + rng() * 60).toFixed(0);
        html += '<div class="weather-particle cloud" style="top:' + cy + '%;width:' + cw + 'px;animation-duration:' + cd + 's;animation-delay:' + cl + 's;"></div>';
      } else if(type === 'mist'){
        var md = (20 + rng() * 25).toFixed(2);
        var ml = (-(rng() * 20)).toFixed(2);
        var my = (40 + rng() * 40).toFixed(1);
        var mw = (100 + rng() * 80).toFixed(0);
        html += '<div class="weather-particle mist" style="top:' + my + '%;width:' + mw + 'px;animation-duration:' + md + 's;animation-delay:' + ml + 's;"></div>';
      }
    }
    container.innerHTML = html;
  }

  function stopAtmosphere(){
    if(atmosphereAnimId){
      cancelAnimationFrame(atmosphereAnimId);
      atmosphereAnimId = null;
    }
    if(atmosphereObserver){
      atmosphereObserver.disconnect();
      atmosphereObserver = null;
    }
    shootingStars = [];
  }

  // 清理旧版缓存
  try { localStorage.removeItem('weather_cache'); } catch(e){}

  // 注册处理程序
  Addons._handlers = Addons._handlers || {};

  Addons._handlers['weather'] = {
    activate: function(){
      if(overlayEl){
        closeDialog();
      } else {
        showDialog();
        var btn = document.querySelector('.addon-activate-btn[data-addon-id="weather"]');
        if(btn) btn.textContent = '\u5378\u8f7d';
      }
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
