'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  Button, Typography, Space, Tag, Breadcrumb, Card, Row, Col, 
  Tabs, Table, Badge, Descriptions, Divider, Avatar, Progress,
  Timeline, Alert, List, Steps, Tooltip, Form, Input, Select, message
} from 'antd';
import { 
  ArrowLeftOutlined, RobotOutlined, ApiOutlined, 
  ThunderboltOutlined, SettingOutlined, HistoryOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
  RadarChartOutlined, LineChartOutlined, PlayCircleOutlined,
  CloseCircleOutlined, CodeOutlined, SyncOutlined, WifiOutlined,
  LaptopOutlined, CloudUploadOutlined, KeyOutlined, ReloadOutlined,
  StopOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader, StatusTag } from '@/components/ui';

const { Title, Text } = Typography;

export default function DeviceInstanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');

  const isEditing = searchParams.get('edit') === 'true';

  // ─── Galbot 1.16 XCU/HPU Deployment Simulator States ──────────────────────
  const [deployStep, setDeployStep] = useState(0);
  const [deployStatus, setDeployStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'success' | 'failed'
  const [terminalLogs, setTerminalLogs] = useState([
    'GB-OS Terminal v1.16.0 (SSH Terminal Console)',
    '==================================================',
    '[READY] 等待建立连接并载入升级配置文件...',
    '请选择部署模式: "单步调试执行" 或 "一键自动部署"'
  ]);
  const [deviceStatus, setDeviceStatus] = useState('维护中'); // Starts in maintenance status for Galbot 1.16
  const [currentProgress, setCurrentProgress] = useState(0);
  const terminalEndRef = useRef(null);

  // Shell logs templates for each step
  const stepLogs = [
    // Step 0: XCU 固件刷写
    [
      '>> [步骤 1/7] 开始部署 XCU 底层控制箱固件与全局参数...',
      '>> 正在通过 SSH 登录 XCU 物理节点: root@192.168.1.66 (端口: 22)...',
      '>> [SUCCESS] SSH 会话已建立。检测到原内核版本: Galbot-OS 1.15',
      '>> 执行命令: cd /userdata/update',
      '>> 执行命令: rm -f config.json galbot.pac',
      '>> [INFO] 正在清理缓存，删除旧版 config.json 与 galbot.pac 成功。',
      '>> 正在从本地硬盘复制新版 config.json 至 /userdata/update/ ... 100% (校验和: C93F8A)',
      '>> 正在复制新版固件 galbot.pac 至 /userdata/update/ ... 100% (大小: 128MB, 校验和: A2F31B)',
      '>> 执行升级与引导重启指令: reboot bootloader',
      '>> [WARNING] 机器人进入 Bootloader 升级模式，硬件底座正在重启并断电，通信断开！',
      '>> [6分钟物理重启监控] 正在监听 192.168.1.66 的 ICMP 响应...',
      '>> [自动快进] 跳过 6 分钟漫长重启，检测到设备以太网心跳信号已恢复！',
      '>> [SUCCESS] XCU 底层网络接入成功，当前固件成功升级为: Galbot-OS v1.16.0.2',
      '>> [INFO] 步骤 1 执行完毕，设备就绪。'
    ],
    // Step 1: VLA Capsule 解压部署
    [
      '>> [步骤 2/7] 开始向双端节点下发并部署 VLA 大模型算法包...',
      '>> 目标存储路径: /userdata/pak/',
      '>> 双端节点执行环境清理: rm -rf /userdata/pak/*',
      '>> 正在传输 release-VLA-CAPSULE-GBS_1.16.0.2.rc88-G1_2.2-20260526.tar.gz (大小: 3.7GB) ...',
      '>> [XCU] 传输至 192.168.1.66 ... 速率: 115MB/s ... 成功！MD5 校验一致。',
      '>> [HPU] 传输至 192.168.1.88 ... 速率: 980MB/s ... 成功！MD5 校验一致。',
      '>> [XCU] 执行命令: cd /userdata/pak/ && tar -zxvf release-VLA-CAPSULE-GBS_1.16.0.2.rc88-G1_2.2-20260526.tar.gz',
      '>> [HPU] 执行命令: cd /userdata/pak/ && tar -zxvf release-VLA-CAPSULE-GBS_1.16.0.2.rc88-G1_2.2-20260526.tar.gz',
      '>> 解包成功，双端已解压至当前 output 目录下。',
      '>> [XCU] 进入目录并执行底层驱动安装: cd output && ./install_version.sh',
      '>> [提示] 场景选择: 1 (常规实验室场景配置)。',
      '>> 正在挂载驱动动态库，等待底层重启生效...',
      '>> [SUCCESS] VLA Capsule 双端解压与驱动绑定完成！'
    ],
    // Step 2: IAP 临时程序配置
    [
      '>> [步骤 3/7] 正在配置 IAP 底座关节固件自更新临时环境...',
      '>> SSH 连接 XCU: root@192.168.1.66',
      '>> 执行命令: cd /userdata/iapTemp && rm -rf *',
      '>> 正在向 XCU 传输临时修复包 iapTemp.zip ... 100% 成功。',
      '>> 执行解压命令: unzip iapTemp.zip',
      '>> 赋予安装脚本执行权限并启动: chmod +x install.sh && ./install.sh',
      '>> [IAP] 驱动自检注册成功: IAP_TEMP_UPDATER (v1.16.1) - 激活在线。',
      '>> [SUCCESS] IAP 底座关节自更新升级环境搭建完毕！'
    ],
    // Step 3: Orin 补丁包部署
    [
      '>> [步骤 4/7] 正在配置 HPU (Orin 核心计算节点) 硬件兼容性与时钟同步补丁...',
      '>> SSH 连接 HPU: galbot@192.168.1.88 (密码: gb@2023)...',
      '>> 正在拷贝补丁文件 patch_20260424.zip 至 /userdata/pak/ ... 100% 成功。',
      '>> 执行命令: cd /userdata/pak/ && unzip patch_20260424.zip',
      '>> 进入补丁目录: cd orin_patch-GBS_1.16/patch',
      '>> 执行内核级别升级: sudo bash ./patch.sh (密码: galbot)',
      '>> [PATCH] 正在向 Linux 内核写入 GPU 驱动修正映射表... 成功。',
      '>> [PATCH] PTP (IEEE 1588) 时钟源优先级校准配置中... 成功。',
      '>> [SUCCESS] Orin 补丁包 patch_20260424 成功生效！'
    ],
    // Step 4: 上位机网桥 & Supervisor 配置
    [
      '>> [步骤 5/7] 正在部署上位机数采桥接服务与 Supervisor 守护进程服务...',
      '>> SSH 连接 HPU: galbot@192.168.1.88',
      '>> 备份旧版网桥程序: sudo mv /userdata/data-gather-upper/galbot_upper_bridge/ /userdata/data-gather-upper/galbot_upper_bridge.bak+',
      '>> 正在复制新版上位机程序包 galbot_upper_bridge.zip 至 HPU... 成功。',
      '>> 执行解压命令: sudo unzip galbot_upper_bridge.zip -d /userdata/data-gather-upper',
      '>> 进入二进制目录并修改执行权限: cd /userdata/data-gather-upper/galbot_upper_bridge && sudo chmod +x galbot_upper',
      '>> 创建上位机运行日志目录: sudo mkdir -p /userdata/log/data-gather-upper/galbot-upper',
      '>> [INFO] 正在安装 Linux 进程管理器 Supervisor...',
      '>> 执行命令: sudo apt update && sudo apt install -y supervisor',
      '>> 正在拷贝 Supervisor 进程守护配置文件...',
      '>> 执行命令: sudo cp /userdata/data-gather-upper/galbot_upper_bridge/galbot_upper_bridge.conf /etc/supervisor/conf.d/',
      '>> 启动 Supervisor 守护守护服务并设置开机自动启动...',
      '>> 执行命令: sudo systemctl start supervisor && sudo systemctl enable supervisor',
      '>> 重新载入进程配置项: sudo supervisorctl reload',
      '>> [Supervisor] 守护服务已载入 "galbot_upper_bridge" (当前状态: RUNNING)。',
      '>> [SUCCESS] 上位机进程守护与数据通道桥接部署成功！'
    ],
    // Step 5: WiFi 场景与上位机参数配置
    [
      '>> [步骤 6/7] 开始进行 WiFi 局域网接入与数采工作空间初始化...',
      '>> HPU 正在扫描 Miracle 局域网频段...',
      '>> 正在连接 WiFi: SSID="miracle-office-5g", 密码="miracle666" ...',
      '>> [SUCCESS] HPU 连接成功！获取内网 IP: 192.168.76.57',
      '>> 创建数采场景配置路径: mkdir -p /userdata/user_config/data_collection',
      '>> 正在将场景配置文件写入数据采集工作空间... 成功。',
      '>> 修改配置文件读写权限为可读取: chmod 644 /userdata/user_config/data_collection/*.json',
      '>> 正在将控制脚本拷贝至 XCU 控制箱...',
      '>> 执行命令: scp robot_remote_v2.sh root@192.168.1.66:/root',
      '>> [XCU] 执行脚本进行节点登录同步: sh robot_remote_v2.sh',
      '>> [XCU] 正在检验 /userdata/config/upper_login.json 与上位机登录参数一致性... 通过。',
      '>> 执行 XCU 控制板重启生效命令: reboot',
      '>> [SUCCESS] WiFi 联调与上位机登录桥接数据配置完成！'
    ],
    // Step 6: 服务校验与 SN 绑定完成
    [
      '>> [步骤 7/7] 开始进行最终的系统状态全面验证与 SN 节点鉴权...',
      '>> 正在验证硬件 ID 授权码及 SN 序列号...',
      '>> 执行命令: cd /data/bin && ./sys_tool -V',
      '>> [SYS_TOOL] 读取硬件设备 SN 码: GALBOT-116-GB105',
      '>> [SYS_TOOL] 系统鉴权通过，该机型支持 Galbot 1.16 的全量多目遥控。',
      '>> 正在重启本地数采数据记录服务 (Target)...',
      '>> 执行命令: sudo systemctl stop remote_ctrl_record.target',
      '>> 执行命令: sudo systemctl start remote_ctrl_record.target',
      '>> [Systemd] remote_ctrl_record.target 服务启动成功。',
      '>> 检查上位机运行服务状态: ps -ef | grep galbot_upper',
      '>> [INFO] 服务正常，PID: 4820, CPU占用: 1.8%, 内存占用: 154MB.',
      '>> [SUCCESS] Galbot 1.16 设备 XCU/HPU 升级与部署全部成功！',
      '>> 系统正常联通，当前设备状态修改为：「在线」。'
    ]
  ];

  // Auto scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Deployment simulator runner
  useEffect(() => {
    let timer;
    if (deployStatus === 'running') {
      const activeLogs = stepLogs[deployStep];
      let logIndex = 0;
      
      const printLog = () => {
        if (logIndex < activeLogs.length) {
          setTerminalLogs(prev => [...prev, activeLogs[logIndex]]);
          logIndex++;
          setCurrentProgress(Math.floor((logIndex / activeLogs.length) * 100));
          timer = setTimeout(printLog, 300);
        } else {
          // Completed this step
          if (deployStep < 6) {
            setDeployStep(prev => prev + 1);
            timer = setTimeout(() => {
              setTerminalLogs(prev => [...prev, `\n>> [INFO] 准备进入下一步：步骤 ${deployStep + 2}...`]);
            }, 800);
          } else {
            setDeployStatus('success');
            setDeviceStatus('在线');
            setTerminalLogs(prev => [
              ...prev,
              '==================================================',
              '🎉 [SUCCESS] 所有的 7 个部署步骤已全部执行完毕！',
              '🎉 设备运行状态已恢复，数据同步网关在线。'
            ]);
            setCurrentProgress(100);
          }
        }
      };
      
      timer = setTimeout(printLog, 300);
    }
    return () => clearTimeout(timer);
  }, [deployStatus, deployStep]);

  const handleStartDeploy = (mode) => {
    if (mode === 'auto') {
      setDeployStatus('running');
      setTerminalLogs(prev => [
        ...prev,
        '\n==================================================',
        '🚀 [一键全自动部署启动] 开始依次执行 7 个部署步骤...',
      ]);
    } else {
      // Single step mode
      const activeLogs = stepLogs[deployStep];
      setTerminalLogs(prev => [
        ...prev,
        `\n==================================================`,
        `🛠️ [单步调试启动] 正在手动执行第 ${deployStep + 1} 步...`
      ]);
      
      let logIndex = 0;
      const printLog = () => {
        if (logIndex < activeLogs.length) {
          setTerminalLogs(prev => [...prev, activeLogs[logIndex]]);
          logIndex++;
          setCurrentProgress(Math.floor((logIndex / activeLogs.length) * 100));
          setTimeout(printLog, 300);
        } else {
          setTerminalLogs(prev => [
            ...prev,
            `✔️ 步骤 ${deployStep + 1} 执行完成。请点击「执行下一步」继续。`
          ]);
          if (deployStep < 6) {
            setDeployStep(prev => prev + 1);
          } else {
            setDeployStatus('success');
            setDeviceStatus('在线');
            setTerminalLogs(prev => [
              ...prev,
              '==================================================',
              '🎉 [SUCCESS] 手动调试部署流程全部执行完毕！'
            ]);
          }
        }
      };
      setTimeout(printLog, 300);
    }
  };

  const handleResetDeploy = () => {
    setDeployStep(0);
    setDeployStatus('idle');
    setCurrentProgress(0);
    setDeviceStatus('维护中');
    setTerminalLogs([
      'GB-OS Terminal v1.16.0 (SSH Terminal Console)',
      '==================================================',
      '[READY] 等待建立连接并载入升级配置文件...',
      '请选择部署模式: "单步调试执行" 或 "一键自动部署"'
    ]);
  };

  // Mock data for a specific device instance
  const device = {
    id: params.id || 'DEV-2026-001',
    name: 'Galbot-G2-Node-105',
    enName: 'galbot_g2_node_105',
    deviceNum: 'DEV-2026-001',
    type: 'galbot_1.16_G2',
    status: '在线',
    ip: '192.168.1.105',
    lastActive: '2026-05-11 13:15:22',
    urdf: 'galbot_model.urdf',
    image: null,
    parts: [
      { name: 'XCU 底层控制箱', status: 'normal', ip: '192.168.1.66', service: 'remote_ctrl_record' },
      { name: 'HPU Orin 算力单元', status: 'normal', ip: '192.168.1.88', service: 'supervisor' },
      { name: '双臂机械臂_G2', status: 'normal', type: 'RobotArm', version: 'G2.2' },
      { name: '灵巧手_G1.16', status: 'normal', type: 'DexterousHand', version: 'G1.16' },
      { name: '头部RGB相机_G2', status: 'normal', type: 'Camera', version: 'G2.2' }
    ],
    recentTasks: [
      { id: 'TSK-001', name: '桌面分拣任务', time: '2026-05-11 10:00', status: 'Success' },
      { id: 'TSK-002', name: '门口迎宾测试', time: '2026-05-10 16:30', status: 'Success' },
      { id: 'TSK-003', name: '避障逻辑验证', time: '2026-05-10 14:00', status: 'Failed' }
    ]
  };

  const partColumns = [
    { 
      title: '部件名称', 
      dataIndex: 'name', 
      render: (text) => <Space><ApiOutlined style={{ color: '#722ed1' }} /><strong>{text}</strong></Space> 
    },
    { 
      title: '内网 IP / 类型', 
      render: (_, r) => <Text>{r.ip || r.type || '-'}</Text> 
    },
    { 
      title: '服务进程 / 硬件版本', 
      render: (_, r) => <Text type="secondary">{r.service ? <Tag color="blue">{r.service}</Tag> : (r.version || '-')}</Text> 
    },
    { 
      title: '状态', 
      dataIndex: 'status',
      render: () => (
        <StatusTag status="正常" />
      )
    },
  ];

  return (
    <MainLayout>
      <div className="ui-page ui-detail-page">
        <PageHeader
          title={<Space size={12}>{device.name}<StatusTag status={deviceStatus} /></Space>}
          description={`ID: ${device.id} · 管理设备部件、运行状态、部署流程与采集记录。`}
          breadcrumbs={[{ title: '首页' }, { title: '设备管理' }, { title: '设备列表', href: '/collection/devices' }, { title: '实例详情' }]}
          back={() => router.back()}
        />

      <Row className="ui-detail-grid" gutter={24}>
        <Col span={18}>
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card bordered={false} styles={{ body: { padding: '20px' } }} style={{ borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>XCU 物理网络连通</Text>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <Title level={4} style={{ margin: 0, fontSize: 16 }}>192.168.1.66</Title>
                  <StatusTag status="已连接" />
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} styles={{ body: { padding: '20px' } }} style={{ borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>HPU 物理网络连通</Text>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <Title level={4} style={{ margin: 0, fontSize: 16 }}>192.168.1.88</Title>
                  <StatusTag status="已连接" />
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} styles={{ body: { padding: '20px' } }} style={{ borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>数采网桥服务</Text>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <Title level={4} style={{ margin: 0, fontSize: 16 }}>galbot_upper</Title>
                  <StatusTag status="运行中" />
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} styles={{ body: { padding: '20px' } }} style={{ borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>系统 SN 安全认证</Text>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <Title level={4} style={{ margin: 0, fontSize: 16 }}>sys_tool</Title>
                  <StatusTag status="已认证" />
                </div>
              </Card>
            </Col>
          </Row>

          <Card bordered={false} styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              tabBarStyle={{ padding: '0 24px', marginBottom: 0 }}
              items={[
                {
                  key: 'overview',
                  label: '部件与节点状态',
                  children: (
                    <div style={{ padding: 24 }}>
                      <Table 
                        dataSource={device.parts} 
                        columns={partColumns} 
                        pagination={false}
                        size="middle"
                        rowKey="name"
                      />
                    </div>
                  )
                },
                {
                  key: 'history',
                  label: '任务记录',
                  children: (
                    <div style={{ padding: 24 }}>
                      <Table 
                        dataSource={device.recentTasks}
                        pagination={false}
                        columns={[
                          { title: '任务ID', dataIndex: 'id' },
                          { title: '任务名称', dataIndex: 'name' },
                          { title: '执行时间', dataIndex: 'time' },
                          { title: '结果', dataIndex: 'status', render: s => <StatusTag status={s === 'Success' ? '已完成' : '失败'}>{s}</StatusTag> }
                        ]}
                      />
                    </div>
                  )
                },
                {
                  key: 'deployment',
                  label: 'XCU/HPU 部署与更新',
                  children: (
                    <div style={{ padding: 24 }}>
                      {deployStatus === 'success' ? (
                        <Alert 
                          message="🎉 Galbot 1.16.x XCU/HPU 双端部署与算法解压已成功！" 
                          description={
                            <div style={{ marginTop: 8 }}>
                              <p>底层控制器 (XCU) 及上位机算力核心 (HPU) 配置对齐完毕，物理连接通信稳定。设备主状态已切换为 <strong>在线 (Online)</strong>。</p>
                              <Button 
                                type="primary" 
                                size="small"
                                style={{ background: '#52c41a', borderColor: '#52c41a', fontWeight: 'bold' }} 
                                onClick={() => router.push('/collection/collect')}
                              >
                                🚀 立即前往采集任务列表开启数据采集！
                              </Button>
                            </div>
                          }
                          type="success" 
                          showIcon 
                          style={{ marginBottom: 24 }} 
                        />
                      ) : (
                        <Alert 
                          message="Galbot 1.16.x XCU/HPU 双端部署模式" 
                          description="当前模块支持管理物理控制板 (XCU, 192.168.1.66) 与上位机 Orin 单元 (HPU, 192.168.1.88) 的固件刷写、VLA 算法解压、IAP 环境自更新以及 Supervisor 网桥进程管理。升级过程中底盘将会短暂断电重启。"
                          type="info" 
                          showIcon 
                          style={{ marginBottom: 24 }} 
                        />
                      )}
                      
                      {/* Dual-node Info Cards */}
                      <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col span={12}>
                          <Card title={<Space><LaptopOutlined style={{ color: '#1677ff' }} /><span>XCU 底层控制器 (控制箱板)</span></Space>} size="small" style={{ borderRadius: 10, border: '1px solid #f0f0f0' }} styles={{ body: { padding: '12px' } }}>
                            <Descriptions column={1} size="small" bordered>
                              <Descriptions.Item label="内网 IP">192.168.1.66</Descriptions.Item>
                              <Descriptions.Item label="登录凭证">root / 12345678</Descriptions.Item>
                              <Descriptions.Item label="固件版本">Galbot-OS v1.16.0.2 (已部署)</Descriptions.Item>
                              <Descriptions.Item label="底层守护服务">
                                <StatusTag status="运行中">remote_ctrl_record.target (Active)</StatusTag>
                              </Descriptions.Item>
                              <Descriptions.Item label="主要文件路径">
                                <div style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                  /userdata/update/galbot.pac<br/>
                                  /userdata/iapTemp/install.sh
                                </div>
                              </Descriptions.Item>
                            </Descriptions>
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card title={<Space><CodeOutlined style={{ color: '#52c41a' }} /><span>HPU 上位机算力单元 (Nvidia Orin)</span></Space>} size="small" style={{ borderRadius: 10, border: '1px solid #f0f0f0' }} styles={{ body: { padding: '12px' } }}>
                            <Descriptions column={1} size="small" bordered>
                              <Descriptions.Item label="内网 IP">192.168.1.88</Descriptions.Item>
                              <Descriptions.Item label="登录凭证">galbot / gb@2023</Descriptions.Item>
                              <Descriptions.Item label="VLA 镜像">release-VLA-CAPSULE-GBS_1.16.0.2 (3.7GB)</Descriptions.Item>
                              <Descriptions.Item label="进程守护">
                                <StatusTag status="运行中">Supervisor Daemon (Active)</StatusTag>
                              </Descriptions.Item>
                              <Descriptions.Item label="网桥服务">
                                <StatusTag status="运行中">galbot_upper_bridge (Active)</StatusTag>
                              </Descriptions.Item>
                            </Descriptions>
                          </Card>
                        </Col>
                      </Row>

                      {/* Wizard and Terminal Row */}
                      <Row gutter={24}>
                        <Col span={10}>
                          <Card title="部署引导流程" size="small" style={{ borderRadius: 10, border: '1px solid #f0f0f0', height: 480, overflowY: 'auto' }}>
                            <Steps
                              direction="vertical"
                              current={deployStep}
                              size="small"
                              items={[
                                { title: 'XCU 固件与配置刷写', description: '删除旧文件，复制新版本配置，reboot升级' },
                                { title: 'VLA Capsule 算法包部署', description: '3.7G 压缩包分发，解压并执行 install_version' },
                                { title: 'IAP 底座自更新环境配置', description: '上传解压 iapTemp.zip，执行安装并授权' },
                                { title: 'Orin 内核兼容性补丁', description: '解包 orin_patch，执行 patch.sh 配置内核与PTP' },
                                { title: '上位机网桥与进程守护', description: '解压网桥，安装 supervisor 并配置自启动' },
                                { title: 'WiFi 场景与登录配置', description: 'Miracle WiFi 接入，校验 upper_login 参数' },
                                { title: '验证注册与 SN 自检', description: 'sys_tool -V 校验SN，重启数采录制 target 服务' }
                              ]}
                            />
                          </Card>
                        </Col>
                        
                        <Col span={14}>
                          <Card 
                            title="实时 SSH 部署终端 (Simulator)" 
                            size="small" 
                            style={{ borderRadius: 10, border: '1px solid #f0f0f0' }}
                            extra={
                              <Space>
                                {deployStatus === 'idle' && (
                                  <>
                                    <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStartDeploy('auto')}>一键部署</Button>
                                    <Button size="small" icon={<CodeOutlined />} onClick={() => handleStartDeploy('step')}>单步调试</Button>
                                  </>
                                )}
                                {deployStatus === 'running' && (
                                  <Button danger size="small" icon={<StopOutlined />} onClick={() => setDeployStatus('paused')}>暂停</Button>
                                )}
                                {deployStatus === 'paused' && (
                                  <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => setDeployStatus('running')}>继续下一步</Button>
                                )}
                                {(deployStatus === 'success' || deployStatus === 'paused' || deployStatus === 'failed') && (
                                  <Button size="small" icon={<ReloadOutlined />} onClick={handleResetDeploy}>重置状态</Button>
                                )}
                              </Space>
                            }
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', height: 430 }}>
                              {/* Progress bar */}
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                                  <Text type="secondary">当前步骤执行进度：</Text>
                                  <Text strong>{currentProgress}%</Text>
                                </div>
                                <Progress percent={currentProgress} size="small" strokeColor="#1677ff" showInfo={false} />
                              </div>

                              {/* Terminal Logs Window */}
                              <div style={{ 
                                flex: 1, 
                                background: '#090d16', 
                                padding: '12px 16px', 
                                borderRadius: 8, 
                                overflowY: 'auto',
                                fontFamily: 'Consolas, Courier, monospace',
                                fontSize: 11,
                                color: '#a6accd',
                                border: '1px solid #1f293d',
                                minHeight: '260px'
                              }}>
                                {terminalLogs.map((log, index) => (
                                  <div key={index} style={{ 
                                    whiteSpace: 'pre-wrap', 
                                    lineHeight: '20px',
                                    color: log.startsWith('>> [SUCCESS]') ? '#52c41a' : 
                                           log.startsWith('>> [WARNING]') ? '#faad14' : 
                                           log.startsWith('>> [') ? '#38bdf8' : 
                                           log.startsWith('🎉') ? '#52c41a' : '#a6accd'
                                  }}>
                                    {log}
                                  </div>
                                ))}
                                <div ref={terminalEndRef} />
                              </div>
                            </div>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card 
            title={isEditing ? "编辑实例信息" : "实例信息"} 
            bordered={false} 
            style={{ marginBottom: 24, borderRadius: 8 }}
          >
            {isEditing ? (
              <Form layout="vertical">
                <Form.Item label="设备编号" required>
                  <Input defaultValue={device.deviceNum} />
                </Form.Item>
                <Form.Item label="英文名称">
                  <Input defaultValue={device.enName} />
                </Form.Item>
                <Form.Item label="设备类型" required>
                  <Select defaultValue={device.type} options={[
                    { value: 'galbot_2.2_RGB', label: 'galbot_2.2_RGB' },
                    { value: 'galbot_std', label: 'galbot_std' },
                    { value: 'franka_std', label: 'franka_std' }
                  ]} />
                </Form.Item>
                <Form.Item label="内网IP" required>
                  <Input defaultValue={device.ip} />
                </Form.Item>
                <Form.Item label="URDF文件">
                  <Input defaultValue={device.urdf} />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button size="small" onClick={() => router.push(`/collection/devices/detail/${params.id}`)}>取消</Button>
                    <Button type="primary" size="small" onClick={() => { message.success('设备配置已成功保存！'); router.push(`/collection/devices/detail/${params.id}`); }}>保存</Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="设备编号">{device.deviceNum}</Descriptions.Item>
                  <Descriptions.Item label="英文名称">{device.enName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="设备类型">{device.type}</Descriptions.Item>
                  <Descriptions.Item label="内网IP">{device.ip}</Descriptions.Item>
                  <Descriptions.Item label="注册时间">2026-02-25</Descriptions.Item>
                  <Descriptions.Item label="最后通讯">{device.lastActive}</Descriptions.Item>
                  <Descriptions.Item label="URDF文件">{device.urdf ? <a>{device.urdf}</a> : '—'}</Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>设备图片</Text>
                  {device.image ? (
                    <img src={device.image} alt="设备图片" style={{ width: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }} />
                  ) : (
                    <div style={{ width: '100%', height: 120, background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text type="secondary">暂无图片</Text>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>

          <Card title="运行日志" bordered={false} style={{ borderRadius: 8 }}>
            <Timeline 
              mode="left"
              style={{ marginTop: 16 }}
              items={[
                { color: 'green', children: '系统启动成功 13:10' },
                { color: 'blue', children: '任务 TSK-001 下发 10:00' },
                { color: 'green', children: '标定完成 09:45' },
                { color: 'gray', children: '例行检查 09:00' }
              ]}
            />
            <Button block type="link">查看完整日志</Button>
          </Card>
        </Col>
      </Row>
      </div>
    </MainLayout>
  );
}
