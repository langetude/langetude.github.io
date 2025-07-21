import { Database} from './database.js';
import { DomHelper} from './util.js';
import { SearchBox} from './search.js';
import { WordPage} from './word.js';

window.addEventListener( 'load', async() => {
	try {
		document.body.textContent = 'Loading...';
		new Application( new Database());
	} catch( error) {
		document.body.textContent = error.message;
		throw error;
	}
});

class Application {

	#database;
	#container;
	#currentPage;

	constructor( database) {
		this.#database = database;
		if( !window.history)
			throw new Error( `the history API is not available, use a modern browser`);

		const body = new DomHelper( document.body);
		body.clear();
		body.h1( 'logo', 'Langétude');
		new SearchBox( this, body, new URL( location));
		this.#container = body.div();
		const footer = body.div( 'footer');
		const p = footer.p();
		p.text( 'Copyright 2025 Langétude, all rights reserved. Designed by Langétude, contains icons by ');
		p.a( undefined, 'Icons8', 'https://icons8.com');
		p.text( '.');

		window.addEventListener( 'popstate', () => this.#cameto( new URL( location)));
		this.#cameto( new URL( location));
	}

	get database() {
		return this.#database;
	}

	goto( url) {
		history.pushState( null, '', url);
		this.#cameto( url);
	}

	#cameto( url) {
		if( this.#currentPage)
			this.#currentPage.unload();
		this.#currentPage = null;
		this.#currentPage = this.#instantiatePage( url);
	}

	#instantiatePage( url) {
		if( !url.search)
			return new WordPage( this, this.#container, url);
		if( url.searchParams.get( 'i') !== undefined)
			return new WordPage( this, this.#container, url);
		return new UnknownPage( this, this.#container, url);
	}
}

class UnknownPage {

	#div;

	constructor( context, container, url) {
		this.#div = container.div( 'page');
		this.#div.p( undefined, `Page Not Found: ${ url}`);
	}

	unload() {
		this.#div.remove();
	}
}
