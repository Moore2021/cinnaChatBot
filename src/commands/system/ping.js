const { ApplicationCommandType } = require(`discord.js`)
    /**
     * Output bot's latency
     * @author Pan
     */
module.exports = {
    name: `ping`,
    description: `Output bot's latency`,
    usage: `ping`,
    type: ApplicationCommandType.ChatInput,
    async execute(interaction, client) {
        return await interaction.reply(`the ping is ${Math.floor(client.ws.ping)}ms`)
    }
}