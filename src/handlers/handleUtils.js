module.exports = (client) => {
    client.handleUtils = async (utilityFiles, path) => {
        client.utilityClasses = {}
        for (file of utilityFiles) {
            const classes = require(`../utils/${file}`);
            client.utilityClasses[classes.name]= new classes(client);
        }
    };

}