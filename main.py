from flask import Flask, render_template, request, jsonify
import io
import sys
from googlesearch import search
import openai
app = Flask(__name__)

# Укажите свой API-ключ OpenAI здесь
openai.api_key = "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"
conversation_history = []  # Список для хранения истории диалога

@app.route('/')
def index():
    return render_template('./index.html')

@app.route('/execute', methods=['POST'])
def execute():
    code = request.form['code']

    # Создаем объект для перехвата вывода
    stdout = io.StringIO()
    sys.stdout = stdout

    try:
        # Выполняем переданный код
        exec(code)
    except Exception as e:
        # В случае ошибки выводим сообщение об ошибке
        print('Ошибка:', e)

    # Получаем результат выполнения кода
    output = stdout.getvalue()

    # Возвращаем результат в формате JSON
    return {'output': output}

@app.route('/search_google', methods=['POST'])
def search_google():
    query = request.form['query']
    google_results = get_google_results(query)
    return jsonify({'results': google_results})

@app.route('/search_openai', methods=['POST'])
def search_openai():
    prompt = request.form['prompt']

    # Комбинируем новый запрос с историей диалога, чтобы создать единый контекст
    full_prompt = '\n'.join([item['query'] for item in conversation_history] + [prompt])

    openai_result = get_openai_response(full_prompt)

    # Добавляем новый запрос и ответ в историю диалога
    conversation_history.append({'query': prompt, 'response': openai_result})

    return jsonify({'answer': openai_result})

@app.route('/clear_conversation_history', methods=['POST'])
def clear_conversation_history():
    global conversation_history
    conversation_history = []  # Очистить историю диалога
    return 'История диалога была очищена.'


def get_google_results(query):
    try:
        google_results = set()
        for j in search(query, num=5, stop=5, pause=2, lang='ru', extra_params={"filter": "0"}):
            google_results.add(j)
        return [{'link': link.replace('http://', '').replace('https://', '')} for link in google_results]
    except Exception as e:
        return f"Ошибка: {e}"



def get_openai_response(prompt):
    try:
        # Отправляем запрос на API OpenAI GPT-3.5
        response = openai.Completion.create(engine="text-davinci-003", prompt=prompt, max_tokens=1500)
        answer = response['choices'][0]['text']
        return answer
    except Exception as e:
        return f"Ошибка: {e}"

if __name__ == '__main__':
    conversation_history = []  # List to store conversation history
    app.run(debug=True, port=5001)