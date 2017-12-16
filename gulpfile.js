// third-party dependencies
const gulp = require('gulp')
const gulpSize = require('gulp-size')

// browserify
const browserify = require('browserify')
const source     = require('vinyl-source-stream')
const buffer     = require('vinyl-buffer')

// browser-sync
var browserSync = require('browser-sync').create()

gulp.task('javascript', function () {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: 'demo/index.js',
    debug: false,

    // defining transforms here will avoid crashing your stream
    transform: [
    
    ],
  })

  return b.bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(gulp.dest('dist'))
    .pipe(gulpSize())
})

gulp.task('distribute', ['javascript'], function () {
  gulp.src([
    'demo/index.html',
    'demo/resources/**/*'
  ], { base: 'demo' })
  .pipe(gulp.dest('dist'))
})

gulp.task('develop', ['javascript'], function () {

  gulp.watch([
    'lib/**/*.js',
    'demo/**/*.js'
  ], ['javascript'])

  gulp.watch([
    'dist/**/*.js',
    'demo/index.html',
    'demo/**/*.css',
  ], browserSync.reload)

  browserSync.init({
    server: ['dist', 'demo'],
  })
})
