# SERP connect website

 - install [nodejs](https://nodejs.org/en/) (compatible with 6.1.0)
 - `make` in this dir
 - `make dev` to run file watcher and recompile less/jade automagically
 - `make release` to compile less/jade/js and tarball them to frontend.tgz
 - `make dev-server` to use frontend dev server (required for ajax to work)

# folders
 - `scripts`: development/build scripts
 - `src`: source folder for website (less/js/jade)
 - `bin`: output folder for website (html/js/css)
 - `test`: folder for all test cases (mainly regression atm)

# build
 - copies/babel-transform js
 - compiles less
 - renders jade
 	- production mode (BUILD_MODE=prod): use api from api.serpconnect.cs.lth.se
 	- development mode (BUILD_MODE=dev, default): use api from localhost:8080
 - copies images

# testing
 - `make test` to run all tests
 - `node test <test-file>` to run specific test (note `node` instead of `make`)
 - requires a server on `localhost:9999` (in bin/ dir)

any simple web server should do:
```
# Python
python -m SimpleHTTPServer 9999

# node-static (nodejs)
npm i -g node-static
static -p 9999
```

to run a specific test file in tests/:
```
# Assuming something like
tests/all.js
tests/index.js
tests/my-test.unit.js

# These two are equivalent
$ node test my-test
$ node test my-test.unit.js
```
