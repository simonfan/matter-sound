const Matter = require('matter-js')
const Tone = require('tone')

const scale = require('d3-scale')

Tone.Master.volume.value = -30
Tone.Master.mute = true

let OVERALL_LIMITER = new Tone.Limiter(-6)
OVERALL_LIMITER.toMaster()

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

  window.matterSound = new MatterSound()

  Matter.use(matterSound)

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
        fillStyle: 'transparent',
        strokeStyle: 'white',
        lineWidth: 4,
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
        fillStyle: 'white',
      },
      plugin: {
        sound: {
          source: {
            audioNode: () => {
              let synth = new Tone.PolySynth(4, Tone.Synth)
              synth.triggerAttack(['C4', 'E4', 'G4', 'B4'])
              return synth
            },
          }
        },
      }
    }),
  ]

  let effects = [
    Bodies.circle(CANVAS_WIDTH * 2/5, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * .40, {
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

            bgColorScale: scale.scaleLinear().domain([0, 1]).range(['black', 'darkred']),

            onUpdateConcentricity: function (data) {
              data.audioNode.depth.value = data.concentricity
            },
          }
        }
      }
    }),
    Bodies.circle(CANVAS_WIDTH * 3/5, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * .40, {
      label: 'vibrato',
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
              return new Tone.Vibrato()
            },

            bgColorScale: scale.scaleLinear().domain([0, 1]).range(['black', 'darkred']),

            onUpdateConcentricity: function (data) {
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
              let volumeNode = new Tone.Volume()
              volumeNode.fan(waveformAudioNode, OVERALL_LIMITER)
              return volumeNode
            },

            onUpdateConcentricity: (data) => {
              // console.log('mic onUpdateConcentricity', data.concentricity)

              let volume = scale
                .scaleLinear()
                .domain([0, 1])
                .range([-20, 0])

              data.audioNode.volume.value = volume(data.concentricity)
            },
          }
        }
      }
    }),

    // Bodies.circle(CANVAS_WIDTH * 1/6, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * .15, {
    //   label: 'mic-2',
    //   isSensor: true,
    //   isStatic: true,
    //   render: {
    //     fillStyle: 'transparent',
    //     strokeStyle: 'white',
    //     lineWidth: 1,
    //   },
    //   plugin: {
    //     sound: {
    //       destination: {
    //         audioNode: () => {
    //           let volumeNode = new Tone.Volume(-25)
    //           volumeNode.fan(waveformAudioNode, OVERALL_LIMITER)
    //           return volumeNode
    //         },

    //         onUpdateConcentricity: (data) => {

    //           let volume = scale
    //             .scaleLinear()
    //             .domain([0, 1])
    //             .range([-25, -10])

    //           console.log('mic-2 onUpdateConcentricity', volume(data.concentricity))
    //           data.audioNode.volume.value = volume(data.concentricity)
    //         },
    //       }
    //     }
    //   }
    // }),


    // Bodies.circle(CANVAS_WIDTH * 5/6, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * .15, {
    //   label: 'mic-3',
    //   isSensor: true,
    //   isStatic: true,
    //   render: {
    //     fillStyle: 'transparent',
    //     strokeStyle: 'white',
    //     lineWidth: 1,
    //   },
    //   plugin: {
    //     sound: {
    //       destination: {
    //         audioNode: () => {
    //           let volumeNode = new Tone.Volume(-25)
    //           volumeNode.fan(waveformAudioNode, OVERALL_LIMITER)
    //           return volumeNode
    //         },

    //         onUpdateConcentricity: (data) => {
    //           // console.log('mic onUpdateConcentricity', data.concentricity)

    //           let volume = scale
    //             .scaleLinear()
    //             .domain([0, 1])
    //             .range([-25, -10])

    //           console.log('mic-3 onUpdateConcentricity', volume(data.concentricity))
    //           data.audioNode.volume.value = volume(data.concentricity)
    //         },
    //       }
    //     }
    //   }
    // }),

  ]

  window.sources = sources

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



  setTimeout(() => {
    Tone.Master.mute = false
    Tone.Master.volume.rampTo(0)
  }, 200)


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

window.addEventListener('beforeunload', (e) => {
  // mute tone.js to prevent crackling
  Tone.Master.mute = true
})