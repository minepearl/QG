var express = require('express');
var app = express();
var request = require('request');
var { OpenAIApi, Configuration } = require('openai');
const config = require('config');
var openai = new OpenAIApi(new Configuration({
    apiKey: config.get('openai.apiKey')
}));
var client_id = config.get('client_id')
var client_secret = config.get('client_secret')



app.get('/', function (req, res) {
    res.sendFile(__dirname + "/lang/ko.html")

})
app.get('/ko', function (req, res) {
    res.sendFile(__dirname + "/lang/ko.html")
})
app.get('/en', function (req, res) {
    res.sendFile(__dirname + "/lang/en.html")
})
app.get('/ja', function (req, res) {
    res.sendFile(__dirname + "/lang/ja.html")
})
app.get('/zh-CN', function (req, res) {
    res.sendFile(__dirname + "/lang/zh-CN.html")
})
app.get('/hi', function (req, res) {
    res.sendFile(__dirname + "/lang/hi.html")
})
app.get('/es', function (req, res) {
    res.sendFile(__dirname + "/lang/es.html")
})
app.get('/fr', function (req, res) {
    res.sendFile(__dirname + "/lang/fr.html")
})
app.get('/de', function (req, res) {
    res.sendFile(__dirname + "/lang/de.html")
})
app.get('/pt', function (req, res) {
    res.sendFile(__dirname + "/lang/pt.html")
})
app.get('/vi', function (req, res) {
    res.sendFile(__dirname + "/lang/vi.html")
})
app.get('/id', function (req, res) {
    res.sendFile(__dirname + "/lang/id.html")
})
app.get('/fa', function (req, res) {
    res.sendFile(__dirname + "/lang/fa.html")
})
app.get('/ar', function (req, res) {
    res.sendFile(__dirname + "/lang/ar.html")
})
app.get('/mm', function (req, res) {
    res.sendFile(__dirname + "/lang/mm.html")
})
app.get('/th', function (req, res) {
    res.sendFile(__dirname + "/lang/th.html")
})
app.get('/ru', function (req, res) {
    res.sendFile(__dirname + "/lang/ru.html")
})
app.get('/it', function (req, res) {
    res.sendFile(__dirname + "/lang/it.html")
})









app.use(express.static('public'));
app.use(express.static('lang'));
app.use(express.urlencoded({ extended: false }));





// 주제받기
app.post('/detectLangs', express.json(), function (req, res) {


    var q = req.body.q
    var number = req.body.number
    console.log(q, number)



    var api_url = 'https://openapi.naver.com/v1/papago/detectLangs';





    // 언어인식
    var options = {
        url: api_url,
        form: { 'query': q },
        headers: { 'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret }
    };
    request.post(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {


            var detect = JSON.parse(body).langCode;
            console.log(detect)

            // 한국어처리
            if (detect == "ko") {
                var q_translated = q + `에 대한 질문을 ${number}개를 만들어주세요`;
                var api_url = 'https://openapi.naver.com/v1/papago/n2mt';
                var options = {
                    url: api_url,
                    form: { 'source': 'ko', 'target': 'en', 'text': q_translated },
                    headers: { 'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret }
                };
                // 번역
                request.post(options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var translated = JSON.parse(body).message?.result.translatedText;
                        console.log(translated)
                        // 질문생성
                        openai.createCompletion({
                            model: "text-davinci-003",
                            prompt: translated,
                            temperature: 0.5,
                            max_tokens: 150,
                            top_p: 1,
                            frequency_penalty: 0,
                            presence_penalty: 0,
                        }).then((result) => {
                            var question = result.data.choices[0].text
                            console.log(result.data.choices[0].text)

                            // 번역
                            var api_url = 'https://openapi.naver.com/v1/papago/n2mt';
                            var options = {
                                url: api_url,
                                form: { 'source': 'en', 'target': 'ko', 'text': question },
                                headers: { 'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret }
                            };
                            request.post(options, function (error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    var kor = JSON.parse(body).message.result.translatedText.replace(/\?/g, '?<br>');
                                    console.log(kor)
                                    res.json({ kor: kor });
                                }
                            });
                        })
                    } else {
                        res.status(response.statusCode).end();
                        console.log('error = ' + response.statusCode);
                    }
                });

                // 영어처리
            }
            if (detect=="en") {
                var query = q
                console.log("this is english")
                var api_url = 'https://openapi.naver.com/v1/papago/n2mt';
                var q_translated = `Create ${number} question about` + q
                console.log(q_translated)
                // 질문생성
                openai.createCompletion({
                    model: "text-davinci-003",
                    prompt: q_translated,
                    temperature: 0.5,
                    max_tokens: 150,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                }).then((result) => {
                    var kor = result.data.choices[0].text.replace(/\?/g, '?<br>');
                    console.log(kor)
                    res.json({ kor: kor });

                })
            }else{
                // 다른언어 처리
                console.log("this is other")
                var query = q
                var api_url = 'https://openapi.naver.com/v1/papago/n2mt';
                var options = {
                    url: api_url,
                    form: { 'source': detect, 'target': 'ko', 'text': q },
                    headers: { 'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret }
                };


                // 번역
                request.post(options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var q_translated = JSON.parse(body).message?.result.translatedText.replace(/\./g, "") + `에 대한 질문을 ${number}개를 만들어주세요`;
                        console.log(q_translated)




                        var api_url = 'https://openapi.naver.com/v1/papago/n2mt';
                        var options = {
                            url: api_url,
                            form: { 'source': 'ko', 'target': 'en', 'text': q_translated },
                            headers: { 'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret }
                        };
                        // 번역
                        request.post(options, function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                var translated = JSON.parse(body).message?.result.translatedText
                                console.log(translated)
                                // 질문생성
                                openai.createCompletion({
                                    model: "text-davinci-003",
                                    prompt: translated,
                                    temperature: 0.5,
                                    max_tokens: 150,
                                    top_p: 1,
                                    frequency_penalty: 0,
                                    presence_penalty: 0,
                                }).then((result) => {
                                    var question = result.data.choices[0].text
                                    console.log(result.data.choices[0].text)


                                    // 번역
                                    var api_url = 'https://openapi.naver.com/v1/papago/n2mt';
                                    var options = {
                                        url: api_url,
                                        form: { 'source': 'en', 'target': detect, 'text': question },
                                        headers: { 'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret }
                                    };
                                    request.post(options, function (error, response, body) {
                                        if (!error && response.statusCode == 200) {
                                            var kor = JSON.parse(body).message.result.translatedText.replace(/\?/g, '?<br>');
                                            console.log(kor)
                                            res.json({ kor: kor });
                                        }
                                    });
                                })
                            } else {
                                res.status(response.statusCode).end();
                                console.log('error = ' + response.statusCode);
                            }
                        });
                    }
                })
            }





        }

    })



});


app.listen(3000, function () {
    console.log("listening on 3000")
});