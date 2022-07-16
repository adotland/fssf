import path from "path";
import { promisify } from "util";
import fs from "fs";
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

/**
 * @param data [[any,...],...[any]]
 * @param headerList field name array
 * @param delimiter
 * @returns formatted csv string
 */
const _convertArrCsv = (
  data: Array<Array<string>>,
  headerList: Array<string> | null,
  delimiter: string
) => {
  const headerStr = headerList ? headerList.join(delimiter) : "";
  let formatted: string;
  if (!data) {
    formatted = "";
  } else {
    formatted = data.map((d) => d.join(delimiter)).join("\n") + "\n";
  }
  return (headerStr.length ? headerStr + "\n" : "") + formatted;
};
/**
 * @param src
 * @param dest
 */
const _cp_polyfill = async (src: string, dest: string): Promise<void> => {
  await fsMkdir(dest, { recursive: true });
  let entries = await fsReaddir(src, { withFileTypes: true });
  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);
    entry.isDirectory()
      ? await _cp_polyfill(srcPath, destPath)
      : await fsCopyFile(srcPath, destPath);
  }
};
/**
 * @param str
 */
const _trim = (str: string): string => {
  var re = /^[\s\uFEFF\xA0\r]+|[\s\uFEFF\xA0\r]+$/g;
  return str.replace(re, "");
};

/***************
main
***************/

