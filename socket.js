const { Server } = require("socket.io");
const { Groupware } = require('./class/groupware')
const Grupo = new Groupware

function startSocketServer(server) {
    const io = new Server(server, {
        cors: {
            origin: '*'
        }
    });
    io.on('connection', (client) => {
        client.on('unirse', (user, callback) => {
            Grupo.add_funcionario(client.id, user.id_cuenta, user.funcionario, user.cargo)
            callback(Grupo.get_funcionarios())
            client.broadcast.emit('listar', Grupo.get_funcionarios())
        })
        client.on('enviar-tramite', data => {
            let { id, tramite } = data
            client.broadcast.to(id).emit('recibir_tramite', tramite)
        })
        client.on('disconnect', () => {
            Grupo.delete_funcionario(client.id)
            client.broadcast.emit('listar', Grupo.get_funcionarios())
        })
    });

}

module.exports = startSocketServer