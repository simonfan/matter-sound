const util = require('./util')

/**
 * Calculates the sound radiuses of all bodies.
 * The sound radius is stored as a root property on
 * the Body.plugin.sound object.
 *
 * It is used to calculated the concentricity of bodies
 */
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

/**
 * Destroys all audio nodes
 */
exports.reset = function () {
  if (this.bodies && Array.isArray(this.bodies.sources)) {
    this.bodies.sources.forEach(sourceBody => {
      this.destroySourceBodySoundChain(sourceBody)
    })
  }
}

/**
 * Separates the given `world`'s bodies into sources
 * transforms and destinations and invokes methods that
 * setup the sound chains
 * 
 * @param  {Matter.World} world
 */
exports.setup = function (world) {
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

  /**
   * For each combination of sourceBody and destinationBody,
   * setup a sourceBody soundChain.
   */
  this.bodies.sources.forEach(sourceBody => {
    this.bodies.destinations.forEach(destinationBody => {
      console.log(destinationBody.id)
      this.createSourceBodySoundChain(sourceBody, destinationBody)
    })
  })
}

/**
 * Destroy's the given sourceBody's soundChain
 * @param  {Matter.Body} sourceBody
 */
exports.destroySourceBodySoundChain = function (sourceBody) {
  let source = sourceBody.plugin.sound.source
  let relatedAudioNodesById = source._relatedAudioNodesById

  if (relatedAudioNodesById) {
    for (let bodyId in relatedAudioNodesById) {
      relatedAudioNodesById[bodyId].dispose()
    }
  }

  delete source._relatedAudioNodesById
}

/**
 * Instantiates all audio nodes and chains them up.
 * Also stores them so that each audioNode may be retrieved
 * given the body (source, transform or destination)
 * 
 * @param  {Matter.Body} sourceBody
 * @param  {Matter.Body} destinationBody
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

  /**
   * TODO: better document this
   */

  source._relatedAudioNodesById = source._relatedAudioNodesById || {}
  Object.assign(source._relatedAudioNodesById, audioNodesById)
}

/**
 * Retrieves the audioNode that corresponds to the connection between
 * sourceBody and receiverBody (transformBody or destinationBody)
 * @param  {Matter.Body} sourceBody
 * @param  {Matter.Body} receiverBody
 * @return {Tone.AudioNode}
 */
exports.getAudioNodeForSourceAndReceiver = function (sourceBody, receiverBody) {
  return sourceBody.plugin.sound.source._relatedAudioNodesById[receiverBody.id]
}
