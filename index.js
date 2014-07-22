if (hasNativeGenerators()) {
  module.exports = require('./lib');
} else {
  module.exports = require('./lib/index.es5');
}

function hasNativeGenerators() {
  try {
    eval('(function *(){})');
    return true;
  } catch (ex) {
    return false;
  }
}
