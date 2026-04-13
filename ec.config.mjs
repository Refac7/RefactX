import { defineEcConfig } from 'astro-expressive-code'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'

export default defineEcConfig({
  defaultLocale: 'zh-CN',
  defaultProps: {
    wrap: false,
    collapseStyle: 'collapsible-auto',
    showLineNumbers: false,
    preserveIndent: true,
  },
  minSyntaxHighlightingColorContrast: 0,

  styleOverrides: {
    uiFontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    uiFontSize: '0.875rem',
    codeFontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    codeFontSize: '0.875rem',
    codeLineHeight: '1.6',
    
    borderRadius: '0.5rem',
    
    codePaddingBlock: '1rem',
    codePaddingInline: '1.25rem',
    
    borderColor: ({ theme }) => (theme.type === 'dark' ? '#333333' : '#eaeaea'),

    frames: {
      frameBoxShadowCssValue: 'none',
      inlineButtonBackgroundActiveOpacity: '0.1',
      inlineButtonBackgroundHoverOrFocusOpacity: '0.05',
      
      editorBackground: ({ theme }) => (theme.type === 'dark' ? '#000000' : '#fafafa'),
      terminalBackground: ({ theme }) => (theme.type === 'dark' ? '#000000' : '#fafafa'),
      
      terminalTitlebarBackground: ({ theme }) => (theme.type === 'dark' ? '#111111' : '#f5f5f5'),
    },
    
    textMarkers: {
      backgroundOpacity: '0.15',
      borderOpacity: '0.4',
    },
  },

  plugins: [
    pluginCollapsibleSections({
      defaultCollapsed: false,
    }),
    pluginLineNumbers(),
  ],

  themes: ['github-dark', 'github-light'],
  themeCssSelector: (theme) => (theme.name === 'github-dark' ? '.dark' : ':root:not(.dark)'),
  
  useDarkModeMediaQuery: false,
  useStyleReset: false,
})