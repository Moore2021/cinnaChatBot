const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const fs = require(`fs`)
/**
 * Output bot's latency
 * @author Pan
 */
module.exports = {
	name: `main`,
	aliases: [],
	description: `Get a response from OpenAi`,
	permissionLevel: 0,
	async execute(message, client) {
		const PreviousOpenAiModel = client.pastConvo
		const Nicknames = client.nicknames
		const startOpenAiModel = {
			"messages":
				[
					{
						"role":"system",
						"content":`You're on a roleplay, Your name is Pochita, you act like a talking dog and bark Wauf! your owner, master, and favourite is Cinna or cinna.`
					}
				]
			};

		// Functions to use in file
		const addSysContext = (str) =>{
			return startOpenAiModel.messages[0].content+=`\n, ${str}`
		}

		const DELETE_HISTORY = () =>{
			const J = `{"messages":[]}`
			client.pastConvo.messages = []
			fs.writeFile('.data/pochitaConvo.json', J, 'utf8', (err) => {
				if (err) return console.log(err);
			});
			message.channel.send(`I'm sorry but i think i was bonked by something and i forgot what we were saying`)
		}
		
		const formatDate = (date) => {
			function getTimezoneName() {
				const today = new Date();
				const short = today.toLocaleDateString(undefined);
				const full = today.toLocaleDateString(undefined, { timeZoneName: 'long' });
			  
				// Trying to remove date from the string in a locale-agnostic way
				const shortIndex = full.indexOf(short);
				if (shortIndex >= 0) {
				  const trimmed = full.substring(0, shortIndex) + full.substring(shortIndex + short.length);
				  
				  // by this time `trimmed` should be the timezone's name with some punctuation -
				  // trim it from both sides
				  return trimmed.replace(/^[\s,.\-:;]+|[\s,.\-:;]+$/g, '');
			  
				} else {
				  // in some magic case when short representation of date is not present in the long one, just return the long one as a fallback, since it should contain the timezone's name
				  return full;
				}
			  }
			var hours = date.getHours();
			var minutes = date.getMinutes();
			var ampm = hours >= 12 ? 'pm' : 'am';
			hours = hours % 12;
			hours = hours ? hours : 12; // the hour '0' should be '12'
			minutes = minutes < 10 ? '0'+minutes : minutes;
			var strTime = hours + ':' + minutes + ' ' + ampm;
			var timeZone = getTimezoneName()
			return (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime + " " + timeZone;
		  }

		const whatNicknameToUse = async (user_id) => {
			if (Nicknames[user_id]) return Nicknames[user_id]
			const guildMember = await message.guild.members.fetch(user_id)
			if (guildMember.nickname) return guildMember.nickname
			return guildMember.displayName
		}

		// who was recently in chat
		const recentMsg = await message.channel.messages.fetch({limit:10,cache:true})
		var people = new Set(recentMsg.map(m=>{if (!m.author.bot) {return `${m.author.id}`}else{return}} ))
		people = [...people].filter(Boolean)
		const userNames_chat = []
		for (let i = 0; i < people.length; i++) {
			const nickToUse = await whatNicknameToUse(people[i])
			userNames_chat.push(nickToUse)		
		}
		const peopleToString = userNames_chat.length >= 3 ? `${userNames_chat.slice(0,-1).join(`,`)} and ${userNames_chat.slice(-1)}` : userNames_chat.length >= 2 ? userNames_chat.join(` and `) : userNames_chat.toString()
		
		// Add system context
		addSysContext(`Current date is: ${formatDate(new Date())}`)
		addSysContext(`people in chat: ${peopleToString}`)

		// Fetch who's in VC
		// If people are in the same VC
		if (message.member.voice.channel){
			const NicknameToUse = await whatNicknameToUse(message.author.id)
			addSysContext(`${NicknameToUse} is connected to the vc ${message.member.voice.channel.name}`)
			const membersInVC = message.member.voice.channel.members
			var people_VC = new Set(membersInVC.map(m=>{if (!m.user.bot) {return `${m.user.id}`}else{return}} ))
			people_VC = [...people_VC].filter(Boolean)
			const userNames_VC = []
			for (let i = 0; i < people_VC.length; i++) {
				const nickToUse = await whatNicknameToUse(people_VC[i])
				userNames_VC.push(nickToUse)		
			}
			const otherPeopleToString = userNames_VC.length >= 3 ? `${userNames_VC.slice(0,-1).join(`, `)} and ${userNames_VC.slice(-1)}` : userNames_VC.length >= 2 ? userNames_VC.join(` and `) : userNames_VC.toString()
			addSysContext(`people in vc or voice chat: ${otherPeopleToString}`)
		}

		const pastConvo = client.pastConvo.messages.length>1 ? client.pastConvo.messages : PreviousOpenAiModel.messages
		const MAX_CONVOS = 6
		
		// Now add the user input
		const enddingInstructions = ` - dont talk in quotes and change your pattern of talking`

		// Prepare the payload for api
		const NicknameToUse = await whatNicknameToUse(message.author.id)
		const msgFromUser = { "role": "user", "content": `${NicknameToUse} said: "${message.content.trim()}"${enddingInstructions}` }
		var whatToSend = pastConvo.concat([msgFromUser])
		if (whatToSend.length > MAX_CONVOS) whatToSend = whatToSend.slice(whatToSend.length - (MAX_CONVOS/2))
		
		if (client.pastConvo.messages.length<1){
			client.pastConvo.messages = whatToSend
		}else {
			client.pastConvo.messages.push(msgFromUser)
		}
		
		// If there are too many conversations cut them in half
		message.channel.sendTyping() // To show bot is typing/thinking
		
		try {
			const finalJoin = startOpenAiModel.messages.concat(whatToSend)
			console.log(whatToSend)
			const completion = await openai.createChatCompletion({
				model: "gpt-3.5-turbo",
				max_tokens: 2000,
				frequency_penalty: -1.6,
				messages: finalJoin
			},{timeout:50000});

			// What the api returned
			var response = completion.data.choices[0].message.content.trim()
			if (response.length > 1500) response = response.slice(0, 1500) // If the response exceeds Discord's text limit
			
			// prepare bot's response
			const msgFromBot = { "role": "assistant", "content": `${response}` }

			// Prepare to save to conversation file
			PreviousOpenAiModel.messages.push(msgFromBot)
			whatToSend.push(msgFromBot)
			// If there are too many conversations cut them in half
			if (whatToSend.length > MAX_CONVOS) whatToSend = whatToSend.slice(whatToSend.length - (MAX_CONVOS/2))

			// Write to conversation file
			const J = JSON.stringify({messages: whatToSend})
			fs.writeFile('.data/pochitaConvo.json', J, 'utf8', (err) => {
				if (err) return console.log(err);
			});
			return message.channel.send(response)
		} catch (error) {
			if (error.response) {
				console.log(error.response.status);
				console.log(error.response.data);
			} else {
				console.log(error.message);
			}
			return DELETE_HISTORY();
		}
	}
}