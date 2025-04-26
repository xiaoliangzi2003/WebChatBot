// 全局变量，存储聊天历史
let messages = [
    { role: "system", content: "You are a helpful assistant" }
];

// 是否正在等待机器人回复的标志
let isWaitingForResponse = false;

// 当前聊天ID
let currentChatId = null;

// DOM 元素
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const newChatBtn = document.getElementById('new-chat-btn');
const sidebarChats = document.querySelector('.sidebar-chats');
const chatWelcome = document.querySelector('.chat-welcome');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 加载聊天历史
    loadChatHistory();
    
    // 自动聚焦到输入框
    userInput.focus();
    
    // 发送按钮点击事件
    sendButton.addEventListener('click', sendMessage);
    
    // 新对话按钮
    newChatBtn.addEventListener('click', startNewChat);
    
    // 输入框回车键事件
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // 阻止默认的换行行为
            sendMessage();
        }
    });
    
    // 输入框自动调整高度
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight < 120) ? 
            userInput.scrollHeight + 'px' : '120px';
    });
});

// 加载聊天历史
async function loadChatHistory() {
    try {
        const response = await fetch('/api/history');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status === 'success') {
            renderChatHistory(data.history);
        }
    } catch (error) {
        console.error('加载聊天历史时出错:', error);
    }
}

// 渲染聊天历史到侧边栏
function renderChatHistory(historyList) {
    sidebarChats.innerHTML = '';
    
    historyList.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'sidebar-chat';
        chatItem.dataset.chatId = chat.id;
        
        // 格式化日期
        const date = new Date(chat.updated_at * 1000);
        const dateStr = new Intl.DateTimeFormat('zh-CN', {
            month: 'numeric',
            day: 'numeric',
        }).format(date);
        
        chatItem.innerHTML = `
            <i class="far fa-comment"></i>
            <span>${chat.title || '未命名对话'}</span>
            <small class="chat-date">${dateStr}</small>
        `;
        
        chatItem.addEventListener('click', () => loadChat(chat.id));
        sidebarChats.appendChild(chatItem);
    });
}

// 加载特定聊天
async function loadChat(chatId) {
    try {
        // 如果已经在这个聊天中，不做任何操作
        if (currentChatId === chatId) return;
        
        const response = await fetch(`/api/history/${chatId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status === 'success') {
            // 更新当前聊天ID
            currentChatId = chatId;
            
            // 更新消息列表
            messages = data.chat.messages;
            
            // 清空聊天界面
            chatMessages.innerHTML = '';
            
            // 隐藏欢迎信息
            hideWelcomeMessage();
            
            // 渲染聊天消息
            messages.forEach(msg => {
                if (msg.role !== 'system') {
                    addMessageToChat(msg.role === 'user' ? 'user' : 'bot', msg.content);
                }
            });
            
            // 更新侧边栏选中状态
            updateSidebarSelection(chatId);
        }
    } catch (error) {
        console.error('加载聊天记录时出错:', error);
    }
}

// 开始新对话
function startNewChat() {
    // 清空当前聊天ID
    currentChatId = null;
    
    // 重置消息列表
    messages = [
        { role: "system", content: "You are a helpful assistant" }
    ];
    
    // 清空聊天界面
    chatMessages.innerHTML = '';
    
    // 显示欢迎信息
    chatWelcome.style.display = 'block';
    
    // 更新侧边栏选中状态
    updateSidebarSelection(null);
    
    // 聚焦到输入框
    userInput.focus();
}

// 更新侧边栏选中状态
function updateSidebarSelection(chatId) {
    // 移除所有选中状态
    document.querySelectorAll('.sidebar-chat').forEach(item => {
        item.classList.remove('active');
    });
    
    // 添加新的选中状态
    if (chatId) {
        const selectedChat = document.querySelector(`.sidebar-chat[data-chat-id="${chatId}"]`);
        if (selectedChat) {
            selectedChat.classList.add('active');
        }
    }
}

// 发送消息函数
async function sendMessage() {
    const userMessage = userInput.value.trim();
    
    // 如果用户没有输入内容或者正在等待机器人回复，则不发送
    if (!userMessage || isWaitingForResponse) return;
    
    // 清空输入框并重置高度
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // 隐藏欢迎信息
    hideWelcomeMessage();
    
    // 添加用户消息到聊天界面
    addMessageToChat('user', userMessage);
    
    // 添加用户消息到消息历史
    messages.push({ role: "user", content: userMessage });
    
    // 显示正在输入指示器
    showTypingIndicator();
    
    // 设置等待状态
    setWaitingState(true);
    
    try {
        // 发送请求到后端API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                messages: messages,
                chatId: currentChatId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 隐藏输入指示器
        hideTypingIndicator();
        
        // 添加机器人回复到聊天界面
        addMessageToChat('bot', data.response);
        
        // 添加机器人回复到消息历史
        messages.push({ role: "assistant", content: data.response });
        
        // 如果是新聊天，更新当前聊天ID并刷新历史列表
        if (!currentChatId && data.chatId) {
            currentChatId = data.chatId;
            loadChatHistory();
        }
        
    } catch (error) {
        console.error('Error:', error);
        hideTypingIndicator();
        addMessageToChat('bot', '抱歉，发生了一些错误，请稍后再试。');
    } finally {
        // 无论成功或失败，恢复正常状态
        setWaitingState(false);
    }
    
    // 滚动到最新消息
    scrollToBottom();
}

// 新增：设置等待状态的函数
function setWaitingState(isWaiting) {
    isWaitingForResponse = isWaiting;
    
    if (isWaiting) {
        // 允许用户输入但不能提交
        userInput.placeholder = "机器人正在思考中...";
        
        // 改变发送按钮图标
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        sendButton.classList.add('waiting');
    } else {
        // 恢复输入框
        userInput.placeholder = "询问任何问题...";
        userInput.focus(); // 自动聚焦到输入框
        
        // 恢复发送按钮图标
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendButton.classList.remove('waiting');
    }
}

// 隐藏欢迎信息
function hideWelcomeMessage() {
    if (chatWelcome) {
        chatWelcome.style.display = 'none';
    }
}

// 添加消息到聊天界面
function addMessageToChat(sender, content) {
    // 隐藏欢迎信息
    hideWelcomeMessage();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // 创建头像元素
    const avatarDiv = document.createElement('div');
    avatarDiv.className = `message-avatar ${sender}-avatar`;
    
    // 根据发送者添加不同的图标
    const avatarIcon = document.createElement('i');
    if (sender === 'user') {
        avatarIcon.className = 'fas fa-user';
    } else {
        avatarIcon.className = 'fas fa-robot';
    }
    
    avatarDiv.appendChild(avatarIcon);
    messageDiv.appendChild(avatarDiv);
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    scrollToBottom();
}

// 显示正在输入指示器
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        typingDiv.appendChild(dot);
    }
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

// 隐藏正在输入指示器
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// 滚动到最新消息
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}