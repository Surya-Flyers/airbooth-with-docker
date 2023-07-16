// "dev": "nodemon --legacy-watch app.js",
/**
 * integrating mediasoup server with a node.js application
 */

/* Please follow mediasoup installation requirements */
/* https://mediasoup.org/documentation/v3/mediasoup/installation/ */
import express from "express";
const app = express();

import https from "httpolyglot";
import fs from "fs";
import path from "path";
const __dirname = path.resolve();
import mongoose from "mongoose";
import cors from "cors";

import { Server } from "socket.io";
import mediasoup, { getSupportedRtpCapabilities } from "mediasoup";
import { devUrl } from "./configs/db.config.js";
import {
  connectInspector,
  createCall,
  inspectorStartedSharingVideo,
  touristStartedSharingVideo,
} from "./src/feature/call/repository.js";
import ItemSchema from "./src/feature/item/schema.js";
import { getItemsFromPlanet } from "./src/feature/item/repository.js";
import { sendMaile } from "./src/feature/IAM/user/controller.js";
import { userRoutes } from "./src/feature/IAM/user/routes.js";
import { iamClaimRoutes } from "./src/feature/IAM/claim/routes.js";
import { iamItemRoutes } from "./src/feature/IAM/item/routes.js";
const { HTTPS_SERVER_PORT, RTC_MIN_PORT, RTC_MAX_PORT } = process.env;

function logger(name = "", items = []) {
  // console.log(`B ---- ${name} ----`);
  items.forEach((item) => {
    // console.log(`${item} $####$\n`);
  });
  // console.log(`**** xxx **** \n\n\n`);
}

function SS(name, value = "") {
  if (typeof value === "object") {
    try {
      return `-> STRINGFIED :: ${name} :: ${JSON.stringify(value)}`;
    } catch (error) {
      return `-> !!STRINGFIED :: ${name} :: ${value}`;
    }
  } else {
    return `${name} :: ${value}`;
  }
}

const corsOptions = {
  // origin: process.env.CLIENT_ORIGIN || "http://localhost:8081",
  origin: "*",
};

app.use(cors(corsOptions));

// app.get("*", (req, res, next) => {
//   const path = "/sfu/";

//   if (req.path.indexOf(path) == 0 && req.path.length > path.length)
//     return next();

//   res.send(
//     `You need to specify a room name in the path e.g. 'https://127.0.0.1/sfu/room'`
//   );
// });
app.use(express.json());
userRoutes(app);
iamClaimRoutes(app);
iamItemRoutes(app);
// simple route
app.get("/health-checkup", (req, res) => {
  res.json({ message: "Yeah, I'm good 👍" });
});

app.post("/send-mail", sendMaile);

app.use("/sfu/:room", express.static(path.join(__dirname, "public")));

// SSL cert for HTTPS access
const options = {
  key: fs.readFileSync("./server/ssl/key.pem", "utf-8"),
  cert: fs.readFileSync("./server/ssl/cert.pem", "utf-8"),
  requestCert: false,
  rejectUnauthorized: false,
};

const httpsServer = https.createServer(options, app);
httpsServer.listen(HTTPS_SERVER_PORT, () => {
  console.log("listening on port: " + HTTPS_SERVER_PORT);
});

const io = new Server(httpsServer, {
  cors: {
    origin: "*",
  },
});

