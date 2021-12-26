import { defaults } from 'ts-jest/presets'

export default {
  ...defaults,
  testPathIgnorePatterns: ['/node_modules/'],
  setupFilesAfterEnv: ['./test/customMatchers.ts'],
}
