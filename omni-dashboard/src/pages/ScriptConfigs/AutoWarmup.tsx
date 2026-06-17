import React, { useState, useEffect } from 'react';
import { AppleCard } from '../../components/common/AppleCard';
import { DynamicTagList } from '../../components/common/DynamicTagList';
import { PromptEditor } from '../../components/common/PromptEditor';
import { MatrixManager, type MatrixTask } from '../../components/modules/MatrixManager';
import { InfoTooltip } from '../../components/common/InfoTooltip';
import { Save, Activity, ShieldAlert, GitBranch } from 'lucide-react';
import { toast } from '../../utils/toast';

export const AutoWarmup = () => {
  const [tasks, setTasks] = useState<MatrixTask[]>([
    { profile_id: "k1bhea90", remark: "即将起号的新号" },
    { profile_id: "k1bheai1", remark: "被限流待恢复号" }
  ]);

  const [keywords, setKeywords] = useState([
    "猫咪日常", "周末探店", "减脂餐教程", "卧室改造", "小众旅游地", "职场穿搭"
  ]);

  // 🔥 新增：养号与马尔可夫链防封参数
  const [rpaConfig, setRpaConfig] = useState({
    warmup_min: 8,
    warmup_max: 15,
    cooldown_min: 120,
    cooldown_max: 300,
    // 马尔可夫链概率分布 (必须相加=100)
    weight_feed: 60,
    weight_search: 20,
    weight_notify: 15,
    weight_profile: 5
  });

  const [prompt, setPrompt] = useState(`你是一个正在摸鱼刷小红书的普通网友。看到这篇别人的帖子，你想随手表达一下最真实的感受。

【🚨 顶级防封红线】：
1. 绝对不能包含任何广告、引流、联系方式、业务内容！
2. 字数极短，严格控制在 5 到 15 个字之间。
3. 语气极度口语化，像真人随口一句吐槽、夸奖、惊讶或共鸣。可以带 1 个日常的 Emoji。
4. 必须结合帖子内容有感而发，不要发完全不相干的万能句。

【输出格式】：
直接输出评论文本，不要任何废话、前缀或引号。`);

// 🔥 新增：页面加载时拉取后端数据
  useEffect(() => {
    fetch('/api/config/warmup')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          if (data.tasks) setTasks(data.tasks);
          if (data.keywords) setKeywords(data.keywords);
          if (data.rpaConfig) setRpaConfig(data.rpaConfig);
          if (data.prompt) setPrompt(data.prompt);
        }
      }).catch(err => console.error("加载配置失败:", err));
  }, []);

