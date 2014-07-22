var assert = require('assert');
var shrink = require('..').shrink;
var shrinks = require('..').shrinks;

describe('shrinks', function() {
  context('integers', function() {
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

  context('floats', function() {
    function checkFloat(original) {
      var floats = consume(shrinks(original));
      var zeroIndex = original < 0 ? 1 : 0;

      assert.equal(
        floats[zeroIndex],
        0,
        'the float at ' + zeroIndex + ' should be zero (was ' + floats[zeroIndex] + ')'
      );

      assert.ok(
        floats.length > 10,
        'there should be quite a few floats'
      );

      for (var i = 2; i < floats.length; i++) {
        assert.ok(
          Math.abs(original - floats[i - 1]) > Math.abs(original - floats[i]),
          'float at ' + i + ' (' + floats[i] + ') should be closer to the ' +
          'original value than the one before it (' + floats[i - 1] + ')'
        );

        assert.ok(
          Math.abs(floats[i]) < Math.abs(original),
          'float at ' + i + ' (' + floats[i] + ') should be less ' +
          'than the original value (' + original + ')'
        );
      }
    }

    it('always returns a number closer to the original than the last', function() {
      checkFloat(Math.PI);
      checkFloat(-Math.PI);
    });
  });

  context('arrays', function() {
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
          [],           // sub-list, remove 2
          [[a, 8]],     // sub-list, remove 1 (step 1)
          [[]],         // sub-list, remove 1 (step 2)
          // no shrinks for element 0 ([]), skipping
          [[], []],     // shrink [a, 8], sub-list, remove 2
          [[], [8]],    // shrink [a, 8], sub-list, remove 1 (step 1)
          [[], [a]],    // shrink [a, 8], sub-list, remove 1 (step 2)
          // shrink [a, 8], no shrinks for element 0 (a), skipping
          [[], [a, 0]], // shrink [a, 8], shrink 8 (step 1)
          [[], [a, 4]], // shrink [a, 8], shrink 8 (step 2)
          [[], [a, 6]], // shrink [a, 8], shrink 8 (step 3)
          [[], [a, 7]]  // shrink [a, 8], shrink 8 (step 4)
        ]
      );
    });
  });

  context('strings', function() {
    it('has nothing for empty strings', function() {
      eq('', []);
    });

    it('shrinks strings of length 1 to the empty string', function() {
      eq('a', ['']);
    });

    it('shrinks string lengths but does not shrink string characters', function() {
      eq('abc', ['', 'bc', 'ac', 'ab']);
    });
  });

  context('dates', function() {
    it('has nothing for a date at the start of the epoch', function() {
      eq(new Date(0), []);
    });

    it('shrinks dates after the epoch by shrinking the milliseconds as a number', function() {
      eq(new Date(20), [new Date(0), new Date(10), new Date(15), new Date(18), new Date(19)]);
    });

    it('shrinks dates before the epoch by shrinking the milliseconds as a number', function() {
      eq(new Date(-10), [new Date(10), new Date(0), new Date(-5), new Date(-8), new Date(-9)]);
    });
  });
});

