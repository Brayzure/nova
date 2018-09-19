const Eris = require("eris");

const GuildManager = require("./GuildManager.js");
const StatusClient = require("./StatusClient.js");
const config = require("../config/config.json");
const logger = console;

class Client {
    constructor(token, options={}) {
        this.token = token;
        this.options = options;
        this.discordClient = new Eris(token, options);
        this.guilds = new Map;

        if(config.statusHost) {
            this.statusClient = new StatusClient(config.statusHost);
        }

        this.discordClient.on("ready", this.onReady.bind(this));
        this.discordClient.on("messageCreate", this.onEvent.bind(this, "messageCreate"));
        this.discordClient.on("messageReactionAdd", this.onEvent.bind(this, "messageReactionAdd"));
        this.discordClient.on("guildCreate", this.onGuildJoin.bind(this));
    }

    connect() {
        this.discordClient.connect();
    }

    onReady() {
        logger.log("Ready, initiating guild managers");
        this.discordClient.guilds.forEach((guild) => {
            this.guilds.set(guild.id, new GuildManager(this, guild));
        });
        logger.log("All guild managers initialized");
    }

    onEvent(event, ...args) {
        let guild;
        switch(event) {
            case "messageCreate":
                guild = args[0].channel.guild;
                break;
            case "messageReactionAdd":
                guild = args[0].channel.guild;
                break;
        }
        if(!this.guilds.has(guild.id)) {
            this.guilds.set(guild.id, new GuildManager(this, guild));
        }

        const guildManager = this.guilds.get(guild.id);
        guildManager.emit(event, ...args);
    }

    onGuildJoin(guild) {
        if(!this.guilds.has(guild.id)) {
            this.guilds.set(guild.id, new GuildManager(this, guild));
        }
    }
}

module.exports = Client;
