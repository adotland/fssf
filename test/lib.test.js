const { ff } = require('../dist/cjs');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const testFilesPath = __dirname + '/testFiles';
const fileName = 'file.txt';
const fileNameJson = 'file.json';
const fileNameCsv = 'file.csv';

beforeEach(() => {
  fs.mkdirSync(testFilesPath);
})

afterEach(() => {
  rimraf.sync(testFilesPath);
})

const createSrcWithFile = () => {
  const src = createSrcWithoutFile();
  fs.writeFileSync(path.join(src, fileName), 'contents');
  return src;
}

const createSrcWithoutFile = () => {
  const src = path.join(testFilesPath, 'srcDir');
  fs.mkdirSync(src, { recursive: true });
  return src;
}

const createDest = () => {
  const dest = path.join(testFilesPath, 'destDir');
  fs.mkdirSync(dest, { recursive: true });
  return dest;
}

describe('general tests', () => {
  test('path return formatted string', () => {
    // setup
    const pathParts = ['/folder1', './../folder2', 'file.ext'];
    const expectedPath = '/folder2/file.ext';
    // action
    const formattedPath = ff.path(...pathParts);
    // result
    expect(formattedPath).toBeDefined();
    expect(formattedPath).toBe(expectedPath);
  });
  test('touch creates file', async () => {
    // setup
    const fileName = 'file.txt';
    // action
    await ff.touch(testFilesPath, fileName);
    // result
    const data = fs.readFileSync(path.join(testFilesPath, fileName));
    expect(data).toBeDefined();
    expect(data.toString()).toEqual('');
  });
  test('mv moves all files and directories from one dir to another and deletes src directory', async () => {
    // setup
    const src = createSrcWithFile();
    const dest = createDest();
    // action
    await ff.mv(src, dest);
    // result
    const data = fs.readFileSync(path.join(dest, fileName));
    expect(data).toBeDefined();
    expect(data.toString()).toEqual('contents');
    expect(() => fs.readdirSync(src)).toThrow('ENOENT');
  });
  test('rmrf deletes dir with subdirs and files', async () => {
    // setup
    const src = createSrcWithFile();
    // action
    await ff.rmrf(src);
    // result
    expect(() => fs.readdirSync(src)).toThrow('ENOENT');
  });
  test('cp copies dir contents recursively to another dir', async () => {
    // setup
    const src = createSrcWithFile();
    const dest = createDest();
    // action
    await ff.cp(src, dest);
    // result
    const data = fs.readdirSync(src);
    expect(data).toBeDefined();
    expect(data.length).toBe(1);
    expect(data).toEqual(['file.txt'])
  });
  test('read gets file contents as string', async () => {
    // setup
    const src = createSrcWithFile();
    // action
    const data = await ff.read(src, fileName);
    // result
    expect(data).toBe('contents');
  });
  test('write creates and saves file at expected location', async () => {
    // setup
    const src = createSrcWithoutFile();
    // action
    await ff.write('contents', src, fileName);
    // result
    const data = fs.readdirSync(src);
    expect(data).toBeDefined();
    expect(data.length).toBe(1);
    expect(data).toEqual(['file.txt'])
    const fileContents = fs.readFileSync(path.join(src, fileName)).toString();
    expect(fileContents).toBe('contents');
  });
  test('readdir returns array with only file names', async () => {
    // setup
    const src = createSrcWithFile();
    // action
    const data = await ff.readdir(src);
    // result
    expect(data).toBeDefined();
    expect(data.length).toBe(1);
    expect(data).toEqual(['file.txt']);
  });
  test('mkdir creates directory at given path', async () => {
    // setup
    const src = path.join(testFilesPath, 'srcDir');
    // action
    await ff.mkdir(src);
    // result
    const data = fs.readdirSync(src);
    expect(data).toBeDefined();
    expect(data.length).toBe(0);
  });
  test('append adds data to existing file', async () => {
    // setup
    const src = createSrcWithFile();
    // action
    await ff.append('line2', src, fileName);
    // result
    const fileContents = fs.readFileSync(path.join(src, fileName)).toString();
    expect(fileContents).toBe('contentsline2');
  });
  test('stat returns stat in promise', async () => {
    // setup
    const src = createSrcWithFile();
    // action
    const statObj = await ff.stat(path.join(src, fileName));
    // result
    expect(statObj).toBeDefined();
    expect(statObj).toBeInstanceOf(fs.Stats);
  });
  test('readJson returns Object from file containing json', async () => {
    // setup
    const src = createSrcWithoutFile();
    fs.writeFileSync(path.join(src, fileNameJson), '{"key": "value"}');
    // action
    const data = await ff.readJson(src, fileNameJson);
    // result
    expect(data).toBeDefined();
    expect(data).toHaveProperty('key', 'value');
  });
  test('writeJson writes json to a file from an object', async () => {
    // setup
    const src = createSrcWithoutFile();
    const obj = {key: 'value'};
    // action
    await ff.writeJson(obj, src, fileNameJson);
    // result
    const data = fs.readFileSync(path.join(src, fileNameJson));
    expect(data).toBeDefined();
    expect(data.toString()).toEqual('{"key":"value"}');
  });
  test('readCsv returns double array from csv file', async () => {
    // setup
    const src = createSrcWithoutFile();
    fs.writeFileSync(path.join(src, fileNameCsv), 'header1,header2\nvalue1,value2');
    // action
    const data = await ff.readCsv(src, fileNameCsv);
    // result
    expect(data).toBeDefined;
    expect(data.length).toBe(1);
    expect(data[0][0]).toBe('value1');
    expect(data[0][1]).toBe('value2');
  });
  test('writeCsv takes double array and writes to csv file', async () => {
    // setup
    const src = createSrcWithoutFile();
    const dataList = [['value1', 'value2']];
    const headerList = ['header1', 'header2'];
    // action
    await ff.writeCsv(dataList, headerList, src, fileNameCsv);
    // result
    const data = fs.readFileSync(path.join(src, fileNameCsv));
    expect(data).toBeDefined();
    const formatted = data.toString().replace(/\n/g,' ');
    expect(formatted).toBe('header1,header2 value1,value2 ');
  });
  test('appendCsv adds lines to existing csv file', async () => {
    // setup
    const src = createSrcWithoutFile();
    fs.writeFileSync(path.join(src, fileNameCsv), 'header1,header2\nvalue1,value2');
    // action
    await ff.appendCsv([['value3,value4'], ['value5,value6']], src, fileNameCsv);
    // result
    const data = fs.readFileSync(path.join(src, fileNameCsv));
    expect(data).toBeDefined();
    const formatted = data.toString().replace(/\n/g,' ');
    expect(formatted).toBe('header1,header2 value1,value2 value3,value4 value5,value6 ');
  })
});
