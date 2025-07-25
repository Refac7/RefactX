#!/usr/bin/env node
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import chalk from 'chalk'
import ora from 'ora'
import { t } from './utils.ts'

// 定义支持的图片格式
const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'avif'] as const
type ImageFormat = (typeof SUPPORTED_FORMATS)[number]

// 配置接口定义
interface ImageConfig {
  quality: number
  width: number
  format?: ImageFormat // <--- 将 format 改为可选
  keepOriginal: boolean
  recursive: boolean
  outputDir?: string
}

// 文件大小格式化
const formatBytes = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

// 图片处理类
class ImageProcessor {
  private config: ImageConfig
  private stats = {
    processed: 0,
    skipped: 0,
    errors: 0,
    originalSize: 0,
    optimizedSize: 0,
  }

  constructor(config: ImageConfig) {
    this.config = config
  }

  // 修改签名
  private async processImage(inputPath: string, outputPath: string): Promise<boolean> {
    // 规范化路径以进行准确比较
    const normalizedInputPath = path.normalize(inputPath)
    const normalizedOutputPath = path.normalize(outputPath)
    const isOverwriting = normalizedInputPath === normalizedOutputPath // 使用规范化路径判断

    // 临时文件路径生成逻辑
    const tempFilenameBase = isOverwriting
      ? `${path.basename(outputPath)}.${Date.now()}`
      : path.basename(outputPath, path.extname(outputPath))
    const tempExtension = '.tmp'
    const tempFilename = `${tempFilenameBase}${tempExtension}`

    // --- 修改这里：始终将临时文件放在最终输出目录 ---
    const tempDirectory = path.dirname(outputPath)
    // const tempDirectory = isOverwriting ? os.tmpdir() : path.dirname(outputPath); // 旧逻辑：覆盖时使用系统临时目录
    // --- 结束修改 ---

    const tempOutputPath = path.join(tempDirectory, tempFilename)

    try {
      const originalStats = fs.statSync(inputPath)
      this.stats.originalSize += originalStats.size

      let sharpInstance = sharp(inputPath)
      const metadata = await sharpInstance.metadata()

      // Resize logic (no changes needed here)
      if (this.config.width > 0 && metadata.width && metadata.width > this.config.width) {
        sharpInstance = sharpInstance.resize({
          width: this.config.width,
          withoutEnlargement: true,
          fit: 'inside',
        })
      }

      // Format conversion logic (write to tempOutputPath)
      switch (this.config.format) {
        case 'webp':
          await sharpInstance.webp({ quality: this.config.quality }).toFile(tempOutputPath)
          break
        case 'avif':
          await sharpInstance.avif({ quality: this.config.quality }).toFile(tempOutputPath)
          break
        case 'png':
          // Add PNG specific options if needed, e.g., compressionLevel
          await sharpInstance.png({ quality: this.config.quality /*, compressionLevel: 9 */ }).toFile(tempOutputPath)
          break
        default: // jpeg
          await sharpInstance.jpeg({ quality: this.config.quality }).toFile(tempOutputPath)
      }

      // Wait briefly (optional, might help with file handles)
      await new Promise((resolve) => setTimeout(resolve, 100))

      // If overwriting, replace original file with temp file
      if (isOverwriting) {
        try {
          if (!fs.existsSync(tempOutputPath)) {
            throw new Error(`Temporary file creation failed or file disappeared: ${tempOutputPath}`)
          }
          // 尝试重命名，优先处理 EXDEV (跨设备) 和 EPERM/EACCES (权限/锁定)
          fs.renameSync(tempOutputPath, outputPath)
        } catch (renameError: any) {
          if (renameError.code === 'EXDEV') {
            // 跨设备移动错误
            console.warn(chalk.yellow(`Rename failed (EXDEV), attempting copy then delete for: ${path.basename(inputPath)}`))
            try {
              fs.copyFileSync(tempOutputPath, outputPath) // 复制到目标位置
              fs.unlinkSync(tempOutputPath) // 删除临时文件
            } catch (copyError) {
              if (fs.existsSync(tempOutputPath)) {
                // 尝试清理
                try {
                  fs.unlinkSync(tempOutputPath)
                } catch (_) {}
              }
              console.error(chalk.red(`\n  ✗ Copy fallback failed for ${path.basename(inputPath)}: ${copyError}`))
              throw copyError // 重新抛出复制错误
            }
          } else if (renameError.code === 'EPERM' || renameError.code === 'EACCES') {
            // 权限或锁定错误
            console.warn(
              chalk.yellow(
                `Direct rename failed (${renameError.code}), attempting delete original then rename for: ${path.basename(inputPath)}`
              )
            )
            try {
              fs.unlinkSync(inputPath) // 尝试删除原始文件
              fs.renameSync(tempOutputPath, outputPath) // 再次尝试重命名
            } catch (retryError) {
              if (fs.existsSync(tempOutputPath)) {
                // 尝试清理
                try {
                  fs.unlinkSync(tempOutputPath)
                } catch (_) {}
              }
              console.error(chalk.red(`\n  ✗ Retry rename/delete failed for ${path.basename(inputPath)}: ${retryError}`))
              throw retryError // 重新抛出重试错误
            }
          } else {
            // 其他重命名错误
            if (fs.existsSync(tempOutputPath)) {
              // 尝试清理
              try {
                fs.unlinkSync(tempOutputPath)
              } catch (_) {}
            }
            console.error(chalk.red(`\n  ✗ Unexpected rename error for ${path.basename(inputPath)}: ${renameError}`))
            throw renameError
          }
        }
      } else if (!isOverwriting && tempOutputPath !== outputPath) {
        // Handle the case where tempOutputPath was used but it wasn't overwriting (e.g., different output dir)
        // This block might be redundant if tempOutputPath logic is correct, but good for safety.
        try {
          fs.renameSync(tempOutputPath, outputPath)
        } catch (renameError: any) {
          // Handle potential EXDEV or other errors similar to the overwriting case if necessary
          if (fs.existsSync(tempOutputPath)) {
            try {
              fs.unlinkSync(tempOutputPath)
            } catch (_) {}
          }
          throw renameError
        }
      }

      // Get stats from the final output path
      const optimizedStats = fs.statSync(outputPath)
      this.stats.optimizedSize += optimizedStats.size
      this.stats.processed++

      console.log(chalk.green(`\n✓ ${t.messages.success}: ${path.basename(inputPath)}`))
      return true // 处理成功
    } catch (error) {
      this.stats.errors++
      // 确保错误信息更清晰
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(chalk.red(`\n✗ ${t.messages.error}: ${path.basename(inputPath)} - ${errorMessage}`))
      // Clean up temporary file if it exists on error
      if (fs.existsSync(tempOutputPath)) {
        try {
          fs.unlinkSync(tempOutputPath)
        } catch (cleanupError) {
          const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
          console.error(chalk.red(`Failed to clean up temporary file ${tempOutputPath}: ${cleanupMessage}`))
        }
      }
      return false // 处理失败
    }
  }

