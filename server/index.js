onServerStartup () {
  const { serverId, ip } = getServerInfo() // serverId does not change across restarts
  this.serverId = serverId

  // We don't have any routers or producers (yet). Clear any value that exists in the DB related to our serverId
  clearSharedDB(serverId, 'routers')
  clearSharedDB(serverId, 'producers')
  // Update the DB with our serverId and ip so that others will know how to reach us
  registerServerInDB(serverId, ip)
  
  // Have some kind of pub-sub mechanism so other nodes can notify us when producers are created
  this.pubsub = new PubSub()
  
  // When a new room is created on this server
  this.on('room:create', (room) => {
    const { roomName } = room
    this.pubsub.on(`${roomName}:producer:add`, this.onNewProducer)
    registerServerForRoomInDB(roomName, serverId)
    
    // This room may have producers on other servers.
    // We need to fetch those and also share any producers that are created locally.
    
    // Set up listeners for producer events that can occur on this room
    room.on('producer:add', producer => {
      const { serverId } = this
      const { id: producerId } = producer
      // Update the DB to inform other servers that we have a producer for this room
      const router = getRouterForProducer(producer)
      addProducerToDB(serverId, roomName, producerId, router.id)
      // Publish to pubsub about this new producer
      this.pubsub.emit(`${roomName}:producer:add`, { serverId, roomName, producerId })
    })
    room.on('producer:close', ({ producerId }) => {
      removeProducerFromDB(serverId, roomName, producerId)
    })
    
    // Fetch producers on other nodes, then iterate over these producers, and create a pipe for each one
    const remoteProducers = getRemoteProducersFromDB(serverId, roomName)
    for (entry of remoteProducers) {
      const { serverId: remoteServerId, producerId, routerId } = entry
      await this.onRoomProducerAdd({
        serverId: remoteServerId,
        roomName,
        producerId,
        routerId
      })
    }
  })
  
  this.on('room:destroy', ({ roomName }) => {
    // This node no longer has any clients belonging to this room
    this.pubsub.off(`${roomName}:producer:add`, this.onNewProducer)
    unregisterServerForRoomInDB(roomName, serverId)
  })
}

async onNewProducer (data) {
  const { serverId } = data
  if (serverId === this.serverId) {
    // We published this message when we got a new producer. Ignore it
    return
  }
  // Set up this remote producer
  await this.onRoomProducerAdd(data)
  const { producer, appData } = getProducerFromRoom(room)
  // Inform all local clients about this new producer
  notifyLocalClients({ producerId: producer.id, appData })
}

async onRoomProducerAdd ({ serverId: remoteServerId, roomName, producerId, routerId }) {
  const { serverId } = this
  if (remoteServerId === serverId) {
    // This may be called for producers created on a different router (worker)
    return
  }
  // TODO: Add more details
  const remoteServerIp = getServerIPFromDB(remoteServerId)
  
  const signal = Signal.getSignal(remoteServerIp, roomName) // Communicates between nodes
  const pipeTransport = getOrCreatePipeTransport({
    serverId: remoteServerId,
    serverIp: remoteServerIp,
    roomName,
    routerId,
    signal
  })

  
  const { producerId: pipeProducerId, kind, paused, appData } = await signal.getProducerParameters(producerId)
  const { rtpParameters } = await signal.consume(pipeProducerId) // Really, pipeProducerId should be the same as producerId.. I think
  const localPipeProducer = await pipeTransport.produce({
    id: producerId,
    producerId,
    kind,
    rtpParameters,
    paused,
    appData
  })
  // Events
  localPipeProducer.on('close', async () => {
    // Do any local, room-related cleanup
    await room.onProducerClose(localPipeProducer)
    // TODO: Figure out what else we should be doing here
  })  
  // TODO: Figure out if we should be setting up listeners for other events
}

// Gets a pipe transport from this node to the remote node if it already exists.
// If it does not, then it creates one and  returns the new pipeTransport instead.
async getOrCreatePipeTransport ({ serverId, serverIp, roomName, routerId, signal }) {
  // We should be getting the best possible router on the remote node
  // creating a new one if the existing router (worker) is overburdened.
  // But, for the purposes of this gist, we're going to abstract away all of that and just
  // connect to the routerId we already have
  
  const localRouter = await this.getBestRouterForRoom(roomName) // This is the router we're going to pair with the remote routerId
  
  // Create a local transport which we're going to connect to the remote node
  const localPipeTransport = await router.createPipeTransport({
    listenIps: [serverIp],
    // The following values are all defaults taken from https://github.com/versatica/mediasoup/blob/8748db0c0595841dc6eb56a43a9fd52a416b3aac/lib/Router.js#L280
    enableSctp: true,
    numSctpStreams: { OS: 1024, MIS: 1024 },
    enablertx: false,
    enableSrtp: false
  })
  // Register this pipe transport as existing between us and the remote serverId
  // This is done so that we can reuse this pipeTransport in the future
  registerPipeTransport(this.serverId, serverId, localPipeTransport)
  
  // Get all the transport parameters
  const { srtpParameters, tuple: { localIp, localPort } } = localPipeTransport

  // Signal the remote node to create the pipe transport
  const response = await signal.createPipeTransport({
    routerId, // The remote routerId
    localTransportId: localPipeTransport.id,
    transportParameters: {
      tuple: {
        localIp,
        localPort
      }
    },
    srtpParameters
  })
  
  // The remote client is trying to connect to us at this point. So we connect back
  const { 
    transportParameters: {
      tuple: {
        localIp: remoteIp,
        localPort: remotePort
      },
      srtpParameters: remoteSrtpParameters
    }
  } = response
  await localPipeTransport.connect({
    ip: remoteIp,
    port: remotePort,
    srtpParameters: remoteSrtpParameters
  })
  // TODO: Set up the various listeners
  
  
}
