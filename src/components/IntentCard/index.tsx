import { useState } from 'react';
import { Card, Tag } from 'antd';
import { CaretDownFilled, CaretUpFilled } from '@ant-design/icons';

// 扩展接口，兼容后端返回的字段名
interface IntentData {
  subject?: string;
  topic?: string;
  keyPoints?: string[];
  difficultPoints?: string[];
  duration?: number;
  style?: string;
  // 后端可能返回的原始字段（下划线命名）
  key_points?: string[];
  difficult_points?: string[];
  duration_minutes?: number;
  teaching_style?: string;
  target_audience?: string;
  special_requirements?: string;
  [key: string]: any; // 允许其他字段
}

interface IntentCardProps {
  data?: IntentData | string | null;
}

function IntentCard({ data }: IntentCardProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // 规范化数据：将后端可能返回的各种字段名转换为组件内部使用的字段
  const normalizeData = (rawData: any): IntentData => {
    if (!rawData) return {};

    // 如果传入的是字符串，尝试解析为 JSON
    let parsed = rawData;
    if (typeof rawData === 'string') {
      try {
        parsed = JSON.parse(rawData);
      } catch {
        return {};
      }
    }

    // 如果已经是对象，进行字段映射
    const result: IntentData = {};

    // 学科
    if (parsed.subject) result.subject = parsed.subject;
    // 课题 / 主题
    if (parsed.topic) result.topic = parsed.topic;

    // 知识点：优先使用 keyPoints 数组，否则使用 key_points
    if (parsed.keyPoints && Array.isArray(parsed.keyPoints)) {
      result.keyPoints = parsed.keyPoints;
    } else if (parsed.key_points && Array.isArray(parsed.key_points)) {
      result.keyPoints = parsed.key_points;
    } else if (typeof parsed.key_points === 'string') {
      // 如果是逗号分隔的字符串，分割成数组
      result.keyPoints = parsed.key_points.split(/[,，]/).map((s: string) => s.trim());
    }

    // 重难点
    if (parsed.difficultPoints && Array.isArray(parsed.difficultPoints)) {
      result.difficultPoints = parsed.difficultPoints;
    } else if (parsed.difficult_points && Array.isArray(parsed.difficult_points)) {
      result.difficultPoints = parsed.difficult_points;
    } else if (typeof parsed.difficult_points === 'string') {
      result.difficultPoints = parsed.difficult_points.split(/[,，]/).map((s: string) => s.trim());
    }

    // 时长：优先使用 duration，否则使用 duration_minutes
    if (parsed.duration) {
      result.duration = parsed.duration;
    } else if (parsed.duration_minutes) {
      result.duration = parsed.duration_minutes;
    }

    // 教学风格：优先使用 style，否则使用 teaching_style
    if (parsed.style) {
      result.style = parsed.style;
    } else if (parsed.teaching_style) {
      result.style = parsed.teaching_style;
    }

    return result;
  };

  const normalizedData = normalizeData(data);
  const mockData: IntentData = {
    subject: '暂无',
    topic: '暂无',
    keyPoints: ['暂无', '暂无', '暂无', '暂无'],
    difficultPoints: ['暂无', '暂无'],
    duration: 40,
    style: '探究式',
  };

  // 合并数据：如果 normalizedData 有值则使用，否则使用 mockData
  const hasValidData = (d: IntentData) => {
    return !!(d.subject || d.topic || (d.keyPoints && d.keyPoints.length > 0));
  };
  const displayData = hasValidData(normalizedData) ? normalizedData : mockData;
  const hasData = hasValidData(displayData);

  if (!hasData && collapsed) {
    return null;
  }

  return (
    <Card
      size="small"
      style={{ 
        marginBottom: 16,
        background: isHovered ? '#C5D8E8' : '#D5E4F0',
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

      {!collapsed && hasData && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 学科和课题 */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
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