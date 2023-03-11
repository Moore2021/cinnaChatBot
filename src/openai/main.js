const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const fs = require(`fs`)
const startOpenAiModel = require(`../../.data/openaiPochita.json`)
/**
 * Output bot's latency
 * @author Pan
 */
module.exports = {
	name: `main`,
	aliases: [],
	description: `Get a response from OpenAi`,
	permissionLevel: 0,
	data: {
		name: `main`
	},
	async execute(message, client) {
		const PreviousOpenAiModel = require(`../../.data/pochitaConvo.json`)
		const conversation = startOpenAiModel.messages.concat(PreviousOpenAiModel.messages)
		var isRepeating = (str = '') => {
			if (!str.length) {
				return false
			};
			for (let j = 1; (j <= str.length / 2); j++) {
				if (str.length % j != 0) {
					continue
				};
				let flag = true;
				for (let i = j; i < str.length; ++i) {
					if (str[i] != str[i - j]) {
						flag = false;
						break;
					};
				};
				if (flag) {
					const J = `{"messages":[]}`
					fs.writeFile('.data/pochitaConvo.json', J, 'utf8', (err) => {
						if (err) return console.log(err);
					});
					return true;
				};
			};
			return false;
		};

		const whatToSend = conversation.concat([{ "role": "user", "content": `${message.author.username} said: ${message.content}` }])

		message.channel.sendTyping()

		try {
			const completion = await openai.createChatCompletion({
				model: "gpt-3.5-turbo",
				max_tokens: 2000,
				frequency_penalty: -1.0,
				messages: whatToSend
			},{timeout:10000});
			var response = completion.data.choices[0].message.content
			if (response.length > 1500) response = response.slice(0, 1500)
			if (isRepeating(response)) {
				return message.channel.send(`I'm sorry but i think i was bonked by something and i forgot what we were saying`)
			}
			PreviousOpenAiModel.messages.push({ "role": "user", "content": `${message.author.username} said: ${message.content}` })
			PreviousOpenAiModel.messages.push({ "role": "assistant", "content": response })
			if (PreviousOpenAiModel.messages.length > 10) PreviousOpenAiModel.messages = PreviousOpenAiModel.messages.slice(PreviousOpenAiModel.messages.length - 6)
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
			const J = `{"messages":[]}`
			fs.writeFile('.data/pochitaConvo.json', J, 'utf8', (err) => {
				if (err) return console.log(err);
			});
			return message.channel.send(`I'm sorry but i think i was bonked by something and i forgot what we were saying`)
		}
	}
}