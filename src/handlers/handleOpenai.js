module.exports = (client) => {

    client.handleOpenai = async (openaiFiles, path) => {
        for (file of openaiFiles) {
            const _file = require(`../openai/${file}`);
            console.log(_file.name)
            client.openai.set(_file.name, _file);
        }
    };

}