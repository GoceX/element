var path = require('path');
var fs = require('fs');
var nodeExternals = require('webpack-node-externals');
var Components = require('../components.json');
var pkg = require('../package.json');
var PKG_NAME = pkg && pkg.name ? pkg.name : 'rowinself-ui';

var utilsList = fs.readdirSync(path.resolve(__dirname, '../src/utils'));
var mixinsList = fs.readdirSync(path.resolve(__dirname, '../src/mixins'));
var transitionList = fs.readdirSync(path.resolve(__dirname, '../src/transitions'));

var externals = {};

Object.keys(Components).forEach(function(key) {
  externals[`rowinself-ui/packages/${key}`] = `${PKG_NAME}/lib/${key}`;
});

externals['rowinself-ui/src/locale'] = `${PKG_NAME}/lib/locale`;
utilsList.forEach(function(file) {
  file = path.basename(file, '.js');
  externals[`rowinself-ui/src/utils/${file}`] = `${PKG_NAME}/lib/utils/${file}`;
});
mixinsList.forEach(function(file) {
  file = path.basename(file, '.js');
  externals[`rowinself-ui/src/mixins/${file}`] = `${PKG_NAME}/lib/mixins/${file}`;
});
transitionList.forEach(function(file) {
  file = path.basename(file, '.js');
  externals[`rowinself-ui/src/transitions/${file}`] = `${PKG_NAME}/lib/transitions/${file}`;
});


externals = [
  Object.assign({ vue: 'vue' }, externals),
  nodeExternals({ whitelist: [/^rowinself-ui/] })
];

exports.externals = externals;

exports.alias = {
  main: path.resolve(__dirname, '../src'),
  packages: path.resolve(__dirname, '../packages'),
  examples: path.resolve(__dirname, '../examples'),
  'rowinself-ui': path.resolve(__dirname, '../'),
  [PKG_NAME]: path.resolve(__dirname, '../')
};

exports.vue = {
  root: 'Vue',
  commonjs: 'vue',
  commonjs2: 'vue',
  amd: 'vue'
};

exports.jsexclude = /node_modules|utils\/popper\.js|utils\/date\.js|utils\/lodash\.js/;
