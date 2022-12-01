const mongoose = require('mongoose');
require('dotenv').config()

const dbConection = async () => {
    try {
        mongoose.connect(process.env.URL_DATABASE);
        console.log('DB is online');

    } catch (error) {
        console.log('DB connect error', error);
    }

}

module.exports = dbConection