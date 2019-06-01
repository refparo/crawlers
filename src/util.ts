import { promises as fs } from 'fs'
import fsSync from 'fs'

export const safeMkdir = async (dir: string) => {
  if (fsSync.existsSync(dir))
    if ((await fs.lstat(dir)).isDirectory()) return
    else throw new Error("`dir` exists but isn't a directory!")
  else fs.mkdir(dir)
}

export const withLog = (message: any) => <T>(value: T) => {
  console.log(message)
  return value
}

export const dumpObject =
  (obj: any, file: string = 'object.json') =>
    fs.writeFile(file, JSON.stringify(obj, undefined, 2))
