import React, { useState, useEffect } from 'react';
import { AppleCard } from '../../components/common/AppleCard';
import { InfoTooltip } from '../../components/common/InfoTooltip';
import { Key, Server, Save, BrainCircuit } from 'lucide-react';
import { toast } from '../../utils/toast';

export const GlobalConfig = () => {
  const [config, setConfig] = useState({
    adspowerApiKey: "",
    deepseekApiKey: "",
    imageApiKey: "",
    whisperApiKey: "sk-xxxxxxxxxxxxxxxxxxxxxxxx",
    imageModel: "cogview-3-plus",
    whisperBaseUrl: "https://api.xxxxxx.com/v1",
    aiTempMin: 0.85,
    aiTempMax: 0.99
  });
  const [isSaving, setIsSaving] = useState(false);

  // 页面加载时，从后端读取配置
  useEffect(() => {
    fetch('/api/config/global')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) setConfig(data);
      })
      .catch(err => console.error("加载配置失败，请确保后端已启动", err));
  }, []);

  // 点击保存时，推送给后端
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/config/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      toast.success('全局配置与高级策略已同步到后端环境！');
    } catch (error) {
      toast.error('保存失败，请检查 FastAPI 后端是否运行。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content">全局系统配置</h1>
          <p className="text-content-muted mt-2">集中管理底层驱动密钥与大模型高级超参数。</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`btn-primary ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <Save size={18} />
          <span>{isSaving ? '同步中...' : '保存并应用到所有脚本'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* API 密钥模块 */}
        <div className="space-y-6">
          <AppleCard>
            <div className="flex items-center space-x-3 mb-6 border-b border-line pb-4">
              <div className="p-2 bg-brand/10 text-brand-soft rounded-xl"><Server size={20} /></div>
              <h2 className="text-lg font-semibold text-content">本地接口密钥</h2>
            </div>
            <div>
              <label className="field-label mb-2 text-content-muted">AdsPower Local API Key</label>
              <input type="text" value={config.adspowerApiKey} onChange={e => setConfig({...config, adspowerApiKey: e.target.value})} className="field-input font-mono" />
            </div>
          </AppleCard>

          <AppleCard>
            <div className="flex items-center space-x-3 mb-6 border-b border-line pb-4">
              <div className="p-2 bg-violet-500/10 text-violet-300 rounded-xl"><Key size={20} /></div>
              <h2 className="text-lg font-semibold text-content">AI 授权大脑</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="field-label mb-2 text-content-muted">DeepSeek 文本大脑 Key</label>
                <input type="password" value={config.deepseekApiKey} onChange={e => setConfig({...config, deepseekApiKey: e.target.value})} className="field-input font-mono" />
              </div>
              <div>
                <label className="field-label mb-2 text-content-muted">智谱 CogView 视觉大脑 Key</label>
                <input type="password" value={config.imageApiKey} onChange={e => setConfig({...config, imageApiKey: e.target.value})} className="field-input font-mono" />
              </div>
              <div>
                <label className="field-label mb-2 text-content-muted">Whisper 音频大脑 Key</label>
                <input type="password" value={config.whisperApiKey} onChange={e => setConfig({...config, whisperApiKey: e.target.value})} className="field-input font-mono" />
              </div>
            </div>
          </AppleCard>
        </div>

        {/* 🔥 新增：高级超参数模块 */}
        <div className="space-y-6">
          <AppleCard className="h-full">
            <div className="flex items-center space-x-3 mb-6 border-b border-line pb-4">
              <div className="p-2 bg-amber-400/10 text-amber-400 rounded-xl"><BrainCircuit size={20} /></div>
              <h2 className="text-lg font-semibold text-content">大模型底层超参数 (Hyperparameters)</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="field-label mb-2 text-content-muted">
                  AI 创意发散度 (Temperature 范围)
                  <InfoTooltip content="脚本会在该范围内随机取值，值越大(越接近1.0)，AI生成的文案越跳脱、越不像机器；值越小，排版越稳定。" />
                </label>
                <div className="flex items-center space-x-3">
                  <input type="number" step="0.01" value={config.aiTempMin} onChange={e => setConfig({...config, aiTempMin: Number(e.target.value)})} className="w-24 px-4 py-2 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" />
                  <span className="text-content-dim">至</span>
                  <input type="number" step="0.01" value={config.aiTempMax} onChange={e => setConfig({...config, aiTempMax: Number(e.target.value)})} className="w-24 px-4 py-2 bg-surface-input border border-line rounded-lg text-center text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand/25" />
                </div>
              </div>

              <div className="h-px bg-line"></div>

              <div>
                <label className="field-label mb-2 text-content-muted">
                  智谱视觉引擎模型版本
                  <InfoTooltip content="若官方推出新模型(如 cogview-4)，可直接在此修改，无需改动底层代码。" />
                </label>
                <input type="text" value={config.imageModel} onChange={e => setConfig({...config, imageModel: e.target.value})} className="field-input font-mono" />
              </div>

              <div>
                <label className="field-label mb-2 text-content-muted">
                  Whisper 中转/代理 Base URL
                  <InfoTooltip content="用于配置国内 OpenAI 代理服务器的调用地址。" />
                </label>
                <input type="text" value={config.whisperBaseUrl} onChange={e => setConfig({...config, whisperBaseUrl: e.target.value})} className="field-input font-mono text-content-muted" />
              </div>
            </div>
          </AppleCard>
        </div>
      </div>
    </div>
  );
};
