'use client';

import React from 'react';
import { ConfigProvider, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';

export default function AntdRegistry({ children }) {
    return (
        <ConfigProvider
            locale={zhCN}
            theme={{ token: { colorPrimary: '#1677ff', borderRadius: 8 } }}
        >
            <App>{children}</App>
        </ConfigProvider>
    );
}
