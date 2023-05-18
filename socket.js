const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
require('dotenv').config()
const { Groupware } = require('./class/groupware')
const Group = new Groupware()

function startSocketServer(server) {
    const io = new Server(server, {
        cors: {
            origin: '*'
        }
    });
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.handshake.auth['id_account'] = decoded.id_account
            Group.addUser(socket.id, decoded)
            socket.join(`${decoded.id_dependencie}`)
            next();
        } catch (error) {
            socket.disconnect()
            return
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
                const user = Group.getUser(mail.receptor.cuenta)
                if (user) {
                    user.socketIds.forEach(id_socket => {
                        client.to(id_socket.toString()).emit('newmail', mail)
                    });
                }
            })
        })
        client.on('mail-all-cancel', ids_receivers => {
            ids_receivers.forEach(id_receiver => {
                const user = Group.getUser(id_receiver)
                if (user) {
                    user.socketIds.forEach(id_socket => {
                        client.to(id_socket.toString()).emit('cancel-mail')
                    });
                }
            })
        })
        client.on('mail-one-cancel', id_receiver => {
            const user = Group.getUser(id_receiver)
            if (user) {
                user.socketIds.forEach(id_socket => {
                    client.to(id_socket.toString()).emit('cancel-mail')
                });
            }
        })
        client.on('archive', id_dependencie => {
            console.log(id_dependencie);
            client.to(id_dependencie.toString()).emit('notify', 'nuevo archivo')
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
            Group.deleteUser(client.id, client.handshake.auth['id_account'])
            client.broadcast.emit('listar', Group.getUsers())
        })
    });


}

module.exports = startSocketServer