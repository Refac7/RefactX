// 多语言支持
const i18n = {
  zh: {
    cli: {
      input: '输入文件或目录路径',
      quality: '图片质量 (1-100)',
      width: '最大宽度',
      format: '输出格式',
      keepOriginal: '保留原始文件',
      recursive: '递归处理子目录',
      outputDir: '输出目录',
    },
    messages: {
      processing: '正在处理',
      success: '处理成功',
      error: '处理失败',
      complete: '处理完成',
      skipped: '已跳过',
      invalidPath: '无效的路径',
      createOutputDir: '创建输出目录',
      stats: '统计信息',
      saved: '节省空间',
      end: '✨ 图片任务处理完成',
      errorMsg: '✗ 发生未处理的错误:',
    },
  },
  en: {
    cli: {
      input: 'Input file or directory path',
      quality: 'Image quality (1-100)',
      width: 'Maximum width',
      format: 'Output format',
      keepOriginal: 'Keep original files',
      recursive: 'Process subdirectories recursively',
      outputDir: 'Output directory',
    },
    messages: {
      processing: 'Processing',
      success: 'Success',
      error: 'Error',
      complete: 'Complete',
      skipped: 'Skipped',
      invalidPath: 'Invalid path',
      createOutputDir: 'Creating output directory',
      stats: 'Statistics',
      saved: 'Space saved',
      end: '✨ Image task processing complete',
      errorMsg: '✗ Unprocessed error:',
    },
  },
}

// 检测系统语言
const lang = (process.env.LANG || process.env.LANGUAGE || '').toLowerCase().includes('zh') ? 'zh' : 'en'
export const t = i18n[lang]
