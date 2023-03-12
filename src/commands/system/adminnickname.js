const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits } = require(`discord.js`)
const Nicknames = require(`../../../.data/nicknames.json`)
const fs = require(`fs`)
    /**
     * Output bot's latency
     * @author klerikdust
     */
module.exports = {
    name: `adminnickname`,
    description: `Change the nickname of a user`,
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [
        {
            name: `set`,
            description: `What should be your nickname`,
            required:true,
            type: ApplicationCommandOptionType.String
        },{
            name: `user`,
            description: `The user you would like to edit`,
            required: true,
            type: ApplicationCommandOptionType.User
        }
    ],
    async execute(interaction, client) {
        const userChosenNickName = interaction.options.getString(`set`)
        const userChosen = interaction.options.getUser(`user`)
        Nicknames[userChosen.id] = userChosenNickName
        client.nicknames[userChosen.id] = userChosenNickName
        const DataToSave = JSON.stringify(Nicknames)
        fs.writeFile('.data/nicknames.json', DataToSave, 'utf8', (err) => {
            if (err) return console.log(err);
        });
        interaction.reply(`Okay I updated their nickname`)
    }
}