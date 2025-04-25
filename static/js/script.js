// 全局变量，存储聊天历史
let messages = [
    { role: "system", content: "You are a helpful assistant" }
];

// 新增：是否正在等待机器人回复的标志
let isWaitingForResponse = false;

// DOM 元素
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 自动聚焦到输入框
    userInput.focus();
    
    // 发送按钮点击事件
    sendButton.addEventListener('click', sendMessage);
    
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
            body: JSON.stringify({ messages: messages })
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
        // 禁用输入框
        userInput.disabled = true;
        userInput.placeholder = "机器人正在思考中...";
        
        // 改变发送按钮图标
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        sendButton.classList.add('waiting');
    } else {
        // 恢复输入框
        userInput.disabled = false;
        userInput.placeholder = "询问任何问题...";
        userInput.focus(); // 自动聚焦到输入框
        
        // 恢复发送按钮图标
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendButton.classList.remove('waiting');
    }
}

// 隐藏欢迎信息
function hideWelcomeMessage() {
    const welcomeMessage = document.querySelector('.chat-welcome');
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
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