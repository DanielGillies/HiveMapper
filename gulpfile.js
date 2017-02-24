var gulp = require('gulp');
var source = require('vinyl-source-stream'); // Used to stream bundle for further handling
var browserify = require('browserify');
var babelify = require('babelify');

gulp.task('browserify', function() {
  var bundler = browserify({
    entries: ['./src/main.js'], // Only need initial file, browserify finds the deps
    debug: true, // Gives us sourcemapping
    cache: {}, packageCache: {}, fullPaths: true // Requirement of watchify
  });

  bundler.transform(babelify, {presets: ["es2015", "react"]});

  return bundler.bundle() // Create the initial bundle when starting the task
  .pipe(source('./main.js'))
  .pipe(gulp.dest('./build/'));
});

gulp.task('build', ['browserify']);
