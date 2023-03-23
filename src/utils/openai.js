const fs = require(`fs`)

/**
 * Continue an existing string
 * @param {Object} ObjToAddTo 
 * @param {String} str 
 * @returns 
 */
function addSysContext(ObjToAddTo, str) {
    return ObjToAddTo += `\n, ${str}`
}

/**
 * Delete the chat history and send a message to let the end user know
 * @param {Object} client 
 * @param {Object} message 
 * @returns {void}
 */
function deleteHistory(client, message) {
    const J = `{"messages":[]}`;
    client.pastConvo.messages = [];
    fs.writeFile('.data/pochitaConvo.json', J, 'utf8', (err) => {
        if (err)
            return console.log(err);
    });
    message.channel.send(`I'm sorry but i think i was bonked by something and i forgot what we were saying`);
    return
}

/**
 * Recent convo if the bot hasnt spoke
 * @param {Object} client
 * @returns {void}
 */
function deleteHistoryNoRecent(client) {
    const J = `{"messages":[]}`;
    client.pastConvo.messages = [];
    fs.writeFile('.data/pochitaConvo.json', J, 'utf8', (err) => {
        if (err)
            return console.log(err);
    });
    return client.pastConvo.messages
}

/**
 * Return the current date and time in a readable format
 * @param {Date} date 
 * @returns {String}
 */
function formatDate(date) {
    function getTimezoneName() {
        const today = new Date()
        const short = today.toLocaleDateString(undefined)
        const full = today.toLocaleDateString(undefined, { timeZoneName: 'long' })

        // Trying to remove date from the string in a locale-agnostic way
        const shortIndex = full.indexOf(short)
        if (shortIndex >= 0) {
            const trimmed = full.substring(0, shortIndex) + full.substring(shortIndex + short.length)

            // by this time `trimmed` should be the timezone's name with some punctuation -
            // trim it from both sides
            return trimmed.replace(/^[\s,.\-:;]+|[\s,.\-:;]+$/g, '')

        } else {
            // in some magic case when short representation of date is not present in the long one, just return the long one as a fallback, since it should contain the timezone's name
            return full
        }
    }
    if (!date) { 
        date = new Date() 
    }
    var hours = date.getHours()
    var minutes = date.getMinutes()
    var ampm = hours >= 12 ? 'pm' : 'am'
    hours = hours % 12
    hours = hours ? hours : 12 // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes
    var strTime = hours + ':' + minutes + ' ' + ampm
    var timeZone = getTimezoneName()
    return ((date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime + " " + timeZone).trim()
}

/**
 * Return what nickname to use based on a predefined list
 * @param {String} user_id 
 * @param {Object} NICKNAMES 
 * @param {Object} message
 * @returns 
 */
async function whatNicknameToUse(user_id, NICKNAMES, message) {
    if (message.webhookId == `1088044898491568189` && message.author.username == `cinnamonbuniii`) return `cinna`
    if (message.webhookId == `1088044898491568189`) return message.author.username
    if (NICKNAMES[user_id])
        return NICKNAMES[user_id]
    const guildMember = await message.guild.members.fetch(user_id)
    if (guildMember.nickname)
        return guildMember.nickname
    return guildMember.displayName
}

/**
 * Return a String based on if there are any people in chat
 * @param {Object} message 
 * @param {Object} Nicknames 
 * @returns {String | null}
 */
async function recentChatters(message, Nicknames) {
	const recentMsgs = await message.channel.messages.fetch({ limit: 10, cache: true });
	var people = new Set(recentMsgs.map(m => { if (!m.author.bot) { return `${m.author.id}`; } else { return; } }));
	people = [...people].filter(Boolean);
	const userNames_chat = [];
	for (let i = 0; i < people.length; i++) {
		const nickToUse = await whatNicknameToUse(people[i], Nicknames, message);
		userNames_chat.push(nickToUse);
	}
	const peopleToString = userNames_chat.length >= 3 ? `${userNames_chat.slice(0, -1).join(`,`)} and ${userNames_chat.slice(-1)}` : userNames_chat.length >= 2 ? userNames_chat.join(` and `) : userNames_chat.toString();
	return peopleToString.trim();
}

/**
 * Fetch who is in VC and return String
 * @param {Object} message 
 * @param {Object} Nicknames
 */
async function peopleInVC(message, Nicknames) {
	const NicknameToUse = await whatNicknameToUse(message.author.id, Nicknames, message);
	addSysContext(`${NicknameToUse} is connected to the vc ${message.member.voice.channel.name}`.trim());
	const membersInVC = message.member.voice.channel.members;
	var people_VC = new Set(membersInVC.map(m => { if (!m.user.bot) { return `${m.user.id}`; } else { return; } }));
	people_VC = [...people_VC].filter(Boolean);
	const userNames_VC = [];
	for (let i = 0; i < people_VC.length; i++) {
		const nickToUse = await whatNicknameToUse(people_VC[i], Nicknames, message);
		userNames_VC.push(nickToUse);
	}
	const otherPeopleToString = userNames_VC.length >= 3 ? `${userNames_VC.slice(0, -1).join(`, `)} and ${userNames_VC.slice(-1)}` : userNames_VC.length >= 2 ? userNames_VC.join(` and `) : userNames_VC.toString();
	return otherPeopleToString.trim();
}

/**
 * Take an object and write to file
 * @param {Object} filePath
 * @param {Object} whatToSend 
 * @returns 
 */
function writeToConvoLog(filePath, whatToSend) {
	const J = JSON.stringify({ messages: whatToSend });
	return fs.writeFile(filePath, J, 'utf8', (err) => {
		if (err)
			return console.log(err);
	});
}

/**
 * Return what the user prompt is in format readdy for api
 * @param {Object} message 
 * @param {Object} Nicknames 
 * @returns {Object}
 */
async function prepareUserMsg(message, Nicknames) {
	const enddingInstructions = `\ndont talk in quotes and change your pattern of talking and remove unnecessary parts in your response`
	const NicknameToUse = await whatNicknameToUse(message.author.id, Nicknames, message);
    message.content = replaceRepeats(message.content)
	const msgFromUser = { "role": "user", "content": `${NicknameToUse} said: "${message.content.trim()}"${enddingInstructions}`.trim() };
	return msgFromUser;
}

/**
 * Return a String without repeating characters
 * @param {String} response 
 * @returns {String}
 */
function replaceRepeats(response) {
	const regexForNonWordsConsective=/\B(\W+)(?:\W+\1\B)+/
	return response.replace(regexForNonWordsConsective, ``);
}

module.exports = {
    addSysContext,
    formatDate,
    whatNicknameToUse,
    deleteHistory,
    recentChatters,
    peopleInVC,
    writeToConvoLog,
    prepareUserMsg,
    replaceRepeats,
    deleteHistoryNoRecent
}