mongoose
  .connect(devUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("URI : ", devUrl);
    console.log("Connected to the database!-");
    mongoose.set("useFindAndModify", false);
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

// socket.io namespace (could represent a room?)
const connections = io.of("/mediasoup");

/**
 * Worker
 * |-> Router(s)
 *     |-> Producer Transport(s)
 *         |-> Producer
 *     |-> Consumer Transport(s)
 *         |-> Consumer
 **/
let worker;
let rooms = {}; // { roomName1: { Router, rooms: [ sicketId1, ... ] }, ...}
let calls = {}; // { callId: { Router, rooms: [ sicketId1, ... ] }, ...}
let peers = {}; // { socketId1: { roomName1, socket, transports = [id1, id2,] }, producers = [id1, id2,] }, consumers = [id1, id2,], peerDetails }, ...}
let transports = []; // [ { socketId1, roomName1, transport, consumer }, ... ]
let producers = []; // [ { socketId1, roomName1, producer, }, ... ]
let consumers = []; // [ { socketId1, roomName1, consumer, }, ... ]
let inspectors = {};
let tourists = {};
let touristsItems = {}; // { {callId:[items]}, {callId:[items]}}

const createWorker = async () => {
  worker = await mediasoup.createWorker({
    rtcMinPort: RTC_MIN_PORT,
    rtcMaxPort: RTC_MAX_PORT,
  });
  console.log(`worker pid ${worker.pid}`);

  worker.on("died", (error) => {
    // This implies something serious happened, so kill the application
    console.error("mediasoup worker has died");
    setTimeout(() => process.exit(1), 2000); // exit in 2 seconds
  });

  return worker;
};

// We create a Worker as soon as our application starts
worker = createWorker();

// This is an Array of RtpCapabilities
// https://mediasoup.org/documentation/v3/mediasoup/rtp-parameters-and-capabilities/#RtpCodecCapability
// list of media codecs supported by mediasoup ...
// https://github.com/versatica/mediasoup/blob/v3/src/supportedRtpCapabilities.ts
const mediaCodecs = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
    parameters: {
      "x-google-start-bitrate": 1000,
    },
  },
];

