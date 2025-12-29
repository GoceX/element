const webpackConfig = require('../../build/webpack.test');

module.exports = function (config) {
  const configuration = {
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage'
        ]
      }
    },

    browsers: ['ChromeHeadless'],

    frameworks: ['mocha', 'sinon-chai'],
    reporters: ['spec', 'coverage'],

    files: ['./index.js'],

    preprocessors: {
      './index.js': ['webpack', 'sourcemap']
    },

    webpack: webpackConfig,

    // ✅ 调试阶段不要关输出
    webpackMiddleware: {
      stats: 'errors-warnings',
      // noInfo: true
    },

    // ✅ 关键：防止 30s 断连
    browserNoActivityTimeout: 120000,      // 2 分钟
    browserDisconnectTimeout: 60000,
    browserDisconnectTolerance: 3,
    captureTimeout: 120000,

    coverageReporter: {
      dir: './coverage',
      reporters: [
        { type: 'lcov', subdir: '.' },
        { type: 'text-summary' }
      ]
    },

    client: {
      mocha: {
        timeout: 4000
      }
    },

    // ✅ CI / 稳定性推荐
    singleRun: true,
    autoWatch: false
  };

  config.set(configuration);
};
