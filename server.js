const express = require('express')
const app = express()
const http = require('http');
const cors = require('cors')
require('dotenv').config()

const allroutes = require('./routes')
const dbConection = require('./database/config')
const sockets = require('./socket')
// const sockedIO = require('socket.io')

// configuracion para server socket
const server = http.createServer(app);

// configuracion cors, y lectura de requets
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Establecer conexicon del socket con server
sockets(server)
// module.exports.io = sockedIO(server, {
//     cors: {
//         origin: '*'
//     }
// })
// require('./socket');

// conexion base de datos
dbConection()

// uso de rutas para servidor
app.use(allroutes)


server.listen(process.env.PORT, '192.168.1.4', () => {
    console.log('Server listen in port', process.env.PORT)
})