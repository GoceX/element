var chokidar = require('chokidar');
var path = require('path');
var cp = require('child_process');

var ROOT = process.cwd();
var PACKAGES_DIR = path.join(ROOT, 'packages');

var pending = new Set();
var isBuilding = false;
var timer = null;
var DEBOUNCE_MS = 400;

function getChangedComponent(filePath) {
  var rel = path.relative(ROOT, filePath);
  var parts = rel.split(path.sep);
  var idx = parts.indexOf('packages');
  if (idx === -1) return null;
  var name = parts[idx + 1];
  return name || null;
}

function scheduleBuild() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(runBuild, DEBOUNCE_MS);
}

function runBuild() {
  if (isBuilding) return;
  var list = Array.from(pending);
  if (!list.length) return;
  isBuilding = true;
  pending.clear();
  var env = Object.assign({}, process.env, {
    COMPONENTS_LIST: list.join(',')
  });
  var webpack = cp.spawn('node', [
    path.join(ROOT, 'node_modules', 'webpack', 'bin', 'webpack.js'),
    '--config',
    path.join(ROOT, 'build', 'webpack.component.js')
  ], { stdio: 'inherit', env: env });

  webpack.on('exit', function(code) {
    if (code !== 0) {
      isBuilding = false;
      return;
    }
    var yalc = cp.spawn('yalc', ['push'], { stdio: 'inherit' });
    yalc.on('error', function() {
      isBuilding = false;
    });
    yalc.on('exit', function() {
      isBuilding = false;
      if (pending.size) scheduleBuild();
    });
  });

  webpack.on('error', function() {
    isBuilding = false;
  });
}

function start() {
  var watcher = chokidar.watch(PACKAGES_DIR, {
    persistent: true,
    ignoreInitial: true
  });
  watcher.on('all', function(event, filePath) {
    var comp = getChangedComponent(filePath);
    if (!comp) return;
    pending.add(comp);
    scheduleBuild();
  });
}

start();
