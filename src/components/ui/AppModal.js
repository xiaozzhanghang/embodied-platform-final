'use client';

import { Modal } from 'antd';

const MODAL_WIDTHS = {
  small: 520,
  medium: 720,
  large: 960,
};

const DEFAULT_MODAL_STYLES = {
  body: {
    maxHeight: 'calc(100vh - 220px)',
    overflowY: 'auto',
  },
};

const mergeClassNames = (...classNames) => classNames.filter(Boolean).join(' ');

const mergeModalStyleObject = (styles) => ({
  ...(styles || {}),
  body: {
    ...DEFAULT_MODAL_STYLES.body,
    ...(styles?.body || {}),
  },
});

const mergeModalStyles = (styles) => {
  if (typeof styles === 'function') {
    return (...args) => mergeModalStyleObject(styles(...args));
  }

  return mergeModalStyleObject(styles);
};

export default function AppModal({
  widthSize = 'medium',
  width,
  styles,
  dirty = false,
  onCancel,
  className,
  rootClassName,
  ...modalProps
}) {
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

  return (
    <Modal
      {...modalProps}
      centered
      width={width ?? MODAL_WIDTHS[widthSize] ?? MODAL_WIDTHS.medium}
      styles={mergeModalStyles(styles)}
      className={mergeClassNames('ui-app-modal', className)}
      rootClassName={mergeClassNames('ui-app-modal', rootClassName)}
      onCancel={handleCancel}
    />
  );
}
