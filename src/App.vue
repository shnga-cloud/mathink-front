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

/* ================================================================
   全局公共样式（从 views 各组件抽取的重复样式）
   注意：组件 scoped 样式可覆盖这里的同名规则
   ================================================================ */

/* ============ 公共动画 ============ */
@keyframes floatUp {
  0% { transform: translateY(100vh) scale(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-10vh) scale(1); opacity: 0; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes cardAppear {
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}

/* ============ 公共背景层（所有页面统一） ============ */
.bg-gradient {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 15% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 80%, rgba(118, 75, 162, 0.12) 0%, transparent 55%),
    linear-gradient(180deg, #0a0a14 0%, #0e0e1c 50%, #0b0b14 100%);
  pointer-events: none;
  z-index: 0;
}

.grid-overlay {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(102, 126, 234, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(102, 126, 234, 0.025) 1px, transparent 1px);
  background-size: 80px 80px;
  pointer-events: none;
  z-index: 0;
}

.particles {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.3);
  filter: blur(1px);
  animation: floatUp linear infinite;
}

/* ============ 玻璃面板（公式识别 / 手写识别通用） ============ */
.panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  position: relative;
  overflow: hidden;
  animation: cardAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.panel:nth-child(2) {
  animation-delay: 0.15s;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(102, 126, 234, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-icon {
  font-size: 18px;
  color: #818cf8;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.panel-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), rgba(167, 139, 250, 0.5), transparent);
  border-radius: 2px;
}

/* ============ 模式切换按钮（公式识别 / 手写识别通用） ============ */
.mode-switch-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.mode-switch-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(102, 126, 234, 0.4);
  background: rgba(102, 126, 234, 0.08);
  color: #818cf8;
  font-family: inherit;
  position: relative;
  overflow: hidden;
}

.mode-switch-btn:hover {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.2);
}

.mode-switch-btn.is-chem {
  border-color: rgba(167, 139, 250, 0.45);
  background: rgba(167, 139, 250, 0.1);
  color: #c4b5fd;
}

.mode-switch-btn.is-chem:hover {
  background: rgba(167, 139, 250, 0.18);
  border-color: rgba(167, 139, 250, 0.65);
  box-shadow: 0 4px 14px rgba(167, 139, 250, 0.25);
}

.mode-switch-icon {
  font-size: 14px;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.mode-switch-btn:hover .mode-switch-icon {
  transform: rotate(180deg);
}

.mode-switch-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.mode-switch-current {
  font-weight: 600;
}

.mode-switch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* ============ 通用按钮 ============ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
  font-family: inherit;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.btn-primary::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transition: left 0.6s ease;
}

.btn-primary:hover::after {
  left: 100%;
}

/* ============ 结果区公共（公式识别 / 手写识别通用） ============ */
/* 空状态 */
.result-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  gap: 16px;
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.empty-icon {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.15);
}

.empty-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.3);
  margin: 0;
}

/* 加载状态 */
.result-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  gap: 24px;
}

.loading-spinner {
  width: 56px;
  height: 56px;
  position: relative;
}

.spinner-ring {
  width: 100%;
  height: 100%;
  border: 3px solid rgba(255, 255, 255, 0.06);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* 成功结果布局 */
.result-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 置信度条 */
.confidence-bar {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.02);
  position: relative;
  overflow: hidden;
}

.confidence-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 2px;
  opacity: 0.6;
}

.confidence-bar.high::before { background: linear-gradient(90deg, #10b981, #34d399); }
.confidence-bar.medium::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.confidence-bar.low::before { background: linear-gradient(90deg, #ef4444, #f87171); }

.confidence-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
  gap: 8px;
}

.confidence-label {
  font-size: 15px;
  font-weight: 600;
}

.confidence-tip-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.confidence-progress {
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.confidence-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 公式 / 结构图渲染区 */
.latex-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 14px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}

.section-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 12px;
}

.latex-render {
  font-size: 20px;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: auto;
  color: #fff;
}

/* 化学结构图渲染区（SVG 透明背景，居中显示） */
.chem-svg-render {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: auto;
  padding: 8px;
}

.chem-svg-render svg {
  max-width: 100%;
  height: auto;
  display: block;
}

/* 源码容器（div.latex-source；历史记录页的 code.latex-source 不受影响） */
div.latex-source {
  background: #0f0f1a;
  border-radius: 14px;
  padding: 16px 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.source-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.source-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.5);
  font-family: inherit;
}

.copy-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
  color: #a78bfa;
}

