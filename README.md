# shrinker

Shrinker shrinks data. There might be a lot of reasons to do this, but the one
shrinker was designed for is shrinking randomly-generated test data.

## Install

```
$ npm install [--save-dev] shrinker
```

## Usage

### shrinks(data)

`shrinks` returns an iterator that yields shrunken versions of `data`.

```js
for (var smaller of shrinks([2, 4]) {
  console.log(smaller);
}
```

This would print:

```
[]
[ 2 ]
[ 4 ]
[ 0, 4 ]
[ 1, 4 ]
[ 2, 0 ]
[ 2, 2 ]
[ 2, 3 ]
```

If `shrinks` does not know how to shrink the data you give it, it will return
an iterator that yields nothing. You can teach shrinker about new types of data
to shrink using `addRule`.

### shrink(data, predicate, limit=Infinity) -> { iterations, data }

`shrink` returns the smallest data based on `data` and the number of iterations
required to shrink it for which `predicate` returns `true`. By default it will
shrink the data as many times as it needs to, but you can limit the number of
iterations by passing a finite value for `limit`. If the given `data` cannot be
shrunk, the result will have `iterations` of 0.

```js
/**
 * Shrink 20 such that the result is greater than 5.
 *
 * 1a. tries 0, fails
 * 1b. tries 10, passes
 * 2a. tries 0, fails
 * 2b. tries 5, fails
 * 2c. tries 8, passes
 * 3a. tries 0, fails
 * 3b. tries 4, fails
 * 3c. tries 6, passes
 * 4a. tries 0, fails
 * 4b. tries 3, fails
 * 4c. tries 5, fails
 *
 * 4th iteration failed, so use result of 3rd iteration:
 *
 *   { iterations: 3, data: 6 }
 */
shrink(20, n => n > 5);
```

Here's an example of using `shrink` to find the smallest representable floating
point number in JavaScript:

```js
shrink(0.1, n => n > 0);
// { iterations: 1070, data: 5e-324 }
```

### addRule(test, generator)

Registers a generator for data for which `test` returns true. Use this to add
shrinking support for your own data types.

```js
class Complex {
  constructor(r, i) {
    this.r = r;
    this.i = i;
  }

  distance(to) {
    return Math.sqrt(Math.pow(this.r - to.r, 2), Math.pow(this.i - to.i, 2));
  }

  static get ORIGIN() {
    return new this(0, 0);
  }
}

addRule(
  /**
   * Only use this rule to process instances of `Complex`.
   */
  function(value) {
    return value instanceof Complex;
  },

  /**
   * NOTE: This example is a generator function and will only work with node's
   * `--harmony_generators` flag enabled. If you cannot use harmony generators,
   * consider using esnext to transpile your code to ES5.
   *
   * You may also simply write a regular function that returns an iterator.
   */
  function *(value, shrinker) {
    var next;
    var rIter = shrinker.shrinks(value.r);
    var iIter = shrinker.shrinks(value.i);

    // Try to shrink along the real axis first.
    while (!(next = rIter.next()).done) {
      yield new Complex(next.value, value.i);
    }

    // Then try shrinking along the imaginary axis.
    while (!(next = iIter.next()).done) {
      yield new Complex(value.r, next.value);
    }
  }
);

shrink(new Complex(2, 3), c => c.distance(Complex.ORIGIN) >= 1);
// { iterations: 2, data: { r: 1, i: 0 } }
```

### Shrinker

This is the class used to create different shrinking configurations (i.e. sets
of rules). There is a default shrinker which the other export functions -
`shrinks`, `shrink`, and `addRule` - delegate to. By default instances of
`Shrinker` have no shrinking rules, but you can call `addDefaultRules` to add
all the built-in rules you have with the default shrinker.

```js
var shrinker = new Shrinker();
shrinker.addDefaultRules();
shrinker.shrink(20, n => n > 5);
```

### Contributing

1. Fork this repository.
1. Create a branch for your feature/bug fix.
1. Create as many commits as makes sense for your change, ignoring changes to lib/index.es5.js.
1. Add tests for all your changes.
1. Push your changes to your remote and open a pull request.
