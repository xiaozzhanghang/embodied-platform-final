import { useState, useEffect, useRef, useCallback } from 'react';
import { SimStateUpdate, ExecutionMode } from '../types';

export const useMujocoSim = (activeTaskId: string, mode: ExecutionMode) => {
  const [simState, setSimState] = useState<SimStateUpdate>({
    connected: false,
    mode: mode,
    taskId: activeTaskId,
    simTime: 0,
    stepCount: 0,
    physicsHz: 60,
    isSuccess: false,
    errorMetric: 0,
    statusText: '离线就绪',
    contactForce: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:8765/ws/simulate');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[MuJoCo WS] Connected to simulation server on port 8765');
        setSimState((prev) => ({ ...prev, connected: true, statusText: 'MuJoCo 物理仿真在线' }));
        // Notify server of active task & mode
        ws.send(JSON.stringify({ action: 'switch_task', taskId: activeTaskId }));
        ws.send(JSON.stringify({ action: 'set_mode', mode }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setSimState({
            connected: true,
            mode: data.mode || mode,
            taskId: data.taskId || activeTaskId,
            simTime: data.simTime || 0,
            stepCount: data.stepCount || 0,
            physicsHz: data.physicsHz || 60,
            isSuccess: data.isSuccess || false,
            errorMetric: data.errorMetric || 0,
            statusText: data.statusText || '仿真进行中',
            contactForce: data.contactForce || 0,
            telemetry: data.telemetry
          } as any);
        } catch (e) {
          console.error('[MuJoCo WS] Message parse error:', e);
        }
      };

      ws.onclose = () => {
        setSimState((prev) => ({ ...prev, connected: false, statusText: '仿真后端未连接 (点击重试)' }));
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      setSimState((prev) => ({ ...prev, connected: false, statusText: '连接仿真服务失败' }));
    }
  }, [activeTaskId, mode]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  // Switch task on WS server when activeTaskId changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'switch_task', taskId: activeTaskId }));
    }
  }, [activeTaskId]);

  // Switch mode on WS server
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'set_mode', mode }));
    }
  }, [mode]);

  return { simState, reconnect: connect };
};
