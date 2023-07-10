FROM ubuntu
RUN apt-get update && apt-get install -y locales
RUN apt-get install -y build-essential pip net-tools iputils-ping iproute2

ENV NODE_VERSION=16.13.0
RUN apt install -y curl
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version
# RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
# RUN apt-get install -y nodejs \
#     npm
RUN npm install -g watchify
RUN npm install -g nodemon

WORKDIR /server
COPY package.json .
RUN npm install
COPY . .
RUN npm install
CMD npm run dev

EXPOSE 3000
# EXPOSE 10000-10100
EXPOSE 2000-2999


# docker build -t ubuntu .
# docker-compose up -d