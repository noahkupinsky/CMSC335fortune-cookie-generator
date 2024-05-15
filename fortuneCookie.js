const axios = require('axios');

class FortuneCookie {
    #fortune;
    #numbers;

    constructor(fortune, numbers) {
        this.#fortune = fortune;
        this.#numbers = numbers;
    }

    get fortune() {
        return this.#fortune;
    }

    get numbers() {
        return this.#numbers;
    }

    get data() {
        return {
            "numbers": this.#numbers.join(", "),
            "fortune": this.#fortune
        };
    }

    static fromData(data) {
        const numbers = data["numbers"].split(", ");
        const fortune = data["fortune"];
        return new FortuneCookie(fortune, numbers);
    }
}

async function generateFortuneCookie() {
    const luckyNumbers = [];
    for (let i = 0; i < 6; i++) {
        const randomNumber = Math.floor(Math.random() * 101); // Random number between 0 and 100 (inclusive)
        luckyNumbers.push(randomNumber);
    }
    const fortune = await generateFortune();
    return new FortuneCookie(fortune, luckyNumbers);
}

async function generateFortune() {
    const options = {
        method: 'GET',
        url: 'https://fortune-cookie4.p.rapidapi.com/slack',
        headers: {
            'X-RapidAPI-Key': '7c9a0778f9mshaacf37c34cbdab2p19eb15jsnaf3e3350b8f1',
            'X-RapidAPI-Host': 'fortune-cookie4.p.rapidapi.com'
        }
    };
    try {
        const response = await axios.request(options);
        const { text } = response.data;
        const fortune = text.split(":")[1].trim().slice(1, -1);
        return fortune;
    } catch (error) {
        console.error(error);
        return "Failed to get fortune";
    }
}

module.exports = { generateFortuneCookie, FortuneCookie };