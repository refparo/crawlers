'use strict'
import { JSDOM } from 'jsdom'

export const sampleCrawler = () => JSDOM
  .fromURL("https://github.com/jsdom/jsdom")
  .then(dom => dom.window.document)
  .then(document => console.log(document
    .getElementsByClassName("repository-meta-content")[0]
    .innerHTML))
