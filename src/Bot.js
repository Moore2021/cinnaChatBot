"use strict"
const {
    Intents,
    Client,
    Collection
} = require(`discord.js`);
const fs = require(`fs`);
const client = new Client({
    intents: [Intents.FLAGS.GUILDS]
});

client.commands = new Collection();

class Bot {
    constructor() {
        this.paths = {
            "events": `./src/events`,
            "handlers": {
                "src": `./src/handlers`,
                "relative": `./handlers`
            },
            "database": `./src/database`,
            "utility": `./src/utils`,
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
        this.handlers = this.getJSFilesFromFolder(this.paths.handlers.src);
        this.databaseFiles = this.getJSFilesFromFolder(this.paths.database);
        this.utilityFiles = this.getJSFilesFromFolder(this.paths.utility);
        this.commandFolders = this.getFoldersFromAFolder(this.paths.commands);
    }

    setupFunctionFolderRequireModules() {
        for (let file of this.handlers) {
            require(`${this.paths.handlers.relative}/${file}`)(client);
        }
    }

    async initializeHandlers() {
        await client.handleDatabase(this.databaseFiles, this.paths.database);
        await client.handleEvents(this.eventFiles, this.paths.events);
        await client.handleCommands(this.commandFolders, this.paths.commands);
        await client.handleUtils(this.utilityFiles, this.paths.utility);
    }

    login() {
        client.login(process.env.TOKEN);
    }

    async connectToDB(){
        await client.databaseClasses.DatabaseInit.connectToDatabase();
        client.pgClient = client.databaseClasses.DatabaseInit.pgClient
        client.redis = client.databaseClasses.redis
    }

    async prepareToLogin() {
        process.on(`unhandledRejection`, err => console.warn(err.stack))
        try {
            this.retrieveAllFilesNeeded();
            this.setupFunctionFolderRequireModules();
            await this.initializeHandlers();
            await this.connectToDB()
            this.login()
        } catch (error) {
            console.error(`Client has failed to start >\n ${error.stack}`)
            process.exit()
        } finally {
            console.log(`Ready for operation`)
        }
    }
}

new Bot();