.latex-code {
  color: #a6accd;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 反馈区 */
.feedback-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 14px;
  padding: 16px 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.feedback-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 12px;
}

.feedback-actions {
  display: flex;
  gap: 12px;
}

.feedback-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid;
  background: transparent;
  font-family: inherit;
}

.feedback-btn.correct {
  border-color: rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.feedback-btn.correct:hover {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.5);
}

.feedback-btn.incorrect {
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.feedback-btn.incorrect:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.5);
}

.feedback-done {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.feedback-done.correct { color: #34d399; }
.feedback-done.incorrect { color: #f87171; }

/* 错误状态 */
.result-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  gap: 20px;
}

.error-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: rgba(239, 68, 68, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.error-icon {
  font-size: 32px;
  color: #f87171;
}

.error-text {
  font-size: 15px;
  color: #f87171;
  margin: 0;
}

/* ============ 登录 / 注册公共 ============ */
.login-page,
.register-page {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0f0f1a;
}

/* 顶部发光线 */
.card-glow {
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.6), rgba(118, 75, 162, 0.6), transparent);
  border-radius: 2px;
}

/* Logo 旋转圆环 */
.logo-ring {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  background: linear-gradient(135deg, #667eea, #764ba2) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: spin 8s linear infinite;
}

.logo-ring::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
}

.logo-icon {
  position: relative;
  z-index: 2;
  font-size: 28px;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #a78bfa 50%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 认证卡片 */
.login-card,
.register-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: cardAppear 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(30px);
}

/* 认证页头部 */
.login-header,
.register-header {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInUp 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.login-title,
.register-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px 0;
  letter-spacing: 2px;
}

.login-subtitle,
.register-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  letter-spacing: 1px;
}

/* 认证表单 */
.login-form,
.register-form {
  display: flex;
  flex-direction: column;
  animation: fadeInUp 0.6s 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.input-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0 16px;
  height: 52px;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 0 20px rgba(102, 126, 234, 0.1);
}

.input-wrapper .icon-left {
  color: rgba(255, 255, 255, 0.3);
  margin-right: 12px;
  flex-shrink: 0;
  transition: color 0.3s;
}

.input-wrapper:focus-within .icon-left {
  color: #667eea;
}

.input-wrapper .el-input__wrapper {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.input-wrapper .el-input__inner {
  color: #ffffff !important;
  font-size: 15px;
  height: 100%;
}

.input-wrapper .el-input__inner::placeholder {
  color: rgba(255, 255, 255, 0.25) !important;
}

.input-wrapper .icon-right {
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 8px;
  transition: color 0.2s;
}

.input-wrapper .icon-right:hover {
  color: #667eea;
}

/* 认证提交按钮 */
.login-btn,
.register-btn {
  position: relative;
  width: 100%;
  height: 52px;
  margin-top: 8px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 3px;
  cursor: pointer;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.login-btn::before,
.register-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.3s;
}

.login-btn:hover,
.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(102, 126, 234, 0.3);
}

.login-btn:hover::before,
.register-btn:hover::before {
  opacity: 1;
}

.login-btn:active,
.register-btn:active {
  transform: translateY(0);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.login-btn:disabled,
.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.login-btn::after,
.register-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  transition: left 0.6s ease;
}

.login-btn:hover::after,
.register-btn:hover::after {
  left: 100%;
}

.btn-text {
  position: relative;
  z-index: 2;
}

/* 认证页底部链接 */
.login-footer,
.register-footer {
  text-align: center;
  margin-top: 28px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.35);
  animation: fadeInUp 0.6s 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.login-footer a,
.register-footer a {
  color: #a78bfa;
  font-weight: 500;
  margin-left: 4px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s;
  position: relative;
}

.login-footer a::after,
.register-footer a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: linear-gradient(90deg, #667eea, #a78bfa);
  transition: width 0.3s ease;
}

.login-footer a:hover,
.register-footer a:hover {
  color: #c4b5fd;
}

.login-footer a:hover::after,
.register-footer a:hover::after {
  width: 100%;
}
</style>
