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

/***************
main
***************/

class FF {
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
   * @param filePath
   * @param fileName filename can be in path or here
   */
  static async touch(filePath: string, fileName = ""): Promise<void> {
    return FF.write("", filePath, fileName);
  }
  /**
   * moves all files and directories from one dir to another and deletes src directory
   * @param src
   * @param dest
   */
  static async mv(src: string, dest: string): Promise<void> {
    const srcPath = FF.path(src);
    const destPath = FF.path(dest);
    await FF.cp(srcPath, destPath);
    await FF.rmrf(srcPath);
  }
  /**
   * renames a single file
   * @param src
   * @param dest
   */
  static async rename(src: string, dest: string): Promise<void> {
    const srcPath = FF.path(src);
    const destPath = FF.path(dest);
    await fsRename(srcPath, destPath);
  }
  /**
   * deletes dir with subdirs and files
   * @param dirPath
   */
  static async rmrf(dirPath: string): Promise<void> {
    await fsRm(dirPath, { recursive: true, force: true });
  }
  /**
   * copies dir contents recursively to another dir
   * @param src
   * @param dest
   */
  static async cp(src: string, dest: string): Promise<void> {
    return _cp_polyfill(src, dest);
  }
  /**
   * gets file contents as string
   * @param filePath
   * @param fileName filename can be in path or here
   * @returns file data as string
   */
  static async read(filePath: string, fileName: string = ""): Promise<string> {
    const fullPath = FF.path(filePath, fileName);
    const buffer = await fsReadFile(fullPath, { encoding: "utf8" });
    return buffer.toString();
  }
  /**
   * creates and saves file at expected location
   * @param data
   * @param filePath
   * @param fileName
   */
  static async write(
    data: string,
    filePath: string,
    fileName: string = ""
  ): Promise<void> {
    const fullPath = FF.path(filePath, fileName);
    await fsWriteFile(fullPath, data);
  }
  /**
   * recursively read directory and return array of names
   * @param dirPath
   */
  static async readdir(dirPath: string): Promise<string[]> {
    const fullPath = FF.path(dirPath);
    return fsReaddir(fullPath);
  }
  /**
   * creates directory at given path
   * @param dirPath
   */
  static async mkdir(dirPath: string): Promise<string | undefined> {
    const fullPath = FF.path(dirPath);
    return fsMkdir(fullPath, { recursive: true });
  }
  /**
   * adds data to existing file
   * @param data
   * @param filePath
   * @param fileName filename can be in path or here
   * @returns
   */
  static async append(
    data: string,
    filePath: string,
    fileName: string = ""
  ): Promise<void> {
    const fullPath = FF.path(filePath, fileName);
    return fsAppendFile(fullPath, data);
  }
  /**
   * returns stat object in promise
   * @param filePath
   * @returns stats object
   */
  static async stat(filePath: string): Promise<Object> {
    const fullPath = FF.path(filePath);
    return fsStat(fullPath);
  }
  /**
   * reads file as JSON
   * @param filePath
   * @param fileName can be in path or here
   * @returns Object from file containing json
   */
  static async readJson(filePath: any, fileName: string = ""): Promise<any> {
    const fullPath = FF.path(filePath, fileName);
    const dataStr = await FF.read(fullPath);
    return JSON.parse(dataStr);
  }
  /**
   * converts object to JSON and writes to file
   * @param obj
   * @param filePath
   * @param fileName
   * @param spaces pass to JSON.stringify
   */
  static async writeJson(
    obj: any,
    filePath: any,
    fileName: string = "",
    spaces: number = 0
  ): Promise<void> {
    await FF.write(JSON.stringify(obj, null, spaces), filePath, fileName);
  }
  /**
   * read file as csv with specified delimiter
   * @param filePath
   * @param fileName
   * @param parseLines can return array of unprocessed lines
   * @param delimiter supports ',' '\t' etc.
   * @param stripHeader remove first row from result
   * @returns double array from csv file
   */
  static async readCsv(
    filePath: string,
    fileName: string = "",
    parseLines: boolean = true,
    delimiter: string = ",",
    stripHeader: boolean = true
  ): Promise<Array<Array<string>>> {
    const data = await FF.read(filePath, fileName);
    if (data === "") return [];
    let csvLines = data.split("\n");
    if (stripHeader) {
      csvLines.shift();
    }
    let result: Array<Array<string>>;
    if (parseLines) {
      result = csvLines.map((line) =>
        line.split(delimiter).map((d) => d.trim())
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
      result = [csvLines.map((d) => d.trim())];
    }
    return result;
  }
  /**
   * read csv file and convert to object list
   * @param filePath
   * @param fileName
   * @param delimiter
   * @returns Array of Objects representing csv file data
   */
  static async csvToObj(
    filePath: string,
    fileName: string = "",
    delimiter: string = ","
  ): Promise<Array<Object>> {
    const dataList = await FF.readCsv(filePath, fileName, true, delimiter, false);
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
   * @param filePath
   * @param fileName
   * @param delimiter
   */
  static async objToCsv(
    data: Array<Object>,
    filePath: string,
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
    return FF.write(dataStr, filePath, fileName);
  }
  /**
   * takes double array and writes to csv file
   * @param data
   * @param fields
   * @param filePath
   * @param fileName
   * @param delimiter
   */
  static async writeCsv(
    data: Array<Array<any>>,
    fields: Array<string>,
    filePath: string,
    fileName = "",
    delimiter = ","
  ) {
    const dataStr = _convertArrCsv(data, fields, delimiter);
    return FF.write(dataStr, filePath, fileName);
  }
  /**
   * adds lines to existing csv file
   * @param data
   * @param filePath
   * @param fileName
   * @param delimiter
   */
  static async appendCsv(
    data: Array<Array<any>>,
    filePath: string,
    fileName = "",
    delimiter = ","
  ) {
    const dataStr = _convertArrCsv(data, null, delimiter);
    return FF.append("\n" + dataStr, filePath, fileName);
  }
}

export {FF as ff};
