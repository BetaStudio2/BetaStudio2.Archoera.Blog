<template>
  <div class="desktop-app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss">
/* ── 全局字体声明 ── */
@font-face {
  font-family: 'MiSans';
  src: url('/fonts/MiSans/MiSans-Light.ttf') format('truetype');
  font-weight: 300;
  font-style: normal;
}
@font-face {
  font-family: 'MiSans';
  src: url('/fonts/MiSans/MiSans-Normal.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'MiSans';
  src: url('/fonts/MiSans/MiSans-Medium.ttf') format('truetype');
  font-weight: 500;
  font-style: normal;
}
@font-face {
  font-family: 'MiSans';
  src: url('/fonts/MiSans/MiSans-Bold.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #0f0c29;
  color: #fff;
}

.desktop-app {
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
}

/* ── Firefox / Gecko 核心浏览器专属渲染优化 ──
   解决 GPU 合成层 + transform:scale() 叠加下的发糊问题 */
@-moz-document url-prefix() {
  html, body {
    -webkit-font-smoothing: subpixel-antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    image-rendering: auto;
  }

  /* Firefox 下，带 transform 的合成层使用高质量缩放算法 */
  [style*="transform"],
  [style*="translate3d"],
  [style*="scale("] {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }

  /* 避免 Firefox 为了性能把合成层分辨率减半（常见于 backdrop-filter 元素） */
  * {
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
  }

  /* 对 backdrop-filter 模糊元素：强制保持设备像素比精度
     Firefox 默认会降低模糊层的分辨率来换取性能 */
  [style*="backdrop-filter"],
  [style*="-webkit-backdrop-filter"] {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}
</style>
