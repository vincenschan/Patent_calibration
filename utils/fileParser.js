import mammoth from 'mammoth'

/**
 * 解析Word文档为Markdown格式
 * @param {File} file - Word文档文件
 * @returns {Promise<string>} - 解析后的Markdown文本
 */
export async function parseWordDocument(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    
    // 配置mammoth选项
    const options = {
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer,
            alt: "文档图片"
          }
        })
      }),
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "b => strong",
        "i => em"
      ]
    }
    
    // 使用convertToHtml来保持更好的格式和图片支持
     const result = await mammoth.convertToHtml({ arrayBuffer }, options)
     return result.value
  } catch (error) {
    console.error('Word文档解析失败:', error)
    throw new Error('Word文档解析失败，请检查文件格式')
  }
}

/**
 * 解析PDF文档为文本
 * @param {File} file - PDF文档文件
 * @returns {Promise<string>} - 解析后的文本
 */
export async function parsePDFDocument(file) {
  try {
    // 由于pdf-parse在浏览器环境中有限制，我们使用一个简化的方法
    // 在实际生产环境中，建议使用服务端API来处理PDF解析
    const arrayBuffer = await file.arrayBuffer()
    
    // 这里我们模拟PDF解析，实际项目中需要使用专门的PDF解析库或服务
    // 可以考虑使用PDF.js或者后端API
    const text = await extractTextFromPDF(arrayBuffer)
    return convertTextToMarkdown(text)
  } catch (error) {
    console.error('PDF文档解析失败:', error)
    throw new Error('PDF文档解析失败，请检查文件格式')
  }
}

/**
 * 从PDF ArrayBuffer中提取文本（简化版本）
 * @param {ArrayBuffer} arrayBuffer - PDF文件的ArrayBuffer
 * @returns {Promise<string>} - 提取的文本
 */
async function extractTextFromPDF(arrayBuffer) {
  // 这里使用一个简化的PDF文本提取方法
  // 在实际项目中，建议使用PDF.js或后端服务
  try {
    // 导入PDF.js（如果可用）
    const pdfjsLib = await import('pdfjs-dist/build/pdf')
    
    // 设置worker路径
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      fullText += pageText + '\n\n'
    }
    
    return fullText
  } catch (error) {
    console.error('PDF解析失败，使用备用方法:', error)
    // 备用方法：返回提示信息
    return '# PDF文档\n\n无法直接解析PDF内容，请手动复制粘贴文本内容。\n\n建议：\n1. 使用PDF阅读器打开文件\n2. 选择并复制所需文本\n3. 粘贴到下方文本框中'
  }
}

/**
 * 将普通文本转换为基本的Markdown格式
 * @param {string} text - 普通文本
 * @returns {string} - Markdown格式文本
 */
function convertTextToMarkdown(text) {
  if (!text) return ''
  
  // 基本的文本到Markdown转换
  let markdown = text
    // 保留段落分隔
    .replace(/\n\s*\n/g, '\n\n')
    // 识别可能的标题（全大写或数字开头的行）
    .replace(/^([A-Z\s]{3,}|\d+\.\s+[^\n]+)$/gm, '## $1')
    // 识别列表项
    .replace(/^[\s]*[-•·]\s+/gm, '- ')
    .replace(/^[\s]*\d+[.).]\s+/gm, (match, offset, string) => {
      const num = match.match(/\d+/)[0]
      return `${num}. `
    })
  
  return markdown
}

/**
 * 根据文件类型选择合适的解析方法
 * @param {File} file - 要解析的文件
 * @returns {Promise<string>} - 解析后的Markdown文本
 */
export async function parseFile(file) {
  const fileName = file.name.toLowerCase()
  const fileType = file.type.toLowerCase()
  
  if (fileName.endsWith('.docx') || fileName.endsWith('.doc') || fileType.includes('word')) {
    return await parseWordDocument(file)
  } else if (fileName.endsWith('.pdf') || fileType.includes('pdf')) {
    return await parsePDFDocument(file)
  } else {
    throw new Error('不支持的文件格式，请选择Word文档(.doc, .docx)或PDF文件(.pdf)')
  }
}

/**
 * 格式化文本用于显示
 * @param {string} text - 要格式化的文本
 * @returns {string} - 格式化后的HTML
 */
export function formatTextForDisplay(text) {
  if (!text) return ''
  
  let formatted = text
    // 转换标题
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    // 转换粗体和斜体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 保持段落结构
    .replace(/\n\n/g, '</p><p>')
    // 转换单个换行为<br>
    .replace(/\n/g, '<br>')
  
  // 包装在段落标签中
  if (formatted && !formatted.startsWith('<')) {
    formatted = '<p>' + formatted + '</p>'
  }
  
  // 处理列表
  formatted = formatted
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
  
  // 包装连续的列表项
  formatted = formatted.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/gs, function(match) {
    return '<ul>' + match + '</ul>'
  })
  
  return formatted
}