from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import json
import time
from datetime import datetime
from main import chat_with_deepseek, generate_chat_title

app = Flask(__name__)
CORS(app)  # 启用跨域资源共享

# 确保历史记录文件夹存在
HISTORY_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'history')
if not os.path.exists(HISTORY_FOLDER):
    os.makedirs(HISTORY_FOLDER)

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
        chat_id = data.get('chatId')
        
        # 调用DeepSeek API获取回复
        response = chat_with_deepseek(messages)
        
        # 保存聊天历史
        if not chat_id:
            # 生成智能标题（仅当这是新对话时）
            if len(messages) >= 2:  # 确保有至少一个用户消息
                title = generate_chat_title(messages[:])
            else:
                title = "新对话"
                
            # 创建新的聊天ID和文件
            timestamp = int(time.time())
            chat_id = f"{timestamp}"
            
            chat_data = {
                'id': chat_id,
                'title': title,
                'created_at': timestamp,
                'updated_at': timestamp,
                'messages': messages + [{"role": "assistant", "content": response}]
            }
            
            # 保存到文件
            with open(os.path.join(HISTORY_FOLDER, f"{chat_id}.json"), 'w', encoding='utf-8') as f:
                json.dump(chat_data, f, ensure_ascii=False, indent=2)
        else:
            # 更新现有聊天
            try:
                file_path = os.path.join(HISTORY_FOLDER, f"{chat_id}.json")
                with open(file_path, 'r', encoding='utf-8') as f:
                    chat_data = json.load(f)
                
                chat_data['messages'] = messages + [{"role": "assistant", "content": response}]
                chat_data['updated_at'] = int(time.time())
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(chat_data, f, ensure_ascii=False, indent=2)
                    
            except Exception as e:
                print(f"保存聊天历史时出错: {e}")
        
        return jsonify({
            'status': 'success',
            'response': response,
            'chatId': chat_id
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """获取所有聊天历史"""
    try:
        history_files = [f for f in os.listdir(HISTORY_FOLDER) if f.endswith('.json')]
        history_list = []
        
        for file_name in history_files:
            try:
                with open(os.path.join(HISTORY_FOLDER, file_name), 'r', encoding='utf-8') as f:
                    chat_data = json.load(f)
                    history_list.append({
                        'id': chat_data.get('id'),
                        'title': chat_data.get('title', '未命名对话'),
                        'updated_at': chat_data.get('updated_at'),
                        'created_at': chat_data.get('created_at')
                    })
            except Exception as e:
                print(f"读取历史文件 {file_name} 时出错: {e}")
        
        # 按更新时间倒序排序
        history_list.sort(key=lambda x: x.get('updated_at', 0), reverse=True)
        
        return jsonify({
            'status': 'success',
            'history': history_list
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/history/<chat_id>', methods=['GET'])
def get_chat_history(chat_id):
    """获取特定聊天历史"""
    try:
        file_path = os.path.join(HISTORY_FOLDER, f"{chat_id}.json")
        if not os.path.exists(file_path):
            return jsonify({
                'status': 'error',
                'message': '找不到指定的聊天记录'
            }), 404
        
        with open(file_path, 'r', encoding='utf-8') as f:
            chat_data = json.load(f)
        
        return jsonify({
            'status': 'success',
            'chat': chat_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)