export class ff {
  /**
   * substitute for calling path.join
   * @param paths paths to be combined
   * @returns path
   */
  static path(...paths: Array<string>): string {
    return path.join(...paths);
  }
  /**
   * create empty file at path
   * @param path
   * @param fileName filename can be in path or here
   */
  static async touch(path: string, fileName = ""): Promise<void> {
    return ff.write("", path, fileName);
  }
  /**
   * moves all files and directories from one dir to another and deletes src directory
   * @param src
   * @param dest
   */
  static async mv(src: string, dest: string): Promise<void> {
    const srcPath = ff.path(src);
    const destPath = ff.path(dest);
    await ff.cp(srcPath, destPath);
    await ff.rmrf(srcPath);
  }
  /**
   * renames a single file
   * @param src
   * @param dest
   */
  static async rename(src: string, dest: string): Promise<void> {
    const srcPath = ff.path(src);
    const destPath = ff.path(dest);
    await fsRename(srcPath, destPath);
  }
  /**
   * deletes dir with subdirs and files
   * @param path
   */
  static async rmrf(path: string): Promise<void> {
    await fsRm(path, { recursive: true, force: true });
  }
  /**
   * copies dir contents recursively to another dir
   * @param src
   * @param dest
   */
  static async cp(src: string, dest: string): Promise<void> {
    return await _cp_polyfill(src, dest);
  }
  /**
   * gets file contents as string
   * @param path
   * @param fileName filename can be in path or here
   * @returns file data as string
   */
  static async read(path: string, fileName: string = ""): Promise<string> {
    const fullPath = ff.path(path, fileName);
    const buffer = await fsReadFile(fullPath);
    return buffer.toString();
  }
  /**
   * creates and saves file at expected location
   * @param data
   * @param path
   * @param fileName
   */
  static async write(
    data: string,
    path: string,
    fileName: string = ""
  ): Promise<void> {
    const fullPath = ff.path(path, fileName);
    await fsWriteFile(fullPath, data);
  }
  /**
   * recursively read directory and return array of names
   * @param path
   */
  static async readdir(path: string): Promise<string[]> {
    const fullPath = ff.path(path);
    return await fsReaddir(fullPath);
  }
  /**
   * creates directory at given path
   * @param path
   */
  static async mkdir(path: string): Promise<string | undefined> {
    const fullPath = ff.path(path);
    return await fsMkdir(fullPath, { recursive: true });
  }
  /**
   * adds data to existing file
   * @param data
   * @param path
   * @param fileName filename can be in path or here
   * @returns
   */
  static async append(
    data: string,
    path: string,
    fileName: string = ""
  ): Promise<void> {
    const fullPath = ff.path(path, fileName);
    return await fsAppendFile(fullPath, data);
  }
  /**
   * returns stat object in promise
   * @param path
   * @returns stats object
   */
  static async stat(path: string): Promise<Object> {
    const fullPath = ff.path(path);
    return await fsStat(fullPath);
  }
  /**
   * reads file as JSON
   * @param path
   * @param fileName can be in path or here
   * @returns Object from file containing json
   */
  static async readJson(path: any, fileName: string = ""): Promise<any> {
    const fullPath = ff.path(path, fileName);
    const dataStr = await ff.read(fullPath);
    return JSON.parse(dataStr);
  }
  /**
   * converts object to JSON and writes to file
   * @param obj
   * @param path
   * @param fileName
   * @param spaces pass to JSON.stringify
   */
  static async writeJson(
    obj: any,
    path: any,
    fileName: string = "",
    spaces: number = 0
  ): Promise<void> {
    await ff.write(JSON.stringify(obj, null, spaces), path, fileName);
  }
  /**
   * read file as csv with specified delimiter
   * @param path
   * @param fileName
   * @param parseLines can return array of unprocessed lines
   * @param delimiter supports ',' '\t' etc.
   * @param stripHeader remove first row from result
   * @returns double array from csv file
   */
  static async readCsv(
    path: string,
    fileName: string = "",
    parseLines: boolean = true,
    delimiter: string = ",",
    stripHeader: boolean = true
  ): Promise<Array<Array<string>>> {
    const data = await ff.read(path, fileName);
    if (data === "") return [];
    let csvLines = data.split("\n");
    if (stripHeader) {
      csvLines.shift();
    }
    let result: Array<Array<string>>;
    if (parseLines) {
      result = csvLines.map((line) =>
        line.split(delimiter).map((d) => _trim(d))
      );
      const lastLine = result[result.length - 1];
      if (
        lastLine &&
        lastLine.length === 1 &&
        typeof lastLine[0] === "string" &&
        lastLine[0] === ""
      ) {
        result.pop();
      }
    } else {
      result = [csvLines.map((d) => _trim(d))];
    }
    return result;
  }
  /**
   * read csv file and convert to object list
   * @param path
   * @param fileName
   * @param delimiter
   * @returns Array of Objects representing csv file data
   */
  static async csvToObj(
    path: string,
    fileName: string = "",
    delimiter: string = ","
  ): Promise<Array<Object>> {
    const dataList = await ff.readCsv(path, fileName, true, delimiter, false);
    const headerList = dataList.shift();
    if (headerList) {
      const HeaderAsKeyList = [...headerList] as const;
      type THeaderAsKey = {
        [key in typeof HeaderAsKeyList[number]]: any;
      };
      const retval: Array<Object> = [];
      dataList.forEach((data) => {
        const obj: THeaderAsKey = {};
        for (let i = 0, len = data.length; i < len; i++) {
          obj[headerList[i]] = data[i];
        }
        retval.push(obj);
      });
      return retval;
    } else {
      return [];
    }
  }
  /**
   * takes object and writes to csv file
   * @param data
   * @param path
   * @param fileName
   * @param delimiter
   */
  static async objToCsv(
    data: Array<Object>,
    path: string,
    fileName = "",
    delimiter = ","
  ): Promise<void> {
    // allow for missing keys
    const headerSet: Set<string> = new Set();
    data.forEach((d) => {
      Object.keys(d).forEach((f) => headerSet.add(f));
    });
    const headerList: Array<string> = Array.from(headerSet);

    const headerAsKeyList = [...headerList] as const;
    type THeaderAsKey = { [key in typeof headerAsKeyList[number]]: any };

    // array of value arrays
    const dataList: Array<Array<string>> = [];
    for (let i = 0, len = data.length; i < len; i++) {
      const objList: Array<string> = [];
      for (let j = 0, len2 = headerList.length; j < len2; j++) {
        const obj: THeaderAsKey = data[i];
        objList.push(obj[headerList[j]] ?? "");
      }
      dataList.push(objList);
    }
    const dataStr = _convertArrCsv(dataList, headerList, delimiter);
    return await ff.write(dataStr, path, fileName);
  }
  /**
   * takes double array and writes to csv file
   * @param data
   * @param fields
   * @param path
   * @param fileName
   * @param delimiter
   */
  static async writeCsv(
    data: Array<Array<any>>,
    fields: Array<string>,
    path: string,
    fileName = "",
    delimiter = ","
  ) {
    const dataStr = _convertArrCsv(data, fields, delimiter);
    return await ff.write(dataStr, path, fileName);
  }
  /**
   * adds lines to existing csv file
   * @param data
   * @param path
   * @param fileName
   * @param delimiter
   */
  static async appendCsv(
    data: Array<Array<any>>,
    path: string,
    fileName = "",
    delimiter = ","
  ) {
    const dataStr = _convertArrCsv(data, null, delimiter);
    return await ff.append("\n" + dataStr, path, fileName);
  }
}
