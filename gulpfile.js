const gulp = require('gulp');
const less = require('gulp-less');

/* ----------------------------------------- */
/*  Compile LESS
/* ----------------------------------------- */

const COC7_LESS = ['less/*.less', 'less/sheets/*.less', 'less/chat-cards/*.less'];
function compileLESS() {
	return gulp.src('less/coc7g.less')
		.pipe(less())
		.pipe(gulp.dest('./'));
}
const css = gulp.series(compileLESS);

/* ----------------------------------------- */
/*  Watch Updates
/* ----------------------------------------- */

function watchUpdates() {
	gulp.watch(COC7_LESS, css);
}

/* ----------------------------------------- */
/*  Export Tasks
/* ----------------------------------------- */

exports.default = gulp.series(
	gulp.parallel(css),
	watchUpdates
);
exports.css = css;