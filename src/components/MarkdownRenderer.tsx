// MarkdownRenderer.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

// 定义 CodeComponent 的 props 类型
interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {

  const components: Components = {
    // 自定义标题样式
    h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.5em', margin: '0.5em 0' }} {...props} />,
    h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.3em', margin: '0.5em 0' }} {...props} />,
    h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.1em', margin: '0.5em 0' }} {...props} />,
    
    // 自定义段落
    p: ({ node, ...props }) => <p style={{ margin: '0.5em 0', lineHeight: '1.6' }} {...props} />,
    
    // 自定义链接
    a: ({ node, ...props }) => (
      <a {...props} target="_blank" rel="noopener noreferrer" 
         style={{ color: '#6B8EAE', textDecoration: 'underline' }} />
    ),
    
    // 自定义列表
    ul: ({ node, ...props }) => <ul style={{ margin: '0.5em 0', paddingLeft: '1.5em' }} {...props} />,
    ol: ({ node, ...props }) => <ol style={{ margin: '0.5em 0', paddingLeft: '1.5em' }} {...props} />,
    
    // 自定义代码块
    code: ({ node, inline, className, children, ...props }: CodeProps) => {
      if (inline) {
        return (
          <code {...props} style={{
            backgroundColor: '#f6f8fa',
            padding: '0.2em 0.4em',
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '0.9em'
          }}>
            {children}
          </code>
        );
      }
      return (
        <pre style={{
          backgroundColor: '#f6f8fa',
          padding: '12px',
          borderRadius: '6px',
          overflow: 'auto',
          margin: '0.5em 0'
        }}>
          <code {...props} className={className}>
            {children}
          </code>
        </pre>
      );
    },
    
    // 自定义表格
    table: ({ node, ...props }) => (
      <div style={{ overflowX: 'auto', margin: '0.5em 0' }}>
        <table style={{
          borderCollapse: 'collapse',
          width: '100%'
        }} {...props} />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th style={{
        border: '1px solid #e8e8e8',
        padding: '8px 12px',
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold'
      }} {...props} />
    ),
    td: ({ node, ...props }) => (
      <td style={{
        border: '1px solid #e8e8e8',
        padding: '8px 12px'
      }} {...props} />
    ),
    
    // 自定义引用
    blockquote: ({ node, ...props }) => (
      <blockquote style={{
        borderLeft: '4px solid #95AEC7',
        margin: '0.5em 0',
        paddingLeft: '1em',
        color: '#4A637A',
        fontStyle: 'italic'
      }} {...props} />
    ),
  };

  return (
    <div className="markdown-body" style={{ wordBreak: 'break-word' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;