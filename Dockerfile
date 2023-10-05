FROM node:17-alpine

RUN npm install -g nodemon
WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 5000

#CMD [ "node", "server.js" ]
CMD [ "npm", "run", "dev" ]