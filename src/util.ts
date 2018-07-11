//import * as fs from 'fs'

/*
export const isDirectory = (path: string) =>
  fs.existsSync(path) && fs.lstatSync(path).isDirectory()
*/

export const withLog = message => <T>(value: T) => {
  console.log(message)
  return value
}
