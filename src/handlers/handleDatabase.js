module.exports = (client) => {
    client.handleDatabase = async (databaseFiles, path) => {
        client.databaseClasses = {}
        for (file of databaseFiles) {
            const classes = require(`../database/${file}`);
            client.databaseClasses[classes.name]= new classes(client);
        }
    };

}