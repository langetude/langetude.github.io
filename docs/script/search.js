import { INDEX_ENTRY_ID, INDEX_ENTRY_WORD_CLAS, INDEX_ENTRY_WORD_DISP, INDEX_ENTRY_WORD_LANG, INDEX_ENTRY_WORDS} from './database.js';
import { SEARCH_PARAM_ID, SEARCH_PARAM_SEQ} from './word.js';

const SEARCH_DELAY_MS = 500; // wait before starting the search this number of ms after stopped typing
const RESET_DELAY_MS = 1000; // wait before resetting the list this amount of ms after loosing focus
const SEARCH_LIMIT = 8;
const CSS_WORD_CLASS = 'c';
const CSS_WORD_LANG_PREFIX = 'l-';
const CSS_LI_HIGHLIGHTED = 'highlighted';

export class SearchBox {

	#url;
	#context;
	#inputDom;
	#ul; // DomHelper not DOM

	#delayToken;
	#options; // [ string]
	#lis;
	#hl; // index number

	constructor( context, container, url) {
		this.#context = context;
		this.#url = url;
		const div = container.div( 'search');
		this.#inputDom = div.input().dom;
		this.#inputDom.addEventListener( 'input', this.#inputChanged.bind( this));
		this.#inputDom.addEventListener( 'keydown', this.#onKey.bind( this)); // keydown (not keyup) to prevent cursor move
		this.#inputDom.addEventListener( 'blur', this.#onBlur.bind( this));
		this.#ul = div.ul();
	}

	async #inputChanged() {
		const term = this.#inputDom.value;
		const token = this.#delayToken = {}; // new object, only for identity check
		await new Promise( res => setTimeout( res, SEARCH_DELAY_MS)); // delay for rate limit
		if( token !== this.#delayToken)
			return; // input value changed again since delay, abandon
		if( !term)
			this.#reset(); // if nothing entered, clear drop-down list
		else {
			const results = await this.#context.database.searchEntries( term, SEARCH_LIMIT);
			if( token !== this.#delayToken)
				return; // input value changed again since search, abandon
			if( !results.length)
				this.#reset(); // if nothing found, clear drop-down list
			else {
				this.#ul.clear();
				this.#options = [];
				this.#lis = [];
				this.#hl = null;
				for( const { [ INDEX_ENTRY_ID]: id, [ INDEX_ENTRY_WORDS]: words} of results)
					for( let n = 0; n < words.length && this.#options.length < SEARCH_LIMIT; n++) {
						const word = words[ n];
						const option = {
							[ SEARCH_PARAM_ID]: id,
							[ SEARCH_PARAM_SEQ]: words.length > 1? n: undefined,
						};
						this.#options.push( option);
						const li = this.#ul.li();
						this.#lis.push( li);
						const a = li.a( undefined, word[ INDEX_ENTRY_WORD_DISP]);
						a.span( CSS_WORD_CLASS, `${ word[ INDEX_ENTRY_WORD_CLAS]}.`);
						a.setClass( CSS_WORD_LANG_PREFIX + word[ INDEX_ENTRY_WORD_LANG]);
						a.dom.addEventListener( 'click', () => this.#goto( option));
				}
			}
		}
	}

	#onKey( event) {
		switch( event.key) {
			case 'ArrowDown':
				if( this.#lis != null) {
					if( this.#hl != null)
						this.#lis[ this.#hl].setClass( undefined);
					this.#hl = this.#hl == null || this.#hl >= this.#lis.length - 1? 0: this.#hl + 1;
					this.#lis[ this.#hl].setClass( CSS_LI_HIGHLIGHTED);
				}
				event.preventDefault();
				break;
			case 'ArrowUp':
				if( this.#lis != null) {
					if( this.#hl != null)
						this.#lis[ this.#hl].setClass( undefined);
					this.#hl = this.#hl == null || this.#hl == 0? this.#lis.length - 1: this.#hl - 1;
					this.#lis[ this.#hl].setClass( CSS_LI_HIGHLIGHTED);
				}
				event.preventDefault();
				break;
			case 'Enter':
				if( this.#options == null || this.#hl == null)
					return;
				this.#goto( this.#options[ this.#hl]);
				event.preventDefault();
				break;
			case 'Escape':
				this.#reset();
				break;
		}
	}

	async #onBlur() {
		await new Promise( res => setTimeout( res, RESET_DELAY_MS));
		if( document.activeElement !== this.#inputDom) // only if not focused back
			this.#reset();
	}

	#reset() {
		this.#ul.clear();
		this.#options = null;
		this.#lis = null;
		this.#hl = null;
	}

	#goto( option) {
		this.#inputDom.value = '';
		this.#ul.clear();
		this.#options = null;
		this.#lis = null;
		this.#hl = null;
		const target = new URL( this.#url);
		target.search = '';
		target.searchParams.set( SEARCH_PARAM_ID, option[ SEARCH_PARAM_ID]);
		if( option[ SEARCH_PARAM_SEQ] !== undefined)
			target.searchParams.set( SEARCH_PARAM_SEQ, option[ SEARCH_PARAM_SEQ]);
		this.#context.goto( target);
	}
}
