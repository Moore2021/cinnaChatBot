"use strict"
const Discord = require(`discord.js`);
const Nicknames = require(`../.data/nicknames.json`)
const oldConvo = require(`../.data/pochitaConvo.json`)
const fs = require(`fs`);
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.MessageContent
    ]
});
const Redis= require(`async-redis`)

client.commands = new Discord.Collection();
client.openai = new Discord.Collection();

class Bot {
    constructor() {
        this.paths = {
            "events": `./src/events`,
            "openai": `./src/openai`,
            "handlers": {
                "src": `./src/handlers`,
                "relative": `./handlers`
            },
            "commands": `./src/commands`
        }
        this.prepareToLogin()
    }

    getJSFilesFromFolder(path) {
        return fs.readdirSync(path).filter(file => file.endsWith(`.js`));
    }

    getFoldersFromAFolder(path) {
        return fs.readdirSync(path)
    }

    retrieveAllFilesNeeded() {
        this.eventFiles = this.getJSFilesFromFolder(this.paths.events);
        this.openaiFiles = this.getJSFilesFromFolder(this.paths.openai);
        this.handlers = this.getJSFilesFromFolder(this.paths.handlers.src);
        this.commandFolders = this.getFoldersFromAFolder(this.paths.commands);
    }

    setupFunctionFolderRequireModules() {
        for (let file of this.handlers) {
            require(`${this.paths.handlers.relative}/${file}`)(client);
        }
    }

    async initializeHandlers() {
        await client.handleEvents(this.eventFiles, this.paths.events);
        await client.handleCommands(this.commandFolders, this.paths.commands);
        await client.handleOpenai(this.openaiFiles, this.paths.openai);
    }

    initNicknames(){
        client.nicknames = Nicknames
    }

    initOldConvo(){
        client.pastConvo = oldConvo
    }

    login() {
        client.login(process.env.TOKEN);
    }

    async prepareToLogin() {
        process.on(`unhandledRejection`, err => console.warn(err.stack))
        try {
            this.retrieveAllFilesNeeded();
            this.setupFunctionFolderRequireModules();
            await this.initializeHandlers();
            this.initNicknames()
            this.initOldConvo()
            // await this.connectRedis();
            this.login()
        } catch (error) {
            console.error(`Client has failed to start >\n ${error.stack}`)
            process.exit()
        } finally {
            console.log(`Ready for operation`)
        }
    }

    /**
     * Opening redis database connection
     * @return {void}
     */
    async connectRedis() {
        const redis = await Redis.createClient();

        redis.on(`error`, err => {
            console.error(`REDIS <ERROR> ${err.message}`)
            process.exit()
        })
        redis.on(`connect`, async () => {
            console.log(`REDIS <CONNECTED>`)
            client.redis = redis
        })
        
    }
}

new Bot();