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

class FBXAnimationCurveNode {
  protected constructor(public node: FBXReaderNode) {}

  static from(node: FBXReaderNode): FBXAnimationCurveNode | undefined {
    return new FBXAnimationCurveNode(node)
  }

  getX(): number | undefined {
    const props70 = this.node?.node('Properties70')
    if (typeof props70 === 'undefined') return undefined

    const value = props70.node('P', { 0: 'd|X' })?.prop(4, 'number')
    if (typeof value === 'undefined') return undefined

    return value
  }

  getY(): number | undefined {
    const props70 = this.node?.node('Properties70')
    if (typeof props70 === 'undefined') return undefined

    const value = props70.node('P', { 0: 'd|Y' })?.prop(4, 'number')
    if (typeof value === 'undefined') return undefined

    return value
  }

  getZ(): number | undefined {
    const props70 = this.node?.node('Properties70')
    if (typeof props70 === 'undefined') return undefined

    const value = props70.node('P', { 0: 'd|Z' })?.prop(4, 'number')
    if (typeof value === 'undefined') return undefined

    return value
  }
}

class FBXModel {
  constructor(public node: FBXReaderNode, private root: FBXReader) {}

  private getAnimCurveNode(type: 'Lcl Translation' | 'Lcl Rotation') {
    const modelId = this.node.prop(0, 'number') // Get the own model id to find connections
    const objects = this.root.node('Objects') // Get root Objects node to look for the animation curve node
    const connections = this.root.node('Connections') // Get root Connections node to look for the connections
    if (typeof modelId === 'undefined' || !connections) return undefined

    const animCurveNodeId = connections.node({ 2: modelId, 3: type })?.prop(1) // Find the connection to the model with the according type, and get the id of the node
    if (typeof animCurveNodeId === 'undefined') return undefined

    const animCurveObj = objects?.node({ 0: animCurveNodeId }) // Find the node by id in objects
    if (typeof animCurveObj === 'undefined') return undefined

    return FBXAnimationCurveNode.from(animCurveObj)
  }

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

  getTranslationNode(): FBXAnimationCurveNode | undefined {
    return this.getAnimCurveNode('Lcl Rotation')
  }

  getTranslationKey(axes: FBXAxes): FBXAnimationCurve | undefined {
    return this.getAnimCurve('Lcl Translation', axes)
  }

  getRotationNode(): FBXAnimationCurveNode | undefined {
    return this.getAnimCurveNode('Lcl Rotation')
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
