/* global Netitor, nn */
/*
  WARNING: this class does some funny things with the default functions:
    setTimeout, setInterval, requestAnimationFrame

  This is in order to make the output area work properly when using those functions
  be warned, it will cancel any timing functions running on the same page every time
  a new example is loaded
*/
class JSDemoEditor {
  constructor (opts) {
    this.parent = typeof opts.parent === 'string' ? nn.get(opts.parent) : opts.parent
    this.dataUrl = opts.dataUrl
    this.data = null

    this.buildStructure()

    this.editor = new Netitor({
      ele: this.editorEl,
      code: '',
      lint: false,
      hint: false,
      readOnly: false,
      autoUpdate: false,
      friendlyErr: false
    })

    this.nnLink = nn.create('button')
      .content('open in netnet')
      .css({ float: 'right', transform: 'translate(-1em, -1em)' })
      .on('click', () => this.openInNetnet())
    this.outputContainerEl.prepend(this.nnLink)

    this.init()
  }

  async init () {
    this.data = await nn.loadData(this.dataUrl)

    this.setupAltIntervals()

    this.buildUI()

    this.updateSubList()
  }

  buildStructure () {
    this.navEl = nn.create('nav').css({
      display: 'flex',
      margin: '1em'
    }).addTo(this.parent)

    this.editorSplitEl = nn.create('div').css({
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridGap: '2em'
    }).addTo(this.parent)

    this.editorEl = nn.create('div').addTo(this.editorSplitEl)
    this.outputContainerEl = nn.create('div').addTo(this.editorSplitEl)

    this.outputEl = nn.create('pre').content('...').css({
      border: '1px solid gray',
      borderRadius: '5px',
      padding: '1em',
      marginRight: '1em',
      background: 'rgba(0,0,0,0.1)'
    }).set('class', 'js-demo-editor-output').addTo(this.outputContainerEl)

    this.copyEl = nn.create('p').addTo(this.outputContainerEl)
  }

  buildUI () {
    // first part...
    if (Object.keys(this.data).length > 1) {
      nn.create('span').content(' load example ➞  &nbsp;').addTo(this.navEl)
    } else {
      nn.create('span').content(' load &nbsp;').addTo(this.navEl)

      nn.create('button').content('prev').css({ cursor: 'pointer' })
        .on('click', () => this.prevExample())
        .addTo(this.navEl)

      nn.create('span').content('&nbsp;||&nbsp;').addTo(this.navEl)

      nn.create('button').content('next').css({ cursor: 'pointer' })
        .on('click', () => this.nextExample())
        .addTo(this.navEl)

      nn.create('span').content('&nbsp; example ➞  &nbsp;').addTo(this.navEl)
    }

    // second part...
    if (Object.keys(this.data).length > 1) {
      nn.create('select')
        .set({ options: Object.keys(this.data) })
        .addTo(this.navEl)
        .on('change', () => this.updateSubList())

      nn.create('span').content('&nbsp; /  &nbsp;').addTo(this.navEl)

      nn.create('select')
        .addTo(this.navEl)
        .on('change', () => this.loadExample())
    } else {
      nn.create('select')
        .set({ options: Object.keys(this.data) })
        .css({ display: 'none' })
        .addTo(this.navEl)
        .on('change', () => this.updateSubList())

      nn.create('select')
        .addTo(this.navEl)
        .on('change', () => this.loadExample())
    }

    // last part
    nn.create('span').content('&nbsp;; &nbsp; then ➞  &nbsp;').addTo(this.navEl)

    nn.create('button')
      .content('run code')
      .css({ cursor: 'pointer' })
      .addTo(this.navEl)
      .on('click', () => this.runExample())
  }

  setupAltIntervals () {
    // because some examples may use "setInterval" or "requestAnimationFrame"
    this.intervalIds = []
    this.timeoutIds = []
    this.animationFrameIds = []

    const originalSetInterval = window.setInterval
    const originalSetTimeout = window.setTimeout
    const originalRequestAnimationFrame = window.requestAnimationFrame

    const self = this

    window.setInterval = function (fn, delay, ...args) {
      const id = originalSetInterval(fn, delay, ...args)
      self.intervalIds.push(id)
      return id
    }

    window.setTimeout = function (fn, delay, ...args) {
      const id = originalSetTimeout(fn, delay, ...args)
      self.timeoutIds.push(id)
      return id
    }

    window.requestAnimationFrame = function (callback) {
      const id = originalRequestAnimationFrame(callback)
      self.animationFrameIds.push(id)
      return id
    }
  }

  updateSubList () {
    const selects = this.navEl.querySelectorAll('select')
    const sel1 = selects[0].value
    const sel2 = selects[1]
    sel2.innerHTML = ''
    sel2.set({ options: this.data[sel1].map(o => o.name) })
    this.loadExample()
  }

  nextExample () {
    const selects = this.navEl.querySelectorAll('select')
    // const sel1 = selects[0].value
    const sel2 = selects[1]
    const currentIndex = sel2.selectedIndex
    const nextIndex = (currentIndex + 1) % sel2.options.length
    sel2.selectedIndex = nextIndex
    this.loadExample()
  }

  prevExample () {
    const selects = this.navEl.querySelectorAll('select')
    // const sel1 = selects[0].value
    const sel2 = selects[1]
    const currentIndex = sel2.selectedIndex
    const prevIndex = (currentIndex - 1 + sel2.options.length) % sel2.options.length
    sel2.selectedIndex = prevIndex
    this.loadExample()
  }

  clearOutput () {
    this.intervalIds.forEach(clearInterval)
    this.timeoutIds.forEach(clearTimeout)
    this.animationFrameIds.forEach(window.cancelAnimationFrame)
    this.outputEl.content('')
  }

  loadExample () {
    this.clearOutput()
    const selects = this.navEl.querySelectorAll('select')
    const sel1 = selects[0].value
    const sel2 = selects[1].value
    const obj = this.data[sel1].find(o => o.name === sel2)

    this.copyEl.content(obj.text)
    this.editor.code = obj.code
    this.outputEl.content('...')
  }

  runExample () {
    this.clearOutput()
    const log = (x) => nn.create('div').content(JSON.stringify(x, null, 2)).addTo(this.outputEl)
    const clear = (x) => { this.outputEl.innerText = '' }
    const c = this.editor.code.replace('<script>', '').replace('<\/script>', '')
    if (c.includes('log(')) eval(c)
    else this.outputEl.content('<span style="color: red">code has no log() to output here</span>')
  }

  openInNetnet () {
    const base = 'https://netnet.studio/?layout=dock-left#code/'
    const c = this.editor.code.replace(/log\(/g, 'console.log(').replace(/clear\(/g, 'console.clear(')
    const url = base + this.editor._encode(c)
    window.open(url, '_blank')
  }
}

window.onerror = function (message, source, lineno) {
  const e = `${message} on line:${lineno}`
  nn.getAll('.js-demo-editor-output').forEach(el => {
    el.innerHTML = `<span style="color: red">${e}</span>`
  })
}

window.JSDemoEditor = JSDemoEditor
