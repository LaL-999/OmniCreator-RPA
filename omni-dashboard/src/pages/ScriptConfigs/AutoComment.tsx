import React, { useState, useEffect } from 'react';
import { AppleCard } from '../../components/common/AppleCard';
import { DynamicTagList } from '../../components/common/DynamicTagList';
import { PromptEditor } from '../../components/common/PromptEditor';
import { MatrixManager, type MatrixTask } from '../../components/modules/MatrixManager';
import { InfoTooltip } from '../../components/common/InfoTooltip';
import { Save, MessageCircle, ShieldAlert, Search } from 'lucide-react';
import { toast } from '../../utils/toast';

export const AutoComment = () => {
  const [tasks, setTasks] = useState<MatrixTask[]>([
    { profile_id: "k1bhea90", keyword: "美国留学 租房被坑" },
    { profile_id: "k1bheai1", keyword: "新加坡留学 签证材料" },
    { profile_id: "k1bheamh", keyword: "英国留学 挂科申诉" }
  ]);

  const [strategies, setStrategies] = useState([
    "【同仇敌忾型】：非常简短地跟着痛骂。然后留下一句自己也遇到过最后搞定了，引发好奇。",
    "【真诚小白型】：用极其随意的口吻感叹太难了，自己之前也踩坑，后来找人帮忙才解决。",
    "【直接给方案型】：不要废话，单刀直入说一句干货建议，最后说不懂的来看我主页。"
  ]);

  // 🔥 新增：AI 左脑的长尾词裂变视角
  const [searchAngles, setSearchAngles] = useState([
    "急救求助（带求助、急等字眼）",
    "血泪避坑（带避雷、坑死等字眼）",
    "特定细节（带押金、中介费、退学等）"
  ]);

  // 🔥 新增：物理级截流防封参数
  const [rpaConfig, setRpaConfig] = useState({
    target_quota_min: 2,
    target_quota_max: 3,
    post_delay_min: 30,
    post_delay_max: 60,
    cooldown_min: 90,
    cooldown_max: 180
  });

  const [prompt, setPrompt] = useState(`你是一个正在躺在床上刷小红书的真实大学生。看到这篇帖子，你想留个言。

【🚨 顶级防封红线 (AI 降智指令)】：
1. 绝对不要像机器人！绝对禁止使用书面语、成语和做作的排版！
2. 可以正常使用标点符号，但要像真人发评论一样自然随意。
3. 总字数严格控制在 10 到 30 个字之间。越短越真实。
4. 禁止用“天呐”、“抱抱姐妹”这种烂大街的假人词汇。

【🎭 本次强制表演策略】：
{selected_strategy}

【输出格式】：
直接输出文案，不要有任何修饰词或多余的解释。`);

// 🔥 新增：页面加载拉取数据
  useEffect(() => {
    fetch('/api/config/comment')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          if (data.tasks) setTasks(data.tasks);
          if (data.strategies) setStrategies(data.strategies);
          if (data.searchAngles) setSearchAngles(data.searchAngles);
          if (data.rpaConfig) setRpaConfig(data.rpaConfig);
          if (data.prompt) setPrompt(data.prompt);
        }
      }).catch(err => console.error(err));
  }, []);

// 🔥 改写：保存推送数据
  const handleSave = async () => {
    const payload = { tasks, strategies, searchAngles, rpaConfig, prompt };
    try {
      await fetch('/api/config/comment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      toast.success("评论截流配置已成功同步到后端环境！");
    } catch(e) {
      toast.error("保存失败，请检查后端是否启动。");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content">2. 评论截流引擎</h1>
          <p className="text-content-muted mt-2"> 自动搜索精准流量池并释放拟人化钩子评论。</p>
        </div>
        <button
          onClick={handleSave}
          className="btn-primary flex items-center space-x-2"
        >
          <Save size={18} />
          <span>保存配置</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AppleCard>
            <MatrixManager
              title="截流矩阵队列"
              description="配置参与截流的账号及每个账号专属的宽泛搜索词（系统会自动裂变为长尾热词）。"
              fields={[{ key: 'keyword', label: '引流搜索词 (Keyword)', placeholder: '例如：美国留学 租房' }]}
              tasks={tasks}
              onChange={setTasks}
            />
          </AppleCard>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <AppleCard className="h-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-amber-400/10 text-amber-400 rounded-xl"><ShieldAlert size={20} /></div>
              <h2 className="text-lg font-semibold text-content">截流风控与限流器</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-content-muted mb-2">
                  单号截流派发上限 (个)
                  <InfoTooltip content="单个账号每次启动最多去几篇帖子里留言。新号建议 1-3，老号可适当增加。" />
                </label>
                <div className="flex items-center space-x-2">
                  <input type="number" value={rpaConfig.target_quota_min} onChange={e=>setRpaConfig({...rpaConfig, target_quota_min: Number(e.target.value)})} className="w-16 px-3 py-2 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" />
                  <span className="text-content-dim">~</span>
                  <input type="number" value={rpaConfig.target_quota_max} onChange={e=>setRpaConfig({...rpaConfig, target_quota_max: Number(e.target.value)})} className="w-16 px-3 py-2 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" />
                </div>
              </div>
              <div className="h-px bg-line"></div>
              <div>
                <label className="block text-xs font-medium text-content-muted mb-2">帖子间浏览休眠 (秒)</label>
                <div className="flex items-center space-x-2">
                  <input type="number" value={rpaConfig.post_delay_min} onChange={e=>setRpaConfig({...rpaConfig, post_delay_min: Number(e.target.value)})} className="w-16 px-3 py-2 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" />
                  <span className="text-content-dim">~</span>
                  <input type="number" value={rpaConfig.post_delay_max} onChange={e=>setRpaConfig({...rpaConfig, post_delay_max: Number(e.target.value)})} className="w-16 px-3 py-2 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" />
                </div>
              </div>
              <div className="h-px bg-line"></div>
              <div>
                <label className="block text-xs font-medium text-content-muted mb-2">账号间切换冷却 (秒)</label>
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
        <AppleCard>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-400/10 text-emerald-400 rounded-xl"><Search size={20} /></div>
            <h2 className="text-lg font-semibold text-content">AI 双脑策略阵列</h2>
          </div>
          <div className="space-y-8">
            <DynamicTagList
              title="🔍 搜索词裂变视角 (AI 左脑)"
              description="AI 会从这些视角中随机抽取一个，将你的宽泛词降维转化为爆款长尾词。"
              tags={searchAngles}
              onChange={setSearchAngles}
            />
            <div className="h-px bg-line"></div>
            <DynamicTagList
              title="💬 评论人设策略 (AI 右脑)"
              description="脚本随机抽取策略赋予 AI，确保每个钩子都极具真实感。"
              tags={strategies}
              onChange={setStrategies}
            />
          </div>
        </AppleCard>

        <AppleCard>
          <PromptEditor
            title="评论生成提示词 (System Prompt)"
            description="控制 AI 生成留言的核心大脑。"
            value={prompt}
            onChange={setPrompt}
          />
        </AppleCard>
      </div>
    </div>
  );
};