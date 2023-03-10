"use strict";
const {
    Client
} = require(`pg`);

const {
    createClient
} = require(`redis`)

const pgClient = new Client({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    port: process.env.DATABASE_PORT,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE
});

module.exports = class DatabaseInit {
    constructor(client) {
        this.client = client
        this.redis = null
    }

    /**
     * Connect to the database and to Redis
     */
    async connectToDatabase() {
        await pgClient.connect()
        this.pgClient = pgClient
        console.log(`Attempting to connect to Redis`)
        /*Connect to Redis */
        await this.connectRedis();
        console.log(`Connected successfuly to Database and Redis and ready for use`)
    }
    /**
     * Opening redis database connection
     * @return {void}
     */
    async connectRedis() {
        const client = createClient();

        client.on(`error`, err => {
            console.error(`REDIS <ERROR> ${err.message}`)
            process.exit()
        })
        client.on(`connect`, async () => {
            console.log(`REDIS <CONNECTED>`)
            this.redis = client
        })
        await client.connect();
        
    }
}