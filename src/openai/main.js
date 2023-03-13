const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
	organization: `org-qBMkn85qHyMzyS5dCvJLnvWl`,
});
const openai = new OpenAIApi(configuration);
const { replaceRepeats, formatDate, deleteHistory, recentChatters, peopleInVC, writeToConvoLog, prepareUserMsg } = require(`../utils/openai.js`);
/**
 * Return a response from the openAi Lib
 * @author Pan
 */
module.exports = {
	name: `main`,
	aliases: [],
	description: `Get a response from OpenAi`,
	permissionLevel: 0,
	async execute(message, client) {
		var PreviousOpenAiModelMsgs = client.pastConvo.messages
		const Nicknames = client.nicknames
		const startOpenAiModel = {
			"messages":
				[
					{
						"role": "system",
						"content": `You're on a roleplay, Your name is Pochita, you act like a talking dog and bark Wauf! your owner, master, and favourite is Cinna or cinna.`
					}
				]
		};
		const arrayMsg = startOpenAiModel.messages
		/**
		 * edit an object's inner property
		 * @param {String} str
		 * @returns {void}
		 */
		function addSysContext(str) {
			return arrayMsg[0].content += `\n ${str}`.trim()
		}

		// Add system context
		addSysContext(`Current date is: ${formatDate(new Date())}.`);

		// Check who recent chatters in text chat are
		const peopleToString = await recentChatters(message, Nicknames);
		addSysContext(`people in text chat: ${peopleToString}.`);

		// Fetch who's in VC
		// If people are in the same VC
		if (message.member.voice.channel) {
			const otherPeopleToString = await peopleInVC(message, Nicknames);
			addSysContext(`people in vc or voice chat: ${otherPeopleToString}.`);
		}

		const MAX_CONVOS = 6;

		// Prepare the payload for api
		const msgFromUser = await prepareUserMsg(message, Nicknames);
		arrayMsg.push(msgFromUser)

		const systemMsg = arrayMsg.length > MAX_CONVOS ? arrayMsg.slice(1, arrayMsg.length - (MAX_CONVOS / 2)) : arrayMsg.shift()

		if (PreviousOpenAiModelMsgs.length < 1) {
			PreviousOpenAiModelMsgs = arrayMsg;
		} else {
			PreviousOpenAiModelMsgs.push(msgFromUser);
		}

		// If there are too many conversations cut them in half
		message.channel.sendTyping(); // To show bot is typing/thinking

		try {
			const finalJoin = [systemMsg].concat(PreviousOpenAiModelMsgs)
			const completion = await openai.createChatCompletion({
				model: "gpt-3.5-turbo",
				max_tokens: 2000,
				frequency_penalty: -1.6,
				messages: finalJoin
			}, { timeout: 1200000 });

			// What the api returned
			var response = completion.data.choices[0].message.content.trim();
			if (response.length > 1500) response = response.slice(0, 1500); // If the response exceeds Discord's text limit

			// prepare bot's response
			const msgFromBot = { "role": "assistant", "content": `${replaceRepeats(response)}` }

			// Prepare to save to conversation file
			PreviousOpenAiModelMsgs.push(msgFromBot);
			// If there are too many conversations cut them in half
			PreviousOpenAiModelMsgs.length > MAX_CONVOS ? PreviousOpenAiModelMsgs.slice(PreviousOpenAiModelMsgs.length - (MAX_CONVOS / 2)) : PreviousOpenAiModelMsgs

			// Write to conversation file
			writeToConvoLog('.data/pochitaConvo.json', PreviousOpenAiModelMsgs);

			return message.channel.send(response);
		} catch (error) {
			if (error.response) {
				console.log(error.response.status);
				console.log(error.response.data);
			} else {
				console.log(error.message);
			}
			return deleteHistory(client, message);
		}
	}
}


