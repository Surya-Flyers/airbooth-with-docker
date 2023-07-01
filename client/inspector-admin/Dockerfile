FROM node:alpine
WORKDIR /client/inspector-admin
COPY package.json .
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]