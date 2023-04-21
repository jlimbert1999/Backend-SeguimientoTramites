const express = require('express')
const app = express()
const http = require('http');
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()
const path = require("path");

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

app.use(morgan('dev'))

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

// conexon con fronten
app.use(express.static(path.join(__dirname, 'public')));

// uso de rutas para servidor
app.use(allroutes)

//REDIRECCIONAR AL INDEX DEL FRONTEND
// app.get('*', (req, res) => { res.sendFile(path.join(__dirname + '/public/index.html')) })


server.listen(process.env.PORT, '192.168.30.34',() => {
    console.log('Server listen in port', process.env.PORT)
})