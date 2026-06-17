/** @type {import('tailwindcss').Config} */
// OmniCreator 控制台 · 深色科技仪表盘设计令牌
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          'Roboto', '"PingFang SC"', '"Microsoft YaHei"', 'Helvetica', 'Arial', 'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace',
        ],
      },
      colors: {
        // 页面最底色
        base: '#070810',
        // 卡片 / 表面层级
        surface: {
          DEFAULT: '#10131c', // 卡片
          soft: '#161a26',    // 略亮的嵌套表面
          input: '#0d1019',   // 输入框底色
        },
        // 描边
        line: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          strong: 'rgba(255,255,255,0.14)',
        },
        // 文字层级
        content: {
          DEFAULT: '#e8eaf2', // 主文字
          muted: '#9aa1b9',   // 次要文字
          dim: '#5f6680',     // 弱化文字 / 占位符
        },
        // 品牌主色（靛蓝 → 紫）
        brand: {
          DEFAULT: '#6366f1',
          soft: '#818cf8',
          dark: '#4f46e5',
        },
        // 青色高亮（科技感点缀）
        accent: '#22d3ee',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 18px 50px -24px rgba(0,0,0,0.85)',
        glow: '0 0 0 1px rgba(99,102,241,0.30), 0 12px 36px -10px rgba(99,102,241,0.55)',
        'glow-accent': '0 0 0 1px rgba(34,211,238,0.30), 0 12px 36px -10px rgba(34,211,238,0.45)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slide-down 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
