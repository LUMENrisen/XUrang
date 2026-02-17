---
title: 运行脚本
pubDate: 2026-02-16
description: 关于长风的一切
tags: 

- 风来
person: 路明

---

## 📌 主要改进点

- **文件名中的序号**：现在使用原始对话中的序号（从 `START_FROM` 开始）作为三位数前缀，例如 `017_用户消息前50字.md`、`018_...`。
- **ZIP文件名**：仍然包含范围后缀，如 `【对话】本地部署AI (17~19).zip`。
- **索引文件**：列表序号从1开始重新编号，方便阅读导出部分的顺序。

## 🚀 使用示例

- 如果想从第17条开始导出，设置 `START_FROM = 17`，运行后得到的文件如：
  - `017_用户消息预览.md`
  - `018_用户消息预览.md`
  - `019_用户消息预览.md`
- 索引文件 `【标题】本地部署AI.md` 中会显示：
  
  ```
  1. 用户消息预览（第17条）...
  2. 用户消息预览（第18条）...
  3. 用户消息预览（第19条）...
  ```
  

```javascript
(function() {
  console.log('🔍 开始导出对话（分支基于用户消息，文件名保留原始序号）...');

  // ========== 可配置参数 ==========
  const TITLE_SELECTOR = 'div.afa34042.e37a04e4.e0a1edb7';
  const BRANCH_SELECTOR = '.dd7e4fda';
  const BRANCH_CONTAINER = '._17e14c5';
  const INDEX_FIXED_PREFIX = '【标题】';
  const START_FROM = 1;  // <--- 修改这里：从第几条用户消息开始导出（1表示第一条）
  // ================================

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

  function userMessageHasBranch(userElement) {
    const wrapper = userElement.closest('._9663006');
    if (!wrapper) return false;
    const branchContainer = wrapper.querySelector(BRANCH_CONTAINER);
    if (branchContainer) {
      const indicator = branchContainer.querySelector(BRANCH_SELECTOR);
      if (indicator && /^\d+\s*\/\s*\d+$/.test(indicator.textContent.trim())) {
        return true;
      }
    }
    return false;
  }

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

  function filterGroupsFrom(groups, startFrom) {
    if (startFrom < 1) startFrom = 1;
    if (startFrom > groups.length) {
      alert(`起始序号 ${startFrom} 超出总组数 ${groups.length}，请修改 START_FROM 值。`);
      return [];
    }
    return groups.slice(startFrom - 1);
  }

  // 修改：使用原始序号 originalIndex 作为文件名前缀
  function generateFilename(userContent, existingNames, originalIndex) {
    const paddedIndex = String(originalIndex).padStart(3, '0');
    if (!userContent || userContent.trim() === '') {
      let filename = `【无文字】${paddedIndex}.md`;
      while (existingNames.has(filename)) {
        // 理论上不会重名，因为原始序号唯一
        filename = `【无文字】${paddedIndex}_${Date.now()}.md`;
      }
      existingNames.add(filename);
      return filename;
    } else {
      let safe = userContent.slice(0, 50).replace(/[\\/*?:"<>|]/g, '').replace(/\s+/g, '_');
      if (!safe) safe = '消息';
      let filename = `${paddedIndex}_${safe}.md`;
      let counter = 1;
      while (existingNames.has(filename)) {
        filename = `${paddedIndex}_${safe}_${counter}.md`;
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

  function generateIndex(filteredGroups, conversationTitle) {
    let index = `导出时间：${new Date().toLocaleString()}\n`;
    index += `总轮次：${filteredGroups.length}\n\n`;

    filteredGroups.forEach((group, i) => {
      const seq = i + 1;
      let preview = group.userContent || '(无文字)';
      preview = preview.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      preview = preview.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');

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

    const allGroups = groupByUserMessages(messages);
    const totalGroups = allGroups.length;
    console.log(`📦 原始总组数: ${totalGroups}`);

    const filteredGroups = filterGroupsFrom(allGroups, START_FROM);
    if (filteredGroups.length === 0) return;

    const startFrom = START_FROM;
    const endAt = startFrom + filteredGroups.length - 1;
    console.log(`📦 导出范围: 第 ${startFrom} ~ ${endAt} 组（共 ${filteredGroups.length} 组）`);

    const zip = new JSZip();
    const usedFilenames = new Set();

    filteredGroups.forEach((group, idx) => {
      const originalIndex = START_FROM + idx; // 原始序号
      const filename = generateFilename(group.userContent, usedFilenames, originalIndex);
      group.filename = filename; // 用于索引中（但索引中不显示文件名，所以可忽略）
      zip.file(filename, generateGroupContent(group));
    });

    const safeTitle = conversationTitle.replace(/[\\/*?:"<>|]/g, '').replace(/\s+/g, '_');
    const indexFilename = `${INDEX_FIXED_PREFIX}${safeTitle}.md`;
    const indexContent = generateIndex(filteredGroups, conversationTitle);
    zip.file(indexFilename, indexContent);

    const rangeSuffix = ` (${startFrom}~${endAt})`;
    const zipFileName = `【对话】${safeTitle}${rangeSuffix}.zip`;

    zip.generateAsync({ type: 'blob' }).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = zipFileName;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
      alert(`✅ 导出成功！共 ${filteredGroups.length} 组，范围 ${startFrom}~${endAt}。`);
    });
  });
})();
```