connections.on("connection", async (socket) => {
  console.log("socket-id : " + socket.id);
  // logger("connection", [SS("socket", socket), SS("socket.id",socket.id)]);
  socket.emit("connection-success", {
    socketId: socket.id,
  });

  socket.on("inspector-connected", async ({ inspectorId }) => {
    inspectors[inspectorId] = {
      id: inspectorId,
      socket: socket,
      socketId: socket.id,
    };
  });

  const removeItems = (items, socketId, type) => {
    items.forEach((item) => {
      if (item.socketId === socket.id) {
        item[type].close();
      }
    });
    items = items.filter((item) => item.socketId !== socket.id);

    return items;
  };

  socket.on("disconnect", () => {
    // do some cleanup
    console.log("peer disconnected - ");
    consumers = removeItems(consumers, socket.id, "consumer");
    producers = removeItems(producers, socket.id, "producer");
    transports = removeItems(transports, socket.id, "transport");

    if (peers[socket.id]) {
      const { roomName } = peers[socket.id];
      delete peers[socket.id];

      // remove socket from room
      rooms[roomName] = {
        router: rooms[roomName]?.router,
        peers: rooms[roomName]?.peers?.filter(
          (socketId) => socketId !== socket.id
        ),
      };
    }
  });

  socket.on("initiate-call-E", async ({ userId }, callback) => {
    const result = await createCall({
      userId: userId,
    });

    tourists[userId] = {
      socket,
      callId: result._id,
    };

    callback({ data: result });

    for (const _inspector in inspectors) {
      inspectors[_inspector].socket.emit("new-user-waiting", {
        data: result,
        userId: userId,
      });
    }
  });

  socket.on("join-call-E", async ({ callId, touristId }, callback) => {
    // create Router if it does not exist
    // const router1 = rooms[roomName] && rooms[roomName].get('data').router || await createRoom(roomName, socket.id)
    // connectInspector
    const router1 = await _createCall(callId, touristId, socket.id);

    logger("joinRoom", [SS("callId", callId), SS("router1", router1)]);

    peers[socket.id] = {
      callId: `${callId}`,
      socket,
      transports: [],
      producers: [],
      consumers: [],
      peerDetails: {
        id: touristId,
        name: "",
        isInspector: true, // Is this Peer the Admin?
      },
    };

    logger("joinRoom", [SS("peers", peers)]);

    // get Router RTP Capabilities
    const rtpCapabilities = router1.rtpCapabilities;
    logger("joinRoom", [SS("rtpCapabilities", rtpCapabilities)]);

    // const connectInspectorResult = await connectInspector({
    //   callId: callId,
    //   inspectorId: inspectorId,
    // });
    // call callback from the client and send back the rtpCapabilities
    callback({ rtpCapabilities });
  });

  socket.on("accept-call-offer", async ({ callId, inspectorId }, callback) => {
    // create Router if it does not exist
    // const router1 = rooms[roomName] && rooms[roomName].get('data').router || await createRoom(roomName, socket.id)
    // connectInspector
    const router1 = await _createCall(callId, inspectorId, socket.id);

    logger("joinRoom", [SS("callId", callId), SS("router1", router1)]);

    peers[socket.id] = {
      callId: `${callId}`,
      socket,
      transports: [],
      producers: [],
      consumers: [],
      peerDetails: {
        inspectorId: inspectorId,
        name: "",
        isInspector: true, // Is this Peer the Admin?
      },
    };

    logger("joinRoom", [SS("peers", peers)]);

    // get Router RTP Capabilities
    const rtpCapabilities = router1.rtpCapabilities;
    logger("joinRoom", [SS("rtpCapabilities", rtpCapabilities)]);

    const connectInspectorResult = await connectInspector({
      callId: callId,
      inspectorId: inspectorId,
    });
    // call callback from the client and send back the rtpCapabilities
    callback({ rtpCapabilities });
    getItemsFromPlanet().then((_items) => {
      socket.emit("tourist-items-update", {
        items: _items,
      });
    });
  });

  socket.on("update-tourist-item", ({ item, callId }) => {
    touristsItems[callId] = touristsItems[callId].map((_item) => {
      if (_item.invoiceId === item.invoiceId) {
        return item;
      } else {
        return _item; //
      }
    });
    calls[callId].peers.forEach((socketId) => {
      connections
        .to(socketId)
        .emit("tourist-items-update", { items: touristsItems[callId] });
    });
  });

  socket.on("joinRoom", async ({ roomName }, callback) => {
    // create Router if it does not exist
    // const router1 = rooms[roomName] && rooms[roomName].get('data').router || await createRoom(roomName, socket.id)
    const router1 = await createRoom(roomName, socket.id);

    logger("joinRoom", [SS("roomName", roomName), SS("router1", router1)]);

    peers[socket.id] = {
      socket,
      roomName, // Name for the Router this Peer joined
      transports: [],
      producers: [],
      consumers: [],
      peerDetails: {
        name: "",
        isAdmin: false, // Is this Peer the Admin?
      },
    };

    logger("joinRoom", [SS("peers", peers)]);

    // get Router RTP Capabilities
    const rtpCapabilities = router1.rtpCapabilities;
    logger("joinRoom", [SS("rtpCapabilities", rtpCapabilities)]);

    // call callback from the client and send back the rtpCapabilities
    callback({ rtpCapabilities });
  });

  const _createCall = async (callId, userId, socketId) => {
    // worker.createRouter(options)
    // options = { mediaCodecs, appData }
    // mediaCodecs -> defined above
    // appData -> custom application data - we are not supplying any
    // none of the two are required
    logger("createCall-");

    let router1;
    let peers = [];
    if (calls[`${callId}`]) {
      router1 = calls[`${callId}`].router;
      peers = calls[`${callId}`].peers || [];
    } else {
      router1 = await worker.createRouter({ mediaCodecs });
    }

    console.log(`Router ID: ${router1.id}`, peers.length);
    logger("createCall", [SS("calls", calls)]);

    calls[`${callId}`] = {
      router: router1,
      id: userId,
      callId: `${callId}`,
      peers: [...peers, socketId],
    };

    logger("createCall", [SS("calls", calls), SS("router1", router1)]);

    return router1;
  };

  const createRoom = async (roomName, socketId) => {
    // worker.createRouter(options)
    // options = { mediaCodecs, appData }
    // mediaCodecs -> defined above
    // appData -> custom application data - we are not supplying any
    // none of the two are required
    logger("createRoom");

    let router1;
    let peers = [];
    if (rooms[roomName]) {
      router1 = rooms[roomName].router;
      peers = rooms[roomName].peers || [];
    } else {
      router1 = await worker.createRouter({ mediaCodecs });
    }

    console.log(`Router ID: ${router1.id}`, peers.length);
    logger("createRoom", [SS("rooms", rooms)]);

    rooms[roomName] = {
      router: router1,
      peers: [...peers, socketId],
    };

    logger("createRoom", [SS("rooms", rooms), SS("router1", router1)]);

    return router1;
  };

  // Client emits a request to create server side Transport
  // We need to differentiate between the producer and consumer transports
  socket.on("createWebRtcTransport", async ({ consumer }, callback) => {
    // get Room Name from Peer's properties
    logger("createWebRtcTransport", [SS("consumer", consumer)]);
    const roomName = peers[socket.id].roomName;
    logger("createWebRtcTransport", [SS("roomName", roomName)]);

    // get Router (Room) object this peer is in based on RoomName
    const router = rooms[roomName].router;
    logger("createWebRtcTransport", [SS("router", router)]);

    createWebRtcTransport(router).then(
      (transport) => {
        logger("createWebRtcTransport", [SS("transport", transport)]);

        callback({
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          },
        });

        // add transport to Peer's properties
        addTransport(transport, roomName, consumer);
      },
      (error) => {
        console.log(error);
      }
    );
  });

  socket.on("createWebRtcTransport-E", async ({ consumer }, callback) => {
    // get Room Name from Peer's properties
    logger("createWebRtcTransport", [SS("consumer", consumer)]);
    const callId = peers[socket.id].callId;

    // get Router (Room) object this peer is in based on RoomName
    const router = calls[callId].router;
    logger("createWebRtcTransport", [SS("router", router)]);

    createWebRtcTransport(router).then(
      (transport) => {
        logger("createWebRtcTransport", [SS("transport", transport)]);

        callback({
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          },
        });

        // add transport to Peer's properties
        addTransportE(transport, callId, consumer);
      },
      (error) => {
        console.log(error);
      }
    );
  });

  const addTransportE = (transport, callId, consumer) => {
    logger("addTransport", [
      SS("transport", transport),
      SS("consumer", consumer),
    ]);

    logger("addTransport", [SS("transports", transports)]);
    transports = [
      ...transports,
      {
        socketId: socket.id,
        transportId: transport.internal.transportId,
        transport,
        callId,
        consumer,
      },
    ];

    logger("addTransport", [SS("peers", peers)]);
    peers[socket.id] = {
      ...peers[socket.id],
      transports: [...peers[socket.id].transports, transport.id],
    };

    logger("addTransport", [
      SS("transports", transports),
      SS("transports.length", transports.length),
    ]);
    logger("addTransport", [SS("peers", peers)]);
  };

  const addTransport = (transport, roomName, consumer) => {
    logger("addTransport", [
      SS("transport", transport),
      SS("roomName", roomName),
      SS("consumer", consumer),
    ]);

    logger("addTransport", [SS("transports", transports)]);
    transports = [
      ...transports,
      {
        socketId: socket.id,
        transportId: transport.internal.transportId,
        transport,
        roomName,
        consumer,
      },
    ];

    logger("addTransport", [SS("peers", peers)]);
    peers[socket.id] = {
      ...peers[socket.id],
      transports: [...peers[socket.id].transports, transport.id],
    };

    logger("addTransport", [
      SS("transports", transports),
      SS("transports.length", transports.length),
    ]);
    logger("addTransport", [SS("peers", peers)]);
  };

  const addProducer = (producer, roomName) => {
    logger("addProducer", [SS("producer", producer), SS("roomName", roomName)]);

    logger("addProducer", [SS("producers", producers)]);
    producers = [...producers, { socketId: socket.id, producer, roomName }];

    logger("addProducer", [SS("peers", peers)]);
    peers[socket.id] = {
      ...peers[socket.id],
      producers: [...peers[socket.id].producers, producer.id],
    };

    logger("addProducer", [
      SS("producers", producers),
      SS("producers - count", producers.length),
    ]);
    logger("addProducer", [SS("peers", peers)]);
  };

  const addProducerE = (producer, callId) => {
    logger("addProducer", [SS("producer", producer), SS("callId", callId)]);

    logger("addProducer", [SS("producers", producers)]);
    producers = [...producers, { socketId: socket.id, producer, callId }];

    logger("addProducer", [SS("peers", peers)]);
    peers[socket.id] = {
      ...peers[socket.id],
      producers: [...peers[socket.id].producers, producer.id],
    };

    logger("addProducer", [
      SS("producers", producers),
      SS("producers - count", producers.length),
    ]);
    logger("addProducer", [SS("peers", peers)]);
  };

  const addConsumer = (consumer, roomName) => {
    logger("addConsumer", [SS("consumer", consumer), SS("roomName", roomName)]);
    // add the consumer to the consumers list
    logger("addConsumer", [SS("consumers", consumers)]);
    consumers = [...consumers, { socketId: socket.id, consumer, roomName }];

    // add the consumer id to the peers list
    logger("addConsumer", [SS("peers", peers)]);
    peers[socket.id] = {
      ...peers[socket.id],
      consumers: [...peers[socket.id].consumers, consumer.id],
    };

    logger("addConsumer", [SS("consumers", consumers)]);
    logger("addConsumer", [SS("peers", peers)]);
  };

  const addConsumerE = (consumer, callId) => {
    logger("addConsumer", [SS("consumer", consumer), SS("callId", callId)]);
    // add the consumer to the consumers list
    logger("addConsumer", [SS("consumers", consumers)]);
    consumers = [...consumers, { socketId: socket.id, consumer, callId }];

    // add the consumer id to the peers list
    logger("addConsumer", [SS("peers", peers)]);
    peers[socket.id] = {
      ...peers[socket.id],
      consumers: [...peers[socket.id].consumers, consumer.id],
    };

    logger("addConsumer", [SS("consumers", consumers)]);
    logger("addConsumer", [SS("peers", peers)]);
  };

  socket.on("getProducers", (callback) => {
    //return all producer transports
    const { roomName } = peers[socket.id];
    logger("getProducers", [
      SS("socket.id", socket.id),
      SS("roomName", roomName),
      SS("peers", peers),
    ]);

    let producerList = [];
    logger("getProducers", [SS("producerList", producerList)]);
    producers.forEach((producerData) => {
      if (
        producerData.socketId !== socket.id &&
        producerData.roomName === roomName
      ) {
        producerList = [...producerList, producerData.producer.id];
      }
    });
    logger("getProducers", [SS("producerList", producerList)]);

    // return the producer list back to the client
    callback(producerList);
  });

  socket.on("getProducers-E", (callback) => {
    //return all producer transports-
    const { callId } = peers[socket.id];
    logger("getProducers", [
      SS("socket.id", socket.id),
      SS("callId", callId),
      SS("peers", peers),
      SS("peers[socket.id]", peers[socket.id]),
      SS("peers[socket.id].callId", peers[socket.id].callId),
    ]);

    let producerList = [];
    logger("getProducers-E", [
      SS("producerList", producerList),
      SS("producers", producers),
    ]);
    producers.forEach((producerData) => {
      if (
        producerData.socketId !== socket.id &&
        producerData.callId === callId
      ) {
        producerList = [...producerList, producerData.producer.id];
      }
    });
    logger("getProducers", [SS("producerList", producerList)]);

    // return the producer list back to the client
    callback(producerList);
  });

  const informConsumers = (roomName, socketId, id) => {
    console.log(`just joined, id ${id} ${roomName}, ${socketId}`);
    logger("informConsumers", [
      SS("roomName", roomName),
      SS("socketId", socketId),
      SS("id", id),
    ]);

    // A new producer just joined
    // let all consumers to consume this producer
    logger("informConsumers", [SS("producers", producers)]);
    producers.forEach((producerData) => {
      if (
        producerData.socketId !== socketId &&
        producerData.roomName === roomName
      ) {
        const producerSocket = peers[producerData.socketId].socket;
        // use socket to send producer id to producer
        producerSocket.emit("new-producer", { producerId: id });
      }
    });
    logger("informConsumers", [SS("producers", producers)]);
  };

  const informConsumersE = (callId, socketId, id) => {
    console.log(`just joined, id ${id} ${callId}, ${socketId}`);
    logger("informConsumers", [
      SS("roomName", callId),
      SS("socketId", socketId),
      SS("id", id),
    ]);

    // A new producer just joined
    // let all consumers to consume this producer
    logger("informConsumers", [SS("producers", producers)]);
    producers.forEach((producerData) => {
      if (
        producerData.socketId !== socketId &&
        producerData.callId === callId
      ) {
        const producerSocket = peers[producerData.socketId].socket;
        // use socket to send producer id to producer
        producerSocket.emit("new-producer", { producerId: id });
        // producerSocket.emit("inspector-found", { producerId: id });
      }
    });

    // callId
    for (const touristKey in tourists) {
      if (`${tourists[touristKey]?.callId}` === `${callId}`) {
        logger("informConsumers", [
          SS("tourists[touristKey]callId", tourists[touristKey].callId),
          SS("callId", callId),
        ]);
        let inspectorId;
        // for (const inspectorKey in inspectors) {
        //   if (inspectors[inspectorKey]?.socketId === socketId) {
        //     inspectorId = inspectors[inspectorKey].id;
        //   }
        // }

        tourists[touristKey].socket.emit("inspector-found", {
          inspectorId: "inspectorId",
          producerId: id,
        });

        getItemsFromPlanet().then((_items) => {
          touristsItems[callId] = [..._items];
          console.log("touristsItems : ", touristsItems);
          tourists[touristKey].socket.emit("tourist-items-update", {
            items: _items,
          });
        });
      }
    }
    logger("informConsumers", [SS("producers", producers)]);
  };

  const getTransport = (socketId, transportId) => {
    const [producerTransport] = transports.filter(
      (transport) =>
        transport.socketId === socketId &&
        transport.transportId === transportId &&
        !transport.consumer
    );
    logger("getTransport", [
      SS("producerTransport", producerTransport),
      SS("transports.length", transports.length),
      SS("transports", transports),
    ]);
    return producerTransport.transport;
  };

  // see client's socket.emit('transport-connect', ...)
  socket.on("transport-connect", ({ dtlsParameters, transportId }) => {
    console.log("DTLS PARAMS... ", { dtlsParameters });

    logger("transport-connect", [SS("dtlsParameters", dtlsParameters)]);
    getTransport(socket.id, transportId).connect({ dtlsParameters });
  });

  socket.on("transport-connect-E", ({ dtlsParameters, transportId }) => {
    console.log("DTLS PARAMS... ", { dtlsParameters });

    logger("transport-connect", [SS("dtlsParameters", dtlsParameters)]);
    getTransport(socket.id, transportId).connect({ dtlsParameters });
  });

  // see client's socket.emit('transport-produce', ...)
  socket.on(
    "transport-produce",
    async ({ kind, rtpParameters, appData, transportId }, callback) => {
      // call produce based on the prameters from the client
      logger("transport-produce", [
        SS("kind", kind),
        SS("rtpParameters", rtpParameters),
        SS("appData", appData),
      ]);
      const producer = await getTransport(socket.id, transportId).produce({
        kind,
        rtpParameters,
      });

      // add producer to the producers array
      const { roomName } = peers[socket.id];

      logger("transport-produce", [
        SS("producer", producer),
        SS("roomName", roomName),
      ]);
      addProducer(producer, roomName);

      informConsumers(roomName, socket.id, producer.id);

      console.log("Producer ID: ", producer.id, producer.kind);

      producer.on("transportclose", () => {
        console.log("transport for this producer closed ");
        logger("transport-produce", [SS("transportclose")]);
        producer.close();
      });

      // Send back to the client the Producer's id
      callback({
        id: producer.id,
        producersExist: producers.length > 1 ? true : false,
      });
    }
  );

  socket.on(
    "transport-produce-E",
    async (
      { kind, rtpParameters, appData, transportId, userType },
      callback
    ) => {
      // call produce based on the prameters from the client
      logger("transport-produce", [
        SS("kind", kind),
        SS("rtpParameters", rtpParameters),
        SS("appData", appData),
      ]);
      const producer = await getTransport(socket.id, transportId).produce({
        kind,
        rtpParameters,
      });

      // add producer to the producers array
      const { callId } = peers[socket.id];

      logger("transport-produce", [
        SS("producer", producer),
        SS("callId", callId),
      ]);
      addProducerE(producer, callId);

      informConsumersE(callId, socket.id, producer.id);

      console.log("Producer ID: ", producer.id, producer.kind);

      producer.on("transportclose", () => {
        console.log("transport for this producer closed ");
        logger("transport-produce", [SS("transportclose")]);
        producer.close();
      });

      // Send back to the client the Producer's id
      callback({
        id: producer.id,
        producersExist: producers.length > 1 ? true : false,
      });

      if (userType === "INSPECTOR") {
        inspectorStartedSharingVideo({ callId });
      } else if (userType === "TOURIST") {
        touristStartedSharingVideo({ callId });
      }
    }
  );

  // see client's socket.emit('transport-recv-connect', ...)
  socket.on(
    "transport-recv-connect",
    async ({ dtlsParameters, serverConsumerTransportId }) => {
      console.log(`DTLS PARAMS: ${dtlsParameters}`);

      logger("transport-recv-connect", [
        SS("dtlsParameters", dtlsParameters),
        SS("serverConsumerTransportId", serverConsumerTransportId),
      ]);

      const consumerTransport = transports.find(
        (transportData) =>
          transportData.consumer &&
          transportData.transport.id == serverConsumerTransportId
      ).transport;
      logger("transport-recv-connect", [
        SS("consumerTransport", consumerTransport),
      ]);
      await consumerTransport.connect({ dtlsParameters });
    }
  );

  socket.on(
    "consume",
    async (
      { rtpCapabilities, remoteProducerId, serverConsumerTransportId },
      callback
    ) => {
      try {
        logger("consume", [
          SS("rtpCapabilities", rtpCapabilities),
          SS("remoteProducerId", remoteProducerId),
          SS("serverConsumerTransportId", serverConsumerTransportId),
        ]);
        const { callId } = peers[socket.id];
        const router = calls[callId].router;
        let consumerTransport = transports.find(
          (transportData) =>
            transportData.consumer &&
            transportData.transport.id == serverConsumerTransportId
        ).transport;
        logger("consume", [
          SS("router", router),
          SS("consumerTransport", consumerTransport),
        ]);

        // check if the router can consume the specified producer
        if (
          router.canConsume({
            producerId: remoteProducerId,
            rtpCapabilities,
          })
        ) {
          // transport can now consume and return a consumer
          const consumer = await consumerTransport.consume({
            producerId: remoteProducerId,
            rtpCapabilities,
            paused: true,
          });

          logger("consume", [SS("consumer", consumer)]);
          consumer.on("transportclose", () => {
            console.log("transport close from consumer");
          });

          consumer.on("producerclose", () => {
            console.log("producer of consumer closed");
            socket.emit("producer-closed", { remoteProducerId });

            consumerTransport.close([]);
            transports = transports.filter(
              (transportData) =>
                transportData.transport.id !== consumerTransport.id
            );
            consumer.close();
            consumers = consumers.filter(
              (consumerData) => consumerData.consumer.id !== consumer.id
            );
            logger("consume-producerclose", [
              SS("transports", transports),
              SS("consumers", consumers),
            ]);
          });

          addConsumerE(consumer, callId);

          // from the consumer extract the following params
          // to send back to the Client
          const params = {
            id: consumer.id,
            producerId: remoteProducerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            serverConsumerId: consumer.id,
          };
          logger("consume", [SS("params", params)]);

          // send the parameters to the client
          callback({ params });
        }
      } catch (error) {
        console.log(error.message);
        callback({
          params: {
            error: error,
          },
        });
      }
    }
  );

  socket.on(
    "consumer-resume",
    async ({ serverConsumerId, callId, userType }) => {
      console.log("consumer resume");
      logger("consumer-resume", [SS("serverConsumerId", serverConsumerId)]);
      const { consumer } = consumers.find(
        (consumerData) => consumerData.consumer.id === serverConsumerId
      );
      logger("consumer-resume", [SS("consumer", consumer)]);
      await consumer.resume();

      if (userType === "INSPECTOR") {
      } else if (userType === "TOURIST") {
      }
    }
  );
});

const createWebRtcTransport = async (router) => {
  return new Promise(async (resolve, reject) => {
    try {
      // https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
      const webRtcTransport_options = {
        listenIps: [
          {
            ip: "0.0.0.0", // replace with relevant IP address
            // announcedIp: '10.0.0.115',
            announcedIp: "127.0.0.1",
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      };

      // https://mediasoup.org/documentation/v3/mediasoup/api/#router-createWebRtcTransport
      let transport = await router.createWebRtcTransport(
        webRtcTransport_options
      );
      console.log(`transport id: ${transport.id}`);
      logger("createWebRtcTransport", [SS("transport", transport)]);

      transport.on("dtlsstatechange", (dtlsState) => {
        if (dtlsState === "closed") {
          transport.close();
        }
      });

      transport.on("close", () => {
        logger("createWebRtcTransport-close");
        console.log("transport closed");
      });

      resolve(transport);
    } catch (error) {
      reject(error);
    }
  });
};
