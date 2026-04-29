import React, { useState, useRef } from 'react';
import { Plus, Trash2, MonitorSmartphone, Image as ImageIcon, Search, UploadCloud } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';
import { GlassModal } from '../common/GlassModal';

export interface MatrixFieldDef {
  key: string; label: string; placeholder: string;
}

export interface MatrixTask {
  [key: string]: any;
}

export interface AvatarItem {
  id: string; name: string; path: string; previewUrl: string;
}

interface MatrixManagerProps {
  title?: string;
  description?: string;
  idField?: { key: string; label: string; placeholder: string; tooltip: string; type?: 'text' | 'avatar' };
  fields?: MatrixFieldDef[];
  tasks: MatrixTask[];
  avatarLibrary?: AvatarItem[];
  onUpdateAvatarLibrary?: (newLib: AvatarItem[]) => void; // 新增：允许子组件更新图库
  onChange: (newTasks: MatrixTask[]) => void;
}

export const MatrixManager: React.FC<MatrixManagerProps> = ({
  title = "矩阵账号队列", description = "在此处配置参与执行的账号及专属参数。",
  idField, fields = [], tasks, avatarLibrary = [], onUpdateAvatarLibrary, onChange
}) => {

  const activeIdField = idField || { key: 'profile_id', label: 'Profile ID', placeholder: '例如: k1bhea90', tooltip: 'AdsPower 环境编号', type: 'text' };

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 隐藏的上传控件引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = (index: number, key: string, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [key]: value };
    onChange(newTasks);
  };

  const handleAdd = () => {
    const newTask: MatrixTask = { [activeIdField.key]: '' };
    fields.forEach(f => newTask[f.key] = '');
    onChange([...tasks, newTask]);
  };

  const handleDelete = (index: number) => {
    onChange(tasks.filter((_, i) => i !== index));
  };

  const openAvatarPicker = (index: number) => {
    if (activeIdField.type !== 'avatar') return;
    setEditingIndex(index);
    setIsPickerOpen(true);
  };

  const selectAvatar = (avatar: AvatarItem) => {
    if (editingIndex !== null) {
      const newTasks = [...tasks];
      newTasks[editingIndex] = {
        ...newTasks[editingIndex],
        [activeIdField.key]: avatar.path,
        avatar_preview: avatar.previewUrl,
        avatar_id: avatar.id
      };
      onChange(newTasks);
    }
    setIsPickerOpen(false);
  };

  // 核心：模拟本地文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateAvatarLibrary) return;

    // 用 URL.createObjectURL 在前端直接渲染本地图片（无需后端）
    const previewUrl = URL.createObjectURL(file);
    const newId = `U${Math.floor(Math.random() * 1000)}`; // 随机生成新编号
    const newAvatar: AvatarItem = {
      id: newId,
      name: file.name.split('.')[0],
      path: `C:\\Users\\Administrator\\Desktop\\photo\\${file.name}`, // 自动套用你的格式
      previewUrl: previewUrl
    };

    onUpdateAvatarLibrary([newAvatar, ...avatarLibrary]);
    e.target.value = ''; // 清空 input 状态
  };

  const deleteFromLibrary = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation(); // 阻止触发“选中”事件
    if (onUpdateAvatarLibrary) {
      onUpdateAvatarLibrary(avatarLibrary.filter(a => a.id !== idToDelete));
    }
  };

  const filteredLibrary = avatarLibrary.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* 顶部标题区 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <button onClick={handleAdd} className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-medium text-sm">
          <Plus size={16} /><span>添加账号</span>
        </button>
      </div>

      {/* 账号列表渲染区 */}
      <div className="space-y-3 mt-4">
        {tasks.map((task, index) => (
          <div key={index} className="flex items-start gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl transition-all hover:shadow-sm group">

            {/* 左侧头像预览区 */}
            <div
              onClick={() => openAvatarPicker(index)}
              className={`relative flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0 shadow-sm border-4 transition-all ${activeIdField.type === 'avatar' ? 'cursor-pointer hover:border-blue-400 border-white bg-gray-100' : 'bg-white border-gray-50 text-gray-400'}`}
              title={activeIdField.type === 'avatar' ? "点击更换头像" : ""}
            >
              {activeIdField.type === 'avatar' && task.avatar_preview ? (
                <img src={task.avatar_preview} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                activeIdField.type === 'avatar' ? <ImageIcon size={20} /> : <MonitorSmartphone size={20} />
              )}

              {/* 悬浮编号 */}
              {activeIdField.type === 'avatar' && task.avatar_id && (
                <div className="absolute -bottom-1 -right-2 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white">
                  {task.avatar_id}
                </div>
              )}
            </div>

            <div className="flex-1 grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              <div className={fields.length === 0 ? "md:col-span-2 xl:col-span-3" : ""}>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1 flex items-center justify-between">
                  <span>{activeIdField.label} <InfoTooltip content={activeIdField.tooltip} /></span>
                  {activeIdField.type === 'avatar' && (
                    <span className="text-[10px] text-blue-500 cursor-pointer hover:underline" onClick={() => openAvatarPicker(index)}>
                      浏览图库
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={task[activeIdField.key] || ''}
                  onChange={(e) => handleUpdate(index, activeIdField.key, e.target.value)}
                  placeholder={activeIdField.placeholder}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono text-gray-600"
                />
              </div>

              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">{field.label}</label>
                  <input
                    type="text"
                    value={task[field.key] || ''}
                    onChange={(e) => handleUpdate(index, field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              ))}
            </div>

            <button onClick={() => handleDelete(index)} className="p-2 mt-4 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* 🚀 Pro 级图库弹窗：支持 max-w-4xl 宽屏 */}
      <GlassModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} title="素材库：对位头像管理" maxWidth="max-w-4xl">
        <div className="space-y-6">
          {/* 搜索与上传控制台 */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索头像编号或备注..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* 隐藏的 File Input */}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

            <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-md text-sm font-medium flex-shrink-0">
              <UploadCloud size={16} /><span>本地上传</span>
            </button>
          </div>

          {/* 高级画廊网格 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredLibrary.map((avatar) => (
              <div
                key={avatar.id}
                onClick={() => selectAvatar(avatar)}
                className="relative flex flex-col p-4 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all group overflow-hidden"
              >
                {/* 图片展示区 */}
                <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                  <img src={avatar.previewUrl} alt={avatar.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/20">
                    {avatar.id}
                  </span>
                </div>

                {/* 文本信息区 */}
                <span className="text-sm font-semibold text-gray-800 truncate w-full" title={avatar.name}>{avatar.name}</span>
                <span className="text-[10px] text-gray-400 truncate w-full mt-0.5" title={avatar.path}>{avatar.path.split('\\').pop()}</span>

                {/* 悬浮遮罩与操作按钮 */}
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                    应用
                  </button>
                  <button
                    onClick={(e) => deleteFromLibrary(e, avatar.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                    title="从库中删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredLibrary.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
              <ImageIcon size={48} className="mb-4 text-gray-300" />
              <p>图库中暂无素材，请点击右上角上传</p>
            </div>
          )}
        </div>
      </GlassModal>
    </div>
  );
};