// 🔥 改写：保存推送到后端
  const handleSave = async () => {
    const totalWeight = rpaConfig.weight_feed + rpaConfig.weight_search + rpaConfig.weight_notify + rpaConfig.weight_profile;
    if (totalWeight !== 100) {
      toast.error(`保存失败！四种行为的权重总和必须等于 100，当前总和为 ${totalWeight}。`);
      return;
    }

    const payload = { tasks, keywords, rpaConfig, prompt };
    try {
      await fetch('/api/config/warmup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      toast.success("数字幽灵养号配置已成功同步到后端环境！");
    } catch(e) {
      toast.error("保存失败，请检查 FastAPI 后端是否启动。");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content">6. 数字幽灵养号</h1>
          <p className="text-content-muted mt-2"> 基于马尔可夫链的无目的随机游走养号引擎。</p>
        </div>
        <button
          onClick={handleSave}
          className="btn-primary"
        >
          <Save size={18} />
          <span>保存配置</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AppleCard>
            <MatrixManager
              title="养号池"
              description="将需要提高账号权重、降低风控等级的账号放入此池。"
              fields={[{ key: 'remark', label: '账号备注', placeholder: '用于标记用途' }]}
              tasks={tasks}
              onChange={setTasks}
            />
          </AppleCard>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <AppleCard className="h-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-amber-400/10 text-amber-400 rounded-xl"><ShieldAlert size={20} /></div>
              <h2 className="text-lg font-semibold text-content">基础养号策略</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-content-muted mb-2">单号单次摸鱼时长范围 (分钟)</label>
                <div className="flex items-center space-x-2">
                  <input type="number" value={rpaConfig.warmup_min} onChange={e=>setRpaConfig({...rpaConfig, warmup_min: Number(e.target.value)})} className="w-16 px-3 py-2 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" />
                  <span className="text-content-dim">~</span>
                  <input type="number" value={rpaConfig.warmup_max} onChange={e=>setRpaConfig({...rpaConfig, warmup_max: Number(e.target.value)})} className="w-16 px-3 py-2 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" />
                </div>
              </div>
              <div className="h-px bg-line"></div>
              <div>
                <label className="block text-xs font-medium text-content-muted mb-2 flex justify-between">
                  <span>深度物理隔离切号冷却 (秒)</span>
                  <InfoTooltip content="养号行为需要极高的隔离度，冷却时间建议设置在 2-5 分钟以上。" />
                </label>
                <div className="flex items-center space-x-2">
                  <input type="number" value={rpaConfig.cooldown_min} onChange={e=>setRpaConfig({...rpaConfig, cooldown_min: Number(e.target.value)})} className="w-16 px-3 py-2 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" />
                  <span className="text-content-dim">~</span>
                  <input type="number" value={rpaConfig.cooldown_max} onChange={e=>setRpaConfig({...rpaConfig, cooldown_max: Number(e.target.value)})} className="w-16 px-3 py-2 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" />
                </div>
              </div>
            </div>
          </AppleCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* 马尔可夫链权重控制盘 */}
          <AppleCard>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-violet-500/10 text-violet-300 rounded-xl"><GitBranch size={20} /></div>
              <h2 className="text-lg font-semibold text-content flex items-center justify-between w-full">
                <span>马尔可夫链行为概率分布</span>
                <span className={`text-sm ${rpaConfig.weight_feed + rpaConfig.weight_search + rpaConfig.weight_notify + rpaConfig.weight_profile === 100 ? 'text-emerald-400' : 'text-red-400 font-bold'}`}>
                  总和: {rpaConfig.weight_feed + rpaConfig.weight_search + rpaConfig.weight_notify + rpaConfig.weight_profile}%
                </span>
              </h2>
            </div>
            <p className="text-xs text-content-muted mb-6">这是决定账号是否像真人的灵魂参数。四项概率相加必须等于 100。起号初期建议加大搜索洗白比重，老号建议偏重信息流摸鱼。</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-line">
                <span className="text-sm font-medium text-content-muted">首页信息流摸鱼概率</span>
                <div className="flex items-center"><input type="number" value={rpaConfig.weight_feed} onChange={e=>setRpaConfig({...rpaConfig, weight_feed: Number(e.target.value)})} className="w-16 px-2 py-1 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" /><span className="ml-2 text-content-dim text-sm">%</span></div>
              </div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-line">
                <span className="text-sm font-medium text-content-muted">搜索无害生活词概率</span>
                <div className="flex items-center"><input type="number" value={rpaConfig.weight_search} onChange={e=>setRpaConfig({...rpaConfig, weight_search: Number(e.target.value)})} className="w-16 px-2 py-1 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" /><span className="ml-2 text-content-dim text-sm">%</span></div>
              </div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-line">
                <span className="text-sm font-medium text-content-muted">点开通知中心概率</span>
                <div className="flex items-center"><input type="number" value={rpaConfig.weight_notify} onChange={e=>setRpaConfig({...rpaConfig, weight_notify: Number(e.target.value)})} className="w-16 px-2 py-1 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" /><span className="ml-2 text-content-dim text-sm">%</span></div>
              </div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-line">
                <span className="text-sm font-medium text-content-muted">看自己主页发呆概率</span>
                <div className="flex items-center"><input type="number" value={rpaConfig.weight_profile} onChange={e=>setRpaConfig({...rpaConfig, weight_profile: Number(e.target.value)})} className="w-16 px-2 py-1 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" /><span className="ml-2 text-content-dim text-sm">%</span></div>
              </div>
            </div>
          </AppleCard>

          <AppleCard>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-brand/10 text-brand-soft rounded-xl"><Activity size={20} /></div>
              <h2 className="text-lg font-semibold text-content">无害模型洗白库</h2>
            </div>
            <DynamicTagList
              title="生活化搜索词 (Benign Keywords)"
              description="养号时将随机搜索这些生活词汇，稀释营销账号标签。"
              tags={keywords}
              onChange={setKeywords}
            />
          </AppleCard>
        </div>

        <div className="h-full">
          <AppleCard className="h-full">
            <PromptEditor
              title="真实情绪废话大脑 (System Prompt)"
              description="养号时偶尔会留下完全无害的真实网民评论，提高账号活跃权重。"
              value={prompt}
              onChange={setPrompt}
            />
          </AppleCard>
        </div>
      </div>
    </div>
  );
};
