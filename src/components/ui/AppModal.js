'use client';

import { Modal } from 'antd';

const MODAL_WIDTHS = {
  small: 520,
  medium: 720,
  large: 960,
};

export default function AppModal({ widthSize = 'medium', dirty = false, onCancel, ...modalProps }) {
  const handleCancel = (event) => {
    if (!dirty) {
      onCancel?.(event);
      return;
    }

    Modal.confirm({
      title: '确认放弃未保存的修改？',
      content: '关闭后，当前未保存的内容将丢失。',
      okText: '放弃修改',
      cancelText: '继续编辑',
      onOk: () => onCancel?.(event),
    });
  };

  return <Modal {...modalProps} centered width={MODAL_WIDTHS[widthSize] || MODAL_WIDTHS.medium} onCancel={handleCancel} />;
}
