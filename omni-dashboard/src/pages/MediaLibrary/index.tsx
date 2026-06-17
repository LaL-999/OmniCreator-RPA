import React, { useState, useEffect, useRef } from 'react';
// 🔥 引入了 Trash2 (垃圾桶图标)
import { Upload, Film, AlertCircle, HardDrive, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from '../../utils/toast';

export const MediaLibrary = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('未使用');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVideos = () => {
    fetch('/api/media/videos')
      .then(res => res.json())
      .then(data => {
        if (data.videos) setVideos(data.videos);
        if (data.profiles) setProfiles(data.profiles);
      })
      .catch(err => console.error("获取视频列表失败:", err));
  };

  useEffect(() => { fetchVideos(); }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      try {
        await fetch('/api/media/upload', { method: 'POST', body: formData });
      } catch (error) {
        console.error("上传失败", error);
      }
    }
    setIsUploading(false);
    fetchVideos();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateVideoMeta = async (id: string, field: string, value: string) => {
    const updatedVideos = videos.map(v => v.id === id ? { ...v, [field]: value } : v);
    setVideos(updatedVideos);

    const targetVideo = updatedVideos.find(v => v.id === id);
    try {
      await fetch('/api/media/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetVideo)
      });
    } catch (e) { console.error("分配保存失败", e); }
  };

// 🔥 核心修复：彻底拦截后端的虚假成功假象
  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm('确定要彻底删除这个视频素材吗？\n删除后将无法恢复，并会释放服务器物理磁盘空间。')) {
      return;
    }

    const previousVideos = [...videos]; // 先把当前数据备份
    setVideos(videos.filter(v => v.id !== id)); // 乐观UI：让界面瞬间消失，体验丝滑

    try {
      const response = await fetch(`/api/media/delete?id=${id}`, { method: 'DELETE' });

      // ⚠️ 关键所在：fetch 默认不拦截 404/500，必须手动查岗！
      if (!response.ok) {
        throw new Error(`后端返回错误代码: ${response.status}`);
      }
    } catch (e) {
      console.error("删除失败", e);
      // 报错并把备份的数据恢复到界面上，防止“刷新复活”的假象
      toast.error('❌ 删除失败！你的 Python 后端可能尚未编写 /api/media/delete 接口。');
      setVideos(previousVideos);
    }
  };

  const filteredVideos = activeTab === '全部素材' ? videos : videos.filter(v => v.status === activeTab);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content">视频素材调度中心</h1>
          <p className="text-content-muted mt-2">上传素材并分配发帖任务。系统低库存时会自动预警。</p>
        </div>

        <input type="file" multiple accept="video/mp4,video/x-m4v,video/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`btn-primary ${isUploading ? 'opacity-70' : ''}`}
        >
          <Upload size={18} />
          <span>{isUploading ? '正在传输至本地...' : '批量上传视频'}</span>
        </button>
      </div>

      {videos.filter(v => v.status === '未使用').length <= 2 && (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="text-amber-400 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-amber-300">库存预警：当前【未使用】的视频素材仅剩 {videos.filter(v => v.status === '未使用').length} 个！</p>
            <p className="text-xs text-amber-400 mt-1">请及时补充本地素材，以免影响矩阵号自动发布计划。</p>
          </div>
        </div>
      )}

      <div className="flex space-x-2 border-b border-line pb-px">
        {['全部素材', '未使用', '已发布'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-brand/10 text-content border border-brand/20 rounded-t-xl'
                : 'text-content-muted hover:text-content hover:bg-white/[0.04] rounded-t-xl'
            }`}
          >
            {tab === '未使用' ? '未使用 (待发布)' : tab}
          </button>
        ))}
      </div>

      {filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-line rounded-2xl">
          <HardDrive size={48} className="text-content-dim mb-4" />
          <p className="text-content-muted font-medium">当前分类下没有视频</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div key={video.id} className="card overflow-hidden group">
              <div className="bg-surface-soft aspect-video flex items-center justify-center relative">
                <Film size={32} className="text-content-dim" />

                {/* 后缀名标签移到右下角，给垃圾桶腾位置 */}
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-mono">
                  {video.id.split('.').pop()?.toUpperCase()}
                </div>

                {video.status === '已发布' && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-green-500/90 backdrop-blur-md rounded flex items-center space-x-1 text-[10px] text-white font-medium">
                    <CheckCircle2 size={12} /><span>已发布</span>
                  </div>
                )}

                {/* 🔥 删除按钮：悬停时才会显示 */}
                <button
                  onClick={() => handleDeleteVideo(video.id)}
                  className="absolute top-3 right-3 p-2 bg-red-500/90 hover:bg-red-600 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  title="彻底删除视频"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-medium text-content truncate" title={video.name}>{video.name}</h3>
                  <p className="text-xs text-content-dim mt-1">上传于 {video.uploadTime}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-line">
                  <div>
                    <label className="text-[10px] font-medium text-content-dim uppercase tracking-wider">分配矩阵账号 (PROFILE ID)</label>
                    <select
                      value={video.profile_id}
                      onChange={(e) => updateVideoMeta(video.id, 'profile_id', e.target.value)}
                      className="field-input mt-1"
                    >
                      <option value="">-- 点击分配账号 --</option>
                      {profiles.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-content-dim uppercase tracking-wider">发布状态与兜底话题</label>
                    <div className="mt-1 flex space-x-2">
                      <select
                        value={video.status}
                        onChange={(e) => updateVideoMeta(video.id, 'status', e.target.value)}
                        className={`text-sm border rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-brand/25 ${video.status==='已发布' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-surface-input text-content-muted border-line'}`}
                      >
                        <option value="未使用">未使用</option>
                        <option value="已发布">已发布</option>
                      </select>
                      <input
                        type="text"
                        value={video.topic}
                        onChange={(e) => updateVideoMeta(video.id, 'topic', e.target.value)}
                        placeholder="选填: 视频话题"
                        className="field-input flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
