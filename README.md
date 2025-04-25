# DeepSeek 聊天机器人

一个基于DeepSeek API的聊天机器人Web应用，具有现代化的聊天界面设计。

## 功能特点

- 优雅的深色模式UI，类似于ChatGPT的界面
- 响应式设计，适配不同设备尺寸
- 聊天气泡与用户/机器人头像显示
- 打字中动画效果
- 防止用户在机器人思考时发送新消息
- 简洁的侧边栏设计

## 技术栈

- **前端**: HTML, CSS, JavaScript
- **后端**: Python, Flask
- **API**: DeepSeek API

## 安装

1. 克隆仓库
2. 创建并激活虚拟环境
3. 安装依赖

```bash
git clone <your-repo-url>
cd deepseek-chatbot
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

4. 在项目根目录创建 `.env` 文件并添加你的DeepSeek API密钥:

```
DEEPSEEK_API_KEY="你的API密钥"
```

## 使用方法

1. 启动Flask服务器:

```bash
python server.py
```

2. 在浏览器中打开 http://127.0.0.1:5000/ 

3. 开始与DeepSeek AI聊天!

## 项目结构

```
deepseek-chatbot/
├── server.py           # Flask服务器
├── main.py             # DeepSeek API交互
├── requirements.txt    # 依赖项
├── .env                # 环境变量(API密钥)
├── templates/          # HTML模板
│   └── index.html      # 主页面
└── static/             # 静态文件
    ├── css/
    │   └── styles.css  # 样式表
    └── js/
        └── script.js   # 客户端脚本
```

## 截图

![DeepSeek聊天界面](https://placeholder-for-screenshot.com)

## 许可证

MIT
