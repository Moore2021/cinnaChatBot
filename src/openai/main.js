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
		var charRepeats = function(str) {
			str = str.toLowerCase()
			for (var i=0; i<str.length; i++) {
			  if ( str.indexOf(str[i]) !== str.lastIndexOf(str[i]) ) {
				return false; // repeats
			  }
			}
			const J = `{"messages":[]}`
				fs.writeFile('.data/pochitaConvo.json', J, 'utf8', (err)=>{
					if (err) return console.log(err);
				});
		  return true;
		}

		const whatToSend = conversation.concat([{"role": "user","content":`${message.author.username} said: ${message.content}`}])
		
		try {
			const completion = await openai.createChatCompletion({
				model: "gpt-3.5-turbo",
				max_tokens:2000,
				frequency_penalty: -1.0,
				messages: whatToSend
			});
			var response = completion.data.choices[0].message.content
			if (response.length > 1500) response = response.slice(0,1500)
			if (charRepeats(response)) {
				message.channel.sendTyping()
				return message.channel.send(`I'm sorry but i think i was bonked by something and i forgot what we were saying`)
			}
			PreviousOpenAiModel.messages.push({"role": "user","content":`${message.author.username} said: ${message.content}`})
			PreviousOpenAiModel.messages.push({"role": "assistant","content":response})
			if (PreviousOpenAiModel.messages.length > 10) PreviousOpenAiModel.messages = PreviousOpenAiModel.messages.slice(PreviousOpenAiModel.messages.length-6)
			const J = JSON.stringify(PreviousOpenAiModel)
			fs.writeFile('.data/pochitaConvo.json', J, 'utf8', (err)=>{
				if (err) return console.log(err);
			});
			message.channel.sendTyping()
			return message.channel.send(response)
		} catch (error) {
			if (error.response) {
				console.log(error.response.status);
				console.log(error.response.data);
			} else {
				console.log(error.message);
			}
			const J = `{"messages":[]}`
			fs.writeFile('.data/pochitaConvo.json', J, 'utf8', (err)=>{
				if (err) return console.log(err);
			});
			message.channel.sendTyping()
			return message.channel.send(`I'm sorry but i think i was bonked by something and i forgot what we were saying`)
		}
	}
}