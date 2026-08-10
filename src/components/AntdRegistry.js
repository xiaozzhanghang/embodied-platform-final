'use client';

import React from 'react';
import { ConfigProvider, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { antdTheme } from '../theme/antdTheme';

export default function AntdRegistry({ children }) {
    return (
        <ConfigProvider
            locale={zhCN}
            theme={antdTheme}
        >
            <App>{children}</App>
        </ConfigProvider>
    );
}
