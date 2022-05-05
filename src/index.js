const path = require('path');
const { promisify } = require('util');
const fs = require('fs');
const fsReadFile = promisify(fs.readFile);
const fsWriteFile = promisify(fs.writeFile);
const fsCopyFile = promisify(fs.copyFile);
const fsStat = promisify(fs.stat);
const fsRm = promisify(fs.rm);
const fsMkdir = promisify(fs.mkdir);
const fsReaddir = promisify(fs.readdir);
const fsAppendFile = promisify(fs.appendFile);

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

// fs.cp (v16.7.0)
const _fsCp = fs.cp ? promisify(fs.cp) : null;

/***************
main
***************/

export default class ff {
  static path(...paths) {
    return path.normalize(path.resolve(...paths));
  }
  static async touch(path, fileName = '') {
    return this.write('', path, fileName);
  }
  static async mv(src, dest) {
    const srcPath = this.path(src);
    const destPath = this.path(dest);
    await this.cp(srcPath, destPath);
    await this.rmrf(srcPath)
  }
  static async rmrf(path) {
    await fsRm(path, { recursive: true, force: true });
  }
  static async cp(src, dest) {
    if (_fsCp) {
      return await _fsCp(src, dest, { recursive: true });
    } else {
      return await _cp_polyfill(src, dest);
    }
  }
  static async read(path, fileName = '') {
    const fullPath = this.path(path, fileName);
    const buffer = await fsReadFile(fullPath);
    return buffer.toString();
  }
  static async write(data, path, fileName = '') {
    const fullPath = this.path(path, fileName);
    await fsWriteFile(fullPath, data);
  }
  static async readdir(path) {
    const fullPath = this.path(path);
    return await fsReaddir(fullPath, { withFileTypes: true });
  }
  static async mkdir(path) {
    const fullPath = this.path(path);
    return await fsMkdir(fullPath, { recursive: true });
  }
  static async append(data, path, fileName = '') {
    const fullPath = this.path(path, fileName);
    return await fsAppendFile(fullPath, data)
  }
  static async stat(path) {
    const fullPath = this.path(path);
    return await fsStat(fullPath);
  }
  static async readJson(path, fileName = '') {
    const fullPath = this.path(path, fileName);
    const dataStr = await this.read(fullPath);
    return JSON.parse(dataStr);
  }
  static async writeJson(obj, path, fileName = '', spaces = 0) {
    await this.write(JSON.stringify(obj, null, spaces), path, fileName);
  }
  static async readCsv(path, fileName = '', parseLines = true, delimiter = ',', stripHeader = true) {
    const data = await this.read(path, fileName);
    if (data === '') return [];
    let result = data.split('\n').map(d => d.trim());
    if (stripHeader) {
      result.shift();
    }
    if (parseLines) {
      result = result.map(line => line.trim().split(delimiter));
    }
    if (result[result.length - 1][0] === '') {
      result.pop();
    }
    return result;
  }
  static async writeCsv(data, fields, path, fileName = '', delimiter = ',') {
    const dataStr = _convertArrCsv(data, fields, delimiter);
    return await this.write(dataStr, path, fileName);
  }
  static async appendCsv(data, path, fileName = '', delimiter = ',') {
    const dataStr = _convertArrCsv(data, null, delimiter);
    return await this.append(dataStr, path, fileName);
  }
}
