const util = require('./util')

exports.updateBodiesSoundRadiuses = function () {
  this.bodies.sources
    .concat(this.bodies.transforms)
    .concat(this.bodies.destinations)
    .forEach((body) => {
      if (body.plugin.sound.radius === undefined) {
        /**
         * Use the plugin configured radius if it is set.
         * Otherwise, the radius is the avgVertexDistance of the body
         * @type {Number}
         */
        body.plugin.sound.radius = util.avgVertexDistance(body)
      }
    })
}

exports.reset = function () {
  if (this.bodies && Array.isArray(this.bodies.sources)) {
    this.bodies.sources.forEach(sourceBody => {
      this.destroySourceBodySoundChain(sourceBody)
    })
  }
}

exports.createWorldSoundChains = function (world) {
  this.bodies = {
    sources: [],
    transforms: [],
    destinations: [],
  }

  world.bodies.forEach(body => {
    let sound = body.plugin && body.plugin.sound

    if (sound) {
      if (util.isSoundBody(body, 'source') && util.validateSoundConfig(body, 'source')) {
        this.bodies.sources.push(body)
      }

      if (util.isSoundBody(body, 'transform') && util.validateSoundConfig(body, 'transform')) {
        this.bodies.transforms.push(body)
      }

      if (util.isSoundBody(body, 'destination') && util.validateSoundConfig(body, 'destination')) {
        this.bodies.destinations.push(body)
      }
    }
  })

  this.updateBodiesSoundRadiuses()

  this.bodies.sources.forEach(sourceBody => {
    this.bodies.destinations.forEach(destinationBody => {
      this.createSourceBodySoundChain(sourceBody, destinationBody)
    })
  })
}

exports.destroySourceBodySoundChain = function (sourceBody) {
  let source = sourceBody.plugin.sound.source
  let soundChain = source._soundChain

  if (soundChain) {
    for (let bodyId in soundChain.audioNodesById) {
      soundChain.audioNodesById[bodyId].dispose()
    }
  }

  delete source._soundChain
}

/**
 * Instantiates all audio nodes and chains them up.
 * Also stores them so that each audioNode may be retrieved
 * given the body (source, transform or destination)
 * 
 * @param  {[type]} sourceBody      [description]
 * @param  {[type]} destinationBody [description]
 * @return {[type]}                 [description]
 */
exports.createSourceBodySoundChain = function (sourceBody, destinationBody) {
  /**
   * Store the audioNodes of this chain by id relating
   * to their originating body.
   *
   * ATTENTION:
   * It is very important to remember that each transformBody
   * and destinationBody generates an audio node per sourceBody.
   * @type {Object}
   */
  let audioNodesById = {}

  let source = sourceBody.plugin.sound.source
  let destination = destinationBody.plugin.sound.destination

  let transformCount = this.bodies.transforms.length

  let sourceAudioNode = source.audioNode()
  audioNodesById[sourceBody.id] = sourceAudioNode

  let transformAudioNodes = this.bodies.transforms.map(transformBody => {
    let transformAudioNode = transformBody.plugin.sound.transform.audioNode()
    audioNodesById[transformBody.id] = transformAudioNode

    return transformAudioNode
  })

  let destinationAudioNode = destination.audioNode()
  audioNodesById[destinationBody.id] = destinationAudioNode

  sourceAudioNode.chain.apply(
    sourceAudioNode,
    transformAudioNodes.concat([destinationAudioNode])
  )

  source._soundChain = {
    audioNodesById: audioNodesById,
  }
}

exports.getAudioNodeForSourceAndReceiver = function (sourceBody, receiverBody) {
  return sourceBody.plugin.sound.source._soundChain.audioNodesById[receiverBody.id]
}
