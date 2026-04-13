import { useState, useEffect, useRef } from 'react';
import { Input, Button, Upload, Tag,  Modal, message as antMessage, Space, Popover,Tooltip } from 'antd';
import { UploadOutlined, EditOutlined,FileTextOutlined,SendOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { createSession, sendMessage } from '../../api/dialogue';
import { uploadFile, mockUploadFile } from '../../api/upload';
import { triggerGenerate, getGenerateStatus, mockGenerate, mockGetGenerateStatus } from '../../api/generate';
import { USE_MOCK } from '../../config';
import VoiceInput from '../VoiceInput';
import IntentCard from '../IntentCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UploadFileWithNote extends UploadFile {
  note?: string;
}

const mockReplies = [
  '好的，你想讲什么课？',
  '这节课的重点是什么？',
  '需要我帮你设计什么互动环节吗？',
  '大概需要多长时间？',
  '有没有什么特殊的教学要求？',
  '明白了，我正在整理你的需求...',
];

function ChatPanel() {
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFileWithNote[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generateStatus, setGenerateStatus] = useState<string>('');
  const [editingFileUid, setEditingFileUid] = useState<string>('');
  const [tempNote, setTempNote] = useState<string>('');
  const [uploadTooltipOpen, setUploadTooltipOpen] = useState(false);
  const [voiceTooltipOpen, setVoiceTooltipOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      if (USE_MOCK) {
        setSessionId('mock-session-123');
        setMessages([
          { role: 'assistant', content: '你好！我是教学智能助手。你想讲什么课？' }
        ]);
      } else {
        try {
          const id = await createSession('教师');
          setSessionId(id);
          setMessages([
            { role: 'assistant', content: '你好！我是教学智能助手。你想讲什么课？' }
          ]);
        } catch (error) {
          console.error('创建会话失败:', error);
          setMessages([
            { role: 'assistant', content: '连接服务器失败，请确保后端已启动。' }
          ]);
          antMessage.error('连接服务器失败');
          setSessionId('mock-session-fallback');
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpload = async (file: File, note?: string) => {
    if (!sessionId) {
      antMessage.error('会话未创建');
      return;
    }

    const uploadFileItem: UploadFileWithNote = {
      uid: `${Date.now()}`,
      name: file.name,
      status: 'uploading',
      note: note || '',
    };
    setFileList(prev => [...prev, uploadFileItem]);

    try {
      let result;
      if (USE_MOCK) {
        result = await mockUploadFile(file);
      } else {
        result = await uploadFile(sessionId, file, note);
      }

      setFileList(prev =>
        prev.map(item =>
          item.uid === uploadFileItem.uid
            ? { ...item, status: 'done', response: result }
            : item
        )
      );
      antMessage.success(`${file.name} 上传成功`);
    } catch (error) {
      console.error('上传失败:', error);
      setFileList(prev =>
        prev.map(item =>
          item.uid === uploadFileItem.uid
            ? { ...item, status: 'error' }
            : item
        )
      );
      antMessage.error(`${file.name} 上传失败`);
    }
  };

  const handleRemove = (file: UploadFile) => {
    setFileList(prev => prev.filter(item => item.uid !== file.uid));
    return true;
  };

  const handleUpdateNote = (uid: string, note: string) => {
    setFileList(prev =>
      prev.map(item =>
        item.uid === uid
          ? { ...item, note }
          : item
      )
    );
    antMessage.success('参考说明已更新');
  };

  const customRequest = async ({ file, onSuccess, onError }: any) => {
    try {
      await handleUpload(file);
      onSuccess?.('ok');
    } catch (error) {
      onError?.(error);
    }
  };
  const saveNote = () => {
    if (editingFileUid) {
      handleUpdateNote(editingFileUid, tempNote);
      setEditingFileUid('');
      setTempNote('');
    }
  };

  const handleGenerate = async () => {
    if (!sessionId) {
      antMessage.error('会话未创建');
      return;
    }
    if (messages.length <= 1) {
      antMessage.warning('请先进行一些对话，让智能体了解你的教学需求');
      return;
    }

    setGenerating(true);
    setGenerateProgress(0);
    setGenerateStatus('正在启动生成...');

    try {
      let taskId: string;
      if (USE_MOCK) {
        const result = await mockGenerate(sessionId);
        taskId = result.task_id;
      } else {
        const result = await triggerGenerate(sessionId, { ppt: true, word: true, game: false });
        taskId = result.task_id;
      }

      antMessage.success('生成任务已启动');
      setGenerateStatus('正在生成PPT...');

      const pollInterval = setInterval(async () => {
        try {
          let statusResult;
          if (USE_MOCK) {
            statusResult = await mockGetGenerateStatus(taskId);
          } else {
            statusResult = await getGenerateStatus(taskId);
          }

          setGenerateProgress(statusResult.progress);

          if (statusResult.status === 'processing') {
            setGenerateStatus(`正在生成课件... ${statusResult.progress}%`);
          } else if (statusResult.status === 'completed') {
            clearInterval(pollInterval);
            setGenerateStatus('生成完成！');
            setGenerating(false);
            if (statusResult.preview) {
              antMessage.success('课件生成成功！');
              console.log('预览地址:', statusResult.preview);
            }
            Modal.success({
              title: '课件生成成功',
              content: '课件已生成，请在右侧预览面板查看和下载。',
            });
          } else if (statusResult.status === 'failed') {
            clearInterval(pollInterval);
            setGenerating(false);
            setGenerateStatus('生成失败');
            antMessage.error('课件生成失败，请重试');
          }
        } catch (error) {
          console.error('查询状态失败:', error);
          clearInterval(pollInterval);
          setGenerating(false);
          antMessage.error('查询生成状态失败');
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    } catch (error) {
      console.error('生成失败:', error);
      setGenerating(false);
      antMessage.error('启动生成失败，请重试');
    }
  };

  const handleSend = async () => {
    if (inputValue.trim() === '') return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    if (USE_MOCK) {
      setTimeout(() => {
        const randomReply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
        setMessages(prev => [...prev, { role: 'assistant', content: randomReply }]);
        setLoading(false);
      }, 800);
    } else {
      try {
        const result = await sendMessage(sessionId, inputValue);
        setMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);
      } catch (error) {
        console.error('发送失败:', error);
        setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，发送失败。' }]);
        antMessage.error('发送失败，请重试');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '0 20px 0px 20px',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* 消息列表区域 */}
      <div style={{ 
  flex: 1, 
  overflowY: 'auto',
  borderRadius: 8,
  padding: '8px 16px 16px 16px',  // 底部留出空间给悬浮按钮
  marginBottom: 0,
  background: '#f0f2f5',
  position: 'relative'  // 让悬浮按钮相对于这个容器定位
}}>
        <IntentCard data={{}} />

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '10px 14px',
                  borderRadius: 18,
                  background: isUser ? '#95AEC7' : '#ffffff',
                  color: isUser ? '#fff' : '#1a1a1a',
                  wordBreak: 'break-word',
                  boxShadow: isUser 
                    ? '0 4px 8px rgba(149, 174, 199, 0.25)'
                    : '0 2px 6px rgba(0, 0, 0, 0.06)',
                  fontSize: 16
                }}
              >
                {msg.content}
              </div>
              
            </div>
          );
        })}
        {loading && (
  <div style={{
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: 12,
    paddingLeft: 4,
    animation: 'pulse 1.8s ease-in-out infinite'
  }}>
    <span style={{
      color: '#999',
      fontSize: 20,
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center'
    }}>
      智能体正在思考
      <span className="loading-dots">
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </span>
    </span>
  </div>
)}
        <div ref={messagesEndRef} />
        

        </div>

      {/* 输入区域（整合上传、语音、发送） */}
      <div className="input-card" style={{ 
            background: '#ffffff', 
            borderRadius: 18,
            border: '1px solid #e8e8e8',
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
       }}>
     
        {/* 文件标签 */}
        {/* 文件标签 */}
{fileList.length > 0 && (
  <div style={{ 
    padding: '8px 12px 0 12px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  }}>
    {fileList.map(file => (
      <Popover
        key={file.uid}
        overlayInnerStyle={{ 
          padding: 16, 
          borderRadius: 16,
          background: '#ffffff',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}
        color="#ffffff"
        title={
          <span style={{ fontWeight: 500, color: '#4A637A' }}>
            {file.name.length > 20 ? file.name.slice(0, 20) + '...' : file.name}
          </span>
        }
        content={
          editingFileUid === file.uid ? (
            <div style={{ width: 260 }}>
              <Input.TextArea
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder="输入参考说明，如：参考第3页的实验步骤"
                rows={3}
                style={{ 
                  marginBottom: 12,
                  borderRadius: 12,
                  borderColor: '#e8e8e8',
                  resize: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button 
                  size="small" 
                  type="primary" 
                  onClick={saveNote}
                  style={{ 
                    background: '#6B8EAE', 
                    border: 'none',
                    borderRadius: 8,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4A637A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#6B8EAE';
                  }}
                >
                  保存
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setEditingFileUid('')}
                  style={{ 
                    borderRadius: 8,
                    borderColor: '#e8e8e8',
                    color: '#4A637A',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e8edf2';
                    e.currentTarget.style.borderColor = '#D5E4F0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#e8e8e8';
                  }}
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ width: 240 }}>
              <p style={{ 
                marginBottom: 12, 
                color: '#4A637A',
                wordBreak: 'break-word'
              }}>
                {file.note || '暂无参考说明'}
              </p>
              <Button 
                size="small" 
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingFileUid(file.uid);
                  setTempNote(file.note || '');
                }}
                style={{ 
                  borderRadius: 8,
                  color: '#6B8EAE',
                  borderColor: '#D5E4F0',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#E9F0F7';
                  e.currentTarget.style.borderColor = '#95AEC7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#D5E4F0';
                }}
              >
                编辑说明
              </Button>
            </div>
          )
        }
        trigger="click"
        open={editingFileUid === file.uid}
        onOpenChange={(visible) => {
          if (visible) {
            setEditingFileUid(file.uid);
            setTempNote(file.note || '');
          } else {
            setEditingFileUid('');
          }
        }}
      >
       <Tag
  closable
  onClose={() => handleRemove(file)}
  style={{
    background: '#f0f2f5',
    color: '#4A637A',
    border: '1px solid #D5E4F0',
    borderRadius: 12,
    fontSize: 12,
    padding: '2px 8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'  // 加过渡
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = '#e0e6ec';
    e.currentTarget.style.borderColor = '#95AEC7';
    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = '#f0f2f5';
    e.currentTarget.style.borderColor = '#D5E4F0';
    e.currentTarget.style.boxShadow = 'none';
  }}
>
  {file.name}
  {file.note && ' 📝'}
</Tag>
      </Popover>
    ))}
  </div>
)}

        {/* 输入框 */}
        <Input.TextArea 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的教学思路...（Enter 发送，Shift+Enter 换行）" 
          style={{ 
  border: 'none',
  boxShadow: 'none',
  resize: 'none',
  padding: '12px',
  fontSize: 14,
  background: 'transparent'
}}
          autoSize={{ minRows: 2, maxRows: 4 }}
          disabled={loading}
        />

        {/* 底部工具栏 */}
        {/* 底部工具栏 */}
<div style={{ 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between',
  padding: '8px 12px 12px 12px'
}}>
  <div style={{ display: 'flex', gap: 8 }}>
    {/* 文件上传按钮 */}
    <Tooltip
  open={uploadTooltipOpen}
  onOpenChange={setUploadTooltipOpen}
  placement="top"
  color="#E9F0F7"
  overlayInnerStyle={{ color: '#4A637A' }}
  title={
    <div style={{ textAlign: 'center' }}>
      <div>上传参考资料</div>
      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
        PDF、Word、PPT、图片、视频
      </div>
    </div>
  }
>
  <Upload
    customRequest={customRequest}
    onRemove={handleRemove}
    fileList={fileList}
    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4"
    showUploadList={false}
    multiple
  >
    <div
      onClick={() => setUploadTooltipOpen(false)}
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        cursor: 'pointer',
        color: '#6B8EAE',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#E9F0F7';
        e.currentTarget.style.color = '#4A637A';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#6B8EAE';
      }}
    >
      <UploadOutlined style={{ fontSize: 18 }} />
    </div>
  </Upload>
