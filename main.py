from openai import OpenAI
from dotenv import load_dotenv
import os


# 加载.env文件中的环境变量
load_dotenv()

#获取DeepSeek API Key
api_key = os.getenv("DEEPSEEK_API_KEY")
if not api_key:
    raise ValueError("未找到DEEPSEEK_API_KEY环境变量，请在.env文件中设置")


client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

def chat_with_deepseek(messages):
    """
    与DeepSeek聊天
    :param messages (str): 聊天流
    :return (str): DeepSeek的回复
    """
    print(f"Messages Round : {messages}")
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=False
    )
    print(f"Messages Round : {messages}")
    response_role = response.choices[0].message.role
    response_content = response.choices[0].message.content
    messages.append({ "role": response_role, "content": response_content})
    return response.choices[0].message.content

if __name__ == "__main__":
    print("欢迎使用DeepSeek AI聊天机器人！输入'退出'结束对话。")
    messages =[ {"role": "system", "content": "You are a helpful assistant"}]

    while True:
        user_input = input("\n请输入您的问题: ")
        messages.append({"role": "user", "content": user_input})

        if user_input.lower() in ['退出', 'exit', 'quit']:
            print("感谢使用，再见！")
            break

        response = chat_with_deepseek(messages)
        print("\nDeepSeek AI:", response)