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
to shrink using `register`.

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

### register(test, generator)

Registers a generator for data for which `test` returns true. Use this to add
shrinking support for your own data types.
