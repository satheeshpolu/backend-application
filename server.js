const express = require('express');
const cors = require('cors');

const API_PORT = 5000;
const app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(cors());

app.listen(API_PORT, () => console.log(`BE: Server is running on ${API_PORT}`));
