const util = require('./util')

/**
 * Invokes hooks on the receiver body
 * @param  {[type]} type         [description]
 * @param  {[type]} hook         [description]
 * @param  {[type]} receiverBody [description]
 * @param  {[type]} sourceBody   [description]
 * @return {[type]}              [description]
 */
function invokeReceiverHook(type, hook, receiverBody, sourceBody) {
	let receiverSoundConfig = receiverBody.plugin.sound[type]
	let hookFn = receiverSoundConfig[hook]

	if (typeof hookFn === 'function') {

		let distance = util.calulateDistance(receiverBody.position, sourceBody.position)
		let maxDistance = receiverBody.plugin.sound.radius + sourceBody.plugin.sound.radius

		let hookData = {
			concentricity: 1 - Math.min(distance / maxDistance, 1),
			source: sourceBody,
			audioNode: this.getAudioNodeForSourceAndReceiver(sourceBody, receiverBody),
		}

		hookData[type] = receiverBody

		hookFn(hookData)
	}
}

exports.initEngine = function(engine) {
  this.Matter.Events.on(engine, 'collisionStart', (e) => {

    let pairs = e.pairs

    pairs.forEach(pair => {
      let bodyA = pair.bodyA
      let bodyB = pair.bodyB

      if (util.isSoundBody(bodyA))

      if (util.isSoundBody(bodyA, 'source')) {

      	if (util.isSoundBody(bodyB, 'transform')) {
      		// flow from A to B
      		invokeReceiverHook.call(this, 'transform', 'onEnterRange', bodyB, bodyA)
      	}

      	if (util.isSoundBody(bodyB, 'destination')) {
      		// flow from A to B
      		invokeReceiverHook.call(this, 'destination', 'onEnterRange', bodyB, bodyA)
      	}
      }

      if (util.isSoundBody(bodyB, 'source')) {

      	if (util.isSoundBody(bodyA, 'transform')) {
      		// flow from B to A
      		invokeReceiverHook.call(this, 'transform', 'onEnterRange', bodyA, bodyB)
      	}

      	if (util.isSoundBody(bodyA, 'destination')) {
      		// flow from B to A
      		invokeReceiverHook.call(this, 'destination', 'onEnterRange', bodyA, bodyB)
      	}
      }

    })
  })

  this.Matter.Events.on(engine, 'collisionActive', (e) => {

    let pairs = e.pairs

    pairs.forEach(pair => {
      let bodyA = pair.bodyA
      let bodyB = pair.bodyB

      if (util.isSoundBody(bodyA))

      if (util.isSoundBody(bodyA, 'source')) {

      	if (util.isSoundBody(bodyB, 'transform')) {
      		// flow from A to B
      		invokeReceiverHook.call(this, 'transform', 'onUpdateConcentricity', bodyB, bodyA)
      	}

      	if (util.isSoundBody(bodyB, 'destination')) {
      		// flow from A to B
      		invokeReceiverHook.call(this, 'destination', 'onUpdateConcentricity', bodyB, bodyA)
      	}
      }

      if (util.isSoundBody(bodyB, 'source')) {

      	if (util.isSoundBody(bodyA, 'transform')) {
      		// flow from B to A
      		invokeReceiverHook.call(this, 'transform', 'onUpdateConcentricity', bodyA, bodyB)
      	}

      	if (util.isSoundBody(bodyA, 'destination')) {
      		// flow from B to A
      		invokeReceiverHook.call(this, 'destination', 'onUpdateConcentricity', bodyA, bodyB)
      	}
      }

    })
  })

  this.Matter.Events.on(engine, 'collisionEnd', (e) => {

    let pairs = e.pairs

    pairs.forEach(pair => {
      let bodyA = pair.bodyA
      let bodyB = pair.bodyB

      if (util.isSoundBody(bodyA))

      if (util.isSoundBody(bodyA, 'source')) {

      	if (util.isSoundBody(bodyB, 'transform')) {
      		// flow from A to B
      		invokeReceiverHook.call(this, 'transform', 'onLeaveRange', bodyB, bodyA)
      	}

      	if (util.isSoundBody(bodyB, 'destination')) {
      		// flow from A to B
      		invokeReceiverHook.call(this, 'destination', 'onLeaveRange', bodyB, bodyA)
      	}
      }

      if (util.isSoundBody(bodyB, 'source')) {

      	if (util.isSoundBody(bodyA, 'transform')) {
      		// flow from B to A
      		invokeReceiverHook.call(this, 'transform', 'onLeaveRange', bodyA, bodyB)
      	}

      	if (util.isSoundBody(bodyA, 'destination')) {
      		// flow from B to A
      		invokeReceiverHook.call(this, 'destination', 'onLeaveRange', bodyA, bodyB)
      	}
      }

    })
  })
}