describe('shrink', function() {
  context('with an integer and an always-truthy predicate', function() {
    it('shrinks to 0', function() {
      assert.deepEqual(
        shrink(5, function() { return true; }),
        { iterations: 1, data: 0 }
      );
      assert.deepEqual(
        shrink(-5, function() { return true; }),
        { iterations: 2, data: 0 }
      );
    });
  });

  context('with an integer and a restrictive predicate', function() {
    it('shrinks to the smallest data that matches the predicate', function() {
      assert.deepEqual(
        shrink(20, function(n) {  return n > 5; }),
        { iterations: 3, data: 6 }
      );
    });
  });

  context('with a float and a restrictive predicate', function() {
    it('returns a smaller value than the original but still matching the predicate', function() {
      var result = shrink(Math.PI, function(n) { return n > Math.SQRT2; });

      assert.ok(
        result.iterations > 0,
        'there should be at least one iteration'
      );

      assert.ok(
        result.data < Math.PI,
        'result data should be smaller than the original'
      );

      assert.ok(
        result.data > Math.SQRT2,
        'result data should match the predicate'
      );

      var nextFloat = Math.SQRT2 - (result.data - Math.SQRT2) / 2;
      assert.ok(
        nextFloat <= Math.SQRT2,
        'result data cannot get any closer to the predicate'
      );
    });
  });

  context('limited to 0 iterations', function() {
    it('returns the original data', function() {
      assert.deepEqual(
        shrink(99, function(){}),
        { iterations: 0, data: 99 }
      );
    });
  });

  context('limited to fewer iterations than it would shrink to', function() {
    it('returns the intermediate data', function() {
      assert.deepEqual(
        shrink(20, function(n) {  return n > 5; }, 2),
        { iterations: 2, data: 8 }
      );
    });
  });

  context('with an array of un-shrinkable elements', function() {
    context('and an always-truthy predicate', function() {
      it('returns an empty array after one iteration', function() {
        assert.deepEqual(
          shrink([atom('a'), atom('b')], function() { return true; }),
          { iterations: 1, data: [] }
        );
      });
    });

    context('and a predicate that ensures the data has an "a" atom', function() {
      it('returns an array with only the "a" atom', function() {
        var a = atom('a');
        var b = atom('b');
        var c = atom('c');
        var d = atom('d');
        var e = atom('e');
        assert.deepEqual(
          shrink(
            [c, b, a, d, e],
            function(data) {
              return data.some(function(element) {
                return element.toString() === 'a';
              });
            }
          ),
          { iterations: 3, data: [a] }
        );
      });
    });
  });

  context('with an array of shrinkable elements', function() {
    it('returns a shrunk array with the smallest elements that match', function() {
      assert.deepEqual(
        shrink(
          [-3, 8, 4, 99, 18, 0, 78, -5, 66],
          function(data) {
            return workingSum(data) !== brokenSum(data);
          }
        ),
        // [0, 1] is the smallest array that illustrates the bug in brokenSum.
        { iterations: 10, data: [0, 1] }
      );

      /**
       * Returns the sum of all the values in the given list. This is the
       * reference implementation against which brokenSum will be compared.
       *
       * @param {number[]} list
       * @return {number}
       */
      function workingSum(list) {
        return /** @type number */list.reduce(function(s, n) {
          return s + n;
        }, 0);
      }

      /**
       * Returns the sum of all the values in the given list, but does not work
       * with all lists that contain a 0. This implementation has a (contrived)
       * bug that stops iteration of the list when it encounters a 0.
       *
       * @param {number[]} list
       * @return number
       */
      function brokenSum(list) {
        var sum = 0;

        for (var i = 0, length = list.length; i < length; i++) {
          var n = list[i];
          if (n === 0) { break; } // BUG!
          sum += n;
        }

        return sum;
      }
    });
  });

  context('with a string and an always-truthy predicate', function() {
    it('returns the empty string', function() {
      assert.deepEqual(
        shrink('food', function() { return true; }),
        { iterations: 1, data: '' }
      );
    });
  });

  context('with a string and a length-restricted predicate', function() {
    it('returns the shortest matching string', function() {
      assert.deepEqual(
        shrink('some stuff is too long', function(s) { return s.length > 2; }),
        { iterations: 3, data: 'ong' }
      );
    });
  });

  context('with a string and a content-restricted predicate', function() {
    it('shrinks the string content until it matches', function() {
      assert.deepEqual(
        shrink('property', function(s) { return s.charCodeAt(0) > 108; }),
        { iterations: 3, data: 'y' }
      );
    });
  });

  context('with a Date and an always-truthy predicate', function() {
    it('returns the start of the epoch', function() {
      assert.deepEqual(
        shrink(new Date(), function() { return true; }),
        { iterations: 1, data: new Date(0) }
      );
    });
  });

  context('with a Date and a predicate that only matches Tuesdays (UTC)', function() {
    it('returns midnight UTC on a Tuesday', function() {
      var result = shrink(new Date(), function(d) { return d.getUTCDay() === 2; });
      assert.equal(result.data.getUTCDay(), 2);

      // The number of iterations are difficult to reason about here, so we just
      // ensure that *something* happened, though we don't specify what exactly.
      assert.ok(result.iterations > 0, 'has more than zero iterations');
    });
  });
});

/**
 * Asserts that the shrinks for value are the given list.
 *
 * @param {*} value
 * @param {*[]} list
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
  result.inspect = result.toString = function() {
    return name;
  };
  return result;
}
