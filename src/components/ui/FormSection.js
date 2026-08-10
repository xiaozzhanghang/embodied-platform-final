'use client';

import { Typography } from 'antd';

export default function FormSection({ title, description, children }) {
  return (
    <section className="ui-form-section">
      {title ? <Typography.Title level={4}>{title}</Typography.Title> : null}
      {description ? <Typography.Paragraph type="secondary">{description}</Typography.Paragraph> : null}
      {children}
    </section>
  );
}
