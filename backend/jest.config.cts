module.exports = {
  displayName: 'backend',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    '/node_modules/(?!.*(?:htmlparser2|domhandler|domutils|domelementtype|dom-serializer|entities)/)',
  ],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/backend',
};
