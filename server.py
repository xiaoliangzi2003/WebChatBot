from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
from main import chat_with_deepseek

app = Flask(__name__)
CORS(app)  # 启用跨域资源共享

@app.route('/')
def index():
    """提供前端页面"""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """处理聊天请求的API端点"""
    try:
        data = request.json
        if data is None:
            return jsonify({
                'status': 'error',
                'message': '请求数据格式不正确'
            }), 400
        messages = data.get('messages', [])
        
        # 调用DeepSeek API获取回复
        response = chat_with_deepseek(messages)
        
        return jsonify({
            'status': 'success',
            'response': response
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)