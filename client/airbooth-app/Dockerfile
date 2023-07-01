FROM node:alpine
WORKDIR /client/airbooth-app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]