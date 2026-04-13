import { useState } from 'react';
import { Card, Tag, } from 'antd';
import { CaretDownFilled, CaretUpFilled } from '@ant-design/icons';

interface IntentData {
  subject?: string;
  topic?: string;
  keyPoints?: string[];
  difficultPoints?: string[];
  duration?: number;
  style?: string;
}

interface IntentCardProps {
  data?: IntentData;
}

function IntentCard({ data }: IntentCardProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const mockData: IntentData = {
    subject: '初中物理',
    topic: '欧姆定律',
    keyPoints: ['电流', '电压', '电阻', '欧姆定律公式'],
    difficultPoints: ['伏安特性曲线', '电阻的计算'],
    duration: 45,
    style: '探究式',
  };

  const displayData = data?.subject ? data : mockData;
  const hasData = displayData.subject || displayData.topic || displayData.keyPoints?.length;

  if (!hasData && collapsed) {
    return null;
  }

  return (
    <Card
      size="small"
      style={{ 
        marginBottom: 16,
        background: isHovered ? '#D5E4F0' : '#E9F0F7',
        borderRadius: 18,
        boxShadow: isHovered 
          ? '0 6px 16px rgba(0, 0, 0, 0.08)' 
          : '0 4px 12px rgba(0, 0, 0, 0.06)',
        border: 'none',
        fontSize: 16,
        fontFamily: 'inherit',
        transition: 'all 0.25s ease',
        cursor: 'pointer'
      }}
      styles={{
        body: { padding: '10px 14px' },
        header: { display: 'none' }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 标题栏 */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: collapsed ? 0 : 8
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <span style={{ fontWeight: 400, color: '#4A637A', fontSize: 16 }}>
          当前教学需求
        </span>
        {collapsed ? 
  <CaretDownFilled style={{ fontSize: 14, color: '#6B8EAE' }} /> : 
  <CaretUpFilled style={{ fontSize: 14, color: '#6B8EAE' }} />
}
      </div>

      {/* 内容区 */}
      {!collapsed && hasData && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 学科和课题 */}
          <div style={{ display: 'flex', gap: 20 }}>
            {displayData.subject && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#4A637A', fontSize: 13, opacity: 0.8 }}>学科</span>
                <Tag style={{ 
                  background: '#ffffff', 
                  color: '#4A637A', 
                  border: '1px solid #D5E4F0',
                  borderRadius: 12,
                  fontSize: 13,
                  padding: '2px 12px'
                }}>
                  {displayData.subject}
                </Tag>
              </div>
            )}
            {displayData.topic && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#4A637A', fontSize: 13, opacity: 0.8 }}>课题</span>
                <Tag style={{ 
                  background: '#ffffff', 
                  color: '#4A637A', 
                  border: '1px solid #D5E4F0',
                  borderRadius: 12,
                  fontSize: 13,
                  padding: '2px 12px'
                }}>
                  {displayData.topic}
                </Tag>
              </div>
            )}
          </div>

          {/* 知识点 */}
          {displayData.keyPoints && displayData.keyPoints.length > 0 && (
            <div>
              <span style={{ color: '#4A637A', fontSize: 13, opacity: 0.8, marginBottom: 6, display: 'block' }}>知识点</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {displayData.keyPoints.map((point, idx) => (
                  <Tag key={idx} style={{ 
                    background: '#ffffff', 
                    color: '#4A637A', 
                    border: '1px solid #D5E4F0',
                    borderRadius: 12,
                    fontSize: 13,
                    padding: '2px 12px',
                    margin: 0
                  }}>
                    {point}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {/* 重难点 */}
          {displayData.difficultPoints && displayData.difficultPoints.length > 0 && (
            <div>
              <span style={{ color: '#4A637A', fontSize: 13, opacity: 0.8, marginBottom: 6, display: 'block' }}>重难点</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {displayData.difficultPoints.map((point, idx) => (
                  <Tag key={idx} style={{ 
                    background: '#ffffff', 
                    color: '#4A637A', 
                    border: '1px solid #D5E4F0',
                    borderRadius: 12,
                    fontSize: 13,
                    padding: '2px 12px',
                    margin: 0
                  }}>
                    {point}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {/* 时长和风格 */}
          <div style={{ display: 'flex', gap: 20 }}>
            {displayData.duration && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#4A637A', fontSize: 13, opacity: 0.8 }}>时长</span>
                <Tag style={{ 
                  background: '#ffffff', 
                  color: '#4A637A', 
                  border: '1px solid #D5E4F0',
                  borderRadius: 12,
                  fontSize: 13,
                  padding: '2px 12px'
                }}>
                  {displayData.duration} 分钟
                </Tag>
              </div>
            )}
            {displayData.style && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#4A637A', fontSize: 13, opacity: 0.8 }}>风格</span>
                <Tag style={{ 
                  background: '#ffffff', 
                  color: '#4A637A', 
                  border: '1px solid #D5E4F0',
                  borderRadius: 12,
                  fontSize: 13,
                  padding: '2px 12px'
                }}>
                  {displayData.style}
                </Tag>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!collapsed && !hasData && (
        <div style={{ marginTop: 12 }}>
          <p style={{ color: '#4A637A', textAlign: 'center', padding: '8px 0', fontSize: 13, opacity: 0.7 }}>
            继续对话，智能体会逐步收集教学需求...
          </p>
        </div>
      )}
    </Card>
  );
}

export default IntentCard;