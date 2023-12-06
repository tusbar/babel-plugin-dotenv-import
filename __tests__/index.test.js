const process = require('process')

const {transformFileSync} = require('@babel/core')

const FIXTURES = '__tests__/__fixtures__/'
const env = Object.apply({}, process.env)

describe('babel-plugin-dotenv-import', () => {
  afterEach(() => {
    process.env = Object.apply({}, env)
  })

  it('should throw if the variable does not exist', () => {
    expect(() => transformFileSync(FIXTURES + 'variable-not-exist/source.js')).toThrow(
      '"foo" is not defined in .env',
    )
  })

  it('should throw if default is imported', () => {
    expect(() => transformFileSync(FIXTURES + 'default-import/source.js')).toThrow(
      'Default import is not supported',
    )
  })

  it('should throw if wildcard is imported', () => {
    expect(() => transformFileSync(FIXTURES + 'wildcard-import/source.js')).toThrow(
      'Wildcard import is not supported',
    )
  })

  it('should load environment variables from .env', () => {
    const {code} = transformFileSync(FIXTURES + 'default/source.js')
    expect(code).toBe('console.log("abc123");\nconsole.log("username");')
  })

  it('should allow importing variables already defined in the environment', () => {
    process.env.FROM_ENV = 'hello'

    const {code} = transformFileSync(FIXTURES + 'from-env/source.js')
    expect(code).toBe('console.log("hello");')
  })

  it('should prioritize environment variables over variables defined in .env', () => {
    process.env.API_KEY = 'i win'

    const {code} = transformFileSync(FIXTURES + 'default/source.js')
    expect(code).toBe('console.log("i win");\nconsole.log("username");')
  })

  it('should load custom env file', () => {
    const {code} = transformFileSync(FIXTURES + 'filename/source.js')
    expect(code).toBe('console.log("abc123456");\nconsole.log("username123456");')
  })

  it('should support `as alias` import syntax', () => {
    const {code} = transformFileSync(FIXTURES + 'as-alias/source.js')
    expect(code).toBe('const a = "abc123";\nconst b = "username";')
  })

  it('should allow specifying a custom module name', () => {
    const {code} = transformFileSync(FIXTURES + 'custom-module/source.js')
    expect(code).toBe('console.log("abc123");\nconsole.log("username");')
  })

  it('should leave other imports untouched', () => {
    const {code} = transformFileSync(FIXTURES + 'unused/source.js')
    expect(code).toBe(
      "import path from 'path'; // eslint-disable-line import/no-unresolved\n\nconsole.log(path.join);",
    )
  })

  it('should throw when using non-allowlisted env variables', () => {
    expect(() => transformFileSync(FIXTURES + 'allowlist/source.js')).toThrow(
      '"NOT_ALLOWLISTED" was not allowlisted',
    )
  })

  it('should throw when using blocklisted env variables', () => {
    expect(() => transformFileSync(FIXTURES + 'blocklist/source.js')).toThrow(
      '"BLOCKLISTED" was blocklisted',
    )
  })

  it('should throw when trying to use a variable not defined in .env in safe mode', () => {
    process.env.FROM_ENV = 'here'

    expect(() => transformFileSync(FIXTURES + 'safe-error/source.js')).toThrow(
      '"FROM_ENV" is not defined',
    )
  })

  it('should load environment variables from .env in safe mode', () => {
    const {code} = transformFileSync(FIXTURES + 'safe-success/source.js')
    expect(code).toBe('console.log("1");')
  })

  it('should import undefined variables', () => {
    const {code} = transformFileSync(FIXTURES + 'undefined/source.js')
    expect(code).toBe('console.log(undefined);')
  })

  it('should import allowlisted undefined variables', () => {
    const {code} = transformFileSync(FIXTURES + 'undefined-allowlisted/source-allowlisted.js')
    expect(code).toBe('console.log(undefined);')
  })

  it('should throw when trying to import an undefined variable that is not in the allowUndefined array', () => {
    expect(() => transformFileSync(FIXTURES + 'undefined-allowlisted/source-undefined.js')).toThrow(
      '"UNDEFINED_UNLISTED\" is not defined in .env or in allowUndefined[]'
    )
  })

  it('should not throw if .env exists in safe mode', () => {
    const {code} = transformFileSync(FIXTURES + 'safe-no-dotenv/source.js')
    expect(code).toBe('console.log(undefined);')
  })
})
