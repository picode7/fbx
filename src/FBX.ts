import { FBXData, FBXReader, FBXReaderNode } from 'fbx-parser'

//https://help.autodesk.com/view/FBX/2015/ENU/

export enum FBXAxes {
  X = 0,
  Y = 1,
  Z = 2,
}

class FBXAnimationCurve {
  protected constructor(public node: FBXReaderNode) {}

  static from(node: FBXReaderNode): FBXAnimationCurve | undefined {
    if (!node.node('KeyTime')?.prop(0, 'number[]') || !node.node('KeyValueFloat')?.prop(0, 'number[]')) return undefined
    return new FBXAnimationCurve(node)
  }

  getTime(): number[] {
    // no undefined, object should only exist if those values are available
    return this.node.node('KeyTime')?.prop(0, 'number[]') as number[]
  }

  getValue(): number[] {
    // no undefined, object should only exist if those values are available
    return this.node.node('KeyValueFloat')?.prop(0, 'number[]') as number[]
  }
}

class FBXModel {
  constructor(public node: FBXReaderNode, private root: FBXReader) {}

  private getAnimCurve(type: 'Lcl Translation' | 'Lcl Rotation', axes: FBXAxes) {
    const modelId = this.node.prop(0, 'number')
    const objects = this.root.node('Objects')
    const connections = this.root.node('Connections')
    if (typeof modelId === 'undefined' || !connections) return undefined

    const animCurveNodeId = connections.node({ 2: modelId, 3: type })?.prop(1)
    if (typeof animCurveNodeId === 'undefined') return undefined

    const axesStr = ['d|X', 'd|Y', 'd|Z'][axes]
    const animCurveId = connections.node({ 2: animCurveNodeId, 3: axesStr })?.prop(1)
    if (typeof animCurveId === 'undefined') return undefined

    const animCurveObj = objects?.node({ 0: animCurveId })
    if (typeof animCurveObj === 'undefined') return undefined

    return FBXAnimationCurve.from(animCurveObj)
  }

  getTranslationKey(axes: FBXAxes): FBXAnimationCurve | undefined {
    return this.getAnimCurve('Lcl Translation', axes)
  }

  getRotationKey(axes: FBXAxes): FBXAnimationCurve | undefined {
    return this.getAnimCurve('Lcl Rotation', axes)
  }
}

class FBXGlobalSettings {
  constructor(public node: FBXReaderNode | undefined) {}

  getUpAxes(): FBXAxes | undefined {
    const axes = this.node?.node('Properties70')?.node('P', { 0: 'UpAxis' })?.prop(4, 'number')
    if (typeof axes == 'undefined') return undefined
    return axes >= 0 && axes <= 2 ? axes : undefined
  }

  getFrontAxes(): FBXAxes | undefined {
    const axes = this.node?.node('Properties70')?.node('P', { 0: 'FrontAxis' })?.prop(4, 'number')
    if (typeof axes == 'undefined') return undefined
    return axes >= 0 && axes <= 2 ? axes : undefined
  }

  getCoordAxes(): FBXAxes | undefined {
    const axes = this.node?.node('Properties70')?.node('P', { 0: 'CoordAxis' })?.prop(4, 'number')
    if (typeof axes == 'undefined') return undefined
    return axes >= 0 && axes <= 2 ? axes : undefined
  }
}

export class FBX {
  readonly globalSettings: FBXGlobalSettings
  readonly root: FBXReader

  constructor(fbxData: FBXData) {
    this.root = new FBXReader(fbxData)
    this.globalSettings = new FBXGlobalSettings(this.root.node('GlobalSettings'))
  }

  getModel(name: string): FBXModel | undefined {
    const node = this.root.node('Objects')?.node({ 1: `Model::${name}` })
    if (typeof node === 'undefined') return undefined
    return new FBXModel(node, this.root)
  }
}
