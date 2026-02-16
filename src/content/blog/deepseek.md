---
title: 运行脚本
pubDate: 2026-02-16
description: 关于长风的一切
tags: 

- 风来
person: 路明

---

## DeepSeek 对话导出脚本使用说明

### 📌 脚本功能

本脚本用于从 **DeepSeek 网页版** 导出当前分支的对话，生成一个 ZIP 压缩包，包含：

- **索引文档**：以 `【标题】对话标题.md` 命名，包含有序列表，每项格式为 `序号. ● 用户消息预览`（● 表示该用户消息存在分支），以及用户附件列表（缩进展示）。
- **分组文档**：每个用户消息及其对应的 AI 回复组成一个独立的 Markdown 文档，文件名以用户消息前 50 字符命名（空消息则命名为 `【无文字】三位序号.md`）。文档内容只包含 AI 的思考和回答（及 AI 附件），不包含用户消息正文。

### 🚀 使用方法

#### 1. 准备工作

- 使用 **Chrome / Edge 浏览器**，打开 DeepSeek 网页，进入你想导出的对话页面。
- 确保该对话是你想导出的**分支**（如果有多个分支，请先手动切换到对应分支）。
- 如果对话中有图片、文件等附件，脚本会提取其**文件名**（仅用于索引），但不会下载实际文件。如需保存附件，请手动下载。

#### 2. 运行脚本

1. 按 **F12** 打开开发者工具，点击 **Console**（控制台）标签。
2. 将下方完整脚本代码**复制**，粘贴到控制台中，然后按 **Enter** 执行。
3. 等待几秒钟，脚本会自动处理并下载一个 ZIP 文件，文件名为 `【对话】对话标题.zip`。

#### 3. 查看输出

- 解压 ZIP 文件，得到若干 `.md` 文件。
- **索引文件**：`【标题】对话标题.md`，打开可查看所有分组的预览、分支标记和附件信息。
- **分组文件**：每个文件对应一次用户消息及其 AI 回复，文件名见索引。

### 📂 输出文件结构

```
【对话】对话标题.zip
├── 【标题】对话标题.md          # 索引文档
├── 用户消息前50字符.md          # 第1组
├── 用户消息前50字符_1.md        # 第2组（如有重名）
├── 用户消息前50字符_2.md
└── 【无文字】001.md             # 无文字内容的用户消息组
```

### ⚠️ 注意事项

- **分支标记**：脚本会根据用户消息所在容器是否包含分支控件（`2/2` 等）自动添加 `●` 标记。仅当该用户消息有多个分支变体时才会标记。
- **附件处理**：
  - **用户附件**（如图片、文件）只会在索引文档中列出文件名，不包含实际内容。
  - **AI 附件**（如果有）会出现在对应分组文档的末尾，以 `## 📎 AI附件` 标题展示。
- **空消息处理**：如果用户消息只有附件而没有文字内容，文件名会统一为 `【无文字】三位序号.md`，索引预览显示为 `(无文字)`。
- **多分支导出**：此脚本仅导出**当前可见分支**的对话。如果同一用户消息有多个分支（如 `2/2`），你需要手动切换到每个分支后分别运行脚本，得到多个 ZIP 文件。
- **格式保留**：AI 回答中的代码块、列表、加粗等格式会转换为 Markdown 语法，在 Obsidian 等编辑器中可正常渲染。

### ❓ 常见问题

**Q：脚本运行后没有反应？**  
A：请检查控制台是否有报错。常见原因：网络问题导致 JSZip 加载失败，或页面中未找到 `.ds-message` 元素。刷新页面后重试。

**Q：索引中的预览内容有乱码或 HTML 标签？**  
A：脚本已对特殊字符（如 `<`、`>`、`&`）进行转义，如果仍有异常，可能是页面结构有变。请提供控制台输出和示例 HTML，以便更新脚本。

**Q：分支标记不准确？**  
A：脚本根据 `._9663006` 容器内的 `._17e14c5` 判断分支。如果页面结构变化，标记可能失效。此时可手动检查并反馈。

**Q：如何导出所有分支？**  
A：手动点击分支切换按钮（如 `2/2`），每次切换后运行一次脚本，得到多个 ZIP 文件。后续可手动合并或使用 AI 整理。

### 📝 脚本代码

