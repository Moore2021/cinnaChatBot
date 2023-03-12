const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
const Nicknames = require(`../../../.data/nicknames.json`)
const fs = require(`fs`)
    /**
     * Output bot's latency
     * @author klerikdust
     */
module.exports = {
    name: `nickname`,
    description: `Recent the convo history`,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: `set`,
            description: `What should be your nickname`,
            required:true,
            type: ApplicationCommandOptionType.String
        }
    ],
    async execute(interaction, client) {
        const userChosenNickName = interaction.options.getString(`set`)
        Nicknames[interaction.member.id] = userChosenNickName
        client.nicknames[interaction.member.id] = userChosenNickName
        const DataToSave = JSON.stringify(Nicknames)
        fs.writeFile('.data/nicknames.json', DataToSave, 'utf8', (err) => {
            if (err) return console.log(err);
        });
        interaction.reply(`Okay I wrote down your nickname as ${userChosenNickName}`)
    }
}