ESNEXT=./node_modules/.bin/esnext

# By default compile everything and run the tests.
all: test

# Remove the built files.
clean:
	rm -f lib/index.es5.js

# Transpile the source file into ES5 using esnext.
lib/index.es5.js: lib/index.js
	$(ESNEXT) --include-runtime -o $@ $<

# Test both native and transpiled versions by default.
test: test-native test-esnext

# Test that the version built with node's native generator support passes.
test-native: test/shrinker_test.js lib/index.js
	mocha --harmony-generators -R spec test

# Test that the version built with esnext passes.
test-esnext: test/shrinker_test.js lib/index.es5.js
	mocha -R spec test

# Shorthand for transpiling the required files.
transpile: lib/index.es5.js

.PHONY: all clean transpile test test-native test-esnext
