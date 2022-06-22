# fssf

> provides a simple api for common file based operations

[![NPM Version][npm-image]][npm-url]
[![License: ISC][license-img]](LICENSE)
[![Node.js Version][node-version-image]][node-version-url]
[![Build][github-wf]][build-url]
<!-- [![install size][install-size-badge]](packagephobia-url) -->

Promise based wrapper for node:fs

handles ```.csv``` files

handles ```.json``` files

no external dependencies

*contains opinionated conveniences*

# Installation

```sh
npm install fssf
```

# Usage


```js
// commonJS
const { ff } = require('fssf');
```
```js
// es6 module
import { ff } from 'fssf'
```
```js
const data = { arrayList: [[1, 1], [2, 2]] };
// JSON
await ff.writeJson(data, __dirname, 'file.json');
const obj = await ff.readJson(__dirname, 'file.json');

// CSV
await ff.writeCsv(obj.arrayList, ['header1', 'header2'], __dirname, 'file.csv');
const doubleArray = await ff.readCsv(__dirname, 'file.csv');

const objList = [
  {
    header1: 'value1',
    header2: 'value2',
  },
  {
    header2: 'value4',
  }
]

await ff.objToCsv(objList, __dirname, 'file.tsv', '\t');

// GENERAL
const stringValue = 'class is called ff, but library is called fssf';
await ff.write(stringValue, __dirname, 'file.txt');
```

# API

✓ **path** return formatted string

✓ **touch** creates file

✓ **mv** moves all files and directories from one dir to another and deletes src directory

✓ **rename** renames a single file

✓ **rmrf** deletes dir with subdirs and files

✓ **cp** copies dir contents recursively to another dir

✓ **read** gets file contents as string

✓ **write** creates and saves file at expected location

✓ **readdir** returns array with only file names

✓ **mkdir** creates directory at given path

✓ **append** adds data to existing file

✓ **stat** returns stat in promise

✓ **readJson** returns Object from file containing json

✓ **writeJson** writes json to a file from an object

✓ **readCsv** returns double array from csv file

✓ **writeCsv** takes double array and writes to csv file

✓ **appendCsv** adds lines to existing csv file

✓ **csvToObj** returns Array of Objects representing csv file data

✓ **objToCsv** takes object and writes to csv file


[npm-image]: https://img.shields.io/npm/v/fssf.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/fssf
[node-version-image]: https://img.shields.io/node/v/fssf.svg?style=flat-square
[node-version-url]: https://nodejs.org/en/
[license-img]: https://img.shields.io/badge/License-ISC-green.svg?style=flat-square
[github-wf]: https://img.shields.io/github/workflow/status/adotland/fssf/shipit.svg?style=flat-square
[build-url]: https://github.com/adotland/fssf/actions
<!-- [install-size-badge]: https://packagephobia.com/badge?p=fssf
[packagephobia-url]: https://packagephobia.com/result?p=fssf&style=flat-square -->
