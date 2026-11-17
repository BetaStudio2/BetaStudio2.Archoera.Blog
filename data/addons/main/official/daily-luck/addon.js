(function(){
  var WW = window.WebWord = window.WebWord || {};
  var Addons = WW.addons = WW.addons || {};

  var overlayEl = null;
  var dialogEl = null;
  var styleEl = null;

  function getEl(id, container){
    return (container || document).querySelector('#' + id);
  }

  // 基于日期+设备特征的固定种子，同一天同一设备结果不变
  function getDailySeed(){
    var now = new Date();
    var dateStr = now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate();
    // 设备指纹：屏幕分辨率 + 语言 + 平台
    var deviceStr = screen.width + 'x' + screen.height + navigator.language + navigator.platform;
    var combined = dateStr + '|' + deviceStr;
    var hash = 0;
    for(var i = 0; i < combined.length; i++){
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // 基于种子的确定性随机数（线性同余法），分布更均匀
  function seededRandom(seed){
    var x = (seed * 9301 + 49297) % 233280;
    return x / 233280;
  }

  // 计算人品值 0~100，0 有约 1% 概率出现
  function calcScore(seed){
    var score = Math.floor(seededRandom(seed) * 100);
    // 如果落在 99~99.9 区间，映射为 0（约 1% 概率）
    if(score >= 99){
      score = 0;
    }
    return score;
  }

  function getLevel(score){
    if(score === -1) return 'tamper';
    if(score === 0) return 'doom';
    if(score >= 95) return 'max';
    if(score >= 85) return 'great';
    if(score >= 70) return 'good';
    if(score >= 50) return 'normal';
    if(score >= 30) return 'bad';
    return 'worst';
  }

  var levelLabels = {
    tamper: [
      '\u6539\u6570\u636e\uff1f\u4e0d\u5b58\u5728\u7684\u3002',
      '\u4f60\u4ee5\u4e3a\u6539\u4e86 localStorage \u5c31\u80fd\u6539\u53d8\u4eba\u751f\uff1f',
      '\u7cfb\u7edf\u68c0\u6d4b\u5230\u4e86\u4e00\u4e2a\u5c0f\u52a8\u4f5c\u3002',
      '\u4eba\u54c1\u503c\u6838\u9a8c\u5931\u8d25\u3002\u8bf7\u91cd\u65b0\u67e5\u770b\u3002',
      '\u7b97\u76d8\u7387\u5f88\u9ad8\uff0c\u4f46\u4eba\u54c1\u4e0d\u662f\u8fd9\u4e48\u7b97\u7684\u3002'
    ],
    max: [
      '\u5927\u5409\u5927\u5229\u2014\u2014\u8d85\u7ea7\u597d\u8fd0\uff01',
      '\u767e\u65e0\u7981\u5fcc\uff0c\u4e07\u4e8b\u4ff1\u606a\uff01',
      '\u6982\u7387\u4e4b\u795e\u4eca\u5929\u7761\u7740\u4e86\u2026\u2026',
      '\u8fd0\u6c14\u7206\u68da\uff01\u5feb\u53bb\u4e70\u5f69\u7968\uff01',
      '\u4eca\u65e5\u8fd0\u52bf\u5982\u5d3d\u9e70\u5c55\u7ffc\uff0c\u5343\u91cc\u4e91\u5c71\u4e00\u7ebf\u5929\u3002',
      '\u4f60\u662f\u4eca\u5929\u7684\u5ba0\u513f\uff0c\u5b87\u5b99\u5728\u4e3a\u4f60\u5e03\u5c40\u3002',
      '\u798f\u661f\u9ad8\u7167\uff0c\u8d35\u4eba\u5728\u4fa7\uff0c\u7f18\u5206\u5df2\u5230\u3002',
      '\u8fd9\u4e00\u5207\u90fd\u662f\u6700\u597d\u7684\u5b89\u6392\u2014\u2014\u800c\u4e14\u4eca\u5929\u5c24\u5176\u597d\u3002',
      '\u4e0d\u662f\u4f60\u7684\u5e78\u8fd0\u6765\u4e86\uff0c\u662f\u5e78\u8fd0\u7ec8\u4e8e\u627e\u5230\u4e86\u4e3b\u4eba\u3002',
      '\u4eca\u65e5\u5b9c\u5c55\u573a\u3002\u767e\u65e0\u7981\u5fcc\uff0c\u5927\u5c55\u5b8f\u56fe\u3002',
      '\u8fd0\u6c14\u503c\u6ee1\u8d5b\u4e9a\u661f\u7403\uff0c\u542f\u52a8\u5b87\u5b99\u7ea7\u597d\u8fd0\u6a21\u5f0f\u3002',
      '\u5e78\u798f\u6765\u5f97\u592a\u7a81\u7136\uff0c\u4f60\u51c6\u5907\u597d\u4e86\u5417\uff1f'
    ],
    great: [
      '\u6240\u5411\u62ab\u9776\uff0c\u6240\u5230\u5c61\u65b0\u3002',
      '\u8bf8\u4e8b\u987a\u7545\uff0c\u7740\u624b\u53ef\u884c\u3002',
      '\u4eba\u9645\u548c\u7545\uff0c\u8d35\u4eba\u4e91\u96c6\u3002',
      '\u5f97\u5fc3\u5e94\u624b\uff0c\u4e8b\u534a\u529f\u500d\u3002',
      '\u665f\u5149\u521d\u73b0\uff0c\u524d\u8def\u5149\u660e\u3002',
      '\u767e\u5ddd\u5f52\u6d77\uff0c\u800c\u4f60\u5728\u6d41\u91cc\u627e\u5230\u4e86\u81ea\u5df1\u7684\u8def\u3002',
      '\u65e0\u9700\u8fc7\u591a\u76d8\u7b97\uff0c\u4eca\u65e5\u5c3d\u60c5\u53d1\u6325\u3002',
      '\u4eba\u54c1\u5728\u7ebf\uff0c\u60c5\u7eea\u5355\u6b63\uff0c\u884c\u52a8\u529b\u8f93\u51fa\u4e2d\u3002',
      '\u5fc3\u60c5\u662f\u4eca\u5929\u7684\u5f20\u826f\uff0c\u505a\u4e8b\u662f\u660e\u5929\u7684\u8d77\u70b9\u3002',
      '\u8bf8\u4e8b\u5df2\u5907\uff0c\u53ea\u7b49\u4e00\u9635\u4e1c\u98ce\u3002\u98ce\u6765\u4e86\u3002',
      '\u8fd0\u52bf\u8f6c\u597d\uff0c\u7ec6\u5fae\u4e4b\u5904\u4e5f\u80fd\u5f00\u82b1\u3002'
    ],
    good: [
      '\u6ce2\u6f9c\u4e0d\u60ca\uff0c\u8303\u8303\u800c\u884c\u3002',
      '\u98ce\u548c\u65e5\u4e3d\uff0c\u5b9c\u5f80\u76f4\u884c\u3002',
      '\u5c0f\u5fb7\u5728\u90bb\uff0c\u4e0d\u8d1f\u5c18\u6e0a\u3002',
      '\u6b65\u6b65\u4e3a\u8425\uff0c\u5fd7\u5728\u5343\u91cc\u3002',
      '\u5b89\u4e4b\u82e5\u7d20\uff0c\u5f97\u5176\u6240\u5b89\u3002',
      '\u4eca\u5929\u662f\u53ef\u4ee5\u5fae\u7b11\u7684\u65e5\u5b50\u3002\u539f\u56e0\u4e0d\u91cd\u8981\u3002',
      '\u5e78\u798f\u5728\u7ec6\u8282\u91cc\uff0c\u4eca\u5929\u591a\u7559\u610f\u5c31\u662f\u3002',
      '\u4e00\u5c0f\u6b65\u4e00\u5c0f\u6b65\u5730\u8d70\uff0c\u5f88\u5feb\u5c31\u4f1a\u53d1\u73b0\u8d70\u5f97\u5f88\u8fdc\u4e86\u3002',
      '\u522b\u5c0f\u770b\u4eca\u5929\uff0c\u5b83\u662f\u672a\u6765\u7684\u4e00\u90e8\u5206\u3002',
      '\u5f53\u4e0b\u7a33\u59a5\uff0c\u4fbf\u662f\u6700\u597d\u7684\u626f\u5e55\u3002',
      '\u4eca\u65e5\u5b9c\u7ec6\u54c1\u751f\u6d3b\uff0c\u4e0d\u5b9c\u5fd9\u78cc\u3002',
      '\u5c0f\u5e78\u8fd0\u96be\u5f97\uff0c\u5927\u5e78\u8fd0\u53ef\u9047\u4e0d\u53ef\u6c42\u2014\u2014\u4f46\u4eca\u5929\u80af\u5b9a\u4e0d\u5dee\u3002',
      '\u987a\u5176\u81ea\u7136\u4e5f\u662f\u4e00\u79cd\u52c7\u6c14\u3002\u4eca\u5929\u53ef\u4ee5\u5c1d\u8bd5\u3002'
    ],
    normal: [
      '\u5f97\u5931\u4e91\u70df\uff0c\u987a\u5176\u81ea\u7136\u3002',
      '\u751f\u6d3b\u5982\u5e38\uff0c\u8303\u8303\u4ea6\u53ef\u3002',
      '\u4e16\u4e8b\u65e0\u5e38\uff0c\u4eba\u751f\u5982\u5b87\u3002',
      '\u5fc3\u5b89\u5219\u9759\uff0c\u5fc3\u9759\u5219\u61c2\u3002',
      '\u6a44\u6984\u5165\u5473\uff0c\u56de\u5473\u65e0\u7a77\u3002',
      '\u8303\u8303\u8d70\uff0c\u8303\u8303\u6d3b\uff0c\u8303\u8303\u4e5f\u662f\u4e00\u79cd\u6d3b\u6cd5\u3002',
      '\u4e0d\u5fc5\u6bcf\u5929\u90fd\u5145\u5b9e\uff0c\u653e\u677e\u4e00\u70b9\u4e5f\u597d\u3002',
      '\u4eca\u5929\u7684\u4f60\u4e0d\u662f\u592a\u5dee\uff0c\u53ea\u662f\u8fd8\u6ca1\u53d1\u5149\u3002',
      '\u65e0\u8bba\u597d\u574f\uff0c\u53ea\u662f\u4e00\u5929\u3002\u660e\u5929\u53c8\u662f\u65b0\u7684\u3002',
      '\u4e2d\u4e2d\u4e5f\u4e0d\u9519\uff0c\u4e2d\u5c31\u662f\u5b89\u5168\u7684\u4ee3\u540d\u8bcd\u3002',
      '\u5e73\u5e78\u662f\u798f\u3002\u4eca\u65e5\u5b9c\u5e73\u5b89\u3002',
      '\u8336\u6ee1\u4e0a\uff0c\u53ef\u4ee5\u5c0f\u61d2\u4e00\u4e0b\u3002'
    ],
    bad: [
      '\u5c0f\u51f6\uff0c\u4e0d\u5b9c\u8f7b\u4e3e\u5fd8\u52a8\u3002',
      '\u592a\u5c71\u6c89\u6d7d\uff0c\u4e0d\u5b9c\u6025\u9020\u3002',
      '\u665f\u5149\u5fae\u663e\uff0c\u4f51\u5f85\u8f6c\u8fd0\u3002',
      '\u767e\u4e1a\u4ff1\u5e9f\uff0c\u5b9c\u591a\u4f11\u606f\u3002',
      '\u798f\u798d\u76f8\u4f9d\uff0c\u8010\u5fc3\u5f85\u4e4b\u3002',
      '\u5931\u8bef\u4e0d\u662f\u7ec8\u70b9\uff0c\u662f\u8d77\u70b9\u7684\u53e6\u4e00\u79cd\u5199\u6cd5\u3002',
      '\u505a\u4e8b\u5c0f\u5fc3\uff0c\u8bf4\u8bdd\u5c0f\u5fc3\uff0c\u8d70\u8def\u4e5f\u5c0f\u5fc3\u3002',
      '\u4e0d\u5b9c\u5927\u52a8\u4f5c\uff0c\u5b9c\u5c0f\u6b65\u5feb\u8dd1\u3002',
      '\u5047\u5982\u4eca\u5929\u4e0d\u592a\u597d\uff0c\u90a3\u4e48\u8bf4\u660e\u660e\u5929\u6709\u66f4\u5927\u7684\u597d\u4e8b\u5728\u7b49\u4f60\u3002',
      '\u4eba\u751f\u8d77\u4f0f\uff0c\u4eca\u65e5\u4e0d\u5b9c\u51b2\u52a8\u6d88\u8d39\u3002',
      '\u5c0f\u5c0f\u7684\u5760\u5c98\u662f\u4e3a\u4e86\u66f4\u5927\u7684\u98de\u8dc3\u3002\u4f46\u4eca\u5929\u8fd8\u662f\u5148\u522b\u98de\u3002'
    ],
    worst: [
      '\u5927\u51f6\uff0c\u5b9c\u4f11\u606f\u3002',
      '\u767e\u4e8b\u4e0d\u5b9c\uff0c\u7f62\u624b\u518d\u8bf4\u3002',
      '\u5b9c\u9ed8\u5b9c\u5e95\uff0c\u5b9c\u8ba9\u5b9c\u63a8\u3002',
      '\u672b\u8def\u8ff7\u832b\uff0c\u56de\u5934\u662f\u5cb8\u3002',
      '\u5929\u6613\u6b8b\u4e91\uff0c\u7b49\u5f85\u8f6c\u673a\u3002',
      '\u4eca\u5929\u7684\u5efa\u8bae\uff1a\u4e0d\u8981\u505a\u4efb\u4f55\u5efa\u8bae\u3002',
      '\u8fd0\u52bf\u4f4e\u8c37\uff0c\u4f46\u8bb0\u4f4f\u2014\u2014\u8c37\u5e95\u4e4b\u540e\u53ea\u80fd\u5411\u4e0a\u3002',
      '\u4f60\u4e0d\u662f\u5b64\u5355\u7684\uff0c\u8fd8\u6709\u5c0f\u51f6\u3001\u4e2d\u51f6\u548c\u5927\u51f6\u966a\u4f60\u3002',
      '\u5168\u8eab\u8bbe\u7f6e\u4e3a\u201c\u4fdd\u62a4\u6a21\u5f0f\u201d\uff0c\u4eca\u65e5\u5b9c\u7f29\u5728\u88ab\u7a9d\u91cc\u3002',
      '\u4e0d\u8981\u6025\uff0c\u4e0d\u8981\u6162\uff0c\u4eca\u5929\u5c31\u662f\u7528\u6765\u8fc7\u7684\u3002',
      '\u5929\u5c06\u964d\u5927\u4efb\u4e8e\u662f\u4eba\u4e5f\u2026\u2026\u7b97\u4e86\uff0c\u660e\u5929\u518d\u8bf4\u3002',
      '\u4eba\u54c1\u503c\u7684\u6700\u5c0f\u503c\u4e0d\u662f\u4f60\u7684\u6700\u5c0f\u503c\u3002\u6df1\u547c\u5438\u3002'
    ],
    doom: [
      '\u5f97\u5206\u4e3a\u96f6\u3002\u548c\u5b57\u5178\u91cc\u7684\u201c\u4eba\u54c1\u201d\u540c\u97f3\u3002',
      '\u5df2\u7ecf\u5f3a\u5927\u5230\u65e0\u6cd5\u7528\u4eba\u54c1\u6765\u8861\u91cf\u3002',
      '\u8fd9\u662f\u4e00\u4e2a\u5f88\u5927\u7684\u6570\u5b57\u3002\u5565\uff1f\u4f60\u8bf4\u96f6\u662f\u5c0f\u6570\uff1f\u96f6\u4e5f\u662f\u65e0\u9650\u3002',
      '\u201c\u4eba\u54c1\u201d\u8fd9\u4e2a\u5b9a\u4e49\u672c\u8eab\u5c31\u592a\u5c40\u9650\u4e86\uff0c\u4f60\u786e\u5b9a\u8981\u7528\u4e00\u4e2a\u6570\u5b57\u5b9a\u4e49\u81ea\u5df1\uff1f',
      '\u77e5\u9053\u4e3a\u4ec0\u4e48\u662f\u96f6\u5417\uff1f\u56e0\u4e3a\u8bbe\u8ba1\u5e08\u6ca1\u7ed9\u4e00\u767e\u5206\u505a\u300c\u8d1f\u6570\u300d\u6548\u679c\u3002',
      '\u5f53\u4f60\u770b\u5230\u96f6\u7684\u65f6\u5019\uff0c\u610f\u5473\u7740\u7cfb\u7edf\u5728\u544a\u8bc9\u4f60\uff1a\u201c\u6211\u4e0d\u77e5\u9053\u600e\u4e48\u8bc4\u5206\u4f60\u3002\u201d',
      '\u6ee1\u5206\u4e3a\u591a\u5c11\uff1f\u4e0d\u91cd\u8981\u3002\u91cd\u8981\u7684\u662f\u4f60\u5f97\u5230\u4e86\u4e00\u4e2a\u5f88\u5c11\u89c1\u7684\u6570\u5b57\u3002',
      '\u7cfb\u7edf\u63d0\u793a\uff1a\u201c\u4eba\u54c1\u503c\u5df2\u7ecf\u6ee1\u51fa\u754c\u9762\u663e\u793a\u8303\u56f4\u3002\u201d\u6240\u4ee5\u663e\u793a\u4e3a\u96f6\u3002',
      '\u8fd9\u4e0d\u662f\u4f60\u7684\u9519\uff0c\u662f\u8fd9\u4e2a\u6570\u5b57\u592a\u5c0f\u4e86\uff0c\u5c0f\u5230\u7cfb\u7edf\u90fd\u4e0d\u597d\u610f\u601d\u5b9a\u4e49\u3002',
      '\u5dee\u70b9\u5c31\u5f97\u5230\u4e86\u6b63\u6570\u2014\u2014\u53ef\u60dc\u5dee\u90a3\u4e48\u4e00\u70b9\u70b9\u3002',
      '\u53bb\u5e74\u7684\u4eba\u54c1\u501f\u524d\u5929\u7684\u94b1\u8fd8\u6ca1\u8fd8\u6e05\u3002'
    ]
  };

  function pickRandom(arr){
    var idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
  }

  function getSentence(score){
    if(score === -1) return pickRandom(levelLabels.tamper);
    if(score === 0) return pickRandom(levelLabels.doom);
    if(score >= 95) return pickRandom(levelLabels.max);
    if(score >= 85) return pickRandom(levelLabels.great);
    if(score >= 70) return pickRandom(levelLabels.good);
    if(score >= 50) return pickRandom(levelLabels.normal);
    if(score >= 30) return pickRandom(levelLabels.bad);
    return pickRandom(levelLabels.worst);
  }

  // 计算人品值的 HMAC 校验码（防篡改）
  function calcChecksum(score, dateStr){
    var salt = 'DailyLuck^v1@' + dateStr;
    var raw = score + '|' + salt;
    var hash = 0;
    for(var i = 0; i < raw.length; i++){
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  function saveScore(score){
    var now = new Date();
    var dateStr = now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate();
    var checksum = calcChecksum(score, dateStr);
    try {
      localStorage.setItem('dailyLuck_score', score);
      localStorage.setItem('dailyLuck_checksum', checksum);
      localStorage.setItem('dailyLuck_date', dateStr);
    } catch(e){}
  }

  function loadScore(){
    try {
      var score = localStorage.getItem('dailyLuck_score');
      var checksum = localStorage.getItem('dailyLuck_checksum');
      var storedDate = localStorage.getItem('dailyLuck_date');
      if(score === null || checksum === null || storedDate === null) return null;
      var now = new Date();
      var today = now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate();
      if(storedDate !== today) return null;
      if(calcChecksum(parseInt(score, 10), storedDate) !== checksum) {
         // hash 不匹配，篡改检测：返回特殊标记 -1
         return -1;
       }
      return parseInt(score, 10);
    } catch(e){
      return null;
    }
  }

  function showDialog(){
    if(dialogEl) return;
    if(!WW.addons.dailyLuck.htmlTemplate) return;

    overlayEl = document.createElement('div');
    overlayEl.className = 'modal-overlay';

    dialogEl = document.createElement('div');
    dialogEl.className = 'modal daily-luck-modal';
    dialogEl.innerHTML =
      '<div class="modal-head">' +
        '<span>\u4eca\u65e5\u4eba\u54c1</span>' +
        '<button class="modal-close" id="dailyLuckDialogClose"><i class="addon-icon addon-icon-close"></i></button>' +
      '</div>' +
      '<div class="modal-body addon-modal-body">' +
        WW.addons.dailyLuck.htmlTemplate +
      '</div>';

    overlayEl.appendChild(dialogEl);
    document.body.appendChild(overlayEl);

    if(!styleEl || !styleEl.parentNode){
      styleEl = document.createElement('link');
      styleEl.rel = 'stylesheet';
      styleEl.href = '/addons/official/daily-luck/style.css';
      document.head.appendChild(styleEl);
    }

    requestAnimationFrame(function(){
      overlayEl.classList.add('show');
    });

    var closeBtn = getEl('dailyLuckDialogClose');
    if(closeBtn){
      closeBtn.addEventListener('click', closeDialog);
    }

    overlayEl.addEventListener('click', function(e){
      if(e.target === overlayEl) closeDialog();
    });

    bindEvents(overlayEl);
  }

  function closeDialog(){
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
    var btns = document.querySelectorAll('.addon-activate-btn[data-addon-id="daily-luck"]');
    btns.forEach(function(b){ b.textContent = '\u88c5\u8f7d'; });
  }

  function bindEvents(container){
    var btn = getEl('dailyLuckBtn', container);
    var scoreEl = getEl('dailyLuckScore', container);
    var labelEl = getEl('dailyLuckLabel', container);
    var barEl = getEl('dailyLuckBar', container);
    var detailEl = getEl('dailyLuckDetail', container);

    // 从 localStorage 加载（带 hash 校验）
    var savedScore = loadScore();

    if(savedScore !== null){
      showResult(savedScore, scoreEl, labelEl, barEl, detailEl, btn);
    } else {
      // 无缓存数据，按钮可用
    }

    if(btn){
      btn.addEventListener('click', function(){
        if(btn.classList.contains('checked')) return;

        var seed = getDailySeed();
        var score = calcScore(seed);

        // 保存到 localStorage（带 hash 校验）
        saveScore(score);

        showResult(score, scoreEl, labelEl, barEl, detailEl, btn);
      });
    }
  }

  function showResult(score, scoreEl, labelEl, barEl, detailEl, btn){
    var level = getLevel(score);

    // 动画显示分数
    if(score === -1){
      if(scoreEl) scoreEl.textContent = 'awa';
    } else if(score === 0){
      if(scoreEl) scoreEl.textContent = '0';
    } else {
      var current = 0;
      var step = Math.max(1, Math.floor(score / 30));
      var timer = setInterval(function(){
        current += step;
        if(current >= score){
          current = score;
          clearInterval(timer);
        }
        if(scoreEl) scoreEl.textContent = current;
      }, 30);
    }

    if(scoreEl){
      scoreEl.className = 'daily-luck-score level-' + level;
    }
    if(labelEl){
      labelEl.textContent = '\u4f60\u4eca\u65e5\u7684\u4eba\u54c1\u662f';
    }
    if(barEl){
      setTimeout(function(){
        barEl.style.width = score + '%';
        barEl.className = 'daily-luck-bar-fill level-' + level;
      }, 100);
    }
    if(detailEl){
      setTimeout(function(){
        detailEl.textContent = getSentence(score);
      }, 1000);
    }
    if(btn){
      btn.classList.add('checked');
      btn.textContent = '\u4eca\u65e5\u5df2\u67e5\u770b';
    }
  }

  // 注册到统一调度器
  Addons._handlers = Addons._handlers || {};

  Addons._handlers['daily-luck'] = {
    activate: function(){
      showDialog();
      var btn = document.querySelector('.addon-activate-btn[data-addon-id="daily-luck"]');
      if(btn) btn.textContent = '\u5378\u8f7d';
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
