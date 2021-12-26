const getKey = (i: number, j: number) => (i < j ? `${i}-${j}` : `${j}-${i}`)
export class TupleDictionary<T> {
  data: { [key: string]: T }
  keys: string[]

  constructor() {
    this.data = {}
    this.keys = []
  }

  get = (i: number, j: number): T => this.data[getKey(i, j)]

  set(i: number, j: number, value: T): void {
    const key = getKey(i, j)

    if (!this.keys.includes(key)) this.keys.push(key)

    this.data[key] = value
  }

  reset(): void {
    this.data = {}
    this.keys = []
  }
}
