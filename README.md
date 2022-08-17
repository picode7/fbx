# FBX Interface for JavaScript/TypeScript

[![npm](https://img.shields.io/npm/v/@picode/fbx)](https://www.npmjs.com/package/@picode/fbx)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/@picode/fbx)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/picode7/fbx/CI)](https://github.com/picode7/fbx/actions)

This parser will parse FBX text files and convert them into a JavaScript-Object structure.

This is work in progress, and functionality can be easily added to cover more FBX features.

## Installation

```bash
npm install @picode/fbx
```

## Usage

```ts
import { FBX, FBXAxes } from '@picode/fbx'
import * as FBXParser from 'fbx-parser'

const fbx = new FBX(FBXParser.parse(await fs.readFileSync(fbxFile)))
const upAxes = fbx.globalSettings.getUpAxes() ?? FBXAxes.Y

const model = fbx.getModel('MyModel')

const rotNode = model.getRotationNode()
const rotationX = rotNode.getX()

const rotKeyY = model.getRotationKey(upAxes)
const rotationsYTimes = rotKeyY?.getTime()
const rotationsYValues = rotKeyY?.getValue()
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](/LICENSE)
