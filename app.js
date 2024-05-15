const path = require("path")
const express = require("express");
const bodyParser = require("body-parser");
const { DatabaseAdapter } = require("./database.js");
const { generateFortuneCookie, FortuneCookie } = require("./fortuneCookie.js");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

/* EXPRESS SETUP */

const app = express()
const port = process.env.PORT || 3001;
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "views"));
app.use('/static', express.static(path.join(__dirname, 'static'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));
app.use(bodyParser.urlencoded({ extended: false }));
const server = app.listen(port, () => console.log(`listening on port ${port}`));
server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

/* MONGODB SETUP */

const MONGO_CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
const MONGO_COLLECTION = process.env.MONGO_COLLECTION;
const db = new DatabaseAdapter(MONGO_CONNECTION_STRING, MONGO_DB_NAME, MONGO_COLLECTION);

/* ROUTES */

app.get("/", (request, response) => {
    response.render("home");
});

/* GENERATE */

app.get("/generate", (request, response) => {
    generateFortuneCookie().then((cookie) => response.render("generate", cookie.data));
});

app.post("/save", (request, response) => {
    const { numbers, fortune } = request.body;
    const cookieHTML = getCookieHTML(numbers, fortune);
    var result = "Successfully Saved Cookie";
    try {
        const numbersList = parseNumbers(numbers);
        const trimmedFortune = parseFortune(fortune);
        const cookie = new FortuneCookie(trimmedFortune, numbersList);
        db.insertCookie(cookie);
    } catch (error) {
        result = "Error Saving Cookie: " + error.message;
    }
    response.render("result", { info: cookieHTML, result: result });
});

function getCookieHTML(numbers, fortune) {
    return `
            <p>
                <strong>Lucky Numbers: </strong>${numbers.trim()}
            </p>
            <p>
                <strong>Fortune: </strong>${fortune.trim()}
            </p>
            `;
}

function parseNumbers(numbers) {
    const numStrings = numbers.split(',').map(s => s.trim());
    if (!numStrings.every(s => !isNaN(s)))
        throw new Error("Numbers must be a comma separated list of numbers");
    return numStrings.map(s => Number(s));
}

function parseFortune(fortune) {
    const trimmed = fortune.trim();
    if (trimmed === "")
        throw new Error("Fortune cannot be empty");
    return trimmed;
}

/* DELETE */

app.post("/delete", (request, response) => {
    const { password } = request.body;
    deleteAll(password).then(deleted => {
        const resultMessage = getDeleteResultMessage(deleted);
        response.render("result", { info: "Delete All Fortune Cookies", result: resultMessage })
    })
});

async function deleteAll(password) {
    process.stdout.write(process.env.DELETE_PASSWORD + "\n");
    process.stdout.write(password + "\n");
    return (password === process.env.DELETE_PASSWORD) ? await db.deleteAll() : undefined;
}

function getDeleteResultMessage(deleted) {
    return deleted === undefined ? "Error Deleting All Cookies: Invalid password" : `Successfully Deleted ${deleted} Cookie(s)`;
}

/* BROWSE */

app.get("/browse", (request, response) => {
    const content = request.query.content;
    contentToCookies(content).then((cookies) => {
        const cookiesHTML = cookies.map(cookie =>
            `<div class="cookie">${getCookieHTML(cookie.numbers, cookie.fortune)}</div>`
        ).join("\n");
        response.render("browse", { cookies: cookiesHTML });
    });
});

async function contentToCookies(content) {
    return cookies = content ? await db.getCookiesContaining(content) : await db.getAllCookies();
}