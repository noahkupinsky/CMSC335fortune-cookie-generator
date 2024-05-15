const { MongoClient, ServerApiVersion } = require('mongodb');

class CollectionAdapter {
    #uri;
    #db;
    #collectionName;
    #client = undefined;

    constructor(uri, db, collectionName) {
        this.#uri = uri;
        this.#db = db;
        this.#collectionName = collectionName;
    }

    async #collection() {
        if (this.#client === undefined) {
            try {
                const client = new MongoClient(this.#uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
                await client.connect();
                this.#client = client;
            } catch (e) {
                console.log(e);
            }
        }
        return this.#client.db(this.#db).collection(this.#collectionName);
    }

    async deleteAll() {
        const collection = await this.#collection();
        const result = await collection.deleteMany({});
        return result.deletedCount;
    }

    async getAllCookies() {
        const collection = await this.#collection();
        return await collection.find({}).toArray();
    }

    async getCookiesContaining(message) {
        const collection = await this.#collection();
        return await collection.find({ fortune: { $regex: message } }).toArray();
    }

    async insertCookie(cookie) {
        const data = cookie.data;
        const collection = await this.#collection();
        const cookieExists = await collection.findOne(data);
        if (!cookieExists) {
            await collection.insertOne(data);
        }
    }
}

module.exports = { DatabaseAdapter: CollectionAdapter };
