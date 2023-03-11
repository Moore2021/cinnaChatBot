module.exports = (client) => {

    client.handleOpenai = async (openaiFiles, path) => {
        for (file of openaiFiles) {
            const _file = require(`../openai/${file}`);
            console.log(_file.data.name)
            client.openai.set(_file.data.name, _file);
        }
    };

}