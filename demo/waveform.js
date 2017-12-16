const Tone = require('tone')

let waveform = new Tone.Waveform(1024)

module.exports = function () {
	let canvas = document.querySelector('#waveform-canvas')
	let context = canvas.getContext('2d')

	let canvasWidth = window.innerWidth
	let canvasHeight = window.innerHeight
	
	canvas.width = canvasWidth
	canvas.height = canvasHeight

	function drawWaveform(values){
		//draw the waveform
		context.clearRect(0, 0, canvas.width, canvas.height)
		context.beginPath()
		context.lineJoin = 'round'
		context.lineWidth = 2
		context.strokeStyle = 'white'
		context.moveTo(0, (values[0] / 255) * canvas.height)
		for (var i = 1, len = values.length; i < len; i++){
			var val = (values[i] + 1) / 2
			var x = canvas.width * (i / len)
			var y = val * canvas.height
			context.lineTo(x, y)
		}
		context.stroke()
	}

	function loop(){
		requestAnimationFrame(loop)
		//get the waveform valeus and draw it
		var waveformValues = waveform.getValue()
		drawWaveform(waveformValues)
	}
	loop()

	return waveform
}