</Tooltip>
    {/* 语音按钮 - 通过样式覆盖让它和上传按钮一致 */}
    <Tooltip
  open={voiceTooltipOpen}
  onOpenChange={setVoiceTooltipOpen}
  placement="top"
  color="#E9F0F7"
  overlayInnerStyle={{ color: '#4A637A' }}
  title="语音输入"
>
  <div
    onClick={() => setVoiceTooltipOpen(false)}
    style={{
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.4 : 1,
      transition: 'all 0.2s ease',
      color: '#6B8EAE',
      pointerEvents: loading ? 'none' : 'auto'
    }}
    onMouseEnter={(e) => {
      if (!loading) {
        e.currentTarget.style.background = '#E9F0F7';
        e.currentTarget.style.color = '#4A637A';
      }
    }}
    onMouseLeave={(e) => {
      if (!loading) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#6B8EAE';
      }
    }}
  >
    <VoiceInput onTextReceived={(text) => setInputValue(text)} disabled={loading} />
  </div>
</Tooltip>
  </div>

  {/* 发送按钮 */}
  {/* 发送按钮 */}
<Tooltip
  placement="top"
  color="#E9F0F7"
  overlayInnerStyle={{ color: '#4A637A' }}
  title={inputValue.trim() === '' && !loading ? "请输入教学思路" : ""}