  private getOutputPath(inputPath: string): string {
    const originalExtWithDot = path.extname(inputPath)
    const originalExt = originalExtWithDot.toLowerCase().slice(1) as ImageFormat // 获取原始格式
    const filename = path.basename(inputPath, originalExtWithDot)

    // 确定目标格式：如果用户指定了格式，则使用用户指定的；否则，使用原始格式
    const targetFormat = this.config.format ? this.config.format : originalExt

    // 确保目标格式是支持的（理论上isImageFile已过滤，但加一层保险）
    if (!SUPPORTED_FORMATS.includes(targetFormat)) {
      // 如果原始格式不在支持列表（例如 .gif），这里会出问题
      // 但 isImageFile 应该已经阻止了这种情况
      // 如果需要更严格处理，可以在这里抛出错误或跳过
      console.warn(
        chalk.yellow(
          `Target format '${targetFormat}' determined for ${path.basename(inputPath)} is not in the supported list. Using original extension anyway.`
        )
      )
    }

    const outputFilename = `${filename}.${targetFormat}` // 使用确定的目标格式

    // Determine the base directory for the output
    const baseOutputDir = this.config.outputDir ? this.config.outputDir : path.dirname(inputPath)

    return path.join(baseOutputDir, outputFilename)
  }

  private isImageFile(filepath: string): boolean {
    const ext = path.extname(filepath).toLowerCase().slice(1)
    return SUPPORTED_FORMATS.includes(ext as ImageFormat)
  }

  private async processDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = []
    const items = fs.readdirSync(dirPath)

    for (const item of items) {
      const fullPath = path.join(dirPath, item)
      const stats = fs.statSync(fullPath)

      if (stats.isDirectory() && this.config.recursive) {
        files.push(...(await this.processDirectory(fullPath)))
      } else if (stats.isFile() && this.isImageFile(fullPath)) {
        files.push(fullPath)
      }
    }

