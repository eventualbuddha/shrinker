/* jshint node: true, esnext: true, undef: true, unused: true */

/**
 * @type {Iterator}
 */
var EMPTY_ITERATOR = {
  next: function() {
    return { value: undefined, done: true };
  }
};

/**
 * Represents a collection of shrink rules and the logic required to select
 * an appropriate shrink rule for data and determining the smallest shrink for
 * data.
 *
 * @constructor
 */
function Shrinker() {
  /**
   * @type {Rule[]}
   */
  this.rules = [];
}

/**
 * Adds a rule to the list with the given test and generate functions.
 *
 * @param {function(*): boolean} test
 * @param {function(*): Iterator} generate
 */
Shrinker.prototype.addRule = function(test, generate) {
  this.rules.push(new Rule(test, generate));
};

/**
 * Generates possible shrinks for the given data using this shrinker's rules.
 *
 * @param {*} data
 * @return {Iterator}
 */
Shrinker.prototype.shrinks = function(data) {
  for (var i = 0, length = this.rules.length; i < length; i++) {
    var rule = this.rules[i];
    if (rule.test(data)) {
      return rule.generate(data);
    }
  }

  return EMPTY_ITERATOR;
};

/**
 * Adds the built-in rules to this shrinker's list of rules.
 */
Shrinker.prototype.addDefaultRules = function() {
  for (var name in exports.RULES) {
    if (exports.RULES.hasOwnProperty(name)) {
      this.rules.push(exports.RULES[name]);
    }
  }
};

/**
 * Shrinks the given data at most `limit` times as long as the predicate holds.
 *
 * @param {*} data
 * @param {function(*): boolean} predicate
 * @param {number=} limit Defaults to Infinity.
 * @return {*}
 */
Shrinker.prototype.shrink = function(data, predicate, limit) {
  // TODO: Implement me.
  if (typeof limit === 'undefined') { limit = Infinity; }
};

/**
 * Struct containing the test and generate functions for a shrink rule.
 *
 * @param {function(*): boolean} test
 * @param {function(*): Iterator} generate
 * @constructor
 */
function Rule(test, generate) {
  this.test = test;
  this.generate = generate;
}

exports.RULES = {
  integer: new Rule(
    function(value) {
      return typeof value === 'number' && parseInt(value) === value;
    },

    function *(value) {
      if (value < 0) {
        yield -value;
        var positives = DEFAULT_SHRINKER.shrinks(-value);
        var next;
        while (!(next = positives.next()).done) {
          yield -next.value;
        }
      } else {
        var diff = value;
        while (diff > 0) {
          yield value - diff;
          diff = Math.floor(diff / 2);
        }
      }
    }
  ),

  array: new Rule(
    Array.isArray,

    function *(value) {
      // Empty arrays cannot be shrunk.
      if (value.length === 0) { return; }

      // Start with an empty array.
      yield [];

      var toRemove = Math.floor(value.length / 2);

      // Loop through all the possible lengths.
      while (toRemove > 0) {
        // Yield slices of the original.
        for (var offset = 0; offset + toRemove <= value.length; offset++) {
          yield value.slice(0, offset).concat(value.slice(offset + toRemove));
        }
        toRemove = Math.floor(toRemove / 2);
      }

      // Loop through all the possible shrinks for each array entry.
      for (var i = 0; i < value.length; i++) {
        var next;
        var entry = value[i];
        var smaller = DEFAULT_SHRINKER.shrinks(entry);

        while (!(next = smaller.next()).done) {
          yield value.slice(0, i).concat([next.value], value.slice(i + 1));
        }
      }
    }
  )
};

var DEFAULT_SHRINKER = new Shrinker();
DEFAULT_SHRINKER.addDefaultRules();

exports.addRule = function(test, generate) {
  DEFAULT_SHRINKER.addRule(test, generate);
};

exports.shrinks = function(data) {
  return DEFAULT_SHRINKER.shrinks(data);
};

exports.shrink = function(data, predicate, limit) {
  return DEFAULT_SHRINKER.shrink(data, predicate, limit);
};