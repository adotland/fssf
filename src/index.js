import path from 'path';
import { promisify } from 'util';
import fs from 'fs';
const fsReadFile = promisify(fs.readFile);
const fsWriteFile = promisify(fs.writeFile);
const fsCopyFile = promisify(fs.copyFile);
const fsStat = promisify(fs.stat);
const fsRm = promisify(fs.rm); // v14.14.0
const fsMkdir = promisify(fs.mkdir);
const fsReaddir = promisify(fs.readdir);
const fsAppendFile = promisify(fs.appendFile);
const fsRename = promisify(fs.rename);

/***************
helpers
***************/

// data = [[any,...],...[any]]
const _convertArrCsv = (data, fields, delimiter) => {
  const headers = fields ? fields.join(delimiter) : '';
  let formatted;
  if (!data) {
    formatted = '';
  } else {
    formatted = data.reduce((a, c) => a + '\n' + c.join(delimiter)) + '\n';
  }
  return (headers.length ? headers + '\n' : '') + formatted;
};

const _cp_polyfill = async (src, dest) => {
  await fsMkdir(dest, { recursive: true });
  let entries = await fsReaddir(src, { withFileTypes: true });
  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);
    entry.isDirectory() ?
      await _cp_polyfill(srcPath, destPath) :
      await fsCopyFile(srcPath, destPath);
  }
};

const _trim = (str, delimiter) => {
  var re = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
  if (delimiter.match(re)) {
    return str;
  } else {
    return str.replace(re, '');
  }
}

// fs.cp (v16.7.0)
const _fsCp = fs.cp ? promisify(fs.cp) : null;

/***************
main
***************/

export class ff {
  /**
   * @param  {...string} paths paths to be combined
   * @returns {string} path
   */
  static path(...paths) {
    return path.join(...paths);
  }
  /**
   * @param  {string} path
   * @param  {string} [fileName=''] filename can be in path or here
   * @returns {Promise<void>}
   */
  static async touch(path, fileName = '') {
    return this.write('', path, fileName);
  }
  /**
   * @param  {string} src
   * @param  {string} dest
   * @return {Promise<void>}
   */
  static async mv(src, dest) {
    const srcPath = this.path(src);
    const destPath = this.path(dest);
    await this.cp(srcPath, destPath);
    await this.rmrf(srcPath)
  }
  static async rename(src, dest) {
    const srcPath = this.path(src);
    const destPath = this.path(dest);
    await fsRename(srcPath, destPath);
  }
  /**
   * @param  {string} path
   * @return {Promise<void>}
   */
  static async rmrf(path) {
    await fsRm(path, { recursive: true, force: true });
  }
  /**
   * @param  {string} src
   * @param  {string} dest
   * @return {Promise<void>}
   */
  static async cp(src, dest) {
    if (_fsCp) {
      return await _fsCp(src, dest, { recursive: true });
    } else {
      return await _cp_polyfill(src, dest);
    }
  }
  /**
   * @param  {string} path
   * @param  {string} [fileName=''] filename can be in path or here
   * @returns {Promise<string>} file data as string
   */
  static async read(path, fileName = '') {
    const fullPath = this.path(path, fileName);
    const buffer = await fsReadFile(fullPath);
    return buffer.toString();
  }
  /**
   * @param  {string} data
   * @param  {string} path
   * @param  {string} [fileName=''] filename can be in path or here
   * @returns {Promise<void>}
   */
  static async write(data, path, fileName = '') {
    const fullPath = this.path(path, fileName);
    await fsWriteFile(fullPath, data);
  }
  /**
   * @param  {string} path
   * @returns {Promise<Array<string>>}
   */
  static async readdir(path) {
    const fullPath = this.path(path);
    return await fsReaddir(fullPath);
  }
  /**
   * @param  {string} path
   * @returns {Promise<void>}
   */
  static async mkdir(path) {
    const fullPath = this.path(path);
    return await fsMkdir(fullPath, { recursive: true });
  }
  /**
   * @param  {string} data
   * @param  {string} path
   * @param  {string} [fileName=''] filename can be in path or here
   * @returns {Promise<void>}
  */
  static async append(data, path, fileName = '') {
    const fullPath = this.path(path, fileName);
    return await fsAppendFile(fullPath, data)
  }
  /**
   * @param  {string} path
   * @returns {Promise<object>} stats
   */
  static async stat(path) {
    const fullPath = this.path(path);
    return await fsStat(fullPath);
  }
  /**
   * @param  {string} path
   * @param  {string} [fileName=''] filename can be in path or here
   * @returns {Promise<string>}
  */
  static async readJson(path, fileName = '') {
    const fullPath = this.path(path, fileName);
    const dataStr = await this.read(fullPath);
    return JSON.parse(dataStr);
  }
  /**
   * @param  {object} obj
   * @param  {string} path
   * @param  {string} [fileName='']
   * @param  {number} [spaces=0]
   * @returns  {Promise<void>}
   */
  static async writeJson(obj, path, fileName = '', spaces = 0) {
    await this.write(JSON.stringify(obj, null, spaces), path, fileName);
  }
  /**
   * @param  {string} path
   * @param  {string} [fileName='']
   * @param  {boolean} [parseLines=true]
   * @param  {string} [delimiter=',']
   * @param  {boolean} [stripHeader=true]
   * @returns  {Promise<Array<string>>}
   */
  static async readCsv(path, fileName = '', parseLines = true, delimiter = ',', stripHeader = true) {
    const data = await this.read(path, fileName);
    if (data === '') return [];
    let result = data.split('\n').map(d => _trim(d, delimiter));
    if (stripHeader) {
      result.shift();
    }
    if (parseLines) {
      result = result.map(line => line.split(delimiter));
    }
    const lastLine = result[result.length - 1];
    if (lastLine && lastLine.length === 1 && typeof(lastLine[0]) === 'string' && lastLine[0] === '') {
      result.pop();
    }
    return result;
  }
  /**
   * @param  {Array<Array<any>>} data
   * @param  {Array<string>} fields
   * @param  {string} path
   * @param  {string} [fileName='']
   * @param  {string} [delimiter=',']
   * @returns  {Promise<void>}
   */
  static async writeCsv(data, fields, path, fileName = '', delimiter = ',') {
    const dataStr = _convertArrCsv(data, fields, delimiter);
    return await this.write(dataStr, path, fileName);
  }
  /**
   * @param  {Array<Array<any>>} data
   * @param  {string} path
   * @param  {string} [fileName='']
   * @param  {string} [delimiter=',']
   * @returns  {Promise<void>}
   */
  static async appendCsv(data, path, fileName = '', delimiter = ',') {
    const dataStr = _convertArrCsv(data, null, delimiter);
    return await this.append('\n' + dataStr, path, fileName);
  }
}
