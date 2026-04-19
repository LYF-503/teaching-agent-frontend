import { useState, useEffect, useRef } from 'react';
import { Input, Button, Upload, Tag, Modal, message as antMessage, Popover, Tooltip, Select } from 'antd';
import { UploadOutlined, EditOutlined, FileTextOutlined, SendOutlined, PlayCircleOutlined, FileWordOutlined, FilePptOutlined, ApiOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { createSession, sendMessage, getHistory, getAllSessions,sendMessageNormal } from '../../api/dialogue';
import { uploadFile, mockUploadFile } from '../../api/upload';
import { generateLessonPlan, generatePPT, generateGame } from '../../api/generate';
import { usePreviewStore } from '../../store/previewStore';
import { USE_MOCK } from '../../config';
import VoiceInput from '../VoiceInput';
import IntentCard from '../IntentCard';
import MarkdownRenderer from '../MarkdownRenderer';

type GenerateType = 'lesson-plan' | 'ppt' | 'game';
type GameType = 'quiz' | 'memory' | 'matching';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UploadFileWithNote extends UploadFile {
  note?: string;
}

interface ChatPanelProps {
  externalSessionId?: string | null;
}

const mockReplies = [
  '好的，你想讲什么课？',
  '这节课的重点是什么？',
  '需要我帮你设计什么互动环节吗？',
  '大概需要多长时间？',
  '有没有什么特殊的教学要求？',
  '明白了，我正在整理你的需求...',
];

function ChatPanel({ externalSessionId }: ChatPanelProps) {
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFileWithNote[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateType, setGenerateType] = useState<GenerateType>('ppt');
  const [gameType, setGameType] = useState<GameType>('quiz');
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generatingType, setGeneratingType] = useState<GenerateType | null>(null);
  const [editingFileUid, setEditingFileUid] = useState<string>('');
  const [tempNote, setTempNote] = useState<string>('');
  const [uploadTooltipOpen, setUploadTooltipOpen] = useState(false);
  const [voiceTooltipOpen, setVoiceTooltipOpen] = useState(false);
  const { setGenerating: setGlobalGenerating, setProgress, setPreview, setRightPanelCollapsed } = usePreviewStore();
  const initializedRef = useRef(false);
  const [intentStatus, setIntentStatus] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!externalSessionId) return;

    const loadHistory = async () => {
      try {
        const history = await getHistory(externalSessionId);
        if (history && history.length > 0) {
          setMessages(history.map((msg: any) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })));
        } else if (!initializedRef.current) {
          setMessages([
            { role: 'assistant', content: '你好！我是教学智能助手。你想讲什么课？' }
          ]);
        }
        initializedRef.current = true;
      } catch (error) {
        console.error('加载历史失败:', error);
      }
    };

    loadHistory();
  }, [externalSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpload = async (file: File, note?: string) => {
    const currentSessionId = externalSessionId || sessionId;
    if (!currentSessionId) {
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
        result = await uploadFile(currentSessionId, file, note);
      }

      console.log('上传成功返回:', result);

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
      antMessage.error(`${file.name} 上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
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

  const handleGenerateClick = () => {
    if (!externalSessionId) {
      antMessage.error('会话未创建');
      return;
    }
    if (messages.length <= 1) {
      antMessage.warning('请先进行一些对话，让智能体了解你的教学需求');
      return;
    }
    setGenerateModalOpen(true);
  };

  const handleConfirmGenerate = async () => {
    const currentSessionId = externalSessionId || sessionId;
    if (!currentSessionId) {
      antMessage.error('会话未创建');
      return;
    }

    setGenerateModalOpen(false);
    setGenerating(true);
    setGeneratingType(generateType);
    setRightPanelCollapsed(false);
    setGlobalGenerating(true);
    setProgress(0, '正在生成...');

    try {
      const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
      const topic = lastUserMessage?.content || '教学课件';

      const conversationHistory = messages
        .map(msg => `${msg.role === 'user' ? '用户' : '智能体'}: ${msg.content}`)
        .join('\n');

      const requirements = `对话历史：\n${conversationHistory}`;

      let result;
      if (generateType === 'lesson-plan') {
        result = await generateLessonPlan(topic, requirements, `${topic}_教案.docx`);
      } else if (generateType === 'ppt') {
        result = await generatePPT(topic, requirements, `${topic}.pptx`);
      } else if (generateType === 'game') {
        result = await generateGame(topic, gameType, requirements, `${topic}_game.html`);
      }

      if (result?.success && result.data) {
        antMessage.success(result.message || '生成成功！');

        if (generateType === 'ppt') {
          setPreview(result.data.access_url, null, null);
        } else if (generateType === 'lesson-plan') {
          setPreview(null, result.data.access_url, null);
        } else if (generateType === 'game') {
          setPreview(null, null, result.data.access_url);
        }

        Modal.success({
          title: '生成成功',
          content: result.message || '内容已生成，请在右侧预览面板查看和下载。',
        });
      } else {
        antMessage.error(result?.message || '生成失败，请重试');
      }
    } catch (error) {
      console.error('生成失败:', error);
      antMessage.error('生成失败，请重试');
    } finally {
      setGenerating(false);
      setGeneratingType(null);
      setGlobalGenerating(false);
    }
  };

  const assistantMessageIndexRef = useRef<number>(-1);

  const handleSend = async () => {
    if (!externalSessionId) return;

     
    const userMessage: Message = {
      role: 'user',
      content: inputValue
    };

    setInputValue('');
    setLoading(true);
    const userInput = inputValue; 

    if (USE_MOCK) {
      setMessages(prev => [...prev, userMessage]);
      setTimeout(() => {
        const randomReply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
        setMessages(prev => [...prev, { role: 'assistant', content: randomReply }]);
        setLoading(false);
      }, 800);
    } else {
      try {
        setMessages(prev => [...prev, userMessage]);

        setMessages(prev => {
          const newMessages = [...prev, { role: 'assistant' as const, content: '' }];
          assistantMessageIndexRef.current = newMessages.length - 1;
          return newMessages;
        });

        await sendMessage(externalSessionId, inputValue, (content) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const index = assistantMessageIndexRef.current;
            if (index !== -1 && newMessages[index] && newMessages[index].role === 'assistant') {
              newMessages[index] = {
                role: 'assistant',
                content: content
              };
            }
            return newMessages;
          });
        });

        assistantMessageIndexRef.current = -1;

        setLoading(false);

         // 4. 流式完成后，静默获取意图状态（不影响现有消息）
      //    注意：sendMessageNormal 会返回 reply 和 intent_status，但我们只取 intent_status
      const normalResponse = await sendMessageNormal(externalSessionId, userInput);
      if (normalResponse?.intent_status) {
        setIntentStatus(normalResponse.intent_status);  
        console.log(normalResponse.intent_status)
      }
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

  const getGenerateTypeIcon = (type: GenerateType) => {
    switch (type) {
      case 'lesson-plan':
        return <FileWordOutlined />;
      case 'ppt':
        return <FilePptOutlined />;
      case 'game':
        return <ApiOutlined />;
    }
  };

  const getGenerateTypeLabel = (type: GenerateType) => {
    switch (type) {
      case 'lesson-plan':
        return '教案';
      case 'ppt':
        return 'PPT';
      case 'game':
        return '互动游戏';
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

      {/* 固定顶部区域 */}
      <div style={{ flexShrink: 0, padding: '8px 16px 0 16px' }}>
        <IntentCard data={intentStatus} />
      </div>

      {/* 可滚动的消息列表 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        borderRadius: 8,
        padding: '8px 16px 16px 16px',
        marginBottom: 0,
        background: '#f0f2f5',
        position: 'relative'
      }}>

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
                  fontSize: 16,
                  overflow: 'hidden',
                }}
              >
                {isUser ? (
                  msg.content
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}
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

      <div className="input-card" style={{
        background: '#ffffff',
        borderRadius: 18,
        border: '1px solid #e8e8e8',
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        opacity: (loading || generating) ? 0.6 : 1,
        transition: 'opacity 0.2s ease'
      }}>

        {fileList.length > 0 && (
          <div style={{
            padding: '8px 12px 0 12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            cursor: (loading || generating) ? 'wait' : 'default'
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
                    transition: 'all 0.2s ease'
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

        <Input.TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={(loading || generating) ? "智能体正在思考，请稍候..." : "输入你的教学思路...（Enter 发送，Shift+Enter 换行）"}
          style={{
            border: 'none',
            boxShadow: 'none',
            resize: 'none',
            padding: '12px',
            fontSize: 14,
            background: 'transparent',
            cursor: (loading || generating) ? 'wait' : 'text',
            opacity: (loading || generating) ? 0.8 : 1,
            transition: 'all 0.2s ease'
          }}
          autoSize={{ minRows: 2, maxRows: 4 }}
          disabled={loading || generating}
        />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px 12px 12px',
          cursor: (loading || generating) ? 'wait' : 'default'
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
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
              <div style={{ pointerEvents: (loading || generating) ? 'none' : 'auto' }}>
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
                      cursor: (loading || generating) ? 'wait' : 'pointer',
                      color: '#6B8EAE',
                      transition: 'all 0.2s ease'
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
                    <UploadOutlined style={{ fontSize: 18 }} />
                  </div>
                </Upload>
              </div>
            </Tooltip>

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
                  cursor: (loading || generating) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#6B8EAE',
                  pointerEvents: (loading || generating) ? 'none' : 'auto'
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
                <VoiceInput 
                 onTextReceived={(text) => setInputValue(text)} 
                 disabled={loading || generating}
                 sessionId={externalSessionId || sessionId}   // 传递当前有效会话ID
                />
              </div>
            </Tooltip>
          </div>

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
                background: '#6B8EAE',
                cursor: (loading || generating || inputValue.trim() === '') ? 'not-allowed' : 'pointer',
                opacity: inputValue.trim() === '' ? 0.5 : 1,
                transition: 'all 0.2s ease',
                pointerEvents: (loading || generating || inputValue.trim() === '') ? 'none' : 'auto'
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
          onClick={messages.length > 1 ? handleGenerateClick : undefined}
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
              {generating ? `生成中...` : '生成内容'}
            </span>
          </div>
        </div>
      </Tooltip>

      <Modal
        title="选择要生成的内容"
        open={generateModalOpen}
        onCancel={() => setGenerateModalOpen(false)}
        footer={null}
        centered
        width={400}
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 16, color: '#666', fontSize: 14 }}>
            请选择要生成的教学内容类型：
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              onClick={() => setGenerateType('ppt')}
              style={{
                padding: '16px',
                borderRadius: 12,
                border: `2px solid ${generateType === 'ppt' ? '#6B8EAE' : '#e8e8e8'}`,
                background: generateType === 'ppt' ? '#E9F0F7' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <FilePptOutlined style={{ fontSize: 24, color: generateType === 'ppt' ? '#6B8EAE' : '#999' }} />
              <div>
                <div style={{ fontWeight: 500, color: '#333' }}>PPT 演示文稿</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>生成适合课堂展示的 PPT 文件</div>
              </div>
            </div>

            <div
              onClick={() => setGenerateType('lesson-plan')}
              style={{
                padding: '16px',
                borderRadius: 12,
                border: `2px solid ${generateType === 'lesson-plan' ? '#6B8EAE' : '#e8e8e8'}`,
                background: generateType === 'lesson-plan' ? '#E9F0F7' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <FileWordOutlined style={{ fontSize: 24, color: generateType === 'lesson-plan' ? '#6B8EAE' : '#999' }} />
              <div>
                <div style={{ fontWeight: 500, color: '#333' }}>教案文档</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>生成完整的教学教案文档</div>
              </div>
            </div>

            <div
              onClick={() => setGenerateType('game')}
              style={{
                padding: '16px',
                borderRadius: 12,
                border: `2px solid ${generateType === 'game' ? '#6B8EAE' : '#e8e8e8'}`,
                background: generateType === 'game' ? '#E9F0F7' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <ApiOutlined style={{ fontSize: 24, color: generateType === 'game' ? '#6B8EAE' : '#999' }} />
              <div>
                <div style={{ fontWeight: 500, color: '#333' }}>互动游戏</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>生成趣味教学互动游戏</div>
              </div>
            </div>
          </div>

          {generateType === 'game' && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#666', fontSize: 14 }}>
                游戏类型：
              </label>
              <Select
                value={gameType}
                onChange={setGameType}
                style={{ width: '100%' }}
                options={[
                  { value: 'quiz', label: '问答游戏' },
                  { value: 'memory', label: '记忆游戏' },
                  { value: 'matching', label: '匹配游戏' },
                ]}
              />
            </div>
          )}

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={() => setGenerateModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleConfirmGenerate} style={{ background: '#6B8EAE', border: 'none' }}>
              开始生成
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ChatPanel;
