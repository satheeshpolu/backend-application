const express = require("express");
const cors = require("cors");

const API_PORT = 5000;
const app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(cors());

app.get("/api", async function (req, res) {
  res.send({ result: "api test" });
});

app.listen(API_PORT, () =>
  console.log(`Server is running on ${API_PORT} 
    \n visit http://localhost:5000/api`)
);
