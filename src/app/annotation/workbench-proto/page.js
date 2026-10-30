'use client';

/**
 * 标注工作台 · 交互优化原型
 * 
 * 以 iframe 方式嵌入独立 HTML 原型，避免与现有标注工作台冲突。
 * 原型文件：/public/annotation_workbench_interactive.html
 * 
 * 功能清单：
 * - 现状版本 / 优化版本对比切换
 * - 24 项优化标注（P0/P1/P2）可点击查看说明
 * - 时间轴缩放、平移、吸附、拖拽编辑
 * - 左右手双轨道、未标注区间高亮
 * - 快捷键体系（空格播放、←→逐帧、I/O打点等）
 * - 提交前校验汇总
 * - 自动保存状态显示
 * - 全局总览条 minimap
 */

import { useEffect, useRef } from 'react';

export default function WorkbenchProtoPage() {
  const iframeRef = useRef(null);

  useEffect(() => {
    // 让 iframe 获得焦点以支持快捷键
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.focus();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10,
      background: '#f0f2f5',
    }}>
      <iframe
        ref={iframeRef}
        src="/annotation_workbench_interactive.html?v=demo_interactive_v3"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="标注工作台 · 交互优化原型"
        allow="fullscreen"
      />
    </div>
  );
}
