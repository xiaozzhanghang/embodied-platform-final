import React, { useState, useMemo } from 'react';
import { BiGymTask, BiGymTaskId, TaskCategory } from '../../types';
import { BIGYM_TASKS, TASK_CATEGORY_NAMES } from '../../data/bigymTasks';
import {
  ListFilter,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Layers,
  Search,
  Crosshair,
  Coffee,
  UtensilsCrossed,
  Flame,
  Zap
} from 'lucide-react';

interface TaskListSidebarProps {
  activeTaskId: BiGymTaskId;
  onSelectTask: (taskId: BiGymTaskId) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const TaskListSidebar: React.FC<TaskListSidebarProps> = ({
  activeTaskId,
  onSelectTask,
  isOpen,
  onToggle
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    target_reaching: true,
    tabletop: true,
    dishwasher: true,
    kitchen: true
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filteredTasks = useMemo(() => {
    return BIGYM_TASKS.filter((task) => {
      const matchCat = selectedCategory === 'all' || task.category === selectedCategory;
      const matchSearch =
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  const categoryIcons: Record<string, any> = {
    target_reaching: Crosshair,
    tabletop: Coffee,
    dishwasher: UtensilsCrossed,
    kitchen: Flame
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: '72px',
          left: '16px',
          zIndex: 40,
          background: 'rgba(11, 17, 33, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 242, 254, 0.4)',
          color: '#00f2fe',
          padding: '8px 14px',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
        }}
      >
        <ListFilter size={16} />
        <span>展开 20 种 BiGym 任务列表</span>
      </button>
    );
  }

  return (
    <aside
      style={{
        width: '340px',
        background: 'rgba(11, 17, 33, 0.92)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(0, 242, 254, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        color: '#e2e8f0',
        zIndex: 40,
        height: '100%',
        userSelect: 'none',
        boxShadow: '8px 0 24px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="#00f2fe" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>
            BiGym 2.0 任务注册表
          </span>
          <span
            style={{
              background: 'rgba(0, 242, 254, 0.15)',
              color: '#00f2fe',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            20 TASKS
          </span>
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          title="收起侧边栏"
        >
          收起
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            padding: '6px 10px',
            gap: '8px'
          }}
        >
          <Search size={14} color="#64748b" />
          <input
            type="text"
            placeholder="搜索任务名称、ID 或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '12px',
              width: '100%'
            }}
          />
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
          {(['all', 'target_reaching', 'tabletop', 'dishwasher', 'kitchen'] as const).map((cat) => {
            const isSelected = selectedCategory === cat;
            const label =
              cat === 'all'
                ? '全部 (20)'
                : cat === 'target_reaching'
                ? '🎯 定位'
                : cat === 'tabletop'
                ? '🍽️ 桌面'
                : cat === 'dishwasher'
                ? '🧼 洗碗机'
                : '🍳 厨房';
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: isSelected ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#00f2fe' : '#94a3b8',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task List Grouped By Category */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {(['target_reaching', 'tabletop', 'dishwasher', 'kitchen'] as TaskCategory[]).map((categoryKey) => {
          const categoryTasks = filteredTasks.filter((t) => t.category === categoryKey);
          if (categoryTasks.length === 0) return null;

          const isExpanded = expandedCategories[categoryKey];
          const Icon = categoryIcons[categoryKey] || Layers;

          return (
            <div key={categoryKey} style={{ marginBottom: '16px' }}>
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(categoryKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon size={14} color="#00f2fe" />
                  <span>{TASK_CATEGORY_NAMES[categoryKey]}</span>
                </div>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>

              {/* Task Items */}
              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {categoryTasks.map((task) => {
                    const isActive = activeTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        id={`task-item-${task.id}`}
                        data-task-id={task.id}
                        onClick={() => onSelectTask(task.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: isActive
                            ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.16), rgba(79, 172, 254, 0.08))'
                            : 'rgba(255, 255, 255, 0.02)',
                          border: isActive ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.06)',
                          boxShadow: isActive ? '0 0 16px rgba(0, 242, 254, 0.2)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: isActive ? 700 : 600,
                                color: isActive ? '#00f2fe' : '#f8fafc'
                              }}
                            >
                              {task.name}
                            </span>
                            {task.isMvp && (
                              <span
                                style={{
                                  background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                                  color: '#070c18',
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  padding: '1px 4px',
                                  borderRadius: '3px'
                                }}
                              >
                                MVP
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: task.officialBaselineSuccess >= 90 ? '#10b981' : '#f59e0b'
                            }}
                          >
                            {task.officialBaselineSuccess}%
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: '11px',
                            color: '#64748b',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span style={{ fontFamily: 'monospace' }}>{task.id}</span>
                          <span
                            style={{
                              padding: '1px 5px',
                              borderRadius: '3px',
                              background: 'rgba(255, 255, 255, 0.04)',
                              color:
                                task.difficulty === 'Easy'
                                  ? '#34d399'
                                  : task.difficulty === 'Medium'
                                  ? '#60a5fa'
                                  : '#f87171'
                            }}
                          >
                            {task.difficulty}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
