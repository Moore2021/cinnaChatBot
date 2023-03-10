const {
	SlashCommandBuilder
} = require(`@discordjs/builders`)
/**
 * Output bot's latency
 * @author klerikdust
 */
module.exports = {
	name: `ping`,
	aliases: [`pong`, `p1ng`, `poing`],
	description: `Output bot's latency`,
	usage: `ping`,
	permissionLevel: 0,
	data: new SlashCommandBuilder()
		.setName(`ping`)
		.setDescription(`Output bot's latency`),
	async execute(interaction, client) {
		if (!interaction.isCommand()) return;
		await interaction.reply({
			content: `The current ping is ${Math.floor(client.ws.ping)}`,
			ephemeral: true
		});
	}
}