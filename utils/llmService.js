/**
 * LLM分析服务
 * 支持多种LLM模型的文本分析和批注功能
 */

/**
 * 预定义的API配置
 */
const API_CONFIGS = {
  kimi: {
    baseURL: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k'
  },
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat'
  },
  custom: {
    baseURL: '',
    model: 'gpt-3.5-turbo'
  }
}

/**
 * 调用LLM API进行文本分析
 * @param {string} text - 要分析的文本
 * @param {string} prompt - 分析提示词
 * @param {Object} config - API配置
 * @returns {Promise<Array>} - 分析结果数组
 */
export async function analyzeLLM(text, prompt, config) {
  try {
    const { selectedModel, apiUrl, apiKey } = config
    
    if (!apiKey) {
      throw new Error('请先配置API Key')
    }
    
    // 获取API配置
    const apiConfig = API_CONFIGS[selectedModel] || API_CONFIGS.custom
    const baseURL = selectedModel === 'custom' ? apiUrl : apiConfig.baseURL
    
    if (!baseURL) {
      throw new Error('请配置API地址')
    }
    
    // 构建请求
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的专利审查员，请仔细分析提供的专利文本，识别其中可能存在的问题并提供修改建议。'
          },
          {
            role: 'user',
            content: `请分析以下专利文本：\n\n${text}\n\n分析要求：${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API响应错误:', errorText)
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('LLM API响应:', data)
    
    const analysisResult = data.choices?.[0]?.message?.content || ''
    
    if (!analysisResult) {
      console.warn('LLM返回了空的分析结果，使用备用分析')
      return createFallbackAnnotations('LLM分析结果为空', text)
    }
    
    console.log('LLM分析结果:', analysisResult)
    // 解析分析结果并生成批注
    const annotations = parseAnalysisResult(analysisResult, text)
    console.log('解析后的批注:', annotations)
    return annotations
    
  } catch (error) {
    console.error('LLM分析失败:', error)
    throw error
  }
}

/**
 * 解析LLM分析结果，提取问题片段和批注
 * @param {string} analysisResult - LLM分析结果
 * @param {string} originalText - 原始文本
 * @returns {Array} - 解析后的批注数组
 */
function parseAnalysisResult(analysisResult, originalText) {
  const annotations = []
  
  try {
    // 清理LLM返回结果中的HTML标签
    const cleanedResult = analysisResult.replace(/<\/?[^>]+(>|$)/g, '').replace(/&nbsp;/g, ' ')
    
    // 尝试解析结构化的分析结果
    // 假设LLM返回的格式包含问题片段和建议
    const lines = cleanedResult.split('\n').filter(line => line.trim())
    
    let currentIssue = null
    
    for (const line of lines) {
      // 识别问题片段（通常以引号或特定标记开始）
      const quotedMatch = line.match(/[""'']([^""'']+)[""'']/)
      if (quotedMatch) {
        const problemText = quotedMatch[1]
        const textIndex = originalText.indexOf(problemText)
        
        if (textIndex !== -1) {
          currentIssue = {
            text: problemText,
            startIndex: textIndex,
            endIndex: textIndex + problemText.length,
            issues: []
          }
        }
      }
      
      // 识别问题描述和建议
      if (currentIssue && (line.includes('问题') || line.includes('建议') || line.includes('修改'))) {
        currentIssue.issues.push(line.trim())
      }
      
      // 如果找到了完整的问题描述，添加到结果中
      if (currentIssue && currentIssue.issues.length > 0 && 
          (line.trim() === '' || lines.indexOf(line) === lines.length - 1)) {
        annotations.push({
          ...currentIssue,
          annotation: currentIssue.issues.join('\n')
        })
        currentIssue = null
      }
    }
    
    // 如果没有找到结构化的结果，尝试简单的文本匹配
    if (annotations.length === 0) {
      return createFallbackAnnotations(analysisResult, originalText)
    }
    
    return annotations
    
  } catch (error) {
    console.error('解析分析结果失败:', error)
    return createFallbackAnnotations(analysisResult, originalText)
  }
}

/**
 * 创建备用的批注（当无法解析结构化结果时）
 * @param {string} analysisResult - 分析结果
 * @param {string} originalText - 原始文本
 * @returns {Array} - 批注数组
 */
function createFallbackAnnotations(analysisResult, originalText) {
  // 清理LLM返回结果中的HTML标签
  const cleanedResult = analysisResult.replace(/<\/?[^>]+(>|$)/g, '').replace(/&nbsp;/g, ' ')
  
  // 简单的关键词匹配，标记可能有问题的片段
  const problemKeywords = ['等', '及其他', '诸如', '比如', '例如', '包括但不限于']
  const annotations = []
  
  for (const keyword of problemKeywords) {
    let index = originalText.indexOf(keyword)
    while (index !== -1) {
      // 找到包含关键词的句子
      const sentenceStart = Math.max(0, originalText.lastIndexOf('。', index) + 1)
      const sentenceEnd = originalText.indexOf('。', index)
      const sentence = originalText.substring(sentenceStart, sentenceEnd !== -1 ? sentenceEnd + 1 : originalText.length)
      
      annotations.push({
        text: sentence.trim(),
        startIndex: sentenceStart,
        endIndex: sentenceEnd !== -1 ? sentenceEnd + 1 : originalText.length,
        annotation: `检测到可能的问题：使用了"${keyword}"等不确定性表述。\n\n建议：在专利申请中应避免使用不确定性的表述，建议具体列举或使用更精确的描述。\n\nLLM分析结果：\n${cleanedResult}`
      })
      
      index = originalText.indexOf(keyword, index + 1)
    }
  }
  
  // 如果没有找到关键词，创建一个通用的批注
  if (annotations.length === 0) {
    annotations.push({
      text: originalText.substring(0, Math.min(100, originalText.length)),
      startIndex: 0,
      endIndex: Math.min(100, originalText.length),
      annotation: `LLM分析结果：\n${cleanedResult}`
    })
  }
  
  // 如果没有找到任何问题，创建一些示例批注用于测试
  if (annotations.length === 0 && text.length > 0) {
    const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 10)
    
    if (sentences.length > 0) {
      // 随机选择1-3个句子进行批注
      const numAnnotations = Math.min(3, Math.max(1, Math.floor(sentences.length / 3)))
      const selectedIndices = []
      
      for (let i = 0; i < numAnnotations; i++) {
        let randomIndex
        do {
          randomIndex = Math.floor(Math.random() * sentences.length)
        } while (selectedIndices.includes(randomIndex))
        selectedIndices.push(randomIndex)
        
        const sentence = sentences[randomIndex].trim()
        const startIndex = text.indexOf(sentence)
        
        if (startIndex !== -1) {
          annotations.push({
            text: sentence,
            startIndex: startIndex,
            endIndex: startIndex + sentence.length,
            annotation: `专利审查建议：\n\n此句表述可以进一步优化，建议：\n1. 确保技术术语的准确性\n2. 避免使用模糊或不确定的表述\n3. 保持逻辑清晰和结构完整\n\n当前句子："${sentence}"`
          })
        }
      }
    }
  }
  
  console.log(`模拟LLM分析完成，生成 ${annotations.length} 个批注`)
  return annotations
}

/**
 * 将批注应用到文本中，生成带有标注的HTML
 * @param {string} originalText - 原始文本
 * @param {Array} annotations - 批注数组
 * @returns {string} - 带有批注的HTML
 */
export function applyAnnotations(originalText, annotations) {
  if (!annotations || annotations.length === 0) {
    return originalText.replace(/\n/g, '<br>')
  }
  
  // 按照起始位置排序，从后往前处理避免位置偏移
  const sortedAnnotations = [...annotations].sort((a, b) => b.startIndex - a.startIndex)
  
  let result = originalText
  
  for (let i = 0; i < sortedAnnotations.length; i++) {
    const annotation = sortedAnnotations[i]
    const { startIndex, endIndex, text, annotation: comment } = annotation
    
    // 确保索引有效
    if (startIndex >= 0 && endIndex <= result.length && startIndex < endIndex) {
      const beforeText = result.substring(0, startIndex)
      const annotatedText = result.substring(startIndex, endIndex)
      const afterText = result.substring(endIndex)
      
      // 创建带有批注的HTML，只对HTML特殊字符进行转义，保留中文字符
      const safeComment = comment.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
      const safeAnnotatedText = annotatedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const safeCommentForTooltip = comment.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      
      const annotatedHTML = `<span class="annotation" data-annotation="${safeComment}" data-index="${i}">${safeAnnotatedText}<span class="annotation-indicator"></span></span>`
      
      result = beforeText + annotatedHTML + afterText
    }
  }
  
  return result.replace(/\n/g, '<br>')
}

/**
 * 将批注应用到文本中，只生成视觉标记，不显示批注文字
 * @param {string} originalText - 原始文本
 * @param {Array} annotations - 批注数组
 * @returns {string} - 带有视觉标记但无批注文字的HTML
 */
export function applyVisualAnnotations(originalText, annotations) {
  if (!annotations || annotations.length === 0) {
    return originalText.replace(/\n/g, '<br>')
  }
  
  // 按照起始位置排序，从后往前处理避免位置偏移
  const sortedAnnotations = [...annotations].sort((a, b) => b.startIndex - a.startIndex)
  
  let result = originalText
  
  for (let i = 0; i < sortedAnnotations.length; i++) {
    const annotation = sortedAnnotations[i]
    const { startIndex, endIndex, text, annotation: comment } = annotation
    
    // 确保索引有效
    if (startIndex >= 0 && endIndex <= result.length && startIndex < endIndex) {
      const beforeText = result.substring(0, startIndex)
      const annotatedText = result.substring(startIndex, endIndex)
      const afterText = result.substring(endIndex)
      
      // 创建只有视觉标记的HTML，保留悬浮提示功能但不显示批注文字
      const safeComment = comment.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
      const safeAnnotatedText = annotatedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const safeCommentForTooltip = comment.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      
      const annotatedHTML = `<span class="annotation" data-annotation="${safeComment}" data-index="${i}">${safeAnnotatedText}<span class="annotation-indicator"></span><span class="annotation-tooltip">${safeCommentForTooltip}</span></span>`
      
      result = beforeText + annotatedHTML + afterText
    }
  }
  
  return result.replace(/\n/g, '<br>')
}

/**
 * 转义HTML字符
 * @param {string} text - 要转义的文本
 * @returns {string} - 转义后的文本
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 模拟LLM分析（用于演示和测试）
 * @param {string} text - 要分析的文本
 * @param {string} prompt - 分析提示词
 * @returns {Promise<Array>} - 模拟的分析结果
 */
export async function mockLLMAnalysis(text, prompt) {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const annotations = []
  
  // 查找常见的专利写作问题
  const issues = [
    { keyword: '等', message: '在权利要求书中不应使用"等"字，应具体列举所有要素。' },
    { keyword: '及其他', message: '"及其他"表述不够具体，建议明确列举。' },
    { keyword: '诸如', message: '"诸如"等举例性表述在权利要求中应谨慎使用。' },
    { keyword: '比如', message: '"比如"等口语化表述不适合在专利文件中使用。' },
    { keyword: '包括但不限于', message: '"包括但不限于"在权利要求中可能导致保护范围不明确。' },
    { keyword: '可以', message: '"可以"表述不够确定，建议使用"能够"或"用于"。' },
    { keyword: '大概', message: '"大概"等不确定表述不适合在专利文件中使用。' },
    { keyword: '大约', message: '"大约"等模糊表述应避免，建议给出具体数值范围。' },
    { keyword: '一般', message: '"一般"等泛化表述缺乏具体性。' },
    { keyword: '通常', message: '"通常"等表述在专利中应谨慎使用。' }
  ]
  
  for (const issue of issues) {
    let index = text.indexOf(issue.keyword)
    while (index !== -1) {
      // 找到包含关键词的句子
      const sentenceStart = Math.max(0, text.lastIndexOf('。', index) + 1, text.lastIndexOf('\n', index) + 1)
      const sentenceEnd = Math.min(
        text.indexOf('。', index) !== -1 ? text.indexOf('。', index) + 1 : text.length,
        text.indexOf('\n', index) !== -1 ? text.indexOf('\n', index) : text.length
      )
      
      const sentence = text.substring(sentenceStart, sentenceEnd).trim()
      
      if (sentence.length > 0) {
        annotations.push({
          text: sentence,
          startIndex: sentenceStart,
          endIndex: sentenceEnd,
          annotation: `问题：${issue.message}\n\n建议：请修改为更具体和明确的表述，避免使用不确定性词汇。`
        })
      }
      
      index = text.indexOf(issue.keyword, index + 1)
    }
  }
  
  return annotations
}