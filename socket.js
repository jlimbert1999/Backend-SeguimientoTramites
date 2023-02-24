const { Server } = require("socket.io");
const { Groupware } = require('./class/groupware')
const Group = new Groupware()

function startSocketServer(server) {
    const io = new Server(server, {
        cors: {
            origin: '*'
        }
    });
    io.use((socket, next) => {
        if (socket.handshake.auth.token) {
            Group.addUser(socket.id, socket.handshake.auth.token)
        }
        next();
    });

    io.on('connection', (client) => {
        // Send list of users online when new user conected
        io.emit("listar", Group.getUsers())

        client.on('notification', data => {
            let { id_cuenta, ...info } = data
            const socketIds = Group.getUser(id_cuenta)
            socketIds.forEach(id => {
                client.to(id.toString()).emit('notify', info)
            });
        })
        client.on('mail', data => {
            data.forEach(mail => {
                const socketIds = Group.getUser(mail.receptor.cuenta)
                socketIds.forEach(id_socket => {
                    client.to(id_socket.toString()).emit('newmail', mail)
                });
            })
        })
        client.on('expel', id_cuenta => {
            const socketIds = Group.getUser(id_cuenta)
            socketIds.forEach(id => {
                client.to(id.toString()).emit('kick', "eliminado")
            });
        })

        // client.on('unirse', (user, callback) => {
        //     Grupo.add_funcionario(client.id, user.id_cuenta, user.funcionario, user.cargo)
        //     callback(Grupo.get_funcionarios())
        //     client.broadcast.emit('listar', Grupo.get_funcionarios())
        // })

        client.on('disconnect', () => {
            Group.deleteUser(client.id, client.handshake.auth.token)
            client.broadcast.emit('listar', Group.getUsers())
        })
    });


}

module.exports = startSocketServer