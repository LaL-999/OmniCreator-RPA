import React, { useState, useEffect } from 'react';

const defaultData = [
  {
    id: 1,
    title: '留学申请与转学',
    topics: [
      '【转学拯救】在新加坡选错学校导致挂科，如何免费帮忙申请转学？',
      '【真实预算】国内学生成绩一般，50-75万人民币预算如何规划新加坡本科？'
    ],
    keywords: ['新加坡留学', '新加坡转学']
  }
];

export default function KnowledgeBase() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newInputs, setNewInputs] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/topics')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(defaultData);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('拉取知识库失败:', err);
        setCategories(defaultData);
        setIsLoading(false);
      });
  }, []);

  const saveToServer = async (newData: any[]) => {
    setCategories(newData);
    try {
      await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
    } catch (err) {
      console.error('保存知识库到服务器失败:', err);
    }
  };

// 🔥 1. 主复制逻辑（已去除所有阻塞式 alert）
  const handleCopy = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // 阻止事件冒泡

    // 优先使用现代 API (HTTPS环境)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopyTextToClipboard(text));
    } else {
      // 降级使用底层 API (HTTP环境)
      fallbackCopyTextToClipboard(text);
    }
  };

  // 🔥 2. 底层降级复制逻辑（纯净静默版）
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // 把输入框藏到屏幕外面去，避免画面闪烁
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      // 如果复制成功，什么都不做，保持绝对的丝滑无感
      if (!successful) {
        // 如果复制失败，只在开发者控制台打印，绝对不弹窗打扰用户
        console.warn('Fallback: 复制失败，请手动选择复制');
      }
    } catch (err) {
      console.error('Fallback: 复制异常，浏览器拦截了此操作', err);
    }

    // 用完即焚，清理战场
    document.body.removeChild(textArea);
  };

  const handleAddCategory = () => {
    if (!newCatTitle.trim()) return;
    const newData = [...categories, { id: Date.now(), title: newCatTitle, topics: [], keywords: [] }];
    saveToServer(newData);
    setNewCatTitle('');
  };

  const handleDeleteCategory = (id: number) => {
    if(window.confirm("确定要删除这个分类及其所有内容吗？")) {
        const newData = categories.filter(cat => cat.id !== id);
        saveToServer(newData);
    }
  };

  const handleInputChange = (catId: number, type: 'topic' | 'keyword', value: string) => {
    setNewInputs({ ...newInputs, [`${catId}-${type}`]: value });
  };

  const handleAddItem = (catId: number, type: 'topic' | 'keyword') => {
    const value = newInputs[`${catId}-${type}`];
    if (!value?.trim()) return;

    const newData = categories.map(cat => {
      if (cat.id === catId) {
        return { ...cat, [type === 'topic' ? 'topics' : 'keywords']: [...cat[type === 'topic' ? 'topics' : 'keywords'], value] };
      }
      return cat;
    });

    saveToServer(newData);
    setNewInputs({ ...newInputs, [`${catId}-${type}`]: '' });
  };

  const handleDeleteItem = (catId: number, type: 'topic' | 'keyword', index: number) => {
    const newData = categories.map(cat => {
      if (cat.id === catId) {
        const newList = [...cat[type === 'topic' ? 'topics' : 'keywords']];
        newList.splice(index, 1);
        return { ...cat, [type === 'topic' ? 'topics' : 'keywords']: newList };
      }
      return cat;
    });
    saveToServer(newData);
  };

  if (isLoading) return <div className="p-8 text-center text-content-muted">正在加载知识库...</div>;

  const totalTopics = categories.reduce((sum, cat) => sum + cat.topics.length, 0);
  const totalKeywords = categories.reduce((sum, cat) => sum + cat.keywords.length, 0);

  return (
    <div className="pb-12">
      <div className="max-w-7xl mx-auto card overflow-hidden">

        <div className="px-8 py-6 border-b border-line flex justify-between items-center">
          <h1 className="text-2xl font-bold text-content">小红书话题与关键词知识库</h1>
          <div className="flex gap-6 text-sm text-content-dim">
            <div className="flex flex-col items-center"><span className="font-semibold text-content text-lg">{categories.length}</span>分类总数</div>
            <div className="flex flex-col items-center"><span className="font-semibold text-content text-lg">{totalTopics}</span>话题总数</div>
            <div className="flex flex-col items-center"><span className="font-semibold text-content text-lg">{totalKeywords}</span>关键词数</div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-brand/[0.06] border border-brand/15 rounded-xl p-6 relative group transition-all hover:shadow-md">
              <button onClick={() => handleDeleteCategory(cat.id)} className="absolute top-6 right-6 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity" title="删除整个分类">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>

              <h2 className="text-xl font-bold text-content mb-6 border-b border-brand/20 pb-3 inline-block">{cat.title}</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 左侧：发帖话题 */}
                <div>
                  <h3 className="text-sm font-semibold text-content-muted mb-4 flex items-center gap-2">发帖话题 (Topics)</h3>
                  <div className="space-y-3">
                    {cat.topics.map((topic: string, idx: number) => (
                      <div key={idx} className="bg-white/[0.03] border border-line p-4 rounded-lg flex justify-between items-start group/item transition-colors hover:border-brand/40">
                        <span
                          onClick={(e) => handleCopy(topic, e)}
                          className="text-content-muted leading-relaxed pr-4 text-sm flex-1 cursor-pointer hover:text-brand-soft"
                          title="点击即可复制话题"
                        >
                          {topic}
                        </span>
                        <div className="flex gap-2 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button onClick={() => handleDeleteItem(cat.id, 'topic', idx)} className="text-red-400 hover:text-red-300 bg-red-400/10 p-1.5 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input type="text" value={newInputs[`${cat.id}-topic`] || ''} onChange={(e) => handleInputChange(cat.id, 'topic', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddItem(cat.id, 'topic')} placeholder="输入新话题..." className="field-input flex-1" />
                      <button onClick={() => handleAddItem(cat.id, 'topic')} className="btn-soft">添加</button>
                    </div>
                  </div>
                </div>

                {/* 右侧：关键词 */}
                <div>
                  <h3 className="text-sm font-semibold text-content-muted mb-4 flex items-center gap-2">引流搜索词 (Keywords)</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cat.keywords.map((kw: string, idx: number) => (
                      <div
                        key={idx}
                        onClick={(e) => handleCopy(kw, e)}
                        className="bg-brand/10 border border-brand/25 text-brand-soft px-3 py-1.5 rounded-full text-sm flex items-center gap-2 group/kw cursor-pointer hover:bg-brand/20 hover:border-brand/40 transition-colors"
                        title="点击即可复制关键词"
                      >
                        <span>{kw}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteItem(cat.id, 'keyword', idx); }}
                          className="text-brand-soft/60 hover:text-red-400 opacity-0 group-hover/kw:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={newInputs[`${cat.id}-keyword`] || ''} onChange={(e) => handleInputChange(cat.id, 'keyword', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddItem(cat.id, 'keyword')} placeholder="输入关键词..." className="field-input flex-1" />
                    <button onClick={() => handleAddItem(cat.id, 'keyword')} className="btn-soft">添加</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 border-t border-line flex gap-4">
          <input type="text" value={newCatTitle} onChange={(e) => setNewCatTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} placeholder="输入新业务板块名称..." className="field-input flex-1" />
          <button onClick={handleAddCategory} className="btn-primary px-8">新建分类板块</button>
        </div>
      </div>
    </div>
  );
}
