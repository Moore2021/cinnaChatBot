module.exports = (client) => {

    client.handleOpenai = async (openaiFiles, path) => {
        for (file of openaiFiles) {
            const _file = require(`../openai/${file}`);
            client.openai.set(_file.name, _file);
        }
    };

}