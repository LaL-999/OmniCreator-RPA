import React, { useState , useEffect } from 'react';
import { AppleCard } from '../../components/common/AppleCard';
import { DynamicTagList } from '../../components/common/DynamicTagList';
import { PromptEditor } from '../../components/common/PromptEditor';
import { MatrixManager } from '../../components/modules/MatrixManager';
import { InfoTooltip } from '../../components/common/InfoTooltip'; // 🔥 就是漏了这一行！！！
import { Save, Sparkles, ShieldAlert } from 'lucide-react';

export const AdspowerTest = () => {
  const [tasks, setTasks] = useState([
    { profile_id: "k1bhea90", topic: "美国留学的法律避坑指南，主要讲租房和打工" },
    { profile_id: "k1bheai1", topic: "去新加坡留学前必看的法律常识，签证和学术诚信" }
  ]);

  const [styles, setStyles] = useState([
    "【碎碎念吐槽型】：像在宿舍和室友聊天一样，语气随性，多用感叹号，不要有太强的逻辑性。",
    "【小白真诚分享型】：假装自己刚踩过坑，心有余悸地提醒大家，语言要通俗接地气，别端着。",
  ]);

  const [strategyConfig, setStrategyConfig] = useState({
    image_count_min: 1,
    image_count_max: 3,
    cooldown_min: 45,
    cooldown_max: 90
  });

  const [prompt, setPrompt] = useState(`你是一个在小红书上随手记录生活的真实留学生。
请根据用户提供的主题，写一篇排版精美、易读且充满人情味的经验分享笔记。

【🚨 顶级防封与排版红线】：
1. 拒绝机械感：绝对禁止使用“首先”、“其次”、“总之”、“保姆级教程”等标准AI词汇！
2. {selected_style}
3. 【核心排版要求（打造呼吸感）】：
   - 绝对不要用“1. 2. 3.”这种干瘪的数字列点！
   - 必须使用 Emoji (如 💡, ✅, 🔴, 👉, 避雷) 来作为段落的视觉引导符号。
   - 拒绝密密麻麻的文字块！每讲完一个小点，必须【换两行留白】，保证视觉舒适度。
4. 语言要带有真人的口语化，正常使用标点符号。

【⚙️ 强制输出格式】：
标题：[吸引人的口语化标题，15字内]
正文：[换行清晰、带有Emoji引导的精美正文，必须有排版的呼吸感]
互动：[随口问一句，如“你们遇到过吗”]
标签：[直接写词语，空格隔开，绝对不要带#号]`);

// 🔥 新增：页面加载时拉取后端数据
  useEffect(() => {
    fetch('/api/config/adspower')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          if (data.tasks) setTasks(data.tasks);
          if (data.styles) setStyles(data.styles);
          if (data.strategyConfig) setStrategyConfig(data.strategyConfig);
          if (data.prompt) setPrompt(data.prompt);
        }
      }).catch(err => console.error(err));
  }, []);

// 🔥 改写：保存推送到后端
  const handleSave = async () => {
    const payload = { tasks, styles, strategyConfig, prompt };
    try {
      await fetch('/api/config/adspower', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      alert("图文发帖配置已成功同步到后端环境！");
    } catch(e) {
      alert("保存失败，请检查后端是否启动。");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">1. 图文发帖引擎</h1>
          <p className="text-gray-500 mt-2">负责图文笔记的 AI 撰写、视觉绘图、排版与矩阵发布。</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95"
        >
          <Save size={18} />
          <span>保存脚本配置</span>
        </button>
      </div>

      {/* 顶部：账号队列与策略参数 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AppleCard>
            <MatrixManager
              title="内容发布矩阵队列"
              description="在此处分配浏览器环境，并为每个账号指定发文主题（Topic）。"
              fields={[{ key: 'topic', label: '发布主题 (Topic)', placeholder: '例如：美国留学生租房避坑' }]}
              tasks={tasks}
              onChange={setTasks}
            />
          </AppleCard>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <AppleCard className="h-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><ShieldAlert size={20} /></div>
              <h2 className="text-lg font-semibold text-gray-800">防封与生成策略</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 flex justify-between">
                  <span>正文配图生成数量 (张)</span>
                  <InfoTooltip content="除了封面外，AI 将根据该范围随机生成对应数量的知识点附图。" />
                </label>
                <div className="flex items-center space-x-2">
                  <input type="number" value={strategyConfig.image_count_min} onChange={e=>setStrategyConfig({...strategyConfig, image_count_min: Number(e.target.value)})} className="w-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                  <span className="text-gray-400">~</span>
                  <input type="number" value={strategyConfig.image_count_max} onChange={e=>setStrategyConfig({...strategyConfig, image_count_max: Number(e.target.value)})} className="w-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div className="h-px bg-gray-100"></div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 flex justify-between">
                  <span>账号切换冷却时间 (秒)</span>
                  <InfoTooltip content="防止发帖频率过快导致被系统打上营销号标签。" />
                </label>
                <div className="flex items-center space-x-2">
                  <input type="number" value={strategyConfig.cooldown_min} onChange={e=>setStrategyConfig({...strategyConfig, cooldown_min: Number(e.target.value)})} className="w-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                  <span className="text-gray-400">~</span>
                  <input type="number" value={strategyConfig.cooldown_max} onChange={e=>setStrategyConfig({...strategyConfig, cooldown_max: Number(e.target.value)})} className="w-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
            </div>
          </AppleCard>
        </div>
      </div>

      {/* 底部：人格与 Prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppleCard>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Sparkles size={20} /></div>
            <h2 className="text-lg font-semibold text-gray-800">AI 写作人格池</h2>
          </div>
          <DynamicTagList title="文案人设库" description="确保矩阵账号风格各异。" tags={styles} onChange={setStyles} />
        </AppleCard>
        <AppleCard>
          <PromptEditor title="意图大脑 (System Prompt)" description="控制 AI 如何排版和生成文案。" value={prompt} onChange={setPrompt} />
        </AppleCard>
      </div>
    </div>
  );
};