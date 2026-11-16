<template>
  <div class="webword-wrapper">
    <WebWordApp />
  </div>
</template>

<script setup lang="ts">
import WebWordApp from '@/webword/App.vue'
</script>

<style>
.webword-wrapper {
  height: 100%;
  position: relative;
  /* transform 使 WebWord 内部 fixed 元素（弹窗/覆盖层/下拉）以本容器为包含块，
     保持与 iframe 视口语义一致，避免弹层覆盖整个桌面 */
  transform: translateZ(0);
}

/* 独立访问 /webword（不在桌面窗口内）时，父级 .desktop-app 只有 min-height，
   百分比高度会退化为 auto（被内容撑开），文件菜单这类整屏覆盖层就会只有半屏高。
   这里直接给满屏高度，与 /blog 的处理方式一致。 */
.desktop-app > .webword-wrapper {
  height: 100vh;
  height: 100dvh;
}
</style>
