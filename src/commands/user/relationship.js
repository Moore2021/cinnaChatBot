// const User = require(`../../libs/user`)
// const GUI = require((`../../ui/prebuild/relationship`))
const {
	SlashCommandBuilder
} = require(`@discordjs/builders`)
/**
 * Display user's relationship trees
 * @author klerikdust
 */
module.exports = {
    name: `relationship`,
    aliases: [`rel`, `rtship`, `relation`, `relations`, `relationship`],
    description: `Display user's relationship trees`,
    usage: `relationship <user>(Optional)`,
    permissionLevel: 0,
	data: new SlashCommandBuilder()
	.setName(`relationship`)
	.setDescription(`Display user's relationship trees`),
    async execute(client, reply, message, arg, locale, prefix) {
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
		if (!targetUser) return reply.send(locale.USER.IS_INVALID)
        //  Normalize structure
        targetUser = targetUser.master || targetUser
        const targetUserData = await userLib.requestMetadata(targetUser, 2)
        //  Handle if user doesn't have any relationships
        if (!targetUserData.relationships.length) return reply.send(locale.RELATIONSHIP.IS_EMPTY, {
            socket: {prefix: client.prefix}
        })
        const fetching = await reply.send(locale.COMMAND.FETCHING, {
            simplified: true,
            socket: {
                command: `relationship`,
                emoji: await client.getEmoji(`790994076257353779`),
                user: targetUser.id
            }
        })
        let userData = userLib.isSelf(targetUser.id) ? targetUserData : await userLib.requestMetadata(message.author, 2)
        await reply.send(locale.COMMAND.TITLE, {
            simplified: true,
            prebuffer: true,
            socket: {
                command: `Relationship`,
                emoji: await client.getEmoji(`692429004417794058`),
                user: targetUser.username
            },
            image: await new GUI(targetUserData, client, userData).build()
        })
        return fetching.delete()
    }
}
