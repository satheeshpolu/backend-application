const { genSaltSync, hashSync, compareSync } = require('bcrypt');
const {create, getUserByEmailId} = require('./user.service');
const {sign} = require('jsonwebtoken');

module.exports = {
   createUser: (req, res) => {
      const body = req.body;
      const salt = genSaltSync(10);
      body.password = hashSync(body.password, salt);
      create(body, (err, results) => {
         if(err) return res.status(500).json({
            success: 0,
            msg: 'Server error.'
         });
         return res.status(200).json({
            success: 1,
            data: results
         })
      });
   },
   login: async (req, res) => {
      const body = req.body;
      const results = await getUserByEmailId(body.email, (err, results) => {
         if(err) console.log(err);
         if(!results){
            return res.json({
               success: 0,
               msg: 'Invalid email id.'
            })
         }
         const result =  compareSync(body.password, results.password);
         if(result){
            results.password = undefined;
            const jsonToken = sign({result: results}, 'TODO:AddInDotEnvFile', {
               expiresIn: '15m'
            });
            return res.json({
               success: 1,
               msg: 'Login success',
               token: jsonToken,
            });
         } else {
            return res.json({
               success: 1,
               msg: 'Login failed'
            });
         }
      });
   },
};