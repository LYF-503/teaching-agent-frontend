import { useState } from 'react';
import { Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import ChatPanel from './components/ChatPanel';
import PreviewPanel from './components/PreviewPanel';

function App() {
  // 修改默认状态：左侧展开，右侧关闭
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true);

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
        {/* 顶部：折叠按钮 + 新建对话 */}
        <div style={{ 
          padding: leftSidebarCollapsed ? '16px 8px' : '16px 12px',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: leftSidebarCollapsed ? 'center' : 'space-between',
          background: '#f0f2f5'
        }}>
          {!leftSidebarCollapsed ? (
            <>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                size="small"
                style={{ background: '#95AEC7', border: 'none' }}
              >
                新对话
              </Button>
              <Button
                type="text"
                icon={<MenuFoldOutlined />}
                onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
                size="small"
                style={{ color: '#6B8EAE' }}
              />
            </>
          ) : (
            <>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                size="small"
                style={{ background: '#95AEC7', border: 'none' }}
              />
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
                size="small"
                style={{ color: '#6B8EAE' }}
              />
            </>
          )}
        </div>

        {/* 历史对话列表 */}
        {!leftSidebarCollapsed && (
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            padding: '12px 8px'
          }}>
            <p style={{ 
              color: '#999', 
              fontSize: 12, 
              textAlign: 'center',
              padding: '20px 0'
            }}>
              暂无历史对话
            </p>
          </div>
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
              <span style={{ color: '#6B8EAE', fontWeight: 600, fontSize: 18 }}>课件预览</span>
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setRightPanelCollapsed(true)}
                size="small"
                style={{ color: '#6B8EAE' }}
                title="收起预览面板"
              />
            </div>
            <PreviewPanel />
          </>
        )}
      </div>
    </div>
  );
}

export default App;