    return files
  }

  async process(inputPath: string): Promise<void> {
    // Return type changed to void as we no longer return a list
    // 返回需要删除的文件列表 - No longer needed
    // const filesToDelete: string[] = []
    if (!fs.existsSync(inputPath)) {
      console.error(chalk.red(t.messages.invalidPath))
      return // 返回空列表 - Changed to just return
    }

    // 创建输出目录
    if (this.config.outputDir && !fs.existsSync(this.config.outputDir)) {
      console.log(chalk.cyan(`${t.messages.createOutputDir}: ${this.config.outputDir}`))
      console.log(chalk.cyan('======================='))
      fs.mkdirSync(this.config.outputDir, { recursive: true })
    }

    const stats = fs.statSync(inputPath)
    const files = stats.isDirectory() ? await this.processDirectory(inputPath) : [inputPath]

    const spinner = ora({
      text: `${t.messages.processing} 1/${files.length}`,
      spinner: 'dots',
    }).start()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const originalExt = path.extname(file).toLowerCase().slice(1) as ImageFormat

      // 再次确定目标格式，用于传递给 processImage
      const targetFormat = this.config.format ? this.config.format : originalExt

      // 增加一个检查，如果最终确定的格式不支持，则跳过
      if (!SUPPORTED_FORMATS.includes(targetFormat)) {
        spinner.stop() // 停止 spinner 以打印警告
        console.warn(chalk.yellow(`\n⚠ Skipping ${path.basename(file)}: Determined output format '${targetFormat}' is not supported.`))
        spinner.start() // 重新开始 spinner
        this.stats.skipped++
        continue // 跳过这个文件
      }

      const outputPath = this.getOutputPath(file) // getOutputPath 内部已包含格式判断逻辑

      // --- Recalculate isOverwriting here based on normalized paths for deletion logic ---
      const normalizedFile = path.normalize(file)
      const normalizedOutputPath = path.normalize(outputPath)
      const isOverwriting = normalizedFile === normalizedOutputPath
      // ---

      // 将确定的 targetFormat 传递给 processImage
      const success = await this.processImage(file, outputPath)

      // 修改删除逻辑：仅在处理成功、不保留原文件且 *不是* 覆盖操作时删除
      if (success && !this.config.keepOriginal && !isOverwriting) {
        // Use !isOverwriting
        try {
          fs.unlinkSync(file) // 直接尝试删除原始文件
        } catch (deleteError: any) {
          console.error(chalk.red(`\n  ✗ Failed to delete original file: ${path.basename(file)} - ${deleteError.message}`))
          this.stats.errors++ // 将删除失败计入错误统计
        }
      }
      spinner.text = `${t.messages.processing} ${i + 2}/${files.length}`
    }

    spinner.stop()
    this.printStats()
    // return filesToDelete // 不再返回列表
  }

  private printStats(): void {
    const saved = this.stats.originalSize - this.stats.optimizedSize
    // 添加检查：只有在 originalSize 大于 0 时才计算百分比
    const savedPercentage = this.stats.originalSize > 0 ? ((saved / this.stats.originalSize) * 100).toFixed(2) : '0.00' // 如果 originalSize 为 0，则百分比为 0

    console.log(chalk.cyan('\n=== ' + t.messages.stats + ' ==='))
    console.log(chalk.green(`✓ ${t.messages.success}: ${this.stats.processed}`))
    console.log(chalk.yellow(`⚠ ${t.messages.skipped}: ${this.stats.skipped}`)) // 确保 skipped 统计也正确
    console.log(chalk.red(`✗ ${t.messages.error}: ${this.stats.errors}`))
    // 确保 formatBytes 能处理 saved 为负数的情况（虽然理论上不应发生）
    console.log(chalk.blue(`${t.messages.saved}: ${formatBytes(Math.max(0, saved))} (${savedPercentage}%)`))
  }
}

// 主函数
async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('input', {
      alias: 'i',
      type: 'string',
      description: t.cli.input,
      demandOption: true,
    })
    .option('quality', {
      alias: 'q',
      type: 'number',
      description: t.cli.quality,
      default: 80,
    })
    .option('width', {
      alias: 'w',
      type: 'number',
      description: t.cli.width,
      default: 0,
    })
    .option('format', {
      alias: 'f',
      type: 'string',
      choices: SUPPORTED_FORMATS,
      description: t.cli.format,
      // default: 'webp', // <--- 移除这一行
    })
    .option('keepOriginal', {
      alias: 'k',
      type: 'boolean',
      description: t.cli.keepOriginal,
      default: false,
    })
    .option('recursive', {
      alias: 'r',
      type: 'boolean',
      description: t.cli.recursive,
      default: true,
    })
    .option('outputDir', {
      alias: 'o',
      type: 'string',
      description: t.cli.outputDir,
    })
    .parse()

  const processor = new ImageProcessor({
    quality: argv.quality,
    width: argv.width,
    format: argv.format as ImageFormat | undefined, // 允许 format 为 undefined
    keepOriginal: argv.keepOriginal,
    recursive: argv.recursive,
    outputDir: argv.outputDir,
  })

  await processor.process(argv.input)

  console.log(chalk.blue(`\n${t.messages.end}`))
}

main().catch((error) => {
  console.error(chalk.red(`\n${t.messages.errorMsg}`), error)
  process.exit(1) // 确保在错误时退出
})
