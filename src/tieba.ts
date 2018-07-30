import * as fs from 'fs-extra'
import * as https from 'https'

import { JSDOM } from 'jsdom'
import { range, chunk } from 'lodash'

import { withLog, safeMkdir } from './util'

interface Anchor { readonly text: string, readonly url: string }
interface Image { readonly filename: string, readonly url: string }
type FloorContent = string | Anchor | Image
interface Floor {
  readonly author: string
  readonly time: string
  readonly content: FloorContent[]
}

export const downloadImage = (img: Image, dir: string) =>
  new Promise((resolve, reject) => https.get(img.url, res => {
    const dest = dir + '/' + img.filename
    if (fs.existsSync(dest)) resolve() // skip if image already exists
    else {
      const stream = fs.createWriteStream(dest)
      res.pipe(stream)
      stream.on('finish', res => {
        stream.close()
        console.log(`downloaded image: ${img.url}`)
        resolve(res)
      })
      stream.on('error', err => {
        fs.unlink(dest)
        reject(err)
      })
    }
  }))

export const crawlPage = (url: string) => JSDOM.fromURL(url)
  .then(dom => dom.window.document)
  .then(withLog(`crawled post page: ${url}`))
  .then(document => document.getElementsByClassName('l_post'))
  .then(floors => Array.from(floors)
    // remove ads
    .filter(elem => elem.getElementsByClassName('ad_bottom_view').length == 0)
    .map(elem => <Floor> ({
      author: elem.getElementsByClassName('p_author_name')[0].textContent,
      time: Array
        .from(elem.getElementsByClassName('post-tail-wrap')[0].children)
        .filter(elem =>
          elem.textContent.match(/\d{4}\-\d{2}\-\d{2} \d{2}:\d{2}/))[0]
        .textContent,
      content: Array
        .from(elem.getElementsByClassName('d_post_content')[0].childNodes)
        .map(elem => ({
          '#text': (elem: Node) => elem.textContent,
          'BR': () => "\n",
          'A': (elem: HTMLAnchorElement) => <Anchor> {
              text: elem.textContent,
              url: {
                "j-no-opener-url": () => elem.href,
                "at": () =>
                  'https://https://tieba.baidu.com' + elem.href
              }[elem.className]()
          },
          'IMG': (elem: HTMLImageElement) => {
            const src = elem.src
            const filename = src.slice(src.lastIndexOf('/') + 1)
            const url = (filename.slice(0, 14) === 'image_emoticon')
                      ? src
                      : ("https://imgsrc.baidu.com/forum/pic/item/" + filename)
            return <Image> {
              filename: filename,
              url: url
            }
          }
        })[elem.nodeName](elem))
    })))
  .then(withLog(`processed post page: ${url}`))

export const crawlPost = (url: string, from: number, to: number) =>
  chunk(range(from, to + 1), 3)
    .reduce(async (prevCh, ch) => (await prevCh).concat(
          (await Promise.all(ch.map(n => crawlPage(url + '&pn=' + n))))
            .reduce((prevPn, pn) => prevPn.concat(pn))),
      Promise.resolve(<Floor[]>[]))
    .then(withLog(`processed post: ${url}`))

export const exportPostAsMarkdown = async (post: Floor[], file: string) => {
  const dir = file.slice(0, file.lastIndexOf('/') + 1)
  const mapFloor = (floor: Floor) =>
    floor.content.map(content => {
      if ((<Anchor> content).text)
        return `[${(<Anchor> content).text}](${(<Anchor> content).url})`
      else if ((<Image> content).filename)
        return (`![${(<Image> content).filename}]`
          + `(images/${(<Image> content).filename})`)
      else if ((<string> content) == '\n')
        return '\n\n'
      else return (<string> content).trim()
    }).join('') +
    "\n\n" + `*by ${floor.author} at ${floor.time}*`
  const content = post.map(mapFloor).join('\n\n')
  await fs.writeFile(file, content)
  console.log(`wrote post to markdown file: ${file}`)

  const images = (<Image[]> []).concat(...<Image[][]> post.map(floor =>
    floor.content.filter(content => (<Image> content).filename != undefined)))
  const imageDir = dir + 'images'
  await safeMkdir(imageDir)
  await chunk(images, 5).reduce(
    async (prevCh, ch) =>
      (await prevCh).concat(ch.map(img => downloadImage(img, imageDir))),
    Promise.resolve(<{}[]> []))
  await console.log(`exported post: ${file}`)
}

export const downloadPostAsMarkdown =
  (url: string, from: number, to: number, file: string) =>
    crawlPost(url, from, to).then(post => exportPostAsMarkdown(post, file))
