'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');


gulp.task('default', ['browser-sync'], function () {
});

gulp.task('browser-sync', ['nodemon'], function() {
	browserSync.init(null, {
		proxy: "http://localhost:3008",
        files: ["static/**/*.*"],
        browser: "google chrome",
        port: 7000,
				ws: true,
				ghostMode: false,
	});
});

gulp.task('nodemon', function (cb) {
	var started = false;

	return nodemon({
		script: 'server.js',
    ignore: ["static", "*.json"],
    nodeArgs: ['--inspect=0.0.0.0:9229']
	}).on('start', function () {
		if (!started) {
			cb();
			started = true;
		}
	});
});
