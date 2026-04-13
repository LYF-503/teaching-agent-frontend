import { Tabs, Button, Input, Space,} from 'antd';
import type { TabsProps } from 'antd';
import { USE_MOCK } from '../../config';

function PreviewPanel() {
  // 选项卡配置
  const tabItems: TabsProps['items'] = [
    {
      key: 'ppt',
      label: 'PPT课件',
      children: (
        <div style={{ 
          height: 400, 
          background: '#f5f5f5', 
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <p style={{ color: '#999' }}>
            {USE_MOCK 
              ? '模拟模式：PPT预览区域，生成课件后会显示在这里' 
              : 'PPT预览区域，生成课件后会显示在这里'
            }
          </p>
        </div>
      ),
    },
    {
      key: 'word',
      label: 'Word教案',
      children: (
        <div style={{ 
          height: 400, 
          background: '#f5f5f5', 
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <p style={{ color: '#999' }}>
            {USE_MOCK 
              ? '模拟模式：Word教案预览区域' 
              : 'Word教案预览区域'
            }
          </p>
        </div>
      ),
    },
    {
      key: 'game',
      label: '互动游戏',
      children: (
        <div style={{ 
          height: 400, 
          background: '#f5f5f5', 
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <p style={{ color: '#999' }}>
            {USE_MOCK 
              ? '模拟模式：互动游戏预览区域' 
              : '互动游戏预览区域'
            }
          </p>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      
      {/* 选项卡切换 */}
      <Tabs defaultActiveKey="ppt" items={tabItems} />
      
      {/* 修改意见区域 */}
      <div style={{ marginTop: 24 }}>
        <p><strong>修改意见：</strong></p>
        <Input.TextArea 
          placeholder="例如：把第三页的案例换成特斯拉的故事..." 
          rows={2}
          style={{ marginBottom: 12 }}
          disabled={USE_MOCK}
        />
        <Space>
          <Button type="primary" disabled={USE_MOCK}>
            {USE_MOCK ? '模拟模式暂不可用' : '应用修改'}
          </Button>
          <Button disabled={USE_MOCK}>导出PPT</Button>
          <Button disabled={USE_MOCK}>导出Word</Button>
        </Space>
        {USE_MOCK && (
          <p style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
            提示：当前为模拟模式，修改和导出功能暂不可用。切换到真实模式后即可使用。
          </p>
        )}
      </div>
    </div>
  );
}

export default PreviewPanel;