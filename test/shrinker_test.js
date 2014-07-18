var assert = require('assert');
var shrink = require('..').shrink;
var shrinks = require('..').shrinks;

describe('shrinks', function() {
  describe('integers', function() {
    it('has nothing for 0', function() {
      eq(0, []);
    });

    it('shrinks 1 to 0', function() {
      eq(1, [0]);
    });

    it('shrinks 2 to 0 and 1', function() {
      eq(2, [0, 1]);
    });

    it('shrinks 3 to 0 and 2', function() {
      eq(3, [0, 2]);
    });

    it('shrinks numbers by factors of 2', function() {
      eq(17, [0, 9, 13, 15, 16]);
    });

    it('shrinks negative to positive first if possible', function() {
      eq(-5, [5, 0, -3, -4]);
    });
  });

  describe('arrays', function() {
    it('has nothing for empty arrays', function() {
      eq([], []);
    });

    it('shrinks arrays of 1 element to empty array', function() {
      eq([{}], [[]]);
    });

    it('shrinks arrays of multiple atoms by removing sections', function() {
      var a = atom('a'), b = atom('b'), c = atom('c');
      eq([a, b, c], [[], [b, c], [a, c], [a, b]]);
    });

    it('shrinks elements if possible', function() {
      eq(
        [2, 1],
        [
          [],
          [1],
          [2],
          [0, 1],
          [1, 1],
          [2, 0]
        ]
      );
    });

    it('shrinks sub-arrays', function() {
      var a = atom('a');
      eq(
        [[], [a, 8]],
        [
          [],           // sublist, remove 2
          [[a, 8]],     // sublist, remove 1 (step 1)
          [[]],         // sublist, remove 1 (step 2)
          // no shrinks for element 0 ([]), skipping
          [[], []],     // shrink [a, 8], sublist, remove 2
          [[], [8]],    // shrink [a, 8], sublist, remove 1 (step 1)
          [[], [a]],    // shrink [a, 8], sublist, remove 1 (step 2)
          // shrink [a, 8], no shrinks for element 0 (a), skipping
          [[], [a, 0]], // shrink [a, 8], shrink 8 (step 1)
          [[], [a, 4]], // shrink [a, 8], shrink 8 (step 2)
          [[], [a, 6]], // shrink [a, 8], shrink 8 (step 3)
          [[], [a, 7]]  // shrink [a, 8], shrink 8 (step 4)
        ]
      );
    });
  });
});

/**
 * Asserts that the shrinks for value are the given list.
 *
 * @param {*} value
 * @param {*[]}
 */
function eq(value, list) {
  assert.deepEqual(consume(shrinks(value)), list);
}

/**
 * Consumes all the elements of the given iterator by making a list of them.
 *
 * @param {{next: function(): {value: *, done: boolean}}} iterator
 * @return {*[]}
 */
function consume(iterator) {
  var results = [];
  var next;
  while (!(next = iterator.next()).done) {
    results.push(next.value);
  }
  return results;
}

/**
 * Atoms won't be shrunk because they're functions. Conveniently, the assert
 * module also will print them by calling #toString, which we replace to just
 * give the name of the atom.
 *
 * @param name
 * @returns {Function}
 */
function atom(name) {
  var result = function() {};
  result.toString = function() {
    return name;
  };
  return result;
}
