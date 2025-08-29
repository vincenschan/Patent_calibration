<template>
  <div class="app-container">
    <NuxtRouteAnnouncer />
    
    <!-- 主页面 -->
    <div class="main-page">
      <!-- 校准页面 -->
      <div class="calibration-page">
        <h1 class="page-title">文字校准系统</h1>
        
        <!-- 第一行：导入框和导入按钮 -->
        <div class="import-section">
          <input 
            type="file" 
            ref="fileInput" 
            @change="handleFileImport" 
            accept=".doc,.docx,.pdf" 
            class="file-input" 
            id="file-input"
          />
          <label for="file-input" class="import-box">
            <span v-if="!selectedFile">点击选择文件或拖拽文件到此处</span>
            <span v-else>{{ selectedFile.name }}</span>
          </label>
          <button @click="importFile" class="import-btn" :disabled="!selectedFile">
            <span v-if="!importing">导入</span>
            <div v-else class="loading-spinner"></div>
          </button>
        </div>
        
        <!-- 第二行：开始审核按钮和导出按钮 -->
        <div class="review-section">
          <button @click="startReview" class="review-btn" :disabled="!textContent || reviewing">
            <span v-if="!reviewing">开始审核</span>
            <div v-else class="loading-spinner"></div>
          </button>
          <button @click="exportFile" class="export-btn" :disabled="!textContent">
            导出
          </button>
        </div>
        
        <!-- 文本展示框 -->
        <div class="text-display-container">
          <div 
             class="text-display" 
             contenteditable="true" 
             @paste="handlePaste"
             @input="handleTextInput"
             v-html="displayContent"
             placeholder="请粘贴文本或导入文件..."
           ></div>
           
           <!-- 批注统计信息 -->
           <div v-if="lastReviewTime" class="annotation-stats" :class="{ 'no-issues': annotationCount === 0 }">
             <div v-if="annotationCount > 0">
               📋 审核完成：发现 <strong>{{ annotationCount }}</strong> 个需要注意的问题
             </div>
             <div v-else>
               ✅ 审核完成：未发现明显问题
             </div>
             <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">
               最后审核时间：{{ lastReviewTime }}
             </div>
           </div>
        </div>
      </div>
      
      <!-- 左下角设置图标 -->
      <div class="settings-icon" @click="toggleSettings">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2579 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.01127 9.77251C4.28054 9.5799 4.48571 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      
      <!-- 设置面板 -->
      <div class="settings-panel" :class="{ 'show': showSettings }">
        <div class="settings-header">
          <h3>设置</h3>
          <button @click="toggleSettings" class="close-btn">×</button>
        </div>
        
        <div class="settings-content">
          <div class="setting-group">
            <label>LLM 模型</label>
            <select v-model="selectedModel" class="model-select">
              <option value="custom">自定义模型</option>
              <option value="kimi">Kimi</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          </div>
          
          <div class="setting-group">
            <label>API 地址</label>
            <input v-model="apiUrl" type="text" class="api-input" placeholder="请输入API地址" />
          </div>
          
          <div class="setting-group">
            <label>API Key</label>
            <input v-model="apiKey" type="password" class="api-input" placeholder="请输入API Key" />
          </div>
          
          <div class="setting-group">
            <label>Prompt</label>
            <textarea v-model="prompt" class="prompt-textarea" rows="6"></textarea>
          </div>
          
          <button @click="saveSettings" class="save-btn">保存设置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { parseFile, formatTextForDisplay } from '../utils/fileParser.js'
import { analyzeLLM, applyAnnotations, applyVisualAnnotations, mockLLMAnalysis } from '../utils/llmService.js'

// 响应式数据
const selectedFile = ref(null)
const importing = ref(false)
const reviewing = ref(false)
const textContent = ref('')
const displayContent = ref('')
const showSettings = ref(false)
const annotationCount = ref(0)
const lastReviewTime = ref(null)
const importedFileFormat = ref('') // 跟踪导入文件的格式
const annotatedContent = ref('') // 存储带批注的内容，用于导出

