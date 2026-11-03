/** Pure-logic unit tests only (no component rendering). */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/utils/**/*.test.ts', '<rootDir>/hooks/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
