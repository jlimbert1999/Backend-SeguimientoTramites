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
            next();
        }
    });

    io.on('connection', (client) => {
        io.emit("listar", Group.getUsers())
        client.on('notification', data => {
            const { id_cuenta, message } = data
            const user = Group.getUser(id_cuenta)
            if (user) {
                user.socketIds.forEach(id => {
                    client.to(id.toString()).emit('notify', message)
                });
            }

        })
        client.on('mail', data => {
            data.forEach(mail => {
                const socketIds = Group.getUser(mail.receptor.cuenta)
                socketIds.forEach(id_socket => {
                    client.to(id_socket.toString()).emit('newmail', mail)
                });
            })
        })
        client.on('expel', data => {
            const { id_cuenta, message } = data
            const user = Group.getUser(id_cuenta)
            if (user) {
                user.socketIds.forEach(id => {
                    client.to(id.toString()).emit('kick', message)
                });
            }
        })

        client.on('disconnect', () => {
            Group.deleteUser(client.id, client.handshake.auth.token)
            client.broadcast.emit('listar', Group.getUsers())
        })
    });


}

module.exports = startSocketServer