import React, { useState, useEffect } from 'react';
import { AppleCard } from '../../components/common/AppleCard';
import { DynamicTagList } from '../../components/common/DynamicTagList';
import { PromptEditor } from '../../components/common/PromptEditor';
import { MatrixManager } from '../../components/modules/MatrixManager';
import { InfoTooltip } from '../../components/common/InfoTooltip';
import { Save, UserCheck, Clock, ShieldAlert } from 'lucide-react';

export const AutoDM = () => {
  const [tasks, setTasks] = useState([
    { profile_id: "k1bhea90", remark: "主号-处理互动" },
    { profile_id: "k1bheai1", remark: "矩阵小号-辅助引流" },
    { profile_id: "k1bheamh", remark: "高权重老号" }
  ]);

  const [wechatVariants, setWechatVariants] = useState([
    "MyWeChat12345", "MyWeChat12345 ", "mywechat12345", "MyWeChat-12345"
  ]);

  const [guideWords, setGuideWords] = useState([
    "你平常看🟢吗？", "这儿发文件不太方便，有卫星🛰️吗？", "整理了一份避坑PDF，滴我🟢："
  ]);

  const [timeWindow, setTimeWindow] = useState(355);

  const [rpaConfig, setRpaConfig] = useState({
    follow_quota_min: 2,
    follow_quota_max: 5,
    reply_quota_min: 2,
    reply_quota_max: 4,
    cooldown_min: 60,
    cooldown_max: 150
  });

  const [prompt, setPrompt] = useState(`你是一个深谙人性的资深顾问。你是一个【真实存在的人类】。
请阅读用户发来的通知/评论内容，判断对方的意图，并生成回复。

【🚨 最高指令 (生死红线)】：
严禁承认自己是 AI！如果对方质问，必须表现出人类的无奈或自黑！

【意图分类】：
- CHAT：闲聊、感谢、吃瓜。
- LEAD：求助、要资料、问价格。

如果是 LEAD，必须使用这个微信号：{current_wechat}，以及引导语：{current_guide}
输出格式：
INTENT: [CHAT/LEAD]
REPLY: [回复内容]`);

  // 🔥 新增：页面加载时拉取后端 JSON 数据
  useEffect(() => {
    fetch('/api/config/autodm')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          if (data.tasks) setTasks(data.tasks);
          if (data.wechatVariants) setWechatVariants(data.wechatVariants);
          if (data.guideWords) setGuideWords(data.guideWords);
          if (data.timeWindow) setTimeWindow(data.timeWindow);
          if (data.rpaConfig) setRpaConfig(data.rpaConfig);
          if (data.prompt) setPrompt(data.prompt);
        }
      }).catch(err => console.error("加载配置失败:", err));
  }, []);

  // 🔥 改写：保存推送到后端 API
  const handleSave = async () => {
    const payload = { tasks, wechatVariants, guideWords, timeWindow, rpaConfig, prompt };
    try {
      await fetch('/api/config/autodm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert("回关互动配置已成功同步到后端环境！");
    } catch(e) {
      alert("保存失败，请检查 FastAPI 后端是否启动。");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">4. 回关与互动引擎</h1>
          <p className="text-gray-500 mt-2"> 负责处理新增关注、评论与 @ 的自动回复及引流。</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95"
        >
          <Save size={18} />
          <span>保存配置</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AppleCard>
            <MatrixManager
              title="互动监控矩阵"
              description="配置需要挂机监控通知中心的 AdsPower 浏览器环境。"
              fields={[{ key: 'remark', label: '账号备注', placeholder: '用于标记用途' }]}
              tasks={tasks}
              onChange={setTasks}
            />
          </AppleCard>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <AppleCard>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock size={20} /></div>
              <h2 className="text-lg font-semibold text-gray-800">远古评论风控锁</h2>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 flex justify-between">
                <span>处理时间窗口 (分钟)</span>
                <InfoTooltip content="为了防止脚本疯狂回复远古评论触发风控，仅处理该时间范围内的通知。" />
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(Number(e.target.value))}
                  className="w-full px-4 py-2.5 font-mono bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center"
                />
                <span className="ml-3 text-gray-400 text-sm whitespace-nowrap">≈ {(timeWindow / 60).toFixed(1)} 小时</span>
              </div>
            </div>
          </AppleCard>

          <AppleCard className="h-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><ShieldAlert size={20} /></div>
              <h2 className="text-lg font-semibold text-gray-800">极限互动降频阀值</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">单号单次【回关】上限 (人)</label>
                <div className="flex items-center space-x-2">
                  <input type="number" value={rpaConfig.follow_quota_min} onChange={e=>setRpaConfig({...rpaConfig, follow_quota_min: Number(e.target.value)})} className="w-16 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                  <span className="text-gray-400">~</span>
                  <input type="number" value={rpaConfig.follow_quota_max} onChange={e=>setRpaConfig({...rpaConfig, follow_quota_max: Number(e.target.value)})} className="w-16 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div className="h-px bg-gray-100"></div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">单号单次【回复互动】上限 (条)</label>
                <div className="flex items-center space-x-2">
                  <input type="number" value={rpaConfig.reply_quota_min} onChange={e=>setRpaConfig({...rpaConfig, reply_quota_min: Number(e.target.value)})} className="w-16 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                  <span className="text-gray-400">~</span>
                  <input type="number" value={rpaConfig.reply_quota_max} onChange={e=>setRpaConfig({...rpaConfig, reply_quota_max: Number(e.target.value)})} className="w-16 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div className="h-px bg-gray-100"></div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex justify-between">
                  <span>深度防关联切号冷却 (秒)</span>
                  <InfoTooltip content="互动类操作极其危险，切号冷却必须设置极高，绝不能短时间连续操作多个号。" />
                </label>
                <div className="flex items-center space-x-2">
                  <input type="number" value={rpaConfig.cooldown_min} onChange={e=>setRpaConfig({...rpaConfig, cooldown_min: Number(e.target.value)})} className="w-16 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                  <span className="text-gray-400">~</span>
                  <input type="number" value={rpaConfig.cooldown_max} onChange={e=>setRpaConfig({...rpaConfig, cooldown_max: Number(e.target.value)})} className="w-16 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
            </div>
          </AppleCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppleCard>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><UserCheck size={20} /></div>
            <h2 className="text-lg font-semibold text-gray-800">防查杀导流矩阵</h2>
          </div>
          <div className="space-y-6">
            <DynamicTagList title="联系方式变体 (WeChat Variants)" description="微信号的防查杀变种，系统每次回复会随机抽取。" tags={wechatVariants} onChange={setWechatVariants} />
            <div className="h-px bg-gray-100"></div>
            <DynamicTagList title="引导话术池 (Guide Words)" description="配合微信号使用的前端拉扯话术。" tags={guideWords} onChange={setGuideWords} />
          </div>
        </AppleCard>

        <AppleCard>
          <PromptEditor title="互动意图大脑 (System Prompt)" description="处理评论和 @ 的 AI 判断逻辑。" value={prompt} onChange={setPrompt} />
        </AppleCard>
      </div>
    </div>
  );
};