```javascript
(function() {
  console.log('🔍 开始导出对话（分支基于用户消息）...');

  // ========== 配置 ==========
  const TITLE_SELECTOR = 'div.afa34042.e37a04e4.e0a1edb7';
  const BRANCH_SELECTOR = '.dd7e4fda';
  const BRANCH_CONTAINER = '._17e14c5'; // 分支控件所在容器
  const INDEX_FIXED_PREFIX = '【标题】';
  // ==========================

  function loadJSZip(callback) {
    if (window.JSZip) { callback(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = callback;
    script.onerror = () => alert('无法加载JSZip库');
    document.head.appendChild(script);
  }

  function getConversationTitle() {
    const el = document.querySelector(TITLE_SELECTOR);
    return el ? el.textContent.trim() : '对话导出';
  }

  // ---------- 检查用户消息是否有分支（基于用户消息元素）----------
  function userMessageHasBranch(userElement) {
    const wrapper = userElement.closest('._9663006');
    if (!wrapper) return false;
    const branchContainer = wrapper.querySelector(BRANCH_CONTAINER);
    if (branchContainer) {
      const indicator = branchContainer.querySelector(BRANCH_SELECTOR);
      if (indicator && /^\d+\s*\/\s*\d+$/.test(indicator.textContent.trim())) {
        console.log('✅ 用户消息有分支:', indicator.textContent.trim());
        return true;
      }
    }
    console.log('❌ 用户消息无分支');
    return false;
  }

  // 提取附件（仅文件名）
  function extractAttachments(messageEl) {
    const attachments = [];
    messageEl.querySelectorAll('._789aea7').forEach(container => {
      const nameDiv = container.querySelector('.f3a54b52');
      if (nameDiv) {
        attachments.push(nameDiv.textContent.trim());
      }
    });
    return attachments;
  }

  // HTML 转 Markdown
  function htmlToMarkdown(html) {
    if (!html) return '';
    let text = html;
    text = text.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (m, c) => '\n```\n' + c.replace(/<[^>]*>/g, '') + '\n```\n');
    text = text.replace(/<code>([^<]+)<\/code>/g, '`$1`');
    text = text.replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**').replace(/<b>([\s\S]*?)<\/b>/g, '**$1**');
    text = text.replace(/<em>([\s\S]*?)<\/em>/g, '*$1*').replace(/<i>([\s\S]*?)<\/i>/g, '*$1*');
    for (let i = 1; i <= 6; i++) {
      const r = new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\\/h${i}>`, 'g');
      text = text.replace(r, (m, c) => '\n' + '#'.repeat(i) + ' ' + c.replace(/<[^>]*>/g, '') + '\n');
    }
    text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)');
    text = text.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, '![$2]($1)');
    text = text.replace(/<img[^>]*src="([^"]*)"[^>]*>/g, '![图片]($1)');
    text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, (m, l) => {
      const items = (l.match(/<li[^>]*>([\s\S]*?)<\/li>/g) || []).map(i => '- ' + htmlToMarkdown(i.replace(/<li[^>]*>|<\/li>/g, '')));
      return '\n' + items.join('\n') + '\n';
    });
    text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (m, l) => {
      const items = (l.match(/<li[^>]*>([\s\S]*?)<\/li>/g) || []).map((i, idx) => (idx+1) + '. ' + htmlToMarkdown(i.replace(/<li[^>]*>|<\/li>/g, '')));
      return '\n' + items.join('\n') + '\n';
    });
    text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '\n\n$1\n\n');
    text = text.replace(/<br\s*\/?>/g, '\n');
    text = text.replace(/<[^>]*>/g, '');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
  }

  function extractMarkdown(container) {
    if (!container) return '';
    const clone = container.cloneNode(true);
    clone.querySelectorAll('.ds-icon-button, .db183363, .d4910adc, .e7367035, .ds-focus-ring').forEach(el => el.remove());
    return htmlToMarkdown(clone.innerHTML);
  }

  function extractPlainText(container) {
    if (!container) return '';
    const clone = container.cloneNode(true);
    clone.querySelectorAll('.ds-icon-button, .db183363, .d4910adc, .e7367035, .ds-focus-ring').forEach(el => el.remove());
    return clone.textContent.trim().replace(/\s+/g, ' ');
  }

  function processMessages() {
    const messageElements = Array.from(document.querySelectorAll('.ds-message'));
    if (!messageElements.length) { alert('未找到消息'); return []; }
    const messages = [];

    messageElements.forEach(el => {
      let role = el.classList.contains('d29f3d7d') ? 'user' : 'assistant';
      if (!role && el.textContent.trim().startsWith('已思考')) role = 'assistant';

      let content = '';
      let think = '';
      const attachments = extractAttachments(el);

      if (role === 'user') {
        const userDiv = el.querySelector('.fbb737a4');
        content = userDiv ? extractPlainText(userDiv) : extractPlainText(el);
      } else {
        const thinkDiv = el.querySelector('.ds-think-content');
        if (thinkDiv) {
          think = extractMarkdown(thinkDiv);
        } else {
          const fullText = el.textContent.trim();
          if (fullText.startsWith('已思考')) {
            const match = fullText.match(/^(已思考（用时 [^）]+秒）)([\s\S]*)/);
            if (match) think = match[1].trim();
          }
        }
        let answerDiv = null;
        const allMarkdowns = el.querySelectorAll('.ds-markdown');
        for (let md of allMarkdowns) {
          if (!md.closest('.ds-think-content')) {
            answerDiv = md;
            break;
          }
        }
        if (answerDiv) {
          content = extractMarkdown(answerDiv);
        } else {
          let fullText = el.textContent.trim();
          if (fullText.startsWith('已思考')) {
            const match = fullText.match(/^(已思考（用时 [^）]+秒）)([\s\S]*)/);
            content = match ? match[2].trim() : fullText;
          } else {
            content = fullText;
          }
        }
      }

      messages.push({ role, content, think, attachments, element: el });
    });

    return messages;
  }

  function groupByUserMessages(messages) {
    const groups = [];
    let currentGroup = null;

    messages.forEach(msg => {
      if (msg.role === 'user') {
        if (currentGroup && currentGroup.userContent) groups.push(currentGroup);
        currentGroup = {
          userContent: msg.content,
          userAttachments: msg.attachments,
          userElement: msg.element,
          aiContent: '',
          aiThink: '',
          aiAttachments: [],
          hasBranch: userMessageHasBranch(msg.element)
        };
      } else {
        if (currentGroup) {
          if (msg.think) currentGroup.aiThink += (currentGroup.aiThink ? '\n\n' : '') + msg.think;
          if (msg.content) currentGroup.aiContent += (currentGroup.aiContent ? '\n\n' : '') + msg.content;
          if (msg.attachments.length) currentGroup.aiAttachments.push(...msg.attachments);
        }
      }
    });
    if (currentGroup && currentGroup.userContent) groups.push(currentGroup);
    return groups;
  }

  function generateFilename(userContent, existingNames, index) {
    if (!userContent || userContent.trim() === '') {
      let filename = `【无文字】${String(index).padStart(3, '0')}.md`;
      while (existingNames.has(filename)) {
        filename = `【无文字】${String(++index).padStart(3, '0')}.md`;
      }
      existingNames.add(filename);
      return filename;
    } else {
      let safe = userContent.slice(0, 50).replace(/[\\/*?:"<>|]/g, '').replace(/\s+/g, '_');
      if (!safe) safe = '消息';
      let filename = safe + '.md';
      let counter = 1;
      while (existingNames.has(filename)) {
        filename = `${safe}_${counter}.md`;
        counter++;
      }
      existingNames.add(filename);
      return filename;
    }
  }

  function generateGroupContent(group) {
    let content = '';
    if (group.aiThink) content += `## 💭 思考\n\n${group.aiThink}\n\n`;
    if (group.aiContent) content += `## 🤖 回答\n\n${group.aiContent}\n\n`;
    if (group.aiAttachments.length) {
      content += `## 📎 AI附件\n${group.aiAttachments.map(a => `- ${a}`).join('\n')}\n`;
    }
    return content;
  }

  function generateIndex(groups, conversationTitle) {
    let index = `导出时间：${new Date().toLocaleString()}\n`;
    index += `总轮次：${groups.length}\n\n`;

    groups.forEach((group, i) => {
      const seq = i + 1;
      let preview = group.userContent || '(无文字)';
      preview = preview.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      preview = preview.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');

      // 使用 ● 标记有分支的对话
      const branchMark = group.hasBranch ? ' ●' : '';

      index += `${seq}.${branchMark} ${preview}\n`;

      if (group.userAttachments.length) {
        const uniqueAttachments = [...new Set(group.userAttachments)];
        index += `    附件：\n`;
        uniqueAttachments.forEach(fileName => {
          index += `        - ${fileName}\n`;
        });
      }
    });
    return index;
  }

  loadJSZip(() => {
    const conversationTitle = getConversationTitle();
    console.log(`📌 对话标题: ${conversationTitle}`);

    const messages = processMessages();
    if (!messages.length) return;

    const groups = groupByUserMessages(messages);
    console.log(`📦 共 ${groups.length} 组`);

    const zip = new JSZip();
    const usedFilenames = new Set();

    groups.forEach((group, idx) => {
      const filename = generateFilename(group.userContent, usedFilenames, idx + 1);
      group.filename = filename;
      zip.file(filename, generateGroupContent(group));
    });

    const safeTitle = conversationTitle.replace(/[\\/*?:"<>|]/g, '').replace(/\s+/g, '_');
    const indexFilename = `${INDEX_FIXED_PREFIX}${safeTitle}.md`;
    const indexContent = generateIndex(groups, conversationTitle);
    zip.file(indexFilename, indexContent);

    zip.generateAsync({ type: 'blob' }).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `【对话】${safeTitle}.zip`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
      alert(`✅ 导出成功！共 ${groups.length} 组。`);
    });
  });
})();
```