const CON = require('../../src/const.json');
const fnc = require('../../fnc');

module.exports = {
	aliases: ['r'],
	description: 'Reloads the bot or a single command or function.',
	descriptionLong: 'If you don\'t provide a prefix (c: or f:) the argument is handled as a command name.',
	args: 0,
	usage: '[c:command|f:function]',
	msgType: CON.MSGTYPE.TEXT | CON.MSGTYPE.DM,
	permLvl: CON.PERMLVL.OWNER,
	cooldown: 10,
	deleteMsg: true,
	execute(message, args) {
		if (args.length) {
			if (args[0].startsWith('f:')) {
				const func = args[0].replace(/^f:/, '');
				try {
					if (typeof fnc[func] !== 'function') throw new Error(`${func} is not a function`);
					message.client.logger.info(`Reloading function ${func}`);
					delete require.cache[require.resolve(`../fnc/src/${func}.js`)];
					fnc[func] = require(`../fnc/src/${func}.js`);
					fnc.replyExt(message, `function ${func} was reloaded`);
				}
				catch (e) {
					message.client.logger.error(`Couldn't reload function ${func}:\n${e.stack}`);
					fnc.replyExt(message, `there was an error while reloading function ${func}:\n\`${e.message}\``);
				}
			}
			else {
				try {
					args[0] = args[0].replace(/^c:/, '').toLowerCase();
					const command = message.client.commands.get(args[0]);
					if (!command) throw new Error(`${args[0]} is not a command`);
					message.client.logger.info(`Reloading command ${command.name}`);
					delete require.cache[require.resolve(`./${command.name}.js`)];
					const newCommand = require(`./${command.name}.js`);
					newCommand.name = command.name;
					message.client.commands.set(command.name, newCommand);
					fnc.replyExt(message, `command ${command.name} was reloaded`);
				}
				catch (e) {
					message.client.logger.error(`Couldn't reload command ${args[0]}:\n${e.stack}`);
					fnc.replyExt(message, `there was an error while reloading command ${args[0]}:\n\`${e.message}\``);
				}
			}
		}
		else {
			try {
				message.client.logger.info('Reloading complete bot');
				delete require.cache[require.resolve('../../src/const.json')];
				delete require.cache[require.resolve('../../src/config.json')];
				message.client.commands.forEach(command => delete require.cache[require.resolve(`./${command.name}.js`)]);
				delete require.cache[require.resolve('..')];
				Object.getOwnPropertyNames(message.client.db).forEach(tbl => delete require.cache[require.resolve(`../../tbl/src/${tbl}.js`)]);
				Object.getOwnPropertyNames(fnc).forEach(func => delete require.cache[require.resolve(`../../fnc/src/${func}.js`)]);
				delete require.cache[require.resolve('../../fnc')];
				message.client.destroy();
				require.main.exports.reload();
			}
			catch (e) {
				if (message) {
					message.client.logger.error(`Couldn't reload bot:\n${e.stack}`);
					fnc.replyExt(message, `there was an error while reloading the bot:\n\`${e.stack}\``);
				}
				else {
					console.error(`Couldn't reload bot:\n${e.stack}`);
				}
			}
		}
	},
};
