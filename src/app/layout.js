import './globals.css';
import AntdRegistry from '@/components/AntdRegistry';

export const metadata = {
  title: '具身智能数据平台',
  description: '具身智能数据采集、标注、管理一体化平台',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
