const {
    REST
} = require('@discordjs/rest');
const {
    Routes
} = require(`discord-api-types/v9`);
const fs = require(`fs`)

const clientId = `1021923602209194024`;
const testguildId = `597171669550759936`
const guildId = `1027066084945305691`

module.exports = (client) => {
    client.handleCommands = async (commandFolders, path) => {
        client.commandArray = [];
        for (folder of commandFolders) {
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith(`.js`));

            for (const file of commandFiles) {
                const command = require(`../commands/${folder}/${file}`);
                // set a new item in the collection
                // with the key as the command name and the value as the exported module
                client.commands.set(command.data.name, command);
                client.commandArray.push(command.data.toJSON());
            }
        }

        const rest = new REST({
            version: `9`
        }).setToken(process.env.TOKEN);

        (async () => {
            try {
                console.log(`Started refreshing application (/) commands.`);
                await rest.put(
                    Routes.applicationGuildCommands(clientId, testguildId), {
                        body: client.commandArray
                    },
                );
                await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId), {
                        body: client.commandArray
                    },
                );

                console.log(`Successfully reloaded application (/) commands.`)
            } catch (error) {
                console.error(error)
            }
        })();
    }
}