'use client';

import { useEffect, useState } from 'react';
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

const EDITABLE_NATIVE_SELECTOR = [
  'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([readonly]):not([disabled])',
  'textarea:not([readonly]):not([disabled])',
  'select:not([disabled])',
  '[contenteditable="true"]',
].join(', ');

const EDITABLE_ANT_CLICK_SELECTOR = [
  '.ant-select:not(.ant-select-disabled)',
  '.ant-picker:not(.ant-picker-disabled)',
  '.ant-checkbox-wrapper:not(.ant-checkbox-wrapper-disabled)',
  '.ant-radio-wrapper:not(.ant-radio-wrapper-disabled)',
  '.ant-upload:not(.ant-upload-disabled)',
  '.ant-input-number:not(.ant-input-number-disabled)',
  '.ant-switch:not(.ant-switch-disabled)',
  '.ant-slider:not(.ant-slider-disabled)',
].join(', ');

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
  dirty,
  open,
  onCancel,
  modalRender,
  className,
  rootClassName,
  ...modalProps
}) {
  const [autoDirty, setAutoDirty] = useState(false);
  const autoDirtyEnabled = dirty === undefined;
  const effectiveDirty = autoDirtyEnabled ? autoDirty : dirty;

  useEffect(() => {
    setAutoDirty(false);
  }, [open]);

  const markAutoDirtyFromInput = (event) => {
    if (autoDirtyEnabled && event.target?.matches?.(EDITABLE_NATIVE_SELECTOR)) {
      setAutoDirty(true);
    }
  };

  const markAutoDirtyFromClick = (event) => {
    if (autoDirtyEnabled && event.target?.closest?.(EDITABLE_ANT_CLICK_SELECTOR)) {
      setAutoDirty(true);
    }
  };

  const renderWithDirtyTracking = (modalNode) => {
    const renderedModal = modalRender ? modalRender(modalNode) : modalNode;

    return (
      <div
        className="ui-app-modal-dirty-tracker"
        style={{ display: 'contents' }}
        onInputCapture={markAutoDirtyFromInput}
        onChangeCapture={markAutoDirtyFromInput}
        onClickCapture={markAutoDirtyFromClick}
      >
        {renderedModal}
      </div>
    );
  };

  const handleCancel = (event) => {
    if (!effectiveDirty) {
      onCancel?.(event);
      return;
    }

    Modal.confirm({
      title: '确认放弃未保存的修改？',
      content: '关闭后，当前未保存的内容将丢失。',
      okText: '放弃修改',
      cancelText: '继续编辑',
      onOk: () => {
        setAutoDirty(false);
        onCancel?.(event);
      },
    });
  };

  return (
    <Modal
      {...modalProps}
      open={open}
      centered
      width={width ?? MODAL_WIDTHS[widthSize] ?? MODAL_WIDTHS.medium}
      styles={mergeModalStyles(styles)}
      modalRender={renderWithDirtyTracking}
      className={mergeClassNames('ui-app-modal', className)}
      rootClassName={mergeClassNames('ui-app-modal', rootClassName)}
      onCancel={handleCancel}
    />
  );
}
