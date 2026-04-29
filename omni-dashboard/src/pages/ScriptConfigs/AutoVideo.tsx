import React, { useState, useEffect } from 'react';
import { AppleCard } from '../../components/common/AppleCard';
import { DynamicTagList } from '../../components/common/DynamicTagList';
import { PromptEditor } from '../../components/common/PromptEditor';
import { MatrixManager } from '../../components/modules/MatrixManager';
import { InfoTooltip } from '../../components/common/InfoTooltip';
import { Save, FileVideo, ShieldAlert } from 'lucide-react';

export const AutoVideo = () => {
  const [tasks, setTasks] = useState([
    { profile_id: "k1bhea90", fallback_topic: "美国留学生租房避坑指南" },
    { profile_id: "k1bheai1", fallback_topic: "去新加坡留学必须要知道的学术红线" }
  ]);

  const [styles, setStyles] = useState([
    "【碎碎念吐槽型】：语气随性，多用感叹号，像朋友聊天，不要有太强的逻辑性。",
    "【小白真诚分享型】：假装刚踩过坑，心有余悸地提醒大家，语言通俗接地气。",
    "【极简懒人型】：直接把核心点说出来，用词年轻化（如：绝绝子、无语、避雷）。"
  ]);

  const [rpaConfig, setRpaConfig] = useState({
    speed_shift_min: 1.01,
    speed_shift_max: 1.03,
    color_shift_min: 0.98,
    color_shift_max: 1.02,
    vol_shift_min: 0.95,
    vol_shift_max: 1.05,
    cooldown_min: 45,
    cooldown_max: 90
  });

  const [prompt, setPrompt] = useState(`你是一个小红书百万粉丝的短视频操盘手。
请根据以下【视频原话或主题】，写一篇配套的视频发布文案。

【🚨 顶级防封与排版红线】：
1. 拒绝机械感：绝对禁止使用“首先”、“其次”等AI词汇！
2. {selected_style}
3. 【核心排版要求】：
   - 使用 Emoji 作为视觉引导。每讲完一个小点，必须【换行留白】。
   - 保证长篇正文连贯易读，但整体排版要保持随性。`);

  useEffect(() => {
    fetch('/api/config/video')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          if (data.tasks) setTasks(data.tasks);
          if (data.styles) setStyles(data.styles);
          if (data.rpaConfig) setRpaConfig(data.rpaConfig);
          if (data.prompt) setPrompt(data.prompt);
        }
      }).catch(err => console.error("加载失败:", err));
  }, []);

  const handleSave = async () => {
    const payload = { tasks, styles, rpaConfig, prompt };
    try {
      await fetch('/api/config/video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      alert("视频混剪配置已成功同步到后端！");
    } catch(e) {
      alert("保存失败，请检查后端状态。");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">5. 视频混剪发布</h1>
          <p className="text-gray-500 mt-2"> 负责本地视频的底层洗稿、听写与全自动发布。</p>
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
              title="视频矩阵队列"
              description="配置发文账号与兜底主题。(素材绑定请前往素材库)"
              fields={[
                // 🔥 删除了 raw_video_path 对象，彻底剔除冗余路径框！
                { key: 'fallback_topic', label: '兜底发文主题', placeholder: '例如：热门话题分享' }
              ]}
              tasks={tasks}
              onChange={setTasks}
            />
          </AppleCard>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <AppleCard className="h-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><ShieldAlert size={20} /></div>
              <h2 className="text-lg font-semibold text-gray-800">底层洗稿与防封参数</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex justify-between">
                  <span>画面变速扰动率 (倍)</span>
                  <InfoTooltip content="通过微弱变速打乱每一帧的 MD5。如 1.01~1.03 表示加速 1%~3%。" />
                </label>
                <div className="flex items-center space-x-2">
                  <input type="number" step="0.01" value={rpaConfig.speed_shift_min} onChange={e=>setRpaConfig({...rpaConfig, speed_shift_min: Number(e.target.value)})} className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                  <span className="text-gray-400">~</span>
                  <input type="number" step="0.01" value={rpaConfig.speed_shift_max} onChange={e=>setRpaConfig({...rpaConfig, speed_shift_max: Number(e.target.value)})} className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div className="h-px bg-gray-100"></div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex justify-between">
                  <span>色彩滤镜偏移率 (倍)</span>
                  <InfoTooltip content="改变全局画面的明暗度，打破图像识别指纹。1.0 为不改变。" />
                </label>
                <div className="flex items-center space-x-2">
                  <input type="number" step="0.01" value={rpaConfig.color_shift_min} onChange={e=>setRpaConfig({...rpaConfig, color_shift_min: Number(e.target.value)})} className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                  <span className="text-gray-400">~</span>
                  <input type="number" step="0.01" value={rpaConfig.color_shift_max} onChange={e=>setRpaConfig({...rpaConfig, color_shift_max: Number(e.target.value)})} className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div className="h-px bg-gray-100"></div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex justify-between">
                  <span>音轨音量扰动率 (倍)</span>
                  <InfoTooltip content="改变视频原声的音量，打破音频波形指纹查重。" />
                </label>
                <div className="flex items-center space-x-2">
                  <input type="number" step="0.01" value={rpaConfig.vol_shift_min} onChange={e=>setRpaConfig({...rpaConfig, vol_shift_min: Number(e.target.value)})} className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                  <span className="text-gray-400">~</span>
                  <input type="number" step="0.01" value={rpaConfig.vol_shift_max} onChange={e=>setRpaConfig({...rpaConfig, vol_shift_max: Number(e.target.value)})} className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div className="h-px bg-gray-100"></div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">账号切换冷却时间 (秒)</label>
                <div className="flex items-center space-x-2">
                  <input type="number" value={rpaConfig.cooldown_min} onChange={e=>setRpaConfig({...rpaConfig, cooldown_min: Number(e.target.value)})} className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                  <span className="text-gray-400">~</span>
                  <input type="number" value={rpaConfig.cooldown_max} onChange={e=>setRpaConfig({...rpaConfig, cooldown_max: Number(e.target.value)})} className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
            </div>
          </AppleCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppleCard>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><FileVideo size={20} /></div>
            <h2 className="text-lg font-semibold text-gray-800">配文风格人设池</h2>
          </div>
          <DynamicTagList
            title="视频文案语气"
            description="提取视频原声后，将根据此处设置的人格进行文案逆向改写。"
            tags={styles}
            onChange={setStyles}
          />
        </AppleCard>
        <AppleCard>
          <PromptEditor
            title="系统提示词 (System Prompt)"
            description="负责将 Whisper 提取的语音片段包装成小红书风格。"
            value={prompt}
            onChange={setPrompt}
          />
        </AppleCard>
      </div>
    </div>
  );
};