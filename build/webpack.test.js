const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
  mode: 'development',

  // ❌ 测试环境不需要 entry / output
  entry: undefined,
  output: {},

  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      vue$: 'vue/dist/vue.common.js',
      '@': path.resolve(process.cwd(), 'src'),
      'main': path.resolve(process.cwd(), 'src'),
      'packages': path.resolve(process.cwd(), 'packages'),
      'rowinself-ui': path.resolve(process.cwd())
    }
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },

      // ✅ 测试环境不注入样式
      {
        test: /\.css$/,
        loader: 'null-loader'
      },
      {
        test: /\.scss$/,
        loader: 'null-loader'
      },

      // ✅ 测试环境直接忽略资源文件
      {
        test: /\.(svg|otf|ttf|woff2?|eot|gif|png|jpe?g)$/,
        loader: 'null-loader'
      }
    ]
  },

  plugins: [
    new VueLoaderPlugin()
  ],

  // ✅ 关键：减少日志但不“无输出”
  stats: 'errors-warnings'
};
