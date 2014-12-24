<?php header( 'Content-type: text/javascript; charset=UTF-8' ); ?>

(function(win, doc, undefined) {
'use strict';

<?php
	$ignore = array( '.', '..' );
	$files  = opendir( '.' );
	while ( false !== ( $filename = readdir( $files ) ) ) {
		if ( in_array( $filename, $ignore ) ) continue;
		if ( pathinfo( $filename, PATHINFO_EXTENSION ) != 'js' ) continue;
		echo file_get_contents( $filename );
	}
?>

// publish game to global scope
window.game = game;

// init on window ready
window.onload = function() {
	game.init(win, doc);
};

})(window, document);
