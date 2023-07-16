// // @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import socketIOClient, { Socket } from "socket.io-client";
import { Device } from "mediasoup-client";
import "./App.css";
import { temp } from "./test";
import Video from "./components/Video";

function logger(name = "", items = []) {
  console.log(`S ---- ${name} ----`);

  items.forEach((item) => {
    console.log(`${item} $####$\n`);
  });
  console.log(`**** xxx **** \n\n\n`);
}

function SS(name, value = "") {
  if (typeof value === "object") {
    return `-> STRINGFIED :: ${name} :: ${JSON.stringify(value)}`;
  } else {
    return `${name} :: ${value}`;
  }
}

const ENDPOINT = "https://127.0.0.1:3000/mediasoup";
const MEDIAS = {
  encodings: [
    {
      rid: "r0",
      maxBitrate: 100000,
      scalabilityMode: "S1T3",
    },
    {
      rid: "r1",
      maxBitrate: 300000,
      scalabilityMode: "S1T3",
    },
    {
      rid: "r2",
      maxBitrate: 900000,
      scalabilityMode: "S1T3",
    },
  ],
  // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
  codecOptions: {
    videoGoogleStartBitrate: 1000,
  },
};

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

function App() {
  console.log(`S ---- -- ${temp} ----`);
  const [gotMedia, setGotMedia] = useState(false);
  const socketIoRef = useRef<any>({});
  const socketIdRef = useRef<any>(null);
  const callDetails = useRef<any>({});
  const mediasRef = useRef<any>({});
  const videosRef = useRef<any>([]);
  const rtpCapabilities = useRef<any>(null);
  const deviceRef = useRef<any>(null);
  const consumingTransportsRef = useRef<any>([]);
  const consumerTransportsRef = useRef<any>([]);
  const [producersVideo, setProducersVideo] = useState([]);
  const [airBoothClientUsers, setAirBoothClientUsers] = useState({});
  const [inspectorName, setInspectorName] = useState("inspector-user-");
  const [touristItems, setTouristItems] = useState([]);

  useEffect(() => {
    if (gotMedia === true) {
      // joinCall();
      createDevice();
    }
  }, [gotMedia]);

  // const joinCall = () => {
  //   socketIoRef.current.emit(
  //     "join-call-E",
  //     { callId: callDetails.current.callId },
  //     (data) => {
  //       console.log(`Router RTP Capabilities... ${data.rtpCapabilities}`);

  //       // we assign to local variable and will be used when
  //       // loading the client Device (see createDevice above)
  //       rtpCapabilities.current = data.rtpCapabilities;

  //       // once we have rtpCapabilities from the Router, create Device
  //       createDevice();
  //     }
  //   );
  // };

  // A device is an endpoint connecting to a Router on the
  // server side to send/recive media
  const createDevice = async () => {
    try {
      deviceRef.current = new Device();

      // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-load
      // Loads the device with RTP capabilities of the Router (server side)
      await deviceRef.current.load({
        // see getRtpCapabilities() below
        routerRtpCapabilities: rtpCapabilities.current,
      });

      console.log("Device RTP Capabilities", deviceRef.current.rtpCapabilities);

      // once the device loads, create transport
      createSendTransport();
    } catch (error) {
      console.log(error);
      if (error.name === "UnsupportedError")
        console.warn("browser not supported");
    }
  };

  const createSendTransport = () => {
    // see server's socket.on('createWebRtcTransport', sender?, ...)
    // this is a call from Producer, so sender = true
    console.log("T1-mediasRef.current : ", mediasRef.current);

    for (const _mediaKey in mediasRef.current) {
      if (mediasRef.current[_mediaKey] && mediasRef.current[_mediaKey].params) {
        socketIoRef.current.emit(
          "createWebRtcTransport-E",
          { consumer: false },
          async ({ params }) => {
            // The server sends back params needed
            // to create Send Transport on the client side
            if (params.error) {
              console.log(params.error);
              return;
            }

            console.log(params);

            // creates a new WebRTC Transport to send media
            // based on the server's producer transport params
            // https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
            mediasRef.current[_mediaKey].producerTransport =
              deviceRef.current.createSendTransport(params);
            console.log(
              "mediasRef.current[_mediaKey] : ",
              mediasRef.current[_mediaKey]
            );

            console.log(
              "producerTransport : ",
              mediasRef.current[_mediaKey].producerTransport
            );
            console.log(
              "T1-mediasRef.current[_mediaKey] : ",
              mediasRef.current[_mediaKey]
            );

            await producerTransportFnc(
              mediasRef.current[_mediaKey].producerTransport,
              mediasRef.current[_mediaKey]
            );
          }
        );
      }
    }
  };

  async function producerTransportFnc(producerTransport, camera) {
    console.log("producerTransportFnc : producerTransport ", producerTransport);
    console.log("producerTransportFnc : camera ", camera);
    // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
    // this event is raised when a first call to transport.produce() is made
    // see connectSendTransport() below
    producerTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log("producerTransport.on(connect) ", dtlsParameters);
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-connect', ...)
          await socketIoRef.current.emit("transport-connect-E", {
            dtlsParameters,
            transportId: producerTransport._id,
          });
          // Tell the transport that parameters were transmitted.
          callback();
        } catch (error) {
          errback(error);
        }
      }
    );

    producerTransport.on("produce", async (parameters, callback, errback) => {
      console.log("producerTransport.on(produce) ", parameters);

      try {
        // tell the server to create a Producer
        // with the following parameters and produce
        // and expect back a server side producer id
        // see server's socket.on('transport-produce', ...)
        await socketIoRef.current.emit(
          "transport-produce-E",
          {
            kind: parameters.kind,
            rtpParameters: parameters.rtpParameters,
            appData: parameters.appData,
            transportId: producerTransport._id,
            userType: "INSPECTOR",
          },
          ({ id, producersExist }) => {
            // Tell the transport that parameters were transmitted and provide it with the
            // server side producer's id.
            callback({ id });

            // if producers exist, then join room
            if (producersExist) getProducersE();
          }
        );
      } catch (error) {
        errback(error);
      }
    });

    await connectSendTransport(producerTransport, camera);
  }

  const connectSendTransport = async (producerTransport, camera) => {
    // we now call produce() to instruct the producer transport
    // to send media to the Router
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
    // this action will trigger the 'connect' and 'produce' events above
    console.log("camera.params : ", camera.params);
    console.log("1-mediasRef.current : ", mediasRef.current);

    camera.producer = await producerTransport.produce(camera.params);

    camera.producer.on("trackended", () => {
      console.log("track ended");

      // close video track
    });

    camera.producer.on("transportclose", () => {
      console.log("transport ended");
      // close video track
    });
  };

  const getProducers = () => {
    socketIoRef.current.emit("getProducers", (producerIds) => {
      console.log(producerIds);
      // for each of the producer create a consumer
      // producerIds.forEach(id => signalNewConsumerTransport(id))
      producerIds.forEach(signalNewConsumerTransport);
    });
  };

  const getProducersE = () => {
    socketIoRef.current.emit("getProducers-E", (producerIds) => {
      console.log(producerIds);
      // for each of the producer create a consumer
      // producerIds.forEach(id => signalNewConsumerTransport(id))
      producerIds.forEach(signalNewConsumerTransportE);
    });
  };

  const signalNewConsumerTransport = async (remoteProducerId) => {
    //check if we are already consuming the remoteProducerId
    logger("signalNewConsumerTransport", [
      SS("remoteProducerId", remoteProducerId),
    ]);

    logger("signalNewConsumerTransport", [
      SS("consumingTransports", consumingTransportsRef.current),
    ]);
    if (consumingTransportsRef.current.includes(remoteProducerId)) return;
    consumingTransportsRef.current.push(remoteProducerId);
    logger("signalNewConsumerTransport", [
      SS("consumingTransports", consumingTransportsRef.current),
    ]);

    await socketIoRef.current.emit(
      "createWebRtcTransport",
      { consumer: true },
      ({ params }) => {
        logger("signalNewConsumerTransport - createWebRtcTransport", [
          SS("params", params),
        ]);

        // The server sends back params needed
        // to create Send Transport on the client side
        if (params.error) {
          console.log(params.error);
          return;
        }
        console.log(`PARAMS... ${params}`);

        let consumerTransport;
        try {
          consumerTransport = deviceRef.current.createRecvTransport(params);
          logger("signalNewConsumerTransport", [
            SS("consumerTransport", consumerTransport),
          ]);
        } catch (error) {
          // exceptions:
          // {InvalidStateError} if not loaded
          // {TypeError} if wrong arguments.
          console.log(error);
          return;
        }

        consumerTransport.on(
          "connect",
          async ({ dtlsParameters }, callback, errback) => {
            logger("signalNewConsumerTransport - connect", [
              SS("dtlsParameters", dtlsParameters),
            ]);

            try {
              // Signal local DTLS parameters to the server side transport
              // see server's socket.on('transport-recv-connect', ...)
              await socketIoRef.current.emit("transport-recv-connect", {
                dtlsParameters,
                serverConsumerTransportId: params.id,
              });
              // Tell the transport that parameters were transmitted.
              callback();
            } catch (error) {
              // Tell the transport that something was wrong
              errback(error);
            }
          }
        );

        connectRecvTransport(consumerTransport, remoteProducerId, params.id);
      }
    );
  };

  const signalNewConsumerTransportE = async (remoteProducerId) => {
    //check if we are already consuming the remoteProducerId
    logger("signalNewConsumerTransport", [
      SS("remoteProducerId", remoteProducerId),
    ]);

    logger("signalNewConsumerTransport", [
      SS("consumingTransports", consumingTransportsRef.current),
    ]);
    if (consumingTransportsRef.current.includes(remoteProducerId)) return;
    consumingTransportsRef.current.push(remoteProducerId);
    logger("signalNewConsumerTransport", [
      SS("consumingTransports", consumingTransportsRef.current),
    ]);

    await socketIoRef.current.emit(
      "createWebRtcTransport-E",
      { consumer: true },
      ({ params }) => {
        logger("signalNewConsumerTransport - createWebRtcTransport", [
          SS("params", params),
        ]);

        // The server sends back params needed
        // to create Send Transport on the client side
        if (params.error) {
          console.log(params.error);
          return;
        }
        console.log(`PARAMS... ${params}`);

        let consumerTransport;
        try {
          consumerTransport = deviceRef.current.createRecvTransport(params);
          logger("signalNewConsumerTransport", [
            SS("consumerTransport", consumerTransport),
          ]);
        } catch (error) {
          // exceptions:
          // {InvalidStateError} if not loaded
          // {TypeError} if wrong arguments.
          console.log(error);
          return;
        }

        consumerTransport.on(
          "connect",
          async ({ dtlsParameters }, callback, errback) => {
            logger("signalNewConsumerTransport - connect", [
              SS("dtlsParameters", dtlsParameters),
            ]);

            try {
              // Signal local DTLS parameters to the server side transport
              // see server's socket.on('transport-recv-connect', ...)
              await socketIoRef.current.emit("transport-recv-connect", {
                dtlsParameters,
                serverConsumerTransportId: params.id,
              });
              // Tell the transport that parameters were transmitted.
              callback();
            } catch (error) {
              // Tell the transport that something was wrong
              errback(error);
            }
          }
        );

        connectRecvTransport(consumerTransport, remoteProducerId, params.id);
      }
    );
  };

  const connectRecvTransport = async (
    consumerTransport,
    remoteProducerId,
    serverConsumerTransportId
  ) => {
    logger("connectRecvTransport", [
      SS("consumerTransport", consumerTransport),
      SS("remoteProducerId", remoteProducerId),
      SS("serverConsumerTransportId", serverConsumerTransportId),
    ]);

    // for consumer, we need to tell the server first
    // to create a consumer based on the rtpCapabilities and consume
    // if the router can consume, it will send back a set of params as below
    await socketIoRef.current.emit(
      "consume",
      {
        rtpCapabilities: deviceRef.current.rtpCapabilities,
        remoteProducerId,
        serverConsumerTransportId,
      },
      async ({ params }) => {
        logger("connectRecvTransport - consume", [SS("params", params)]);

        if (params.error) {
          console.log("Cannot Consume");
          return;
        }

        console.log(`Consumer Params ${params}`);
        // then consume with the local consumer transport
        // which creates a consumer
        const consumer = await consumerTransport.consume({
          id: params.id,
          producerId: params.producerId,
          kind: params.kind,
          rtpParameters: params.rtpParameters,
        });

        logger("connectRecvTransport", [SS("consumer", consumer)]);

        logger("connectRecvTransport", [
          SS("consumerTransports", consumerTransportsRef.current),
        ]);

        consumerTransportsRef.current = [
          ...consumerTransportsRef.current,
          {
            consumerTransport,
            serverConsumerTransportId: params.id,
            producerId: remoteProducerId,
            consumer,
          },
        ];

        logger("connectRecvTransport", [
          SS("consumerTransports", consumerTransportsRef.current),
        ]);

        // create a new div element for the new consumer media
        // const newElem = document.createElement('div')
        // newElem.setAttribute('id', `td-${remoteProducerId}`)

        // if (params.kind == 'audio') {
        //   //append to the audio container
        //   newElem.innerHTML = '<audio id="' + remoteProducerId + '" autoplay></audio>'
        // } else {
        //   //append to the video container
        //   newElem.setAttribute('class', 'remoteVideo')
        //   newElem.innerHTML = '<video id="' + remoteProducerId + '" autoplay class="video" ></video>'
        // }

        // videoContainer.appendChild(newElem)

        // createVideoElement(`${remoteProducerId}`, params)

        // destructure and retrieve the video track from the producer
        const { track } = consumer;
        logger("connectRecvTransport", [SS("-consumer", consumer)]);

        // document.getElementById(`${remoteProducerId}`).srcObject = new MediaStream([track])
        const stream = new MediaStream([track]);
        setProducersVideo((prevState) => [
          ...prevState,
          { id: remoteProducerId, kind: params.kind, stream: stream },
        ]);
        // document.getElementById(`${remoteProducerId}_2`).srcObject = new MediaStream([track_2])
        logger("connectRecvTransport", [SS("track", track)]);
        // logger("connectRecvTransport", [SS("track", track),SS("track_2", track_2) ]);

        // the server consumer started with media paused
        // so we need to inform the server to resume
        socketIoRef.current.emit("consumer-resume", {
          serverConsumerId: params.serverConsumerId,
          callId: callDetails.current._id,
          userType: "INSPECTOR",
        });
      }
    );
  };

  function listenToItems() {
    console.error("listenToItems ");
    socketIoRef.current.on("tourist-items-update", ({ items }: any) => {
      console.error("tourist-items-update : ", items);
      setTouristItems([...items]);
    });
  }

  // socketIoRef.current.on("producer-closed", ({ remoteProducerId }) => {
  //   logger("producer-closed", [SS("remoteProducerId", remoteProducerId)]);

  //   // server notification is received when a producer is closed
  //   // we need to close the client-side consumer and associated transport
  //   logger("producer-closed", [SS("producerToClose", producerToClose)]);
  //   const producerToClose = consumerTransportsRef.current.find(
  //     (transportData) => transportData.producerId === remoteProducerId
  //   );
  //   logger("producer-closed", [SS("producerToClose", producerToClose)]);
  //   producerToClose.consumerTransport.close();
  //   producerToClose.consumer.close();

  //   // remove the consumer transport from the list
  //   consumerTransportsRef.current = consumerTransportsRef.current.filter(
  //     (transportData) => transportData.producerId !== remoteProducerId
  //   );
  //   logger("producer-closed", [SS("consumerTransports", consumerTransports)]);

  //   // remove the video div element
  //   // videoContainer.removeChild(document.getElementById(`td-${remoteProducerId}`))
  //   setProducersVideo((prevState) => {
  //     return prevState.filter(
  //       (ProducerVideo) => ProducerVideo.id !== remoteProducerId
  //     );
  //   });
  // });

  async function getLocalStream() {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          width: {
            min: 640,
            max: 1920,
          },
          height: {
            min: 400,
            max: 1080,
          },
        },
      })
      .then(() => {
        getAllMediaStreams()
          .then((streams) => streamSuccess(streams))
          .catch((e) => console.error(e));
      });
  }

  async function getAllMediaStreams() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind == "videoinput");
    const streams = [];
    if (cameras.length > 0) {
      for (const _camera of cameras) {
        const constraints = { deviceId: { exact: _camera.deviceId } };
        const _stream = await navigator.mediaDevices.getUserMedia({
          video: constraints,
        });
        if (
          !!_camera.deviceId &&
          !!_camera.label &&
          !!_camera.groupId &&
          !!_camera.kind
        ) {
          streams.push({
            stream: _stream,
            device: _camera,
          });
        }
      }
      return streams;
    }
  }

  const streamSuccess = (streams) => {
    let index = 0;
    for (const { stream, device } of streams) {
      videosRef.current.push({
        id: `localVideo_${index}`,
        stream: stream,
      });
      const track = stream.getVideoTracks()[0];
      mediasRef.current[`localVideo_${index}`] = {
        ...mediasRef.current[`localVideo_${index}`],
        params: {
          ...MEDIAS,
          track,
          ...mediasRef.current[`localVideo_${index}`]?.params,
        },
      };
      index = index + 1;
    }

    // streams.forEach(({ stream, device }, index) => {
    //   // createVideoElement(`localVideo_${index}`, device);
    //   // const videoElement = document.getElementById(`localVideo_${index}`);
    //   // videoElement.srcObject = stream;

    //   videosRef.current.push({
    //     id: `localVideo_${index}`,
    //     stream: stream,
    //   });
    //   const track = stream.getVideoTracks()[0];
    //   mediasRef.current[`localVideo_${index}`] = {
    //     ...mediasRef.current[`localVideo_${index}`],
    //     params: {
    //       track,
    //       ...mediasRef.current[`localVideo_${index}`]?.params,
    //     },
    //   };
    // });

    console.log("mediasRef.current : ", mediasRef.current);
    // renderClientVideo()
    setGotMedia(true);
    // joinRoom(true)
  };

  async function connect() {
    const socket: Socket<any, any> = socketIOClient(ENDPOINT);
    socketIoRef.current = socket;
    socket.on("connection-success", ({ socketId, existsProducer }: any) => {
      console.log(socketId, existsProducer);
      socketIdRef.current = socketId;
      // getLocalStream()
    });

    socket.emit("inspector-connected", { inspectorId: inspectorName });

    socket.on("new-user-waiting", ({ data, userId }: any) => {
      setAirBoothClientUsers((prevState) => {
        return {
          ...prevState,
          [userId]: data,
        };
      });
      console.log("new-user-waiting data : ", data);
      // getLocalStream()
    });
  }

  async function initiateCall() {
    const socket: Socket<any, any> = socketIOClient(ENDPOINT, {
      rejectUnauthorized: false,
    });
    socketIoRef.current = socket;
    socket.on("connection-success", ({ socketId, existsProducer }: any) => {
      console.log(socketId, existsProducer);
      socketId.current = socketId;
      // getLocalStream()
    });

    socket.emit("inspector-connected", { inspectorId: inspectorName });

    socket.on("new-user-waiting", ({ data, userId }: any) => {
      callDetails.current = {
        ...callDetails.current,
        inspectorId: inspectorName,
      };
      getLocalStream();
    });
  }

  function asArray(valueObject) {
    const result = [];
    for (const key in valueObject) {
      result.push({ ...valueObject[key], userId: key });
    }
    return result;
  }

  function acceptCallOffer(client) {
    console.log("acceptCallOffer : ", client);
    console.log("accept-call-offer _id : ", client._id);
    callDetails.current = {
      ...callDetails.current,
      ...client,
    };
    listenToItems();
    socketIoRef.current.emit(
      "accept-call-offer",
      {
        callId: client._id,
        inspectorId: inspectorName,
      },
      (data) => {
        console.log(`Router RTP Capabilities... ${data.rtpCapabilities}`);

        // we assign to local variable and will be used when
        // loading the client Device (see createDevice above)
        rtpCapabilities.current = data.rtpCapabilities;

        // once we have rtpCapabilities from the Router, create Device
        getLocalStream();
        // createDevice();
      }
    );

    socketIoRef.current.on("new-producer", ({ producerId }) => {
      logger("new-producer", [SS("producerId", producerId)]);
      signalNewConsumerTransportE(producerId);
    });
  }

  return (
    <div>
      <h1>IAM app</h1>
      <h2>{`Got media : ${gotMedia}`}</h2>
      <input
        value={inspectorName}
        onChange={(event) => {
          setInspectorName(event.target.value);
        }}
      />

      <button
        onClick={() => {
          connect();
        }}
      >
        {" "}
        Connect App{" "}
      </button>

      <h1>Items</h1>
      {touristItems.map((item) => {
        return (
          <div style={{ border: "1px solid black", margin: "5px" }}>
            <p>
              <strong>name</strong> {`: ${item.name}`}
            </p>
            <p>
              <strong>invoiceId</strong> {`: ${item.invoiceId}`}
            </p>
            <p>
              <strong>totalAmount</strong> {`: ${item.totalAmount}`}
            </p>
            <p>
              <strong>netRefund</strong> {`: ${item.netRefund}`}
            </p>
            {item.status !== "UNCHANGED" && (
              <div
                style={{
                  borderRadius: "100%",
                  height: "50px",
                  width: "50px",
                  backgroundColor: item.status === "APPROVED" ? "green" : "red",
                }}
              />
            )}
            <button
              style={{ backgroundColor: "green" }}
              onClick={() => {
                socketIoRef.current.emit("update-tourist-item", {
                  item: { ...item, status: "APPROVED" },
                  callId: callDetails.current._id,
                });
              }}
            >
              APPROVE
            </button>
            <button
              style={{ backgroundColor: "red" }}
              onClick={() => {
                socketIoRef.current.emit("update-tourist-item", {
                  item: { ...item, status: "REJECTED" },
                  callId: callDetails.current._id,
                });
              }}
            >
              REJECT
            </button>
          </div>
        );
      })}

      <h1>Airbooth Users</h1>
      {asArray(airBoothClientUsers).map((client, index) => {
        return (
          <button
            key={index}
            onClick={() => {
              acceptCallOffer(client);
            }}
          >
            {" "}
            {`client ${index}`}{" "}
          </button>
        );
      })}
      <h1>Client Video</h1>
      {producersVideo.length > 0 && (
        <>
          {producersVideo.map((videoRef, index) => {
            if (videoRef.kind === "video") {
              return (
                <Video
                  key={index}
                  id={videoRef.id}
                  width={200}
                  height={200}
                  srcObject={videoRef.stream}
                />
              );
            } else {
              return <a>Not an Video</a>;
            }
          })}
        </>
      )}

      <h1>Local Video</h1>
      {gotMedia === true && videosRef.current.length > 0 && (
        <>
          {videosRef.current.map((videoRef, index) => {
            console.log("videoRef.stream : ", videoRef.stream);
            console.log("videoRef.stream[] : ", [videoRef.stream]);
            return (
              <Video
                key={index}
                id={videoRef.id}
                width={200}
                height={200}
                srcObject={videoRef.stream}
              />
            );
            // if (videoRef.kind === "video") {
            //   return (
            //     <Video
            //       key={index}
            //       id={videoRef.id}
            //       srcObject={videoRef.stream}
            //     />
            //   );
            // } else {
            //   return <a>Not an Video</a>;
            // }
          })}
        </>
      )}
    </div>
  );
}

export default App;
