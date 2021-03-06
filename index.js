const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fetch = require('node-fetch');
const HTMLParser = require('node-html-parser');

const corsOptions = {
    origin: [
        'https://www.cse.ntou.edu.tw',
        'http://www.cse.ntou.edu.tw',
        'https://cse.ntou.edu.tw',
        'http://cse.ntou.edu.tw',
        'https://www.cs.ntou.edu.tw',
        'http://www.cs.ntou.edu.tw',
        'https://cs.ntou.edu.tw',
        'http://cs.ntou.edu.tw',
        'https://wordpress.cse.ntou.edu.tw',
        'http://wordpress.cse.ntou.edu.tw',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors(corsOptions));

app.get("/", (req, res) => {
    fetchCalendar().then(result => {
        res.send(result);
    }).catch(err => res.status(500).send(err));
});

function fetchCalendar() {
    return new Promise((resolve, reject) => {
        const year = parseInt(new Date(new Date().getTime() + 3600000*8).toISOString().split('-')[0]);
        const month = parseInt(new Date(new Date().getTime() + 3600000*8).toISOString().split('-')[1]);
        const semester = ((year - 1911) - ((month >= 8) ? 0 : 1)).toString();
        const academicUrl = 'https://academic.ntou.edu.tw';
        const corsUrl = 'https://cors-anywhere.herokuapp.com/';
        const calendarPath = './cse-calendar.json';
        const calendarObj = fs.existsSync(calendarPath) ? JSON.parse(fs.readFileSync(calendarPath).toString()) : null;
        
        if (calendarObj && (calendarObj['semester'] === semester)) resolve(calendarObj['uri']);
        else {
            fetch(corsUrl + 'https://academic.ntou.edu.tw/index.php', {
                headers: {"X-Requested-With": "XMLHttpRequest"}
            }).then(res => res.text()).then(res => {
                const indexHtml = HTMLParser.parse(res);
                let calendarUrlDom = null;
                if (indexHtml) calendarUrlDom = indexHtml.querySelectorAll('a').filter(ele => ele.getAttribute("title") === "校園行事曆")[0];

                if (calendarUrlDom) {
                    const url = academicUrl + calendarUrlDom.getAttribute('href');
                    fetch(corsUrl + url, {
                        headers: {"X-Requested-With": "XMLHttpRequest"}
                    }).then(res => res.text()).then(res => {
                        const calendarHTML = HTMLParser.parse(res);
                        const calendarDom = calendarHTML.querySelectorAll('a').filter(a => a.getAttribute("title") && (a.getAttribute("title").includes('行事曆') && a.getAttribute("title").includes(semester)))[0];

                        if (calendarDom) {
                            const uri = calendarDom.getAttribute("href").includes(academicUrl) ? calendarDom.getAttribute("href") : academicUrl + calendarDom.getAttribute("href");
    
                            if (fs.existsSync(calendarPath)) fs.unlinkSync(calendarPath);
                            fs.writeFileSync(calendarPath, JSON.stringify({ semester, uri }));
                            resolve(uri);
                        } else {
                            console.log(year);
                            console.log(month);
                            console.log(semester);
                            reject("Error");
                        }
                    });
                } else reject("Error");
            }).catch(error => {
                reject(error);
            });
        }
    });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}!`));
