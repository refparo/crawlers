import * as fs from 'fs-extra'

export const safeMkdir = async (dir: string) => {
  if (fs.existsSync(dir))
    if ((await fs.lstat(dir)).isDirectory()) return
    else throw new Error("`dir` exists but isn't a directory!")
  else fs.mkdir(dir)
}

export const withLog = message => <T>(value: T) => {
  console.log(message)
  return value
}

export const dumpObject =
  (obj, file: string = 'object.json') =>
    fs.writeFile(file, JSON.stringify(obj, undefined, 2))
