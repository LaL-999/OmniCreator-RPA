import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, Clock, AlertCircle, Edit2, Save, Play, Pause } from 'lucide-react';
import { toast } from '../../utils/toast'; // 🔥 重新引入优雅的弹窗

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRuns: 0,
    successRate: 0,
    activeProfiles: 0,
    warnings: 0
  });

  const [schedules, setSchedules] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 🔥 修复核心：强制禁用浏览器缓存，获取绝对真实的实时数据
  const fetchDashboardData = () => {
    // 1. 加上 cache: 'no-store'
    // 2. 加上时间戳参数 ?t=xxx，彻底打破浏览器的自作聪明
    fetch(`/api/dashboard?t=${new Date().getTime()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats);
        if (data.schedules) setSchedules(data.schedules);
      })
      .catch(err => console.error("看板数据加载失败:", err));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 切换运行/暂停状态
  const toggleStatus = async (id: number) => {
    const updated = schedules.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setSchedules(updated); // 乐观更新 UI，让按钮瞬间变化
    await saveToBackend(updated, true);
  };

  // 记录输入框的修改
  const handleCronChange = (id: number, newValue: string) => {
    setSchedules(schedules.map(s => s.id === id ? { ...s, cron: newValue } : s));
  };

  // 保存时间规则
  const saveInlineEdit = async () => {
    setEditingId(null);
    await saveToBackend(schedules, false);
  };

  // 保存到后端并刷新
  const saveToBackend = async (dataToSave: any[], isToggle: boolean = false) => {
    try {
      const res = await fetch('/api/dashboard/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });

      // 🔥 核心修复：拆穿后端的沉默报错！只要状态码不是 2xx，立刻抛出异常
      if (!res.ok) {
        throw new Error(`后端拒绝了请求，状态码: ${res.status}`);
      }

      if (isToggle) {
        toast.success("运行状态已切换！");
      } else {
        toast.success("调度规则已更新！系统重新定闹钟成功。");
      }

      // 重新拉取绝对真实的数据
      fetchDashboardData();
    } catch (error) {
      toast.error("时间表同步失败，请检查黑窗口报错");
      console.error("保存失败原因：", error);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">矩阵运行看板</h1>
        <p className="text-gray-500 mt-2">系统概览与全量脚本定时任务调度中心。</p>
      </div>

      {/* 🚀 动态统计卡片区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Activity size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">总计执行任务</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalRuns} <span className="text-sm font-normal text-gray-500">次</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">任务成功率</p>
            <p className="text-2xl font-bold text-gray-800">{stats.successRate}<span className="text-sm font-normal text-gray-500">%</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Clock size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">当前排队活跃账号</p>
            <p className="text-2xl font-bold text-gray-800">{stats.activeProfiles} <span className="text-sm font-normal text-gray-500">个</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><AlertCircle size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">拦截风控警告</p>
            <p className="text-2xl font-bold text-gray-800">{stats.warnings} <span className="text-sm font-normal text-gray-500">次</span></p>
          </div>
        </div>
      </div>

      {/* 🕒 真实可编辑的自动化时间表 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800">自动化时间表 (北京时间 Scheduler)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-white text-sm text-gray-500">
                <th className="px-6 py-4 font-medium">脚本模块</th>
                <th className="px-6 py-4 font-medium">执行频率规则 (可编辑)</th>
                <th className="px-6 py-4 font-medium">下次执行时间</th>
                <th className="px-6 py-4 font-medium">运行状态</th>
                <th className="px-6 py-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schedules.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{item.name}</td>
                  <td className="px-6 py-4">
                    {/* 动态编辑输入框 */}
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={item.cron}
                        onChange={(e) => handleCronChange(item.id, e.target.value)}
                        className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">{item.cron}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-blue-600">{item.nextRun}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {item.active ? '运行中' : '已暂停'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {/* 编辑与保存按钮 */}
                    {editingId === item.id ? (
                      <button onClick={saveInlineEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Save size={18} />
                      </button>
                    ) : (
                      <button onClick={() => setEditingId(item.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                    )}

                    {/* 启停开关按钮 */}
                    <button onClick={() => toggleStatus(item.id)} className={`p-2 rounded-lg transition-colors ${item.active ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
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