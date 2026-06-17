import React, { useState, useRef } from 'react';
import { Plus, Trash2, MonitorSmartphone, Image as ImageIcon, Search, UploadCloud } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';
import { GlassModal } from '../common/GlassModal';

export interface MatrixFieldDef {
  key: string;
  label: string;
  placeholder: string;
}

export interface MatrixTask {
  [key: string]: any;
}

export interface AvatarItem {
  id: string;
  name: string;
  path: string;
  previewUrl: string;
}

interface MatrixManagerProps {
  title?: string;
  description?: string;
  idField?: { key: string; label: string; placeholder: string; tooltip: string; type?: 'text' | 'avatar' };
  fields?: MatrixFieldDef[];
  tasks: MatrixTask[];
  avatarLibrary?: AvatarItem[];
  onUpdateAvatarLibrary?: (newLib: AvatarItem[]) => void;
  onChange: (newTasks: MatrixTask[]) => void;
}

export const MatrixManager: React.FC<MatrixManagerProps> = ({
  title = '矩阵账号队列',
  description = '在此处配置参与执行的账号及专属参数。',
  idField,
  fields = [],
  tasks,
  avatarLibrary = [],
  onUpdateAvatarLibrary,
  onChange
}) => {
  const activeIdField =
    idField || { key: 'profile_id', label: 'Profile ID', placeholder: '例如: k1bhea90', tooltip: 'AdsPower 环境编号', type: 'text' as const };

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = (index: number, key: string, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [key]: value };
    onChange(newTasks);
  };

  const handleAdd = () => {
    const newTask: MatrixTask = { [activeIdField.key]: '' };
    fields.forEach((f) => (newTask[f.key] = ''));
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

  // 模拟本地文件上传（前端直接预览，无需后端）
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateAvatarLibrary) return;

    const previewUrl = URL.createObjectURL(file);
    const newId = `U${Math.floor(Math.random() * 1000)}`;
    const newAvatar: AvatarItem = {
      id: newId,
      name: file.name.split('.')[0],
      path: `C:\\Users\\Administrator\\Desktop\\photo\\${file.name}`,
      previewUrl
    };

    onUpdateAvatarLibrary([newAvatar, ...avatarLibrary]);
    e.target.value = '';
  };

  const deleteFromLibrary = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    if (onUpdateAvatarLibrary) {
      onUpdateAvatarLibrary(avatarLibrary.filter((a) => a.id !== idToDelete));
    }
  };

  const filteredLibrary = avatarLibrary.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* 顶部标题区 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-content">{title}</h3>
          <p className="text-sm text-content-muted mt-1">{description}</p>
        </div>
        <button onClick={handleAdd} className="btn-soft flex-shrink-0">
          <Plus size={16} />
          <span>添加账号</span>
        </button>
      </div>

      {/* 账号列表渲染区 */}
      <div className="space-y-3 mt-4">
        {tasks.length === 0 && (
          <div className="py-10 flex flex-col items-center justify-center text-content-dim border border-dashed border-line rounded-2xl">
            <MonitorSmartphone size={36} className="mb-3 opacity-50" />
            <p className="text-sm">队列为空，点击右上角「添加账号」开始配置。</p>
          </div>
        )}

        {tasks.map((task, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-4 bg-white/[0.02] border border-line rounded-2xl transition-all hover:border-line-strong group"
          >
            {/* 左侧头像 / 环境图标 */}
            <div
              onClick={() => openAvatarPicker(index)}
              className={`relative flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0 border transition-all ${
                activeIdField.type === 'avatar'
                  ? 'cursor-pointer hover:border-brand border-line bg-surface-soft'
                  : 'bg-surface-soft border-line text-content-dim'
              }`}
              title={activeIdField.type === 'avatar' ? '点击更换头像' : ''}
            >
              {activeIdField.type === 'avatar' && task.avatar_preview ? (
                <img src={task.avatar_preview} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : activeIdField.type === 'avatar' ? (
                <ImageIcon size={20} />
              ) : (
                <MonitorSmartphone size={20} />
              )}

              {activeIdField.type === 'avatar' && task.avatar_id && (
                <div className="absolute -bottom-1 -right-2 bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                  {task.avatar_id}
                </div>
              )}
            </div>

            <div className="flex-1 grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              <div className={fields.length === 0 ? 'md:col-span-2 xl:col-span-3' : ''}>
                <label className="text-xs font-medium text-content-muted mb-1.5 ml-1 flex items-center justify-between">
                  <span className="flex items-center">
                    {activeIdField.label}
                    <InfoTooltip content={activeIdField.tooltip} />
                  </span>
                  {activeIdField.type === 'avatar' && (
                    <span
                      className="text-[10px] text-brand-soft cursor-pointer hover:underline"
                      onClick={() => openAvatarPicker(index)}
                    >
                      浏览图库
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={task[activeIdField.key] || ''}
                  onChange={(e) => handleUpdate(index, activeIdField.key, e.target.value)}
                  placeholder={activeIdField.placeholder}
                  className="field-input font-mono"
                />
              </div>

              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-content-muted mb-1.5 ml-1">{field.label}</label>
                  <input
                    type="text"
                    value={task[field.key] || ''}
                    onChange={(e) => handleUpdate(index, field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="field-input"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => handleDelete(index)}
              className="p-2 mt-4 text-content-dim hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* 图库弹窗 */}
      <GlassModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} title="素材库：对位头像管理" maxWidth="max-w-4xl">
        <div className="space-y-6">
          {/* 搜索与上传控制台 */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-content-dim w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索头像编号或备注..."
                className="field-input pl-9"
              />
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

            <button onClick={() => fileInputRef.current?.click()} className="btn-primary flex-shrink-0">
              <UploadCloud size={16} />
              <span>本地上传</span>
            </button>
          </div>

          {/* 画廊网格 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredLibrary.map((avatar) => (
              <div
                key={avatar.id}
                onClick={() => selectAvatar(avatar)}
                className="relative flex flex-col p-3 bg-surface-soft border border-line rounded-2xl cursor-pointer hover:border-brand/60 hover:shadow-glow transition-all group overflow-hidden"
              >
                <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden bg-surface-input border border-line">
                  <img
                    src={avatar.previewUrl}
                    alt={avatar.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/20">
                    {avatar.id}
                  </span>
                </div>

                <span className="text-sm font-semibold text-content truncate w-full" title={avatar.name}>
                  {avatar.name}
                </span>
                <span className="text-[10px] text-content-dim truncate w-full mt-0.5" title={avatar.path}>
                  {avatar.path.split('\\').pop()}
                </span>

                {/* 悬浮操作层 */}
                <div className="absolute inset-0 bg-base/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 gap-2">
                  <button className="px-4 py-2 bg-gradient-to-r from-brand to-violet-500 text-white text-xs font-bold rounded-lg shadow-md hover:brightness-110 transition-all">
                    应用
                  </button>
                  <button
                    onClick={(e) => deleteFromLibrary(e, avatar.id)}
                    className="p-2 bg-red-500/15 text-red-300 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                    title="从库中删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredLibrary.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-content-dim border-2 border-dashed border-line rounded-2xl">
              <ImageIcon size={48} className="mb-4 opacity-50" />
              <p>图库中暂无素材，请点击右上角上传</p>
            </div>
          )}
        </div>
      </GlassModal>
    </div>
  );
};
