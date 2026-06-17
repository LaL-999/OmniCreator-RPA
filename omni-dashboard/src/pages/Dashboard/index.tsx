import React, { useState, useEffect } from 'react';
import { Activity, Clock, AlertCircle, Edit2, Save, Play, Pause, Users, RefreshCw } from 'lucide-react';
import { toast } from '../../utils/toast';

interface ScheduleItem {
  id: number;
  name: string;
  cron: string;
  nextRun: string;
  active: boolean;
}

interface Stats {
  totalRuns: number;
  successRate: number;
  activeProfiles: number;
  warnings: number;
}

// 环形进度（成功率）
const RadialGauge: React.FC<{ value: number }> = ({ value }) => {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#818cf8" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-content">{value}</span>
        <span className="text-xs text-content-dim mt-0.5">成功率 %</span>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{
  icon: React.ReactNode;
  tint: string;
  label: string;
  value: React.ReactNode;
  unit?: string;
}> = ({ icon, tint, label, value, unit }) => (
  <div className="card card-hover p-6 flex items-center gap-4">
    <div className={`icon-badge p-3 ${tint}`}>{icon}</div>
    <div>
      <p className="text-sm font-medium text-content-muted">{label}</p>
      <p className="text-2xl font-bold text-content">
        {value}
        {unit && <span className="text-sm font-normal text-content-dim ml-1">{unit}</span>}
      </p>
    </div>
  </div>
);

export const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({ totalRuns: 0, successRate: 0, activeProfiles: 0, warnings: 0 });
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = () => {
    setRefreshing(true);
    fetch(`/api/dashboard?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
        if (data.schedules) setSchedules(data.schedules);
      })
      .catch((err) => console.error('看板数据加载失败:', err))
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const toggleStatus = async (id: number) => {
    const updated = schedules.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    setSchedules(updated);
    await saveToBackend(updated, true);
  };

  const handleCronChange = (id: number, newValue: string) => {
    setSchedules(schedules.map((s) => (s.id === id ? { ...s, cron: newValue } : s)));
  };

  const saveInlineEdit = async () => {
    setEditingId(null);
    await saveToBackend(schedules, false);
  };

  const saveToBackend = async (dataToSave: ScheduleItem[], isToggle = false) => {
    try {
      const res = await fetch('/api/dashboard/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      if (!res.ok) throw new Error(`后端拒绝了请求，状态码: ${res.status}`);
      toast.success(isToggle ? '运行状态已切换！' : '调度规则已更新！系统重新定闹钟成功。');
      fetchDashboardData();
    } catch (error) {
      toast.error('时间表同步失败，请检查后端黑窗口报错');
      console.error('保存失败原因：', error);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content">矩阵运行看板</h1>
          <p className="text-content-muted mt-2">系统概览与全量脚本定时任务调度中心。</p>
        </div>
        <button onClick={fetchDashboardData} className="btn-ghost flex-shrink-0">
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">刷新</span>
        </button>
      </div>

      {/* 健康度 + KPI */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 成功率环形 */}
        <div className="card p-6 flex items-center gap-6 xl:col-span-1 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-brand/10 blur-3xl" />
          <RadialGauge value={stats.successRate} />
          <div className="relative">
            <p className="text-sm font-medium text-content-muted">系统运行健康度</p>
            <p className="text-xs text-content-dim mt-1 leading-relaxed">
              基于全部历史执行记录
              <br />
              的成功 / 失败统计
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              引擎运行中
            </div>
          </div>
        </div>

        {/* KPI 三连 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 xl:col-span-2">
          <KpiCard
            icon={<Activity size={22} />}
            tint="bg-brand/10 text-brand-soft"
            label="总计执行任务"
            value={stats.totalRuns}
            unit="次"
          />
          <KpiCard
            icon={<Users size={22} />}
            tint="bg-violet-500/10 text-violet-300"
            label="排队活跃账号"
            value={stats.activeProfiles}
            unit="个"
          />
          <KpiCard
            icon={<AlertCircle size={22} />}
            tint="bg-amber-400/10 text-amber-400"
            label="拦截风控警告"
            value={stats.warnings}
            unit="次"
          />
        </div>
      </div>

      {/* 调度时间表 */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-line flex items-center gap-2">
          <Clock size={18} className="text-brand-soft" />
          <h2 className="text-base font-semibold text-content">自动化时间表（北京时间 Scheduler）</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line text-xs text-content-dim uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">脚本模块</th>
                <th className="px-6 py-4 font-medium">执行频率规则（可编辑）</th>
                <th className="px-6 py-4 font-medium">下次执行时间</th>
                <th className="px-6 py-4 font-medium">运行状态</th>
                <th className="px-6 py-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0 hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-4 font-medium text-content">{item.name}</td>
                  <td className="px-6 py-4">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={item.cron}
                        onChange={(e) => handleCronChange(item.id, e.target.value)}
                        className="px-3 py-1.5 bg-surface-input border border-brand/50 rounded-lg text-sm w-52 text-content focus:outline-none focus:ring-2 focus:ring-brand/25"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-content-muted font-mono bg-white/[0.04] border border-line px-3 py-1.5 rounded-lg">
                        {item.cron}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-accent">{item.nextRun}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        item.active
                          ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                          : 'bg-white/5 text-content-muted border-line'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${item.active ? 'bg-emerald-400' : 'bg-content-dim'}`} />
                      {item.active ? '运行中' : '已暂停'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    {editingId === item.id ? (
                      <button
                        onClick={saveInlineEdit}
                        className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                      >
                        <Save size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingId(item.id)}
                        className="p-2 text-content-dim hover:text-brand-soft hover:bg-brand/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => toggleStatus(item.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.active ? 'text-amber-400 hover:bg-amber-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'
                      }`}
                    >
                      {item.active ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
