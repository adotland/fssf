# fssf
[![NPM Version](https://img.shields.io/npm/v/fssf.svg?style=flat-square)](https://www.npmjs.com/package/fssf)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg?style=flat-square)](LICENSE)

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
// module
const { ff } = require('fssf');
```
```js
// es6
import 'ff' = require('fssf')
```
```js
const data = { arrayList: [[1, 1], [2, 2]] };
await ff.writeJson(data, __dirname, 'file.json');
const obj = await ff.readJson(__dirname, 'file.json');
await ff.writeCsv(obj.arrayList, ['header1', 'header2'], __dirname, 'file.csv');
```
