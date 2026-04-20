// App.tsx 修改后
import { useState, useEffect } from 'react';
import { Button, Upload, message as antMessage, Tooltip } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, PlusOutlined, EyeOutlined, BookOutlined } from '@ant-design/icons';
import ChatPanel from './components/ChatPanel';
import PreviewPanel from './components/PreviewPanel';
import { usePreviewStore } from './store/previewStore';
import { getAllSessions, createSession } from './api/dialogue'; // 导入真实 API
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { uploadKnowledgeBaseFile } from './api/upload';
import { USE_MOCK } from './config';

interface Session {
  session_id: string;
  content: string;
}

function App() {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const { rightPanelCollapsed, setRightPanelCollapsed } = usePreviewStore();
  const [kbUploading, setKbUploading] = useState(false);
  const [kbFileList, setKbFileList] = useState<UploadFile[]>([]);
  
  // 替换为真实数据状态
  const [historyList, setHistoryList] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 刷新 ChatPanel 的 key
  const [chatKey, setChatKey] = useState(0);

  // 加载所有会话
  const loadSessions = async () => {
    setLoading(true);
    try {
      const sessions = await getAllSessions();
      setHistoryList(sessions);
      
      // 如果有会话且没有选中项，默认选中第一个
      if (sessions.length > 0 && !activeSessionId) {
        setActiveSessionId(sessions[0].session_id);
      }
    } catch (error) {
      console.error('加载会话列表失败:', error);
      antMessage.error('加载会话列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建新会话
const handleNewSession = async () => {
  const newSessionId = await createSession('教师');
  setActiveSessionId(newSessionId);
  setChatKey(prev => prev + 1);
};

  // 切换会话
  const handleSessionChange = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setChatKey(prev => prev + 1); // 刷新聊天面板加载新会话的历史
  };

  const handleKnowledgeBaseUpload = async (file: File) => {
  if (USE_MOCK) {
    antMessage.info('模拟模式：知识库文件上传成功');
    return Promise.resolve();
  }
  setKbUploading(true);
  try {
    const result = await uploadKnowledgeBaseFile(file);
    antMessage.success(`“${file.name}” 已上传至知识库，后台解析中`);
    console.log('知识库上传结果:', result);
  } catch (error) {
    console.error('知识库上传失败:', error);
    antMessage.error(`“${file.name}” 上传失败`);
  } finally {
    setKbUploading(false);
  }
  return Promise.resolve();
};

const customKbRequest: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
  try {
    await handleKnowledgeBaseUpload(file as File);
    onSuccess?.('ok');
  } catch (error) {
    console.error('加载历史失败:', error); // 注意：此处错误信息写成了“加载历史失败”，应为“上传失败”
  }
};

  useEffect(() => {
    loadSessions();
  }, []);

  // 计算宽度
  const leftWidth = leftSidebarCollapsed ? 60 : 260;
  const rightWidth = rightPanelCollapsed ? 60 : 700;

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
          </>
        ) : (
          // 展开状态
          <>
            {/* 头部 */}
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
            
            {/* 新对话按钮 */}
            <div style={{ padding: '8px 12px' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                block
                onClick={handleNewSession}
                style={{ 
                  background: '#6B8EAE',
                  border: 'none',
                  height: 44,
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
            
            {/* 历史对话列表 */}
            <div style={{ padding: '0 12px', flex: 1, overflowY: 'auto' }}>
              <div style={{ 
                borderTop: '1px solid #e8e8e8',
                paddingTop: 8,
                marginBottom: 8
              }} />
              <div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                    加载中...
                  </div>
                ) : historyList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                    暂无对话记录
                  </div>
                ) : (
                  historyList.map((session) => {
                    const isActive = activeSessionId === session.session_id;
                    return (
                      <div
                        key={session.session_id}
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
                        onClick={() => handleSessionChange(session.session_id)}
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
                        {session.content || '新对话'}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

              <Tooltip
    placement="top"
    title="上传文档（PDF/Word/PPT）至本地知识库，用于增强智能体回答质量"
    color="#E9F0F7"
    overlayInnerStyle={{ color: '#4A637A' }}
  >
    <Upload
      customRequest={customKbRequest}
      fileList={kbFileList}
      onChange={({ fileList }) => setKbFileList(fileList)}
      accept=".pdf,.doc,.docx,.ppt,.pptx"
      multiple={false}
      showUploadList={false}
      disabled={kbUploading}
    >
      <Button
        icon={<UploadOutlined />}
        loading={kbUploading}
        style={{ marginLeft:12,width: '157%', background: '#E9F0F7', borderColor: '#D5E4F0', color: '#4A637A', borderRadius: 12, height: 40, fontWeight: 500, transition: 'all 0.2s ease' }}
        onMouseEnter={(e) => { if (!kbUploading) { e.currentTarget.style.background = '#D5E4F0'; e.currentTarget.style.borderColor = '#95AEC7'; } }}
        onMouseLeave={(e) => { if (!kbUploading) { e.currentTarget.style.background = '#E9F0F7'; e.currentTarget.style.borderColor = '#D5E4F0'; } }}
      >
        上传至知识库
      </Button>
    </Upload>
  </Tooltip>
  <div style={{ fontSize: 12, color: '#95AEC7', marginTop: 8, textAlign: 'center' }}>
    支持 PDF、Word、PPT
  </div>
          </>
        )}
        <div style={{
  borderTop: '1px solid #e8e8e8',
  padding: '12px',
  background: '#f5f7fa',
}}>
</div>
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
        <div style={{
          height: 57,
          borderBottom: '1px solid #e8e8e8',
          background: '#f0f2f5',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 20,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <span style={{ color: '#6B8EAE', fontWeight: 600, fontSize: 18 }}>对话区</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {/* 传递 sessionId 和 key 给 ChatPanel */}
          <ChatPanel key={chatKey} externalSessionId={activeSessionId} />
        </div>
      </div>

      {/* 右侧预览面板 - 保持不变 */}
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
          </div>
        ) : (
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