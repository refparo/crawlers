'use strict'
const { JSDOM } = require('jsdom')

JSDOM.fromURL("https://github.com/jsdom/jsdom")
  .then(dom => {
    const { document } = dom.window
    console.log(document.getElementsByClassName("repository-meta-content")[0].innerHTML)
  })