// 设置相关
const selectedModel = ref('custom')
const apiUrl = ref('')
const apiKey = ref('')
const prompt = ref('你是一位专业的专利审核助手，请根据你的专业逐句判断这个专利文字描述上有哪些方面不符合中国专利法以及审查指南的形式要求，不会使得中国专利局审查员发出补正通知书，不需要考虑新颖性和创造性的要求。如果有，请逐条列举出来，给出明确的分析和修改意见，如果没有，就忽略。不要总结。例如在权利要求书中，当出现多个名称的时候，不能出现"等"的情况。')

// 文件导入处理
const handleFileImport = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

// 导入文件
const importFile = async () => {
  if (!selectedFile.value) return
  
  importing.value = true
  try {
    // 记录文件格式
    const fileExtension = selectedFile.value.name.split('.').pop().toLowerCase()
    importedFileFormat.value = fileExtension
    
    // 解析文件内容
    const parsedContent = await parseFile(selectedFile.value)
    textContent.value = parsedContent
    // 直接使用原始内容，不进行格式化，让浏览器处理HTML
    displayContent.value = parsedContent.includes('<img') ? parsedContent : formatTextForDisplay(parsedContent)
    
    console.log('文件导入成功:', {
      fileName: selectedFile.value.name,
      fileFormat: importedFileFormat.value,
      contentLength: parsedContent.length,
      hasImages: parsedContent.includes('<img')
    })
    
  } catch (error) {
    console.error('文件导入失败:', error)
    alert(`文件导入失败: ${error.message}`)
  } finally {
    importing.value = false
  }
}

// 处理粘贴
const handlePaste = (event) => {
  // 保留原始格式
  setTimeout(() => {
    const element = event.target
    textContent.value = element.innerText
    displayContent.value = element.innerHTML
  }, 0)
}

// 处理文本输入
const handleTextInput = (event) => {
  const element = event.target
  textContent.value = element.innerText
  displayContent.value = element.innerHTML
}

// 开始审核
const startReview = async () => {
  if (!textContent.value) return
  
  reviewing.value = true
  try {
    let annotations = []
    
    // 检查是否配置了API
    if (apiKey.value && (apiUrl.value || selectedModel.value !== 'custom')) {
      // 使用真实的LLM API
      try {
        annotations = await analyzeLLM(textContent.value, prompt.value, {
          selectedModel: selectedModel.value,
          apiUrl: apiUrl.value,
          apiKey: apiKey.value
        })
      } catch (apiError) {
        console.warn('LLM API调用失败，使用模拟分析:', apiError)
        // 如果API调用失败，使用模拟分析
        annotations = await mockLLMAnalysis(textContent.value, prompt.value)
      }
    } else {
      // 使用模拟分析
      console.log('使用模拟LLM分析（未配置API）')
      annotations = await mockLLMAnalysis(textContent.value, prompt.value)
    }
    
    // 文本展示框显示带有视觉标记但不包含批注文字的内容
     displayContent.value = applyVisualAnnotations(textContent.value, annotations)
     // 存储完整批注内容用于导出
     annotatedContent.value = applyAnnotations(textContent.value, annotations)
     
     // 更新统计信息
     annotationCount.value = annotations.length
     lastReviewTime.value = new Date().toLocaleString()
     
     console.log(`审核完成，发现 ${annotations.length} 个问题`)
    
  } catch (error) {
    console.error('审核失败:', error)
    alert(`审核失败: ${error.message}`)
  } finally {
    reviewing.value = false
  }
}

// 切换设置面板
const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

// 保存设置
const saveSettings = () => {
  // 保存到本地存储
  localStorage.setItem('patent-calibration-settings', JSON.stringify({
    selectedModel: selectedModel.value,
    apiUrl: apiUrl.value,
    apiKey: apiKey.value,
    prompt: prompt.value
  }))
  
  alert('设置已保存')
}

