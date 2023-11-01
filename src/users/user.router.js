const {createUser, login} = require('./user.controller');
const router = require('express').Router();

const { checkJWTToken} = require('../auth/validateToken');
router.post('/', checkJWTToken, createUser);
router.post('/login', login);

module.exports = router;