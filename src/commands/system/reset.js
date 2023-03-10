const { ApplicationCommandType } = require(`discord.js`)
const fs = require(`fs`)
    /**
     * Output bot's latency
     * @author klerikdust
     */
module.exports = {
    name: `reset`,
    description: `Recent the convo history`,
    type: ApplicationCommandType.ChatInput,
    async execute(interaction, client) {
        client.pastConvo.messages=[]
        console.log(`in reset client.pastConvo.messages`)
        console.log(client.pastConvo.messages)
        const J = `{"messages":[]}`
        fs.writeFile('.data/pochitaConvo.json', J, 'utf8', (err) => {
            if (err) return console.log(err);
        });
        await interaction.reply(`my memory is wiped`)
    }
}