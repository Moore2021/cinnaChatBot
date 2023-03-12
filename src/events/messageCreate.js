module.exports = {
    name: `messageCreate`,
    async execute(message, client) {
        if (message.author.bot) return;
        // if (message.author.id != `277266191540551680`) return FOR TESTING; only allows Pan to speak
        const allowedChannelIds = [`1084170152473526272`,`1029922118076465235`,`920077441857380383`]
        if (!allowedChannelIds.includes(message.channelId)) return;
        message.content = message.cleanContent
        const listenFor = [`wauf`,`pochita`,`hey doggy`]
        if (!listenFor.some(word => message.content.toLowerCase().includes(word.toLowerCase()))) return
        const command = client.openai.get(`main`)
        command.execute(message,client)
    }
}