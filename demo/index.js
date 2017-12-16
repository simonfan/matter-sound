const Matter = require('matter-js')
const Tone = require('tone')

const scale = require('d3-scale')


// Tone.Master.mute = true

/**
 * Matter submodules
 */
const Engine = Matter.Engine
const Render = Matter.Render
const Runner = Matter.Runner
const Bodies = Matter.Bodies
const World = Matter.World
const Mouse = Matter.Mouse
const MouseConstraint = Matter.MouseConstraint
const Events = Matter.Events
const Common = Matter.Common

const MatterSound = require('../')


const waveformAudioNode = require('./waveform')()

function setup(options) {
  const CANVAS_WIDTH = options.canvasWidth
  const CANVAS_HEIGHT = options.canvasHeight
  let canvas = options.canvas

  if (!canvas) {
    throw new Error('canvas is required')
  }
  
  if (!CANVAS_WIDTH) {
    throw new Error('CANVAS_WIDTH is required')
  }
  
  if (!CANVAS_HEIGHT) {
    throw new Error('CANVAS_HEIGHT is required')
  }

  Matter.use(new MatterSound({

  }))

  // create engine
  let engine = Engine.create({
  	// enable sleeping as we are collision heavy users
  	// enableSleeping: true,
  })

  engine.world.gravity.x = 0
  engine.world.gravity.y = 0

  // create renderer
  let render = Render.create({
  	canvas: canvas,
  	engine: engine,
  	options: {
  		wireframes: false,
      background: 'transparent',
  		width: CANVAS_WIDTH,
  		height: CANVAS_HEIGHT,
  	}
  })

  // create runner
  let runner = Runner.create()

  Runner.run(runner, engine)
  Render.run(render)

  let walls = [
  	// ceiling
		Bodies.rectangle(
	    CANVAS_WIDTH / 2, // align center to center
	    -(60 / 2),         
	    CANVAS_WIDTH, // width
	    60,  // height
	    {
	      isStatic: true,
	      restitution: 1,
	    }
	  ),
	  // ground
		Bodies.rectangle(
	    CANVAS_WIDTH / 2, // align center to center
	    CANVAS_HEIGHT + (60 / 2),         
	    CANVAS_WIDTH, // width
	    60,  // height
	    {
	      isStatic: true,
	      restitution: 1,
	      plugin: {
	        collision: {
	        	start: (e) => {
	        		// console.log(`collision started for body ${e.self.label} with ${e.other.label}`)
	        	}
	        }
	      }
	    }
	  ),
	  // left
		Bodies.rectangle(
	    -(60 / 2), // align center to center
	    CANVAS_HEIGHT / 2,         
	    60, // width
	    CANVAS_HEIGHT,  // height
	    {
	      isStatic: true,
	      restitution: 1,
	    }
	  ),
	  // right
		Bodies.rectangle(
	    CANVAS_WIDTH + (60 / 2), // align center to center
	    CANVAS_HEIGHT / 2,         
	    60, // width
	    CANVAS_HEIGHT,  // height
	    {
	      isStatic: true,
	      restitution: 1,
	    }
	  ),
	]

  World.add(engine.world, walls)


  /**
   * Sound
   */

  let sources = [
    Bodies.circle(CANVAS_WIDTH * 2/5, CANVAS_HEIGHT / 2, 20, {
      label: 'sound-1',
      restitution: 1,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,

      render: {
        fillStyle: 'darkred',
      },
      plugin: {
        sound: {
          source: {
            audioNode: () => {
              let synth = new Tone.PolySynth(4, Tone.Synth)
              synth.volume.value = 5
              synth.triggerAttack(['C3', 'E3', 'G3', 'B3'])

              return synth
            },
          }
        },
      }
    }),

    Bodies.circle(CANVAS_WIDTH * 3/5, CANVAS_HEIGHT / 2, 20, {
      label: 'sound-2',
      restitution: 1,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,

      render: {
        fillStyle: 'yellow',
      },
      plugin: {
        sound: {
          source: {
            audioNode: () => {
              return (new Tone.PolySynth(4, Tone.Synth)).triggerAttack(['C4', 'E4', 'G4', 'B4'])
            },
          }
        },
      }
    }),
  ]

  let effects = [
    Bodies.circle(CANVAS_WIDTH * 1/2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * .40, {
      label: 'tremolo',
      isSensor: true,
      isStatic: true,
      render: {
        fillStyle: 'transparent',
        strokeStyle: 'white',
        lineWidth: 1,
      },
      plugin: {
        sound: {
          transform: {
            audioNode: () => {
              return new Tone.Tremolo().start()
            },

            onUpdateConcentricity: (data) => {
              // console.log('mic onUpdateConcentricity', data.concentricity)

              // let frequency = scale
              //   .scaleThreshold()
              //   .domain([0, 1])
              //   .range(['C1', 'D1', 'E1'])

              // console.log(volume(data.concentricity))

              data.audioNode.depth.value = data.concentricity
            },
          }
        }
      }
    }),
  ]

  let microphones = [
    Bodies.circle(CANVAS_WIDTH * 1/2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * .45, {
      label: 'mic-1',
      isSensor: true,
      isStatic: true,
      render: {
        fillStyle: 'transparent',
        strokeStyle: 'white',
        lineWidth: 1,
      },
      plugin: {
        sound: {
          destination: {
            audioNode: () => {
              return new Tone.Volume(-10).fan(waveformAudioNode, Tone.Master)
            },

            // onEnterRange: (data) => {
            //   console.log('mic onEnterRange', data)
            // },

            onUpdateConcentricity: (data) => {
              // console.log('mic onUpdateConcentricity', data.concentricity)

              let volume = scale
                .scaleLinear()
                .domain([0, 1])
                .range([-20, 0])

              // console.log(volume(data.concentricity))

              data.audioNode.volume.value = volume(data.concentricity)
            },

            // onLeaveRange: (data) => {
            //   console.log('mic onLeaveRange', data)
            // }
          }
        }
      }
    }),
  ]

  World.add(engine.world, microphones)
  World.add(engine.world, effects)
  World.add(engine.world, sources)

  window.removeSource = function () {
    World.remove(engine.world, sources[0])
  }

  window.addSource = function () {
    World.add(engine.world, sources[0])
  }


  // add mouse control
  let mouse = Mouse.create(render.canvas)
  let mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      // allow bodies on mouse to rotate
      angularStiffness: 1,
      render: {
        visible: false
      }
    }
  })

  World.add(engine.world, mouseConstraint);

  // keep the mouse in sync with rendering
  render.mouse = mouse;

  return {
  	engine: engine,
  	stop: () => {
	    Matter.Render.stop(render)
	    Matter.Runner.stop(runner)
  	}
  }
}

setup({
  canvasWidth: window.innerWidth,
  canvasHeight: window.innerHeight,
  canvas: document.querySelector('canvas'),
})
