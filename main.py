from openai import OpenAI
from dotenv import load_dotenv
import os

# 加载.env文件中的环境变量
load_dotenv()

# 获取DeepSeek API Key
api_key = os.getenv("DEEPSEEK_API_KEY")
if not api_key:
    raise ValueError("未找到DEEPSEEK_API_KEY环境变量，请在.env文件中设置")

client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

def chat_with_deepseek(messages):
    """
    与DeepSeek聊天
    :param messages (list): 聊天流
    :return (str): DeepSeek的回复
    """
    print(f"发送消息: {messages[-1] if messages else 'None'}")
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=False
    )
    
    response_role = response.choices[0].message.role
    response_content = response.choices[0].message.content
    print(f"收到回复: {response_content[:50]}...")
    return response_content

def generate_chat_title(messages):
    """
    为对话生成一个智能标题
    :param messages (list): 聊天历史
    :return (str): 生成的标题
    """
    # 提取用户的第一个有效消息
    first_user_msg = ""
    for msg in messages:
        if msg["role"] == "user" and msg["content"].strip():
            first_user_msg = msg["content"]
            break
    
    if not first_user_msg:
        return "新对话"
    
    # 使用DeepSeek API生成标题
    title_prompt = [
        {"role": "system", "content": "你是一个帮助生成聊天标题的助手。请根据用户的消息生成一个简短、准确的标题，不超过15个字。不要使用引号或其他标点符号。"},
        {"role": "user", "content": f"消息内容：{first_user_msg}\n请为这个对话生成一个简短、描述性的标题"}
    ]
    
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=title_prompt,
            stream=False
        )
        title = response.choices[0].message.content.strip()
        # 去掉可能的引号
        title = title.replace('"', '').replace("'", "").strip()
        # 限制长度
        if len(title) > 20:
            title = title[:20] + "..."
        return title
    except Exception as e:
        print(f"生成标题时出错: {e}")
        return f"关于{first_user_msg[:10]}..."

if __name__ == "__main__":
    print("欢迎使用DeepSeek AI聊天机器人！输入'退出'结束对话。")
    messages = [{"role": "system", "content": "You are a helpful assistant"}]

    while True:
        user_input = input("\n请输入您的问题: ")
        messages.append({"role": "user", "content": user_input})

        if user_input.lower() in ['退出', 'exit', 'quit']:
            print("感谢使用，再见！")
            break

        response = chat_with_deepseek(messages)
        print("\nDeepSeek AI:", response)