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
		
		const cachePeople = []
		const PreviousOpenAiModel = require(`../../.data/pochitaConvo.json`)
		const startOpenAiModel = {
			"messages":
				[
					{
						"role":"system",
						"content":`You're on a roleplay, Your name is Pochita, you act like a talking dog and bark Wauf! your owner and favourite is Cinna.`
					}
				]
			};

		// Functions to use in file
		const addSysContext = (str) =>{
			return startOpenAiModel.messages[0].content+=`\n, ${str}`
		}

		var DELETE_HISTORY = () =>{
			const J = `{"messages":[]}`
			fs.writeFile('.data/pochitaConvo.json', J, 'utf8', (err) => {
				if (err) return console.log(err);
			});
			message.channel.send(`I'm sorry but i think i was bonked by something and i forgot what we were saying`)
		}
		

		// who was recently in chat
		const recentMsg = await message.channel.messages.fetch({limit:10,cache:true})
		var people = new Set(recentMsg.map(m=>{if (!m.author.bot) {return `"${m.author.username}"`}else{return}} ))
		var people_ids = new Set(recentMsg.map(m=>{if (!m.author.bot) {return m.author.id}else{return}} ))
		people_ids = [...people_ids].filter(Boolean)
		people = [...people].filter(Boolean)
		cachePeople.push(people_ids)
		const peopleToString = [...people].length >= 3 ? `${[...people].slice(0,-1).join(`,`)} and ${[...people].slice(-1)}` : [...people].length >= 2 ? [...people].join(` and `) : [...people].toString()
		
		// Add system context
		addSysContext(`Cinnamonbuniii nickname is cinna, cinna is your master`)
		addSysContext(`Current time is: ${new Date().toUTCString()}`)
		addSysContext(`The recent chatters in this channel are ${peopleToString}`)

		// Fetch who's in VC
		// If people are in the same VC
		if (message.member.voice.channel){
			addSysContext(`${message.author.username} is connected to the VC ${message.member.voice.channel.name}`)
			const membersInVC = message.member.voice.channel.members
			var people_VC = new Set(membersInVC.map(m=>{if (!m.user.bot) {return `\"${m.user.username}\"`}else{return}} ))
			people_VC = [...people_VC].filter(Boolean)
			var people_ids = new Set(membersInVC.map(m=>{if (!m.user.bot) {return m.user.id}else{return}} ))
			people_ids = [...people_ids].filter(Boolean)
			cachePeople.push(people_ids)
			const otherPeopleToString = [...people_VC].length >= 3 ? `${[...people_VC].slice(0,-1).join(`,`)} and ${[...people_VC].slice(-1)}` : [...people_VC].length >= 2 ? [...people_VC].join(` and `) : [...people_VC].toString()
			addSysContext(`\"${message.author.username}\" is talking in VC with ${otherPeopleToString}`)
		}

		// Nicknames
		var flat = cachePeople.join()
		flat = flat.split(`,`)
		var people_ids_noDup = new Set(flat)
		people_ids_noDup = [...people_ids_noDup].filter(Boolean)
		if (people_ids_noDup.length > 1) {
			for (const person of people_ids_noDup){
				const member = await message.guild.members.fetch(person)
				if (member.user.id == `221828709269766147`) continue;
				if (member.nickname) addSysContext(`\"${member.user.username}\" nickname is \"${member.nickname}\"`)
			}
		} else if (people_ids_noDup.length==1){
			const member = await message.guild.members.fetch(people_ids_noDup[0])
			if (member.user.id != `221828709269766147`) addSysContext(`\"${member.user.username}\" nickname is \"${member.nickname}\"`)
		}

		// Handle past convos
		const pastConvo = startOpenAiModel.messages.concat(PreviousOpenAiModel.messages)
		const MAX_CONVOS = 6
		
		// Now add the user input
		const enddingInstructions = ` - dont talk in quotes and change your pattern of talking`

		// Prepare the payload for api
		const whatToSend = pastConvo.concat([{ "role": "user", "content": `${message.author.username} said: "${message.content}"${enddingInstructions}` }])

		// Debug purpose
		// console.debug(whatToSend)
		
		// If there are too many conversations cut them in half
		if (PreviousOpenAiModel.messages.length > MAX_CONVOS) PreviousOpenAiModel.messages = PreviousOpenAiModel.messages.slice(PreviousOpenAiModel.messages.length - (MAX_CONVOS/2))
		message.channel.sendTyping() // To show bot is typing/thinking

		try {
			const completion = await openai.createChatCompletion({
				model: "gpt-3.5-turbo",
				max_tokens: 2000,
				frequency_penalty: -1.6,
				messages: whatToSend
			},{timeout:50000});

			// What the api returned
			var response = completion.data.choices[0].message.content
			if (response.length > 1500) response = response.slice(0, 1500) // If the response exceeds Discord's text limit
			
			// Prepare to save to conversation file
			PreviousOpenAiModel.messages.push({ "role": "user", "content": `${message.author.username} said: ${message.content}${enddingInstructions}` })
			PreviousOpenAiModel.messages.push({ "role": "assistant", "content": `${response}` })

			// If there are too many conversations cut them in half
			if (PreviousOpenAiModel.messages.length > MAX_CONVOS) PreviousOpenAiModel.messages = PreviousOpenAiModel.messages.slice(PreviousOpenAiModel.messages.length - (MAX_CONVOS/2))

			// Write to conversation file
			const J = JSON.stringify(PreviousOpenAiModel)
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