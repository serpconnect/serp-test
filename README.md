# SERP connect

This is the frontend repository of the SERP-connect [project](https://serpconnect.cs.lth.se).

## Getting Started
Make sure you have downloaded and set up the [backend](https://github.com/emenlu/connect) first.

 - Make sure [nodejs](https://nodejs.org/en/) (v5 or v6) is installed. 
 - Clone this project `git clone https://github.com/emenlu/website serp-frontend`
 - Type `cd serp-frontend && make install`

Now you are ready to start developing! Here are some useful make targets:

 - `make dev` to start dev server & watch files
 - `make live` to test with live backend
 - `make release` to compile less/jade/js and tarball them to frontend.tgz

## Project Structure
The topmost level has these 4 folders:

 - `scripts`: scripts that build the website
 - `src`: source folder for website (less/js/jade)
 - `bin`: (generated) output folder (html/js/css)
 - `test`: folder for all test cases (mainly regression atm)

## What building the website means
The project uses jade, less and javascript. Both jade and less files must be compiled to html and css, respectively. Since we also target older browsers our javascript must be backwards-compatible, which is handled by babel. 

These are the steps taken to build the website:

 - copies/babel-transform js
 - compiles less
 - renders jade
 	- production mode (BUILD_MODE=prod): use api from api.serpconnect.cs.lth.se
 	- development mode (BUILD_MODE=dev, default): use api from localhost:8080
 - copies images

## Testing
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
