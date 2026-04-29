import React, { useState, useEffect } from 'react';
import { AppleCard } from '../../components/common/AppleCard';
import { DynamicTagList } from '../../components/common/DynamicTagList';
import { PromptEditor } from '../../components/common/PromptEditor';
import { MatrixManager } from '../../components/modules/MatrixManager';
import { InfoTooltip } from '../../components/common/InfoTooltip';
import { Save, Send, ShieldAlert } from 'lucide-react';

const INITIAL_AVATAR_LIBRARY = [
  { id: 'A01', name: '李双 (主号)', path: 'C:\\Users\\Administrator\\Desktop\\photo\\lishuang.png', previewUrl: 'https://ui-avatars.com/api/?name=A01&background=e0f2fe&color=0369a1&font-size=0.4' },
];

export const AutoDesk = () => {
  const [avatarLibrary, setAvatarLibrary] = useState(INITIAL_AVATAR_LIBRARY);
  const [tasks, setTasks] = useState([
    { avatar_path: "C:\\Users\\Administrator\\Desktop\\photo\\lishuang.png", remark: "主号-留学咨询", avatar_id: "A01", avatar_preview: "https://ui-avatars.com/api/?name=A01&background=e0f2fe&color=0369a1&font-size=0.4" }
  ]);
  const [wechatVariants, setWechatVariants] = useState(["JtdJzsJzjJrsZtm"]);
  const [guideWords, setGuideWords] = useState(["滴我🟢："]);
  const [rpaConfig, setRpaConfig] = useState({ max_unread_min: 2, max_unread_max: 5, cooldown_min: 45, cooldown_max: 90, chat_context_limit: 1600, cv_confidence: 0.80 });
  const [prompt, setPrompt] = useState(`你是一个深谙人性的资深留学/法律顾问...`);

  // 页面加载时读取配置
  useEffect(() => {
    fetch('/api/config/autodesk')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          if (data.avatarLibrary) setAvatarLibrary(data.avatarLibrary);
          if (data.tasks) setTasks(data.tasks);
          if (data.wechatVariants) setWechatVariants(data.wechatVariants);
          if (data.guideWords) setGuideWords(data.guideWords);
          if (data.rpaConfig) setRpaConfig(data.rpaConfig);
          if (data.prompt) setPrompt(data.prompt);
        }
      }).catch(err => console.error(err));
  }, []);

  // 保存推送给后端
  const handleSave = async () => {
    const payload = { avatarLibrary, tasks, wechatVariants, guideWords, rpaConfig, prompt };
    try {
      await fetch('/api/config/autodesk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert("PC 客户端配置已成功同步到后端环境！");
    } catch(e) {
      alert("保存失败，请检查后端是否启动。");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 页面标题与保存按钮 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">3. 私域收割机 (PC客户端)</h1>
          <p className="text-gray-500 mt-2"> 纯物理 RPA 自动化，基于图像识别 (CV) 切换账号。</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 active:scale-95"
        >
          <Save size={18} />
          <span>保存 PC 配置</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 左侧：账号管理队列 */}
        <div className="xl:col-span-2">
          <AppleCard>
            <MatrixManager
              title="本地客户端账号队列"
              description="点击左侧头像框从素材库中选择，系统会自动填入对应的底层图像识别路径。"
              idField={{
                key: 'avatar_path',
                label: '底层绝对路径 (CV 匹配)',
                placeholder: '请点击左侧图标选择头像...',
                tooltip: '脚本会在屏幕上寻找该截图位置来点击切换账号',
                type: 'avatar'
              }}
              fields={[{ key: 'remark', label: '账号备注', placeholder: '用于标记用途' }]}
              tasks={tasks}
              avatarLibrary={avatarLibrary}
              onUpdateAvatarLibrary={setAvatarLibrary} // 允许上传/管理图库
              onChange={setTasks}
            />
          </AppleCard>
        </div>

        {/* 右侧：物理防封参数 (包含新增的视觉与记忆参数) */}
        <div className="xl:col-span-1 space-y-6">
          <AppleCard className="h-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><ShieldAlert size={20} /></div>
              <h2 className="text-lg font-semibold text-gray-800">物理级防封与视觉策略</h2>
            </div>

            <div className="space-y-6">
              {/* 碎片化处理条数 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">单号单次处理上限 (条)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={rpaConfig.max_unread_min}
                    onChange={e=>setRpaConfig({...rpaConfig, max_unread_min: Number(e.target.value)})}
                    className="w-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                  <span className="text-gray-400">~</span>
                  <input
                    type="number"
                    value={rpaConfig.max_unread_max}
                    onChange={e=>setRpaConfig({...rpaConfig, max_unread_max: Number(e.target.value)})}
                    className="w-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2">触发碎片化处理机制，防止被判定为机器清消息。</p>
              </div>

              <div className="h-px bg-gray-100"></div>

              {/* 切号冷却时间 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">切号冷却时间 (秒)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={rpaConfig.cooldown_min}
                    onChange={e=>setRpaConfig({...rpaConfig, cooldown_min: Number(e.target.value)})}
                    className="w-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                  <span className="text-gray-400">~</span>
                  <input
                    type="number"
                    value={rpaConfig.cooldown_max}
                    onChange={e=>setRpaConfig({...rpaConfig, cooldown_max: Number(e.target.value)})}
                    className="w-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2">增加极高延迟，打破固定频率特征关联。</p>
              </div>

              <div className="h-px bg-gray-100"></div>

              {/* 🔥 新增：OpenCV 容错率 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center justify-between">
                  <span>OpenCV 视觉匹配容错率</span>
                  <InfoTooltip content="值越小(如0.70)，越容易匹配到头像，但可能误触；值越大(如0.95)，匹配越严格。若经常提示找不到头像，请调低此值。" />
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="0.99"
                  value={rpaConfig.cv_confidence}
                  onChange={e=>setRpaConfig({...rpaConfig, cv_confidence: Number(e.target.value)})}
                  className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

              {/* 🔥 新增：AI 记忆截断限制 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center justify-between">
                  <span>AI 记忆截断限制 (字数)</span>
                  <InfoTooltip content="读取聊天记录时，最多传给 AI 多少个字。防止对方发送数万字的长文导致 API Token 计费爆炸或报错。" />
                </label>
                <input
                  type="number"
                  step="100"
                  value={rpaConfig.chat_context_limit}
                  onChange={e=>setRpaConfig({...rpaConfig, chat_context_limit: Number(e.target.value)})}
                  className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

            </div>
          </AppleCard>
        </div>
      </div>

      {/* 底部：导流矩阵与 AI 提示词 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppleCard>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Send size={20} /></div>
            <h2 className="text-lg font-semibold text-gray-800">防查杀导流矩阵</h2>
          </div>
          <div className="space-y-8">
            <DynamicTagList
              title="联系方式变体 (WeChat Variants)"
              description="随机抽取微信号变体发送，防止因内容重复被正则风控查杀。"
              tags={wechatVariants}
              onChange={setWechatVariants}
            />
            <div className="h-px bg-gray-100"></div>
            <DynamicTagList
              title="拉扯话术池 (Guide Words)"
              description="引流前置诱饵话术，使引流行为更像人类真实交流。"
              tags={guideWords}
              onChange={setGuideWords}
            />
          </div>
        </AppleCard>

        <AppleCard>
          <PromptEditor
            title="销冠级意图大脑 (System Prompt)"
            description="控制 AI 如何分析私信记录并生成高情商回复的核心逻辑。"
            value={prompt}
            onChange={setPrompt}
          />
        </AppleCard>
      </div>
    </div>
  );
};