// 加载设置
const loadSettings = () => {
  const saved = localStorage.getItem('patent-calibration-settings')
  if (saved) {
    const settings = JSON.parse(saved)
    selectedModel.value = settings.selectedModel || 'custom'
    apiUrl.value = settings.apiUrl || ''
    apiKey.value = settings.apiKey || ''
    prompt.value = settings.prompt || prompt.value
  }
}

// 导出Word文件
const exportToWord = () => {
  if (!textContent.value) return
  
  // 创建HTML内容
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>专利标定审核结果</title>
      <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin-bottom: 20px; }
        .annotation { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 2px 4px; position: relative; }
        .stats { margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>专利标定审核结果</h1>
        <p>生成时间：${new Date().toLocaleString()}</p>
      </div>
      <div class="content">
        ${annotatedContent.value || textContent.value}
      </div>
      ${annotationCount.value > 0 ? `
        <div class="stats">
          <h3>审核统计</h3>
          <p>发现问题数量：${annotationCount.value} 个</p>
          <p>最后审核时间：${lastReviewTime.value || '未审核'}</p>
        </div>
      ` : ''}
    </body>
    </html>
  `
  
  // 创建Blob并下载
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `专利标定审核结果_${new Date().toISOString().slice(0, 10)}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  alert('文件已导出为HTML格式，可以用Word打开并另存为.docx格式')
}

// 智能导出文件
const exportFile = () => {
  if (!textContent.value) return
  
  // 根据导入的文件格式选择导出方式
  if (importedFileFormat.value === 'pdf') {
    exportToPDF()
  } else {
    // 默认导出Word格式（包括doc、docx或其他格式）
    exportToWord()
  }
}

// 导出PDF文件
const exportToPDF = () => {
  if (!textContent.value) return
  
  // 使用浏览器的打印功能生成PDF
  const printWindow = window.open('', '_blank')
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>专利标定审核结果</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        body { 
          font-family: 'Microsoft YaHei', Arial, sans-serif; 
          line-height: 1.6; 
          margin: 20px; 
          color: #333;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .content { 
          margin-bottom: 20px; 
          font-size: 14px;
        }
        .annotation { 
          background-color: #fff3cd; 
          border-left: 4px solid #ffc107; 
          padding: 4px 8px; 
          margin: 2px 0;
          display: inline;
        }
        .stats { 
          margin-top: 30px; 
          padding: 15px; 
          background-color: #f8f9fa; 
          border: 1px solid #dee2e6;
          border-radius: 5px; 
        }
        .print-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin: 20px;
        }
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">打印/保存为PDF</button>
      <div class="header">
        <h1>专利标定审核结果</h1>
        <p>生成时间：${new Date().toLocaleString()}</p>
      </div>
      <div class="content">
        ${annotatedContent.value || textContent.value}
      </div>
      ${annotationCount.value > 0 ? `
        <div class="stats">
          <h3>审核统计</h3>
          <p>发现问题数量：${annotationCount.value} 个</p>
          <p>最后审核时间：${lastReviewTime.value || '未审核'}</p>
        </div>
      ` : ''}
    </body>
    </html>
  `
  
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.focus()
}

// 组件挂载时加载设置
onMounted(() => {
  loadSettings()
  setupAnnotationTooltips()
})

// 设置批注悬浮提示功能
const setupAnnotationTooltips = () => {
  let tooltip = null
  
  // 创建悬浮提示元素
  const createTooltip = () => {
    if (!tooltip) {
      tooltip = document.createElement('div')
      tooltip.className = 'annotation-tooltip-dynamic'
      tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.95);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 12px;
        line-height: 1.3;
        max-width: 400px;
        min-width: 300px;
        max-height: 120px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        pointer-events: none;
      `
      document.body.appendChild(tooltip)
    }
    return tooltip
  }
  
  // 显示悬浮提示
  const showTooltip = (element, content) => {
    const tooltipEl = createTooltip()
    tooltipEl.textContent = content
    
    const rect = element.getBoundingClientRect()
    const tooltipRect = tooltipEl.getBoundingClientRect()
    
    // 计算位置
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2
    let top = rect.top - tooltipRect.height - 10
    
    // 确保不超出视窗
    if (left < 10) left = 10
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10
    }
    if (top < 10) {
      top = rect.bottom + 10
    }
    
    tooltipEl.style.left = left + 'px'
    tooltipEl.style.top = top + 'px'
    tooltipEl.style.opacity = '1'
    tooltipEl.style.visibility = 'visible'
  }
  
  // 隐藏悬浮提示
  const hideTooltip = () => {
    if (tooltip) {
      tooltip.style.opacity = '0'
      tooltip.style.visibility = 'hidden'
    }
  }
  
  // 事件委托处理批注悬浮
  document.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('annotation')) {
      const content = e.target.getAttribute('data-annotation')
      if (content) {
        showTooltip(e.target, content)
      }
    }
  })
  
  document.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('annotation')) {
      hideTooltip()
    }
  })
}
</script>

<style scoped>
/* 全局样式 */
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.main-page {
  position: relative;
  min-height: 100vh;
  padding: 20px;
}

.calibration-page {
  max-width: 1200px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.page-title {
  text-align: center;
  color: #1565c0;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 40px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 导入区域 */
.import-section {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  align-items: center;
}

.file-input {
  display: none;
}

.import-box {
  flex: 1;
  padding: 20px;
  border: 2px dashed #42a5f5;
  border-radius: 12px;
  background: linear-gradient(135deg, #f3f9ff 0%, #e8f4fd 100%);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #1565c0;
  font-weight: 500;
}

.import-box:hover {
  border-color: #1976d2;
  background: linear-gradient(135deg, #e8f4fd 0%, #dbeafe 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 165, 245, 0.2);
}

.import-btn, .review-btn, .save-btn, .export-btn {
  padding: 12px 30px;
  background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-width: 120px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.import-btn:hover, .review-btn:hover, .save-btn:hover {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(25, 118, 210, 0.3);
}

.export-btn {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
}

.export-btn:hover {
  background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
}

.import-btn:disabled, .review-btn:disabled, .export-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 审核区域 */
.review-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.review-btn {
  font-size: 1.1rem;
  padding: 15px 40px;
  min-width: 150px;
}

/* 文本展示区域 */
.text-display-container {
  margin-top: 30px;
}

.text-display {
  width: 100%;
  min-height: 400px;
  padding: 25px;
  border: 2px solid #e3f2fd;
  border-radius: 15px;
  background: #fafafa;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
}

/* 图片样式 */
.text-display img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: block;
  text-align: center;
}

/* 标题样式 */
.text-display h1, .text-display h2, .text-display h3 {
  margin: 20px 0 10px 0;
  color: #2c3e50;
}

.text-display h1 {
  font-size: 24px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 8px;
}

.text-display h2 {
  font-size: 20px;
  color: #34495e;
}

.text-display h3 {
  font-size: 18px;
  color: #7f8c8d;
}

/* 段落样式 */
.text-display p {
  margin: 12px 0;
  text-align: justify;
  text-indent: 2em; /* 首行缩进 */
  line-height: 1.8;
}

/* 列表样式 */
.text-display ul, .text-display ol {
  margin: 12px 0;
  padding-left: 32px;
}

.text-display li {
  margin: 8px 0;
  line-height: 1.6;
}

/* 嵌套列表样式 */
.text-display ul ul, .text-display ol ol {
  margin: 4px 0;
  padding-left: 24px;
}

/* 引用块样式 */
.text-display blockquote {
  margin: 16px 0;
  padding: 12px 20px;
  border-left: 4px solid #3498db;
  background: rgba(52, 152, 219, 0.1);
  font-style: italic;
}

/* 代码块样式 */
.text-display pre {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  margin: 16px 0;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
}

.text-display code {
  background: #f8f9fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.text-display:focus {
  outline: none;
  border-color: #42a5f5;
  box-shadow: 0 0 20px rgba(66, 165, 245, 0.2);
}

.text-display[contenteditable]:empty:before {
  content: attr(placeholder);
  color: #999;
  font-style: italic;
}

/* 设置图标 */
.settings-icon {
  position: fixed;
  bottom: 30px;
  left: 30px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(25, 118, 210, 0.3);
  z-index: 1000;
}

.settings-icon:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 12px 35px rgba(25, 118, 210, 0.4);
}

.settings-icon svg {
  color: white;
  transition: transform 0.3s ease;
}

/* 设置面板 */
.settings-panel {
  position: fixed;
  bottom: 100px;
  left: 30px;
  width: 350px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(15px);
  transform: translateY(20px) scale(0.9);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 999;
  max-height: 70vh;
  overflow-y: auto;
}

.settings-panel.show {
  transform: translateY(0) scale(1);
  opacity: 1;
  visibility: visible;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px 15px;
  border-bottom: 1px solid #e3f2fd;
}

.settings-header h3 {
  margin: 0;
  color: #1565c0;
  font-size: 1.3rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.settings-content {
  padding: 20px 25px 25px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-group label {
  display: block;
  margin-bottom: 8px;
  color: #1565c0;
  font-weight: 500;
  font-size: 0.95rem;
}

.model-select, .api-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e3f2fd;
  border-radius: 10px;
  background: #fafafa;
  font-size: 14px;
  transition: all 0.3s ease;
}

.model-select:focus, .api-input:focus {
  outline: none;
  border-color: #42a5f5;
  background: white;
  box-shadow: 0 0 15px rgba(66, 165, 245, 0.1);
}

.prompt-textarea {
  width: 100%;
  padding: 15px;
  border: 2px solid #e3f2fd;
  border-radius: 10px;
  background: #fafafa;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
  min-height: 120px;
}

.prompt-textarea:focus {
  outline: none;
  border-color: #42a5f5;
  background: white;
  box-shadow: 0 0 15px rgba(66, 165, 245, 0.1);
}

/* 加载动画 */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calibration-page {
    padding: 20px;
    margin: 10px;
  }
  
  .import-section {
    flex-direction: column;
  }
  
  .settings-panel {
    width: calc(100vw - 60px);
    left: 30px;
    right: 30px;
  }
  
  .page-title {
    font-size: 2rem;
  }
}

/* 批注统计信息 */
.annotation-stats {
  margin-top: 15px;
  padding: 10px 15px;
  background: rgba(244, 67, 54, 0.1);
  border-left: 4px solid #f44336;
  border-radius: 4px;
  font-size: 14px;
  color: #d32f2f;
}

.annotation-stats.no-issues {
  background: rgba(76, 175, 80, 0.1);
  border-left-color: #4caf50;
  color: #388e3c;
}
</style>

<style>
/* 批注样式 - 全局样式，不使用scoped */
.annotation {
  background-color: rgba(244, 67, 54, 0.3) !important;
  position: relative;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: all 0.3s ease;
  display: inline;
}

.annotation:hover {
  background-color: rgba(244, 67, 54, 0.4) !important;
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

/* 批注指示器小点 */
.annotation-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 6px;
  height: 6px;
  background-color: #f44336;
  border-radius: 50%;
  border: 1px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

/* 悬浮提示现在通过JavaScript动态创建 */

/* 确保悬浮窗口在文本上方显示 */
.annotation:hover .annotation-indicator {
  background-color: #d32f2f;
  transform: scale(1.2);
  transition: all 0.2s ease;
}

/* 确保批注在文本框中正确显示 */
.text-display .annotation {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

/* 批注计数器 */
.annotation-counter {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f44336;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
</style>
