const { verify } = require("jsonwebtoken");

module.exports = {
  checkJWTToken: (req, res, next) => {
    //console.log('req => ', req);
    const authorizationToken = req.get("authorization");
    if (authorizationToken) {
      //console.log(authorizationToken);
      const token = authorizationToken.slice(7);
      try{
         verify(token, "TODO:AddInDotEnvFile", (err, res) => {
            if (err) {
              res.json({
                success: 0,
                msg: "Invalid token.",
              });
            } else {
              next();
            }
          });
      }catch(err){
         res.json({
            success: 0,
            msg: "Token expired.",
          });
      }
      // verify(token, "TODO:AddInDotEnvFile", (err, res) => {
      //   if (err) {
      //     res.json({
      //       success: 0,
      //       msg: "Invalid token.",
      //     });
      //   } else {
      //     next();
      //   }
      // });
    } else {
      res.json({
        success: 0,
        msg: "Unauthorized: Access denied!",
      });
    }
  },
};
