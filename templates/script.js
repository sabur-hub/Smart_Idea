$(document).ready(function() {
    function clearLocalStorage() {
        // Удаляем все данные из localStorage
        localStorage.clear();
    }

    // Функция для восстановления данных из LocalStorage и помещения на страницу
    function restoreDataFromLocalStorage() {
        var savedExecutedCode = localStorage.getItem('executed_code');
        var savedGoogleQuery = localStorage.getItem('google_query');
        var savedOpenAIQuery = localStorage.getItem('openai_query');
        var savedOpenAIResult = localStorage.getItem('openai_result');
        var savedGoogleOutput = localStorage.getItem('google_output');
        var savedCodeOutput = localStorage.getItem('code_output');

        if (savedExecutedCode) {
            $('#query').val(savedExecutedCode);
        }

        if (savedGoogleQuery) {
            $('#google-query').val(savedGoogleQuery);
        }

        if (savedOpenAIQuery) {
            $('#openai-prompt').val(savedOpenAIQuery);
        }

        if (savedOpenAIResult) {
            $('#output-openai').text(savedOpenAIResult);
        }

        if (savedGoogleOutput) {
            $('#output-google').html(savedGoogleOutput);
        }

        if (savedCodeOutput) {
            $('#output').text(savedCodeOutput);
        }
    }

    $(document).ready(function() {
        // Восстанавливаем данные из LocalStorage при загрузке страницы
        restoreDataFromLocalStorage();

        function emptyOutput(outputElement) {
            $(outputElement).empty();
        }

        $('#execute-btn').click(function() {
            var code = $('#query').val();
            $.post('/execute', {code: code}, function(data) {
                emptyOutput('#output'); // Clear only the output of code execution
                $('#output').text(data.output);

                // Сохраняем выполненный код в LocalStorage
                localStorage.setItem('executed_code', code);
                localStorage.setItem('code_output', data.output);
            });
        });

        function getDomainFromURL(url) {
            // Функция для извлечения имени домена из URL
            var domain = url.replace(/(^\w+:|^)\/\//, ''); // Убрать протокол (http:// или https://) из ссылки
            domain = domain.split('/')[0]; // Взять только имя домена без пути и параметров
            return domain;
        }

        function addProtocol(url) {
            // Функция для добавления протокола, если его нет
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            return url;
        }

        $('#google-search-btn').click(function() {
            var query = $('#google-query').val();
            $.post('/search_google', {query: query}, function(data) {
                emptyOutput('#output-google'); // Очистить только вывод результатов поиска Google
                var google_results = data.results;

                var googleResultHtml = '';
                var linksSet = new Set();

                for (var i = 0; i < google_results.length; i++) {
                    var link = google_results[i]['link'];
                    var domain = getDomainFromURL(link);
                    var linkWithProtocol = addProtocol(link); // Добавить протокол, если его нет

                    // Проверить, есть ли данная ссылка в множестве, чтобы избежать дублирования
                    if (!linksSet.has(link)) {
                        googleResultHtml += '<div>' + domain + ': <a href="' + linkWithProtocol + '" target="_blank"><strong>' + linkWithProtocol + '</strong></a></div>';
                        linksSet.add(link);
                    }
                }
                $('#output-google').html(googleResultHtml);

                // Сохранить запрос Google в LocalStorage
                localStorage.setItem('google_query', query);
                localStorage.setItem('google_output', googleResultHtml);
            });
        });

        $('#openai-search-btn').click(function() {
            var prompt = $('#openai-prompt').val();
            $.post('/search_openai', {prompt: prompt}, function(data) {
                emptyOutput('#output-openai'); // Clear only the output of OpenAI search
                var openai_result = data.answer;
                $('#output-openai').text(openai_result);

                // Сохраняем запрос и результат OpenAI в LocalStorage
                localStorage.setItem('openai_query', prompt);
                localStorage.setItem('openai_result', openai_result);
            });
        });

        $('#change-chat-btn').click(function() {
            $('#openai-prompt').val(''); // Очистить поле для запроса
            emptyOutput('#output-openai'); // Очистить вывод ответа OpenAI

            // Очистить историю диалога на стороне клиента
            conversation_history = [];

            // Отправить запрос на сервер для очистки истории диалога
            $.post('/clear_conversation_history', function() {
                // Опционально: показать уведомление пользователю о том, что чат был очищен.
                // Здесь вы можете добавить div или уведомление для указания того, что чат был очищен.
            });
        });

        // Восстанавливаем данные из LocalStorage перед обновлением страницы
        window.addEventListener('beforeunload', function() {
            localStorage.setItem('executed_code', $('#query').val());
            localStorage.setItem('google_query', $('#google-query').val());
            localStorage.setItem('openai_query', $('#openai-prompt').val());
            localStorage.setItem('openai_result', $('#output-openai').text());
            localStorage.setItem('code_output', $('#output').text());
        });
    });
    $('#query').keydown(function(e) {
        if (e.key === "Tab") {
            e.preventDefault(); // Отменяем стандартное поведение клавиши "Tab"
            var start = this.selectionStart;
            var end = this.selectionEnd;
            var value = $(this).val();
            $(this).val(value.substring(0, start) + "    " + value.substring(end));
            this.selectionStart = this.selectionEnd = start + 4; // Устанавливаем курсор после вставленных 4 пробелов
        }
    });
    });
