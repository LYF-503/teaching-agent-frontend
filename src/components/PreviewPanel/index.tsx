import { useState, useRef, useEffect } from 'react';
import { Tabs,  Input, Tooltip } from 'antd';
// Button,
import { RedoOutlined, DownloadOutlined, CheckOutlined, FileTextOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { usePreviewStore } from '../../store/previewStore';

function PreviewPanel() {
  const [activeTab, setActiveTab] = useState<string>('ppt');
  const [modifyInput, setModifyInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { hasContent, pptUrl, wordUrl, gameUrl, generating, generateProgress, generateStatus } = usePreviewStore();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({ ppt: null, word: null, game: null });
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // 👇 添加这个 useEffect
 useEffect(() => {
  const container = tabRefs.current.ppt?.parentElement;
  if (!container) return;

  const observer = new ResizeObserver(() => {
    const activeElement = tabRefs.current[activeTab];
    if (activeElement) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();
      setIndicatorStyle({ 
        left: elementRect.left - containerRect.left, 
        width: elementRect.width 
      });
    }
  });

  observer.observe(container);
  return () => observer.disconnect();
}, [activeTab]);
  // 获取当前 Tab 的名称
  const getTabName = () => {
    switch (activeTab) {
      case 'ppt': return 'PPT课件';
      case 'word': return 'Word教案';
      case 'game': return '互动游戏';
      default: return '';
    }
  };

  // 处理重新生成
  const handleRegenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  // 处理应用修改
  const handleApplyModify = () => {
    if (!modifyInput.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setModifyInput('');
    }, 1500);
  };

  // 处理键盘事件：Enter 发送，Shift+Enter 换行
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleApplyModify();
    }
  };

  // 处理导出
  const handleExport = () => {
    const currentUrl = activeTab === 'ppt' ? pptUrl : activeTab === 'word' ? wordUrl : gameUrl;
    if (currentUrl) {
      // 构建完整的下载 URL
      let downloadUrl = currentUrl;
      if (!downloadUrl.startsWith('http')) {
        // 检查是否已经包含 /static/ 前缀
        if (!downloadUrl.startsWith('/static/')) {
          downloadUrl = `/static${downloadUrl}`;
        }
        // 构建完整的 URL
        downloadUrl = `http://localhost:8000${downloadUrl}`;
      }
      // 创建下载链接并触发点击
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.download = ''; // 让浏览器自动处理文件名
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 空状态占位
  const emptyPlaceholder = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',  // 改为 flex-start
      paddingTop: 100,                // 加顶部 padding
      height: '100%',
      minHeight: 300,
      color: '#999'
    }}>
      <FileTextOutlined style={{ fontSize: 48, color: '#D5E4F0', marginBottom: 16 }} />
      <p style={{ fontSize: 16, color: '#999', marginBottom: 8 }}>暂无内容</p>
      <p style={{ fontSize: 13, color: '#bfbfbf' }}>点击左侧「生成课件」开始</p>
    </div>
  );

  // PPT 预览内容（模拟）
  const pptPreview = (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 12
    }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #6B8EAE 0%, #95AEC7 100%)',
        borderRadius: 12,
        padding: '20px 16px',
        color: '#fff'
      }}>
        <h3 style={{ color: '#fff', marginBottom: 8 }}>欧姆定律</h3>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>初中物理 · 第3课时</p>
      </div>
      <div style={{ 
        background: '#f5f7fa', 
        borderRadius: 8, 
        padding: 16,
        borderLeft: '4px solid #6B8EAE'
      }}>
        <p style={{ fontWeight: 500, marginBottom: 8 }}>📌 电流与电压的关系</p>
        <p style={{ color: '#666', fontSize: 13 }}>当电阻一定时，通过导体的电流与导体两端的电压成正比。</p>
      </div>
      <div style={{ 
        background: '#f5f7fa', 
        borderRadius: 8, 
        padding: 16,
        borderLeft: '4px solid #95AEC7'
      }}>
        <p style={{ fontWeight: 500, marginBottom: 8 }}>📌 电阻的概念</p>
        <p style={{ color: '#666', fontSize: 13 }}>电阻是导体对电流的阻碍作用，单位是欧姆（Ω）。</p>
      </div>
      <div style={{ 
        background: '#f5f7fa', 
        borderRadius: 8, 
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        color: '#6B8EAE'
      }}>
        <CheckOutlined />
        <span>共 8 页 · 点击导出可下载完整PPT</span>
      </div>
    </div>
  );

  // Word 教案预览内容（模拟）
  const wordPreview = (
    <div style={{ 
      background: '#fff',
      padding: 16,
      borderRadius: 12
    }}>
      <h3 style={{ marginBottom: 16, color: '#4A637A' }}>《欧姆定律》教案</h3>
      
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 500, color: '#6B8EAE', marginBottom: 8 }}>🎯 教学目标</p>
        <ul style={{ paddingLeft: 20, color: '#666', fontSize: 13 }}>
          <li>理解电流、电压、电阻的概念</li>
          <li>掌握欧姆定律公式 I = U/R</li>
          <li>能够运用欧姆定律解决简单电路问题</li>
        </ul>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 500, color: '#6B8EAE', marginBottom: 8 }}>📖 教学过程</p>
        <div style={{ background: '#f5f7fa', padding: 12, borderRadius: 8 }}>
          <p style={{ fontSize: 13, color: '#666' }}><strong>导入（5分钟）：</strong> 通过生活实例引入电流概念</p>
          <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}><strong>新授（25分钟）：</strong> 实验探究电流与电压、电阻的关系</p>
          <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}><strong>巩固（10分钟）：</strong> 例题讲解与课堂练习</p>
          <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}><strong>小结（5分钟）：</strong> 总结欧姆定律及应用</p>
        </div>
      </div>
      
      <div>
        <p style={{ fontWeight: 500, color: '#6B8EAE', marginBottom: 8 }}>📝 课后作业</p>
        <p style={{ color: '#666', fontSize: 13 }}>完成课本第45页练习题1-3题</p>
      </div>
    </div>
  );

  // 游戏预览内容（模拟）
  const gamePreview = (
    <div style={{ 
      background: 'linear-gradient(135deg, #E9F0F7 0%, #f5f7fa 100%)',
      borderRadius: 16,
      padding: 20,
      textAlign: 'center'
    }}>
      <div style={{ 
        background: '#fff', 
        borderRadius: 12, 
        padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <h3 style={{ color: '#4A637A', marginBottom: 20 }}>🎮 欧姆定律挑战</h3>
        
        <div style={{ 
          background: '#6B8EAE', 
          color: '#fff', 
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 20
        }}>
          <p style={{ fontSize: 16 }}>当电阻 R=10Ω，电压 U=5V 时，电流 I = ?</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {['0.5A', '2A', '5A', '50A'].map(option => (
            <div key={option} style={{
              background: '#f5f7fa',
              padding: '12px',
              borderRadius: 8,
              cursor: 'pointer',
              border: '1px solid #e8e8e8',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E9F0F7';
              e.currentTarget.style.borderColor = '#95AEC7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f5f7fa';
              e.currentTarget.style.borderColor = '#e8e8e8';
            }}>
              {option}
            </div>
          ))}
        </div>
        
        <p style={{ marginTop: 20, color: '#6B8EAE', fontSize: 13 }}>
          点击选项选择答案 · 共 5 题
        </p>
      </div>
    </div>
  );

  // 根据是否有内容显示预览或空状态
  const getPreviewContent = () => {
    if (!hasContent) return emptyPlaceholder;
    
    const currentUrl = activeTab === 'ppt' ? pptUrl : activeTab === 'word' ? wordUrl : gameUrl;
    
    if (!currentUrl) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 100,
          height: '100%',
          minHeight: 300,
          color: '#999'
        }}>
          <FileTextOutlined style={{ fontSize: 48, color: '#D5E4F0', marginBottom: 16 }} />
          <p style={{ fontSize: 16, color: '#999', marginBottom: 8 }}>暂无{getTabName()}内容</p>
          <p style={{ fontSize: 13, color: '#bfbfbf' }}>请先生成{getTabName()}</p>
        </div>
      );
    }
    
    // 根据类型显示不同的预览内容
    switch (activeTab) {
      case 'ppt':
        return (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #6B8EAE 0%, #95AEC7 100%)',
              borderRadius: 12,
              padding: '20px 16px',
              color: '#fff'
            }}>
              <h3 style={{ color: '#fff', marginBottom: 8 }}>PPT 课件</h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>已生成，点击导出可下载</p>
            </div>
            <div style={{ 
              background: '#f5f7fa', 
              borderRadius: 8, 
              padding: 16,
              borderLeft: '4px solid #6B8EAE'
            }}>
              <p style={{ fontWeight: 500, marginBottom: 8 }}>📌 生成信息</p>
              <p style={{ color: '#666', fontSize: 13 }}>文件已生成，您可以通过导出功能下载完整 PPT 文件。</p>
            </div>
            <div style={{ 
              background: '#f5f7fa', 
              borderRadius: 8, 
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: '#6B8EAE'
            }}>
              <CheckOutlined />
              <span>生成成功 · 点击导出可下载</span>
            </div>
          </div>
        );
      case 'word':
        return (
          <div style={{ 
            background: '#fff',
            padding: 16,
            borderRadius: 12
          }}>
            <h3 style={{ marginBottom: 16, color: '#4A637A' }}>Word 教案</h3>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 500, color: '#6B8EAE', marginBottom: 8 }}>🎯 生成状态</p>
              <div style={{ background: '#f5f7fa', padding: 12, borderRadius: 8 }}>
                <p style={{ fontSize: 13, color: '#666' }}>教案文件已生成完成</p>
                <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>包含完整的教学目标、教学过程和课后作业</p>
              </div>
            </div>
            
            <div>
              <p style={{ fontWeight: 500, color: '#6B8EAE', marginBottom: 8 }}>📝 操作提示</p>
              <p style={{ color: '#666', fontSize: 13 }}>点击导出按钮下载完整的 Word 教案文件</p>
            </div>
          </div>
        );
      case 'game':
        return (
          <div style={{ 
            background: 'linear-gradient(135deg, #E9F0F7 0%, #f5f7fa 100%)',
            borderRadius: 16,
            padding: 20,
            textAlign: 'center'
          }}>
            <div style={{ 
              background: '#fff', 
              borderRadius: 12, 
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ color: '#4A637A', marginBottom: 20 }}>🎮 互动游戏</h3>
              
              <div style={{ 
                background: '#6B8EAE', 
                color: '#fff', 
                padding: '12px 16px',
                borderRadius: 12,
                marginBottom: 20
              }}>
                <p style={{ fontSize: 16 }}>游戏已生成完成</p>
              </div>
              
              <p style={{ marginTop: 20, color: '#6B8EAE', fontSize: 13 }}>
                点击导出按钮下载完整的游戏文件
              </p>
            </div>
          </div>
        );
      default:
        return emptyPlaceholder;
    }
  };

  // 选项卡配置
  const tabItems: TabsProps['items'] = [
    {
      key: 'ppt',
      label: 'PPT课件',
      children: (
        <div style={{ overflowY: 'auto', padding: 4 }}>
          {getPreviewContent()}
        </div>
      ),
    },
    {
      key: 'word',
      label: 'Word教案',
      children: (
        <div style={{ overflowY: 'auto', padding: 4 }}>
          {getPreviewContent()}
        </div>
      ),
    },
    {
      key: 'game',
      label: '互动游戏',
      children: (
        <div style={{ overflowY: 'auto', padding: 4 }}>
          {getPreviewContent()}
        </div>
      ),
    },
  ];

 return (
  <div style={{ 
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 20px 20px 20px',
    overflow: 'hidden',
    boxSizing: 'border-box' 
  }}>
      {/* 预览区域 - 白色卡片（包含 Tab 和操作按钮） */}
<div style={{
  minHeight: 0,
  flex: 1,
  background: '#ffffff',
  borderRadius: 18,
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
  border: '1px solid #e8e8e8',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  marginBottom: 18,
}}>
  {/* 顶部栏：Tab 切换 + 操作按钮 */}
  <div style={{ 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px 0 16px'
  }}>
    {/* Tab 胶囊 - 带滑动指示器 */}
<div style={{
  position: 'relative',
  display: 'inline-flex',
  background: '#f0f2f5',
  borderRadius: 40,
  padding: 4
}}>
  {/* 滑动指示器 */}
  <div style={{
    position: 'absolute',
    top: 4,
    left: indicatorStyle.left,
    width: indicatorStyle.width,
    height: 'calc(100% - 8px)',
    background: 'linear-gradient(135deg, #6B8EAE 0%, #7BA3B8 100%)',
    borderRadius: 40,
    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 8px rgba(107, 142, 174, 0.25)'
  }} />
  
  {/* Tab 按钮 */}
  {['ppt', 'word', 'game'].map((key) => {
    const labels: Record<string, string> = {
      ppt: 'PPT课件',
      word: 'Word教案',
      game: '互动游戏'
    };
    const isActive = activeTab === key;
    return (
     <button
  key={key}
  ref={(el) => { tabRefs.current[key] = el; }}
  onClick={() => setActiveTab(key)}
  style={{
    padding: '6px 18px',
    borderRadius: 40,
    border: 'none',
    background: 'transparent',
    color: isActive ? '#fff' : '#4A637A',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    position: 'relative',
    zIndex: 1
  }}
  onMouseEnter={(e) => {
    if (!isActive) {
      e.currentTarget.style.color = '#6B8EAE';
    }
  }}
  onMouseLeave={(e) => {
    if (!isActive) {
      e.currentTarget.style.color = '#4A637A';
    }
  }}
>
  {labels[key]}
</button>
    );
  })}
</div>

    {/* 操作按钮组 */}
    <div style={{ display: 'flex', gap: 8 }}>
      {/* 重新生成 */}
<Tooltip placement="top" color="#E9F0F7" overlayInnerStyle={{ color: '#4A637A' }} title={`重新生成${getTabName()}`}>
  <div
    style={{
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      cursor: (loading || generating) ? 'not-allowed' : 'pointer',
      color: '#6B8EAE',
      transition: 'all 0.2s ease',
      opacity: (loading || generating) ? 0.5 : 1,
      pointerEvents: (loading || generating) ? 'none' : 'auto'
    }}
    onClick={(loading || generating) ? undefined : (e) => {
     handleRegenerate();
   // 强制重置 hover 样式
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.color = '#6B8EAE';
}}
    onMouseEnter={(e) => {
      if (!loading && !generating) {
        e.currentTarget.style.background = '#E9F0F7';
        e.currentTarget.style.color = '#4A637A';
      }
    }}
    onMouseLeave={(e) => {
      if (!loading && !generating) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#6B8EAE';
      }
    }}
  >
    <RedoOutlined style={{ fontSize: 18 }} />
  </div>
</Tooltip>

      {/* 导出 */}
<Tooltip placement="top" color="#E9F0F7" overlayInnerStyle={{ color: '#4A637A' }} title={`导出${getTabName()}`}>
  <div
    style={{
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      cursor: (loading || generating) ? 'not-allowed' : 'pointer',
      color: '#6B8EAE',
      transition: 'all 0.2s ease',
      opacity: (loading || generating) ? 0.5 : 1,
      pointerEvents: (loading || generating) ? 'none' : 'auto'
    }}
    onClick={(loading || generating) ? undefined : handleExport}
    onMouseEnter={(e) => {
      if (!loading && !generating) {
        e.currentTarget.style.background = '#E9F0F7';
        e.currentTarget.style.color = '#4A637A';
      }
    }}
    onMouseLeave={(e) => {
      if (!loading && !generating) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#6B8EAE';
      }
    }}
  >
    <DownloadOutlined style={{ fontSize: 18 }} />
  </div>
</Tooltip>
    </div>
  </div>

  {/* 预览内容区域 */}
  <div style={{
    flex: 1,
    padding: 16,
    display: 'flex',
    minHeight: 0,
    overflow: 'hidden'
  }}>
    {generating ? (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',  // 改为 flex-start
        paddingTop: 120,                // 和空状态一致
        width: '100%'
      }}>
        <p style={{ color: '#6B8EAE', marginBottom: 16, fontSize: 15 }}>
          {generateStatus}
        </p>
        <div style={{
          width: 200,
          height: 4,
          background: '#f0f2f5',
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${generateProgress}%`,
            height: '100%',
            background: '#6B8EAE',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>
    ) : (
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ width: '100%', height: '100%' }}
        tabBarStyle={{ display: 'none' }}
      />
    )}
  </div>
</div>
    
      {/* 修改意见卡片 */}
      <div 
        className="input-card"
        style={{
          background: loading ? '#f5f7fa' : '#ffffff',
          borderRadius: 18,
          border: '1px solid #e8e8e8',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          opacity: (loading || generating) ? 0.7 : 1,
          transition: 'opacity 0.2s ease, background 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          marginBottom: 22,
          justifyContent: 'flex-end'
        }}
      >
        <Input.TextArea
          value={modifyInput}
          onChange={(e) => setModifyInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={(loading || generating) ? "正在应用修改，请稍候..." : `例如：把${getTabName()}的案例换成特斯拉的故事...`}
          rows={2}
          style={{
            border: 'none',
            boxShadow: 'none',
            resize: 'none',
            padding: '12px',
            fontSize: 14,
            background: 'transparent',
            cursor: (loading || generating) ? 'wait' : 'text'
          }}
          autoSize={{ minRows: 2, maxRows: 4 }}
          disabled={loading || generating}
        />
        
        {/* 底部工具栏 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px 12px 12px',
          cursor: (loading || generating) ? 'wait' : 'default'
        }}>
          <span style={{
            color: '#6B8EAE',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: (loading || generating) ? 'wait' : 'default'
          }}>
            修改 {getTabName()}
          </span>
          
          <Tooltip
            placement="top"
            color="#E9F0F7"
            overlayInnerStyle={{ color: '#4A637A' }}
            title={!modifyInput.trim() ? "请输入修改意见" : "应用修改"}
          >
            <span style={{ display: 'inline-block' }}>
              <div style={{
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  background: '#6B8EAE',
  cursor: (modifyInput.trim() && !loading && !generating) ? 'pointer' : ((loading || generating) ? 'wait' : 'not-allowed'),
  opacity: (modifyInput.trim() && !loading && !generating) ? 1 : 0.5,
  transition: 'all 0.2s ease',
  pointerEvents: (modifyInput.trim() && !loading && !generating) ? 'auto' : 'none'
}}
onClick={(modifyInput.trim() && !loading && !generating) ? handleApplyModify : undefined}
onMouseEnter={(e) => {
  if (modifyInput.trim() && !loading && !generating) {
    e.currentTarget.style.background = '#4A637A';
  }
}}
onMouseLeave={(e) => {
  if (modifyInput.trim() && !loading && !generating) {
    e.currentTarget.style.background = '#6B8EAE';
  }
}}
>
                {loading ? (
                  <span style={{ color: '#fff', fontSize: 12 }}>...</span>
                ) : (
                  <CheckOutlined style={{ fontSize: 18, color: '#fff' }} />
                )}
              </div>
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export default PreviewPanel;