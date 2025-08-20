const jwt = require('jsonwebtoken');
const {Course } = require('./models/models'); 

function getUserFromToken(req) {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return null;    }
    try {
        return jwt.decode(token)?.email;
    } catch (err) {
        return null;
    }
}
module.exports = {getUserFromToken};
