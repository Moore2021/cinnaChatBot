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
		try {
			const completion = await openai.createChatCompletion({
				model: "gpt-3.5-turbo",
				max_tokens:2000,
				frequency_penalty: -1.0,
				messages: conversation.concat([{"role": "user","content":`${message.author.username} said: ${message.content}`}])
			});
			const response = completion.data.choices[0].message.content
			PreviousOpenAiModel.messages.push({"role": "user","content":`${message.author.username} said: ${message.content}`})
			PreviousOpenAiModel.messages.push({"role": "assistant","content":response})
			if (PreviousOpenAiModel.messages.length > 10) PreviousOpenAiModel.messages = PreviousOpenAiModel.messages.slice(PreviousOpenAiModel.messages.length-6)
			const J = JSON.stringify(PreviousOpenAiModel)
			fs.writeFile('.data/pochitaConvo.json', J, 'utf8', (err)=>{
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
		}
	}
}