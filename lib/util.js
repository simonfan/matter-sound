const Matter = require('matter-js')

function isSoundBody(body, type) {
	type = type || 'any'

	let soundConfig = body.plugin && body.plugin.sound

	if (!soundConfig) {
		return false
	}

	switch (type) {
		case 'any':
			return true
			break
		case 'source':
			return soundConfig.source ? true : false
			break
		case 'transform':
			return soundConfig.transform ? true : false
			break
		case 'destination':
			return soundConfig.destination ? true : false
			break
		default:
			return false
	}
	
}

function validateSoundConfig(body, type) {
	let config = body.plugin.sound[type]

	if (typeof config.audioNode !== 'function') {
		console.warn(`${body.label}: sound.${type} misconfigured - expected audioNode to be a function, got ${typeof config.audioNode}`)
		return false
	}

	return true
}


function isReceiverBody(body) {
	return isSoundBody(body, 'transform') || isSoundBody(body, 'destination')
}

function maxVertexDistance(body) {
	return body.vertices.reduce((res, vertex) => {
    let distance = calulateDistance(body.position, vertex)
    return distance > res ? distance : res
  }, 0)
}

function avgVertexDistance(body) {
	let totalDistance = body.vertices.reduce((res, vertex) => {
		let distance = calulateDistance(body.position, vertex)
		return res + distance
	}, 0)
	return totalDistance / body.vertices.length
}

function calulateDistance(positionA, positionB) {
  // compute distance between bodies
  return Matter.Vector.magnitude(
    Matter.Vector.sub(positionA, positionB)
  )
}

exports.isSoundBody = isSoundBody
exports.validateSoundConfig = validateSoundConfig
exports.isReceiverBody = isReceiverBody
exports.maxVertexDistance = maxVertexDistance
exports.avgVertexDistance = avgVertexDistance
exports.calulateDistance = calulateDistance

// exports.calcVolume = function (mic, body, options) {
//   let distance = exports.calulateDistance(mic.position, body.position)

//   let maxDistance = options.maxDistance
//   let maxVolume   = options.maxVolume - options.minVolume

//   let distanceToVolumeRatio = (maxDistance - distance) / maxDistance
//   return options.minVolume + (distanceToVolumeRatio * maxVolume)
// }

