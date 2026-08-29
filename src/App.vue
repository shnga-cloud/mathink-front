<script setup></script>

<template>
  <router-view />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  width: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
    'Segoe UI Symbol', 'Noto Color Emoji';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ============ ElMessageBox 询问弹窗统一深色风格 ============ */
/* 用 .el-overlay-message-box 前缀提高优先级，确保覆盖 Element Plus 默认样式 */
.el-overlay-message-box .el-message-box {
  background: rgba(24, 24, 38, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  padding: 20px;
}

.el-overlay-message-box .el-message-box__title {
  color: #fff;
  font-weight: 600;
  font-size: 16px;
}

.el-overlay-message-box .el-message-box__content {
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
}

.el-overlay-message-box .el-message-box__headerbtn .el-message-box__close {
  color: rgba(255, 255, 255, 0.5);
}

.el-overlay-message-box .el-message-box__headerbtn:hover .el-message-box__close {
  color: #a78bfa;
}

.el-overlay-message-box .el-message-box__btns .el-button {
  border-radius: 8px;
  padding: 8px 18px;
}

/* 取消按钮：暗色描边 */
.el-overlay-message-box .el-message-box__btns .el-button:not(.el-button--primary) {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.75);
}

.el-overlay-message-box .el-message-box__btns .el-button:not(.el-button--primary):hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  color: #fff;
}

/* 确定按钮：紫色主调 */
.el-overlay-message-box .el-message-box__btns .el-button--primary {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-color: transparent;
  color: #fff;
}

.el-overlay-message-box .el-message-box__btns .el-button--primary:hover,
.el-overlay-message-box .el-message-box__btns .el-button--primary:focus {
  background: linear-gradient(135deg, #9f74fa, #8b5cf6);
  border-color: transparent;
  color: #fff;
}
</style>
