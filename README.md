# fssf

> provides a simple api for common file based operations

[![NPM Version][npm-image]][npm-url]
[![License: ISC][license-img]](LICENSE)
[![Node.js Version][node-version-image]][node-version-url]

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
import { ff } from 'fssf'
```
```js
const data = { arrayList: [[1, 1], [2, 2]] };
await ff.writeJson(data, __dirname, 'file.json');
const obj = await ff.readJson(__dirname, 'file.json');
await ff.writeCsv(obj.arrayList, ['header1', 'header2'], __dirname, 'file.csv');
```

[npm-image]: https://img.shields.io/npm/v/fssf.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/fssf
[node-version-image]: https://img.shields.io/node/v/fssf.svg?style=flat-square
[node-version-url]: https://nodejs.org/en/
[license-img]: https://img.shields.io/badge/License-ISC-green.svg?style=flat-square
