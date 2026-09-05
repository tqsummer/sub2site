/**
 * 颜色 token 走 CSS 变量 + <alpha-value>，而不是写死 hex。
 * 写死 hex 的话 `bg-primary-500/50` 这类带透明度的工具类会失效，
 * 因为 Tailwind 需要能把 alpha 插进 rgb() 里。
 * 变量本身定义在 src/styles/theme.css，存的是 “R G B” 通道值。
 */
const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色调 — AIProxy 电光蓝。明暗共用同一条单调色阶，
        // 因为现有代码大量写 `text-primary-600 dark:text-primary-400`，
        // 假定编号越小越浅；详见 src/styles/theme.css 文件头说明 B。
        primary: {
          50: c('primary-50'),
          100: c('primary-100'),
          200: c('primary-200'),
          300: c('primary-300'),
          400: c('primary-400'),
          500: c('primary-500'),
          600: c('primary-600'),
          700: c('primary-700'),
          800: c('primary-800'),
          900: c('primary-900'),
          950: c('primary-950')
        },

        // 语义 token — 随主题自动切换，新组件优先用这些而不是 primary-N。
        bg: c('bg'),
        surface: {
          DEFAULT: c('surface'),
          2: c('surface-2'),
          3: c('surface-3')
        },
        content: {
          DEFAULT: c('text'),
          2: c('text-2'),
          3: c('text-3')
        },
        divider: {
          DEFAULT: c('divider'),
          strong: c('divider-strong')
        },
        brand: {
          DEFAULT: c('accent'),
          text: c('accent-text'),
          hover: c('accent-hover'),
          active: c('accent-active'),
          soft: c('accent-soft'),
          'soft-2': c('accent-soft-2'),
          on: c('on-accent')
        },
        success: {
          DEFAULT: c('success'),
          soft: c('success-soft')
        },
        warning: {
          DEFAULT: c('warning'),
          soft: c('warning-soft')
        },
        danger: {
          DEFAULT: c('danger'),
          soft: c('danger-soft')
        },

        // 平台标识色 — 只用于圆点、徽章、平台强调条，不用于正文
        platform: {
          claude: c('platform-claude'),
          openai: c('platform-openai'),
          gemini: c('platform-gemini'),
          antigravity: c('platform-antigravity'),
          grok: c('platform-grok')
        },

        // 图表分类色板 — Okabe-Ito 衍生，非语义色，不要拿来表示状态
        chart: {
          1: c('chart-1'),
          2: c('chart-2'),
          3: c('chart-3'),
          4: c('chart-4'),
          5: c('chart-5'),
          6: c('chart-6'),
          7: c('chart-7')
        },

        // 辅助色 - 深蓝灰
        accent: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        // 深色模式背景
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        }
      },
      fontFamily: {
        // 字体栈定义在 theme.css，通过 @fontsource 自托管 Inter / JetBrains Mono。
        // 中文回落到系统字体（PingFang SC / 微软雅黑），不自托管 CJK 字重——
        // Noto Sans SC 全字符集有十几 MB，代价远大于收益。
        sans: 'var(--font-body)',
        mono: 'var(--font-mono)'
      },
      spacing: {
        // 设计稿的 4px 网格档位。数值与 Tailwind 默认刻度重合，
        // 这里另起名字是为了让「用的是设计 token」这件事在类名上可见。
        's2': 'var(--space-2)',
        's4': 'var(--space-4)',
        's8': 'var(--space-8)',
        's12': 'var(--space-12)',
        's16': 'var(--space-16)',
        's20': 'var(--space-20)',
        's24': 'var(--space-24)',
        's32': 'var(--space-32)',
        's48': 'var(--space-48)'
      },
      transitionDuration: {
        fast: '150ms',
        pop: '200ms',
        page: '300ms'
      },
      transitionTimingFunction: {
        token: 'cubic-bezier(0.2, 0, 0, 1)'
      },
      boxShadow: {
        // 设计 token：以 1px 描边代替传统投影，暗色下投影更重以补偿对比
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.06)',
        glow: '0 0 20px rgb(var(--c-accent) / 0.25)',
        'glow-lg': '0 0 40px rgb(var(--c-accent) / 0.35)',
        card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 40px rgba(0, 0, 0, 0.08)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary':
          'linear-gradient(135deg, rgb(var(--c-accent)) 0%, rgb(var(--c-accent-active)) 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        'gradient-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'mesh-gradient':
          'radial-gradient(at 40% 20%, rgb(var(--c-accent) / 0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgb(var(--c-chart-5) / 0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, rgb(var(--c-accent) / 0.08) 0px, transparent 50%)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        glow: 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgb(var(--c-accent) / 0.25)' },
          '100%': { boxShadow: '0 0 30px rgb(var(--c-accent) / 0.4)' }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      borderRadius: {
        // 设计 token 的四档圆角
        token: 'var(--radius-md)',
        'token-sm': 'var(--radius-sm)',
        'token-lg': 'var(--radius-lg)',
        'token-xl': 'var(--radius-xl)',
        '4xl': '2rem'
      }
    }
  },
  plugins: []
}
