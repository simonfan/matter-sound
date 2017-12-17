const util = require('./util')

/**
 * Invokes hooks on the receiver body
 * @param  {String} receiverType Type of the receiver body
 * @param  {String} hook         Name of the hook to be invoked
 * @param  {Matter.Body} receiverBody
 * @param  {Matter.Body} sourceBody
 */
function invokeReceiverHook(receiverType, hook, receiverBody, sourceBody) {
	let receiverSoundConfig = receiverBody.plugin.sound[receiverType]
	let hookFn = receiverSoundConfig[hook]

	if (typeof hookFn === 'function') {

    let audioNode = this.getAudioNodeForSourceAndReceiver(sourceBody, receiverBody)
    if (!audioNode) {
      // TODO in a well tested code this would never happen.
      // remove this after tests are prepared
      console.warn('error finding audioNode')
      return
    }

    let concentricity

    if (hook === 'onUpdateConcentricity' || hook === 'onEnterRange') {
      let distance = util.calulateDistance(receiverBody.position, sourceBody.position)
      let maxDistance = receiverBody.plugin.sound.radius + sourceBody.plugin.sound.radius
      concentricity = 1 - Math.min(distance / maxDistance, 1)
    } else {
      // for onLeaveRange, concentricity is always 0
      concentricity = 0
    }

		let hookData = {
			concentricity: concentricity,
			source: sourceBody,
			audioNode: audioNode
		}

		hookData[receiverType] = receiverBody

		hookFn.call(receiverSoundConfig, hookData)
	}
}

/**
 * Setup event listeners on the engine
 * @param  {Matter.Engine} engine
 */
exports.initEngine = function(engine) {

  function _handleCollisionEvent(hook, e) {
    let pairs = e.pairs

    pairs.forEach(pair => {
      let bodyA = pair.bodyA
      let bodyB = pair.bodyB

      if (util.isSoundBody(bodyA, 'source')) {

        if (util.isSoundBody(bodyB, 'transform')) {
          // flow from A to B
          invokeReceiverHook.call(this, 'transform', hook, bodyB, bodyA)
        }

        if (util.isSoundBody(bodyB, 'destination')) {
          // flow from A to B
          invokeReceiverHook.call(this, 'destination', hook, bodyB, bodyA)
        }
      }

      if (util.isSoundBody(bodyB, 'source')) {

        if (util.isSoundBody(bodyA, 'transform')) {
          // flow from B to A
          invokeReceiverHook.call(this, 'transform', hook, bodyA, bodyB)
        }

        if (util.isSoundBody(bodyA, 'destination')) {
          // flow from B to A
          invokeReceiverHook.call(this, 'destination', hook, bodyA, bodyB)
        }
      }

    })
  }

  this.Matter.Events.on(
    engine,
    'collisionStart',
    _handleCollisionEvent.bind(this, 'onEnterRange')
  )

  this.Matter.Events.on(
    engine,
    'collisionActive',
    _handleCollisionEvent.bind(this, 'onUpdateConcentricity')
  )

  this.Matter.Events.on(
    engine,
    'collisionEnd',
    _handleCollisionEvent.bind(this, 'onLeaveRange')
  )
}