>
  <span style={{ display: 'inline-block' }}>
    <div style={{
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      background: loading ? '#A8B8C8' : '#6B8EAE',
      cursor: loading || inputValue.trim() === '' ? 'not-allowed' : 'pointer',
      opacity: inputValue.trim() === '' ? 0.5 : 1,
      transition: 'all 0.2s ease',
      pointerEvents: loading || inputValue.trim() === '' ? 'none' : 'auto'
    }}
    onClick={inputValue.trim() === '' ? undefined : handleSend}
    onMouseEnter={(e) => {
      if (!loading && inputValue.trim() !== '') {
        e.currentTarget.style.background = '#4A637A';
      }
    }}
    onMouseLeave={(e) => {
      if (!loading && inputValue.trim() !== '') {
        e.currentTarget.style.background = '#6B8EAE';
      }
    }}>
      {loading ? (
        <span style={{ color: '#fff', fontSize: 12 }}>...</span>
      ) : (
        <SendOutlined style={{ fontSize: 18, color: '#fff' }} />
      )}
    </div>
  </span>
</Tooltip>
</div>
      </div>
      {/* 悬浮生成按钮 */}
      <Tooltip
  title={messages.length <= 1 ? "先和智能体聊聊你的教学思路，才能生成课件哦~" : ""}
  placement="left"
  color="#E9F0F7"
  overlayInnerStyle={{ color: '#4A637A' }}
>
<div style={{
  position: 'sticky',
  bottom: 180,
  marginLeft: 'auto',
  marginRight: 22,
  width: 'fit-content',
  zIndex: 100,
  display: 'flex',
  justifyContent: 'flex-end'
}}>
  <div style={{
    position: 'relative',
    width: generating ? 150 : 110,
    height: 42,
    borderRadius: 21,
    background: generating ? '#E0E8E4' : '#7A8A7A',
    boxShadow: generating 
      ? '0 4px 12px rgba(0, 0, 0, 0.06)' 
      : '0 4px 12px rgba(122, 138, 122, 0.25)',
    border: generating ? '1px solid #C5D5CF' : 'none',
    overflow: 'hidden',
    cursor: messages.length <= 1 ? 'not-allowed' : 'pointer',
    opacity: messages.length <= 1 ? 0.5 : 1,
    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease, box-shadow 0.4s ease, transform 0.2s, border 0.4s ease',
    pointerEvents: messages.length <= 1 ? 'none' : 'auto'
  }}
  onClick={messages.length > 1 ? handleGenerate : undefined}
  onMouseEnter={(e) => {
    if (messages.length > 1 && !generating) {
      e.currentTarget.style.background = '#5F6F5F';
      e.currentTarget.style.boxShadow = '0 6px 16px rgba(95, 111, 95, 0.35)';
      e.currentTarget.style.transform = 'scale(1.02)';
    }
  }}
  onMouseLeave={(e) => {
    if (messages.length > 1 && !generating) {
      e.currentTarget.style.background = '#7A8A7A';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(122, 138, 122, 0.25)';
      e.currentTarget.style.transform = 'scale(1)';
    }
  }}>
    {/* 进度填充 - 带渐变光效 */}
    {generating && (
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: `${generateProgress}%`,
        background: 'linear-gradient(90deg, #8FAF9A 0%, #A0C0AC 50%, #8FAF9A 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite',
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'inset 0 0 8px rgba(255, 255, 255, 0.2)'
      }} />
    )}
    
    {/* 按钮内容 */}
    <span style={{
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: '100%',
      width: '100%',
      color: generating ? '#4A5F5A' : '#ffffff',
      fontWeight: 500,
      fontSize: 14,
      whiteSpace: 'nowrap',
      transition: 'color 0.4s ease'
    }}>
      <FileTextOutlined style={{ fontSize: 16 }} />
      {generating ? `生成中 ${generateProgress}%` : '生成课件'}
    </span>
  </div>
</div>
</Tooltip>
      
    </div>
  );
}

export default ChatPanel;