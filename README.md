# fssf

Promise based wrapper for node:fs

handles ```.csv``` files

handles ```.json``` files

no external dependencies

*contains opinionated conveniences*

# Installation

```npm install fssf```

# Usage


```
// module
const { ff } = require('fssf');

// es6
import 'ff' = require('fssf')

const data = { arrayList: [[1, 1], [2, 2]] };
await ff.writejson(data, __dirname, 'file.json');
const obj = await ff.readjson(__dirname, 'file.json');
await ff.writeCsv(obj.arrayList, ['header1', 'header2'], __dirname, 'file.csv');
```
