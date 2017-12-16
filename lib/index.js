const util = require('./util')

class MatterSound {
  constructor (options) {
    this.name = 'matter-sound'
    this.version = '0.0.0' // PLUGIN_VERSION
    this.for = 'matter-js@^0.12.0'
  }

  install (Matter) {
    this.Matter = Matter

    let self = this

    this.Matter.after('Engine.create', function () {
      self.initEngine(this)
    })
    this.Matter.after('World.add', function () {
      self.reset()
      self.createWorldSoundChains(this)
    })
    this.Matter.after('World.remove', function () {
      self.reset()
      self.createWorldSoundChains(this)
    })
  }
}

Object.assign(MatterSound.prototype, require('./engine'))
Object.assign(MatterSound.prototype, require('./bodies'))

module.exports = MatterSound
