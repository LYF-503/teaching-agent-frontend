import { useState, useRef } from 'react';
import { Button, Modal, message } from 'antd';
import { AudioOutlined, CloseOutlined } from '@ant-design/icons';

interface VoiceInputProps {
  onTextReceived: (text: string) => void;
  disabled?: boolean;
}

function VoiceInput({ onTextReceived, disabled }: VoiceInputProps) {
  const MAX_RECORDING_TIME = 60;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const mockVoiceToText = (): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockTexts = [
          '我想讲初中物理的欧姆定律',
          '重点是电流与电压的关系',
          '需要设计一个互动小游戏',
          '时长大概45分钟',
          '请帮我生成一个探究式的课件',
        ];
        const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
        resolve(randomText);
      }, 1500);
    });
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);

    try {
      const text = await mockVoiceToText();
      onTextReceived(text);
      message.success(`语音转文字成功：${text}`);
      handleClose();
    } catch (error) {
      console.error('语音转文字失败:', error);
      message.error('语音转文字失败，请重试');
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        await processAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
        
        if (seconds >= MAX_RECORDING_TIME) {
          stopRecording();
          message.warning(`录音已达最大时长 ${MAX_RECORDING_TIME} 秒`);
        }
      }, 1000);
    } catch (error) {
      console.error('无法访问麦克风:', error);
      message.error('无法访问麦克风，请检查权限');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    setIsModalOpen(false);
    setIsRecording(false);
    setIsProcessing(false);
    setRecordingTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <>
      <Button
        icon={<AudioOutlined style={{ fontSize: 18, color: 'inherit' }} />}
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        style={{
          border: 'none',
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'inherit'
        }}
      />

      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        footer={null}
        width={400}
        centered
        closeIcon={<CloseOutlined style={{ color: '#4A637A', fontSize: 16 }} />}
        styles={{
          body: { padding: '24px 24px 28px' },
          header: { display: 'none' }
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ 
            marginBottom: 16, 
            color: '#4A637A', 
            fontWeight: 500,
            fontSize: 18,
            letterSpacing: 1
          }}>
            语音输入
          </h3>

          {/* 动画区域 */}
          <div style={{ 
            minHeight: 160, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'flex-start'
          }}>
            {/* 处理中状态 */}
            {isProcessing && (
              <div className="voice-state-container">
                <div className="voice-processing-container">
                  <div className="voice-processing-ring" />
                  <div className="voice-processing-ring-2" />
                  <AudioOutlined className="voice-icon-processing" />
                </div>
                <p className="voice-processing-text-inline">
                  正在识别中
                  <span className="processing-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                </p>
              </div>
            )}

            {/* 未录音状态 */}
            {!isRecording && !isProcessing && (
              <div className="voice-state-container">
                <button onClick={startRecording} className="voice-start-btn">
                  <AudioOutlined className="voice-icon-start" />
                </button>
              </div>
            )}

            {/* 录音中状态 */}
            {isRecording && !isProcessing && (
              <div className="voice-state-container">
                <div className="voice-recording-wrapper">
                  <div className="voice-recording-ring-1" />
                  <div className="voice-recording-ring-2" />
                  <div className="voice-recording-ring-3" />
                  <button onClick={stopRecording} className="voice-recording-btn">
                    <AudioOutlined className="voice-icon-recording" />
                  </button>
                </div>
                <div className="voice-wave-container">
                  <div className="voice-wave-bar" />
                  <div className="voice-wave-bar" />
                  <div className="voice-wave-bar" />
                  <div className="voice-wave-bar" />
                  <div className="voice-wave-bar" />
                </div>
              </div>
            )}
          </div>

          {/* 底部文字 - 只有未录音时显示 */}
          <div style={{ marginTop: 8, minHeight: 28 }}>
            {!isRecording && !isProcessing && (
              <p className="voice-bottom-text">
                点击按钮开始录音，最长 {MAX_RECORDING_TIME} 秒
              </p>
            )}
            {/* 录音中和处理中用透明占位保持高度 */}
            {(isRecording || isProcessing) && (
              <p className="voice-bottom-text" style={{ opacity: 0 }}>
                点击按钮开始录音，最长 {MAX_RECORDING_TIME} 秒
              </p>
            )}
          </div>
        </div>
      </Modal>

      <style>{`
        .voice-state-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        
        .voice-bottom-text {
          color: #999;
          fontSize: 13px;
          margin: 0;
        }
        
        /* 开始按钮 */
        .voice-start-btn {
          width: 110px;
          height: 110px;
          border-radius: 55px;
          background: linear-gradient(135deg, #6B8EAE 0%, #95AEC7 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(107, 142, 174, 0.35);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 4px;
        }
        
        .voice-start-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 32px rgba(107, 142, 174, 0.45);
        }
        
        .voice-icon-start {
          font-size: 44px;
          color: #fff;
        }
        
        /* 处理中状态 */
        .voice-processing-container {
          position: relative;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        
        .voice-processing-ring {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          border: 3px solid #6B8EAE;
          border-top-color: transparent;
          animation: spin 1s linear infinite;
        }
        
        .voice-processing-ring-2 {
          position: absolute;
          top: 8px;
          left: 8px;
          right: 8px;
          bottom: 8px;
          border-radius: 50%;
          border: 2px solid #95AEC7;
          border-bottom-color: transparent;
          animation: spin 0.8s linear infinite reverse;
        }
        
        .voice-icon-processing {
          font-size: 44px;
          color: #6B8EAE;
          position: relative;
          z-index: 5;
        }
        
        .voice-processing-text-inline {
          margin-top: 12px;
          color: #6B8EAE;
          font-size: 14px;
          font-weight: 500;
        }
        
        .processing-dots span {
          animation: blink 1.4s infinite both;
        }
        .processing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .processing-dots span:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        
        /* 录音中状态 */
        .voice-recording-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        
        .voice-recording-btn {
          width: 110px;
          height: 110px;
          border-radius: 55px;
          background: #e8edf2;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 10;
          transition: all 0.2s ease;
        }
        
        .voice-recording-btn:hover {
          background: #dce3ea;
          transform: scale(1.02);
        }
        
        .voice-icon-recording {
          font-size: 44px;
          color: #4A637A;
        }
        
        .voice-recording-ring-1,
        .voice-recording-ring-2,
        .voice-recording-ring-3 {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 2px solid #6B8EAE;
          animation: recordingRing 2s ease-in-out infinite;
        }
        
        .voice-recording-ring-2 {
          animation-delay: 0.3s;
        }
        
        .voice-recording-ring-3 {
          animation-delay: 0.6s;
        }
        
        @keyframes recordingRing {
          0% {
            width: 110px;
            height: 110px;
            opacity: 0.8;
          }
          100% {
            width: 180px;
            height: 180px;
            opacity: 0;
          }
        }
        
        /* 声波动画 */
        .voice-wave-container {
          display: flex;
          gap: 5px;
          align-items: flex-end;
          justify-content: center;
          height: 24px;
          margin-top: 12px;
        }
        
        .voice-wave-bar {
          width: 4px;
          height: 8px;
          background: #6B8EAE;
          border-radius: 2px;
          animation: wave 1.2s ease-in-out infinite;
        }
        
        .voice-wave-bar:nth-child(1) { animation-delay: 0s; height: 8px; }
        .voice-wave-bar:nth-child(2) { animation-delay: 0.1s; height: 14px; }
        .voice-wave-bar:nth-child(3) { animation-delay: 0.2s; height: 18px; }
        .voice-wave-bar:nth-child(4) { animation-delay: 0.3s; height: 14px; }
        .voice-wave-bar:nth-child(5) { animation-delay: 0.4s; height: 8px; }
        
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.8); background: #95AEC7; }
        }
        
        @keyframes blink {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default VoiceInput;