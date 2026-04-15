import { useState } from 'react';
import { Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, PlusOutlined, EyeOutlined,BookOutlined } from '@ant-design/icons';
import ChatPanel from './components/ChatPanel';
import PreviewPanel from './components/PreviewPanel';
import { usePreviewStore } from './store/previewStore';

function App() {
  // 修改默认状态：左侧展开，右侧关闭
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const { rightPanelCollapsed, setRightPanelCollapsed } = usePreviewStore();
  const [historyList] = useState([
    { id: '1', title: '欧姆定律教学设计' },
    { id: '2', title: '初中物理复习课' },
    { id: '3', title: '互动游戏设计思路' },
  ]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>('1'); // 默认选中第一个
  
  
  // 计算左侧宽度
  const leftWidth = leftSidebarCollapsed ? 60 : 260;
  // 右侧宽度：收起时 60，展开时 500
  const rightWidth = rightPanelCollapsed ? 60 : 500;

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh',
      width: '100%',
      background: '#f0f2f5',
      position: 'relative'
    }}>
      {/* 左侧历史对话栏 */}
<div style={{ 
  width: leftWidth,
  height: '100%',
  background: '#f0f2f5',
  borderRight: '1px solid #e8e8e8',
  transition: 'width 0.2s ease',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  flexShrink: 0
}}>
  {leftSidebarCollapsed ? (
    // 收起状态
    <>
      {/* 第一行：图标 + 展开按钮 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 8px',
        borderBottom: '1px solid #e8e8e8',
      }}>
        <BookOutlined style={{ fontSize: 16, color: '#6B8EAE' }} />
        <Button
          type="text"
          icon={<MenuUnfoldOutlined />}
          onClick={() => setLeftSidebarCollapsed(false)}
          size="small"
          style={{ color: '#6B8EAE', padding: 0 }}
        />
      </div>
      
      {/* 第二行：新对话按钮 */}
      
    </>
  ) : (
    // 展开状态
    <>
      {/* 第一行：图标 + 产品名 + 收起按钮 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 12px',
        borderBottom: '1px solid #e8e8e8',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOutlined style={{ fontSize: 16, color: '#6B8EAE' }} />
          <span style={{ 
  color: '#6B8EAE', 
  fontWeight: 600, 
  fontSize: 18,
  whiteSpace: 'nowrap',
  overflow: 'hidden'
}}>
  教学智能体
</span>
        </div>
        <Button
          type="text"
          icon={<MenuFoldOutlined />}
          onClick={() => setLeftSidebarCollapsed(true)}
          size="small"
          style={{ color: '#6B8EAE' }}
        />
      </div>
      
      {/* 第二行：开启新对话按钮 */}
      <div style={{ padding: '8px 12px' }}>
        <Button
  type="primary"
  icon={<PlusOutlined />}
  block
  style={{ 
    background: '#6B8EAE',
    border: 'none',
    height: 44,  // 从 36 改成 42
    borderRadius: 18,
    fontWeight: 500,
    fontSize: 15,
    boxShadow: '0 2px 6px rgba(107, 142, 174, 0.2)',
    transition: 'all 0.2s ease'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = '#4A637A';
    e.currentTarget.style.boxShadow = '0 4px 10px rgba(74, 99, 122, 0.3)';
    e.currentTarget.style.transform = 'scale(1.01)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = '#6B8EAE';
    e.currentTarget.style.boxShadow = '0 2px 6px rgba(107, 142, 174, 0.2)';
    e.currentTarget.style.transform = 'scale(1)';
  }}
>
  开启新对话
</Button>

      </div>
      
      {/* 第三行：历史对话列表 */}
      <div style={{ padding: '0 12px', flex: 1, overflowY: 'auto' }}>
  <div style={{ 
    borderTop: '1px solid #e8e8e8',
    paddingTop: 8,
    marginBottom: 8
  }}>
  </div>
  <div>
          {/* 历史记录列表 - 模拟数据 */}
          {historyList.map((item) => {
  const isActive = activeHistoryId === item.id;
  return (
    <div
      key={item.id}
      style={{
        padding: '12px 14px',
        borderRadius: 12,
        cursor: 'pointer',
        marginBottom: 4,
        transition: 'all 0.2s ease',
        color: '#4A637A',
        fontSize: 14,
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        background: isActive ? '#D5E4F0' : 'transparent',
      }}
      onClick={() => setActiveHistoryId(item.id)}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = '#D5E4F0';
          e.currentTarget.style.paddingLeft = '16px';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.paddingLeft = '14px';
        }
      }}
    >
      {item.title}
    </div>
  );
})}
        </div>
      </div>
    </>
  )}
</div>
      {/* 中间聊天面板 */}
      <div style={{ 
        flex: 1,
        height: '100%',
        minWidth: 400,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: '#f0f2f5'
      }}>
        {/* 顶部边框区域，和左右统一 */}
        <div style={{
          height: 57,
          borderBottom: '1px solid #e8e8e8',
          background: '#f0f2f5',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 20,
          position: 'sticky',   // 加这行
          top: 0,               // 加这行
          zIndex: 10            // 加这行
        }}>
          <span style={{ color: '#6B8EAE', fontWeight: 600, fontSize: 18 }}>对话区</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}> <ChatPanel /></div>
        {/* 聊天主体 */}
      </div>

      {/* 右侧预览面板 */}
      <div style={{ 
        width: rightWidth,
        height: '100%',
        background: '#f0f2f5',
        borderLeft: '1px solid #e8e8e8',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {rightPanelCollapsed ? (
          // 收起状态：显示课件预览图标 + 展开按钮
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 8px',
            borderBottom: '1px solid #e8e8e8',
            background: '#f0f2f5'
          }}>
            <Button
              type="text"
              icon={<MenuFoldOutlined />}
              onClick={() => setRightPanelCollapsed(false)}
              size="small"
              style={{ color: '#6B8EAE' }}
              title="展开预览面板"
            />
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              style={{ color: '#6B8EAE' }}
              title="课件预览"
            />
          </div>
        ) : (
          // 展开状态：显示完整预览面板 + 收起按钮
         <>
  <div style={{
    height: 57,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px 0 20px',
    borderBottom: '1px solid #e8e8e8',
    background: '#f0f2f5',
    flexShrink: 0
  }}>
    <span style={{ 
  color: '#6B8EAE', 
  fontWeight: 600, 
  fontSize: 18,
  whiteSpace: 'nowrap',
  overflow: 'hidden'
}}>
  课件预览
</span>
    <Button
      type="text"
      icon={<MenuUnfoldOutlined />}
      onClick={() => setRightPanelCollapsed(true)}
      size="small"
      style={{ color: '#6B8EAE' }}
      title="收起预览面板"
    />
  </div>
  <div style={{ flex: 1, overflow: 'hidden' }}>
    <PreviewPanel />
  </div>
</>
        )}
      </div>
    </div>
  );
}

export default App;