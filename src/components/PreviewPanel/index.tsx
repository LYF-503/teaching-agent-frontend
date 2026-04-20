import { useState, useRef, useEffect } from 'react';
import { Tabs, Input, Tooltip } from 'antd';
// Button,
import { RedoOutlined, DownloadOutlined, CheckOutlined, FileTextOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { usePreviewStore } from '../../store/previewStore';
import { generateLessonPlan, generatePPT, generateGame } from '../../api/generate';
import * as docx from 'docx-preview';
import { parsePptxToJson } from 'ppt2json';
import { PPTXPreviewer, type Slide } from 'pptx-previewer';

// 添加全局样式
const PreviewPanelStyle = () => (
  <style>
    {
`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .docx-preview-content {
        max-width: 100% !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 20px !important;
      }
      
      .docx-preview-content table {
        width: 100% !important;
        max-width: 100% !important;
      }
      
      .docx-preview-content img {
        max-width: 100% !important;
        height: auto !important;
      }
      
      .docx-preview-content p {
        word-wrap: break-word !important;
      }
      
      /* 自定义滚动条样式 */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
`
    }
  </style>
);

function PreviewPanel() {
  const [activeTab, setActiveTab] = useState<string>('ppt');
  const [loading, setLoading] = useState(false);
  const { hasContent, pptUrl, wordUrl, gameUrl, generating, generateProgress, generateStatus, modifyInput, setModifyInput } = usePreviewStore();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({ ppt: null, word: null, game: null });
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  
  // 预览容器引用（用于Word文档）
  const wordPreviewRef = useRef<HTMLDivElement>(null);
  
  // PPT预览状态
  const [pptSlides, setPptSlides] = useState<Slide[]>([]);
  const [pptLoading, setPptLoading] = useState(false);
  const [pptError, setPptError] = useState<string | null>(null);

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

  // 预览渲染逻辑
  useEffect(() => {
    console.log('Word预览useEffect触发:', {
      activeTab,
      wordUrl,
      hasWordUrl: !!wordUrl,
      hasRef: !!wordPreviewRef.current
    });
    
    // 渲染Word
    if (activeTab === 'word' && wordUrl && wordPreviewRef.current) {
      const container = wordPreviewRef.current;
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">正在加载Word文档...</div>';
      
      // 构建完整的预览 URL（与getPreviewContent中的逻辑一致）
      let previewUrl = wordUrl;
      if (!previewUrl.startsWith('http')) {
        previewUrl = previewUrl.replace(/\.\//g, '');
        previewUrl = previewUrl.replace(/\/static\/static/g, '/static');
        
        if (!previewUrl.startsWith('/static')) {
          if (previewUrl.includes('exports')) {
            const exportsIndex = previewUrl.indexOf('exports');
            if (exportsIndex !== -1) {
              previewUrl = '/static/' + previewUrl.substring(exportsIndex);
            } else {
              previewUrl = `/static/exports/${previewUrl}`;
            }
          } else {
            previewUrl = `/static/exports/${previewUrl}`;
          }
        }
        
        previewUrl = `http://localhost:8000${previewUrl}`;
      }
      
      console.log('开始加载Word文档:', previewUrl);
      
      fetch(previewUrl)
        .then(response => {
          console.log('fetch响应状态:', response.status);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then(buffer => {
          console.log('成功获取buffer, 大小:', buffer.byteLength);
          try {
            // 使用更兼容的方式调用docx.renderAsync
            docx.renderAsync(buffer, container as HTMLElement).then(() => {
              console.log('Word文档渲染完成');
              // 应用样式调整
              setTimeout(() => {
                const docContent = container.firstChild as HTMLElement;
                if (docContent) {
                  // 应用基础样式
                  docContent.style.maxWidth = '100%';
                  docContent.style.width = '100%';
                  docContent.style.boxSizing = 'border-box';
                  docContent.style.padding = '0';
                  docContent.style.margin = '0';
                  docContent.style.display = 'block';
                  docContent.style.textAlign = 'left';
                  docContent.style.position = 'relative';
                  docContent.style.left = '0';
                  docContent.style.transform = 'none';
                  
                  // 处理子元素样式
                  const childElements = docContent.querySelectorAll('*');
                  childElements.forEach((element) => {
                    const el = element as HTMLElement;
                    el.style.maxWidth = '100%';
                    el.style.boxSizing = 'border-box';
                    el.style.position = 'relative';
                    el.style.left = '0';
                    el.style.transform = 'none';
                  });
                } else {
                  console.log('Word渲染成功，但未找到渲染内容');
                }
              }, 100);
            }).catch((err: any) => {
              console.error('Word渲染失败:', err);
              container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Word预览加载中...</div>';
            });
          } catch (error) {
            console.error('Word预览失败:', error);
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Word预览失败，请下载查看</div>';
          }
        })
        .catch(error => {
          console.error('Word文件加载失败:', error);
          container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Word文件加载失败，请检查网络连接</div>';
        });
    }
  }, [activeTab, wordUrl]);

  // PPT预览渲染逻辑
  useEffect(() => {
    console.log('PPT预览useEffect触发:', {
      activeTab,
      pptUrl,
      hasPptUrl: !!pptUrl
    });

    if (activeTab === 'ppt' && pptUrl) {
      setPptLoading(true);
      setPptError(null);
      setPptSlides([]);

      // 构建完整的预览 URL
      let previewUrl = pptUrl;
      if (!previewUrl.startsWith('http')) {
        previewUrl = previewUrl.replace(/\.\//g, '');
        previewUrl = previewUrl.replace(/\/static\/static/g, '/static');
        
        if (!previewUrl.startsWith('/static')) {
          if (previewUrl.includes('exports')) {
            const exportsIndex = previewUrl.indexOf('exports');
            if (exportsIndex !== -1) {
              previewUrl = '/static/' + previewUrl.substring(exportsIndex);
            } else {
              previewUrl = `/static/exports/${previewUrl}`;
            }
          } else {
            previewUrl = `/static/exports/${previewUrl}`;
          }
        }
        
        previewUrl = `http://localhost:8000${previewUrl}`;
      }

      console.log('开始加载PPT文件:', previewUrl);

      // 下载PPT文件
      fetch(previewUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then(async (arrayBuffer) => {
          console.log('成功获取PPT buffer, 大小:', arrayBuffer.byteLength);
          
          // 创建File对象
          const file = new File([arrayBuffer], 'presentation.pptx', {
            type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          });

          try {
            // 使用ppt2json解析PPT文件
            const result = await parsePptxToJson(file) as any;
            console.log('PPT解析成功:', result);
            console.log('警告信息:', result.warnings);
            console.log('presentation属性:', result.presentation);
            
            // 检查解析结果的详细结构
            if (result.presentation) {
              console.log('presentation.slides:', result.presentation.slides);
              console.log('presentation内容:', Object.keys(result.presentation));
            }

            // 转换为pptx-previewer需要的格式
            let slides: Slide[] = [];
            
            // 检查不同可能的slides路径
            if (result && result.slides) {
              // 直接在result中找到slides
              slides = result.slides.map((slide: any) => ({
                background: slide.background || { type: 'solid', color: '#ffffff' },
                elements: slide.elements || []
              }));
            } else if (result && result.presentationJSON && result.presentationJSON.slides) {
              // 在presentationJSON中找到slides
              slides = result.presentationJSON.slides.map((slide: any) => ({
                background: slide.background || { type: 'solid', color: '#ffffff' },
                elements: slide.elements || []
              }));
            } else if (result && result.presentation && result.presentation.slides) {
              // 在presentation中找到slides
              slides = result.presentation.slides.map((slide: any) => ({
                background: slide.background || { type: 'solid', color: '#ffffff' },
                elements: slide.elements || []
              }));
            } else if (result && result.presentation) {
              // 检查presentation中的其他可能的slides路径
              console.log('检查presentation中的其他属性:', Object.keys(result.presentation));
              // 尝试创建一个默认的slide
              slides = [{
                background: { type: 'solid', color: '#ffffff' },
                elements: []
              }];
            }

            if (slides.length > 0) {
              setPptSlides(slides);
            } else {
              throw new Error('解析结果中没有找到slides数据');
            }
          } catch (error) {
            console.error('PPT解析失败:', error);
            setPptError('PPT解析失败，请下载查看');
          }
        })
        .catch(error => {
          console.error('PPT文件加载失败:', error);
          setPptError('PPT文件加载失败，请检查网络连接');
        })
        .finally(() => {
          setPptLoading(false);
        });
    }
  }, [activeTab, pptUrl]);


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
  const handleRegenerate = async () => {
    const store = usePreviewStore.getState();
    const { lastTopic, lastGenerateType, lastGameType, modifyInput } = store;
    
    if (!lastGenerateType || !lastTopic) {
      console.warn('没有上次生成的参数');
      return;
    }
    
    setLoading(true);
    store.setGenerating(true);
    store.setProgress(0, '正在重新生成...');
    
    console.log('=== 重新生成参数 ===');
    console.log('lastTopic:', lastTopic);
    console.log('lastGenerateType:', lastGenerateType);
    console.log('lastGameType:', lastGameType);
    console.log('modifyInput:', modifyInput);
    
    try {
      const store = usePreviewStore.getState();
      const { lastRequirements } = store;
      const baseRequirements = lastRequirements || '';
      const modifyRequirements = modifyInput.trim();
      const finalRequirements = baseRequirements + (modifyRequirements ? `\n\n修改意见：${modifyRequirements}` : '');
      const timestamp = Date.now();
      const timeStr = timestamp.toString();
      
      let result;
      if (lastGenerateType === 'lesson-plan') {
        result = await generateLessonPlan(lastTopic, finalRequirements, `${lastTopic}_${timeStr}_教案.docx`);
      } else if (lastGenerateType === 'ppt') {
        result = await generatePPT(lastTopic, finalRequirements, `${lastTopic}_${timeStr}.pptx`);
      } else if (lastGenerateType === 'game' && lastGameType) {
        result = await generateGame(lastTopic, lastGameType, finalRequirements, `${lastTopic}_${timeStr}_game.html`);
      }
      
      console.log('生成结果:', result);
      
      if (result?.success && result.data) {
        if (lastGenerateType === 'ppt') {
          store.setPreview(result.data.access_url, null, null);
        } else if (lastGenerateType === 'lesson-plan') {
          store.setPreview(null, result.data.access_url, null);
        } else if (lastGenerateType === 'game') {
          store.setPreview(null, null, result.data.access_url);
        }
      }
    } catch (error) {
      console.error('重新生成失败:', error);
    } finally {
      setLoading(false);
      store.setGenerating(false);
    }
  };

  // 处理应用修改
  const handleApplyModify = async () => {
    if (!modifyInput.trim()) return;
    
    const store = usePreviewStore.getState();
    const { lastTopic, lastGenerateType, lastGameType } = store;
    
    if (!lastGenerateType || !lastTopic) {
      console.warn('没有上次生成的参数');
      return;
    }
    
    setLoading(true);
    store.setGenerating(true);
    store.setProgress(0, '正在应用修改...');
    
    console.log('=== 应用修改参数 ===');
    console.log('lastTopic:', lastTopic);
    console.log('lastGenerateType:', lastGenerateType);
    console.log('lastGameType:', lastGameType);
    console.log('modifyInput:', modifyInput);
    
    try {
      const store = usePreviewStore.getState();
      const { lastRequirements } = store;
      const baseRequirements = lastRequirements || '';
      const modifyRequirements = modifyInput.trim();
      const finalRequirements = baseRequirements + (modifyRequirements ? `\n\n修改意见：${modifyRequirements}` : '');
      const timestamp = Date.now();
      const timeStr = timestamp.toString();
      
      let result;
      if (lastGenerateType === 'lesson-plan') {
        result = await generateLessonPlan(lastTopic, finalRequirements, `${lastTopic}_${timeStr}_教案.docx`);
      } else if (lastGenerateType === 'ppt') {
        result = await generatePPT(lastTopic, finalRequirements, `${lastTopic}_${timeStr}.pptx`);
      } else if (lastGenerateType === 'game' && lastGameType) {
        result = await generateGame(lastTopic, lastGameType, finalRequirements, `${lastTopic}_${timeStr}_game.html`);
      }
      
      console.log('生成结果:', result);
      
      if (result?.success && result.data) {
        if (lastGenerateType === 'ppt') {
          store.setPreview(result.data.access_url, null, null);
        } else if (lastGenerateType === 'lesson-plan') {
          store.setPreview(null, result.data.access_url, null);
        } else if (lastGenerateType === 'game') {
          store.setPreview(null, null, result.data.access_url);
        }
      }
    } catch (error) {
      console.error('应用修改失败:', error);
    } finally {
      setLoading(false);
      store.setGenerating(false);
    }
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
      // 构建完整的下载 URL - 使用与预览相同的逻辑
      let downloadUrl = currentUrl;
      console.log('原始导出 URL:', downloadUrl);
      
      // 处理不同格式的 URL
      if (!downloadUrl.startsWith('http')) {
        // 清理 URL 中的多余部分
        downloadUrl = downloadUrl.replace(/\.\//g, '');
        downloadUrl = downloadUrl.replace(/\/static\/static/g, '/static');
        
        // 确保以 /static 开头
        if (!downloadUrl.startsWith('/static')) {
          // 检查是否包含 exports 目录
          if (downloadUrl.includes('exports')) {
            // 如果包含 exports，提取 exports 及其后面的部分
            const exportsIndex = downloadUrl.indexOf('exports');
            if (exportsIndex !== -1) {
              downloadUrl = '/static/' + downloadUrl.substring(exportsIndex);
            } else {
              // 否则使用默认路径
              downloadUrl = `/static/exports/${downloadUrl}`;
            }
          } else {
            // 直接使用 /static/exports/ 路径
            downloadUrl = `/static/exports/${downloadUrl}`;
          }
        }
        
        // 构建完整的 URL
        downloadUrl = `http://localhost:8000${downloadUrl}`;
      }
      
      console.log('处理后的导出 URL:', downloadUrl);
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

  // 根据是否有内容显示预览或空状态
  const getPreviewContent = () => {
    if (!hasContent) return emptyPlaceholder;

    // 使用原始文件 URL 进行预览（DocViewer 直接支持 PPT 和 Word）
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

    // 构建完整的预览 URL
    let previewUrl = currentUrl;
    console.log('原始 URL:', previewUrl);
    
    // 处理不同格式的 URL
    if (!previewUrl.startsWith('http')) {
      // 清理 URL 中的多余部分
      previewUrl = previewUrl.replace(/\.\//g, '');
      previewUrl = previewUrl.replace(/\/static\/static/g, '/static');
      
      // 确保以 /static 开头
      if (!previewUrl.startsWith('/static')) {
        // 检查是否包含 exports 目录
        if (previewUrl.includes('exports')) {
          // 如果包含 exports，提取 exports 及其后面的部分
          const exportsIndex = previewUrl.indexOf('exports');
          if (exportsIndex !== -1) {
            previewUrl = '/static/' + previewUrl.substring(exportsIndex);
          } else {
            // 否则使用默认路径
            previewUrl = `/static/exports/${previewUrl}`;
          }
        } else {
          // 直接使用 /static/exports/ 路径
          previewUrl = `/static/exports/${previewUrl}`;
        }
      }
      
      // 使用完整的 URL，指向后端服务器
      // 假设后端服务器运行在 http://localhost:8000
      previewUrl = `http://localhost:8000${previewUrl}`;
      console.log('预览 URL:', previewUrl);
    }
    
    console.log('处理后的预览 URL:', previewUrl);

    // 根据类型显示不同的预览内容

    switch (activeTab) {
     case 'ppt':
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{
        flex: 1,
        background: '#f5f7fa',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #6B8EAE 0%, #95AEC7 100%)',
          padding: '12px 16px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 500 }}>PPT 预览</span>
          <span style={{ fontSize: 12, opacity: 0.9 }}>
            {pptLoading ? '加载中...' : pptSlides.length > 0 ? `共 ${pptSlides.length} 页` : 'PPT 文件'}
          </span>
        </div>
        <div style={{
          flex: 1,
          padding: '20px',
          background: '#fff',
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: '400px',
          minHeight: '300px',
          position: 'relative'
        }}>
          {pptLoading ? (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#999',
              maxWidth: '100%',
              width: '100%',
              margin: '0 auto'
            }}>正在加载PPT文档...</div>
          ) : pptError ? (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#f5222d',
              maxWidth: '100%',
              width: '100%',
              margin: '0 auto'
            }}>
              <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <p>{pptError}</p>
            </div>
          ) : pptSlides.length > 0 ? (
            <div style={{ padding: '0 20px 20px 20px', minWidth: 1200 }}>
              {pptSlides.map((slide, index) => (
                <div key={index} style={{
                  width: 1200,
                  height: 675,
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: 8,
                  overflow: 'auto',
                  marginBottom: 20
                }}>
                  <PPTXPreviewer slide={slide} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#999',
              maxWidth: '100%',
              width: '100%',
              margin: '0 auto'
            }}>
              <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <p>暂无PPT内容</p>
            </div>
          )}
        </div>
      </div>
      <div style={{
        background: '#f5f7fa',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        color: '#6B8EAE'
      }}>
        <CheckOutlined />
        <span>PPT 已生成 · 点击下载查看完整内容</span>
      </div>
    </div>
  );
      case 'word':
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: 12
          }}>
            <div style={{
              flex: 1,
              background: '#f5f7fa',
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #6B8EAE 0%, #95AEC7 100%)',
                padding: '12px 16px',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 500 }}>Word 教案预览</span>
                <span style={{ fontSize: 12, opacity: 0.9 }}>Word 文档</span>
              </div>
              <div style={{
                flex: 1,
                padding: '20px',
                background: '#fff',
                overflow: 'auto',
                maxHeight: '400px',
                minHeight: '300px',
                position: 'relative'
              }} ref={wordPreviewRef}>
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#999',
                  maxWidth: '100%',
                  width: '100%',
                  margin: '0 auto'
                }}>正在加载Word文档...</div>
              </div>
            </div>
            <div style={{
              background: '#f5f7fa',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: '#6B8EAE'
            }}>
              <CheckOutlined />
              <span>教案已生成 · 点击下载查看完整内容</span>
            </div>
          </div>
        );
      case 'game':
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: 12
          }}>
            <div style={{
              flex: 1,
              background: '#f5f7fa',
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #6B8EAE 0%, #95AEC7 100%)',
                padding: '12px 16px',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 500 }}>🎮 互动游戏预览</span>
                <span style={{ fontSize: 12, opacity: 0.9 }}>HTML 游戏</span>
              </div>
              <div style={{
                flex: 1,
                padding: 16,
                background: '#fff',
                overflow: 'hidden'
              }}>
                <iframe
                  src={previewUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: 400,
                    border: 'none',
                    borderRadius: 8,
                    background: '#fff'
                  }}
                  title="Game Preview"
                />
              </div>
            </div>
            <div style={{
              background: '#f5f7fa',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: '#6B8EAE'
            }}>
              <CheckOutlined />
              <span>游戏已生成 · 导出可下载完整文件</span>
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
    <>
      <PreviewPanelStyle />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 20px 20px 20px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        height: '100%'
      }}>
      {/* 预览区域 - 白色卡片（包含 Tab 和操作按钮） */}
<div style={{
  minHeight: 600,
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
    </>
  );
}

export default PreviewPanel;