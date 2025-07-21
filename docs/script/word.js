import { ENTRY_WORD_CLAS, ENTRY_WORD_DISP, ENTRY_WORD_LANG, ENTRY_WORDS, INDEX_ENTRY_ID, INDEX_ENTRY_WORD_CLAS, INDEX_ENTRY_WORD_DISP, INDEX_ENTRY_WORD_LANG, INDEX_ENTRY_WORDS} from './database.js';

const REDIRECT_DELAY_MS = 2000;

export const SEARCH_PARAM_ID = 'i';
export const SEARCH_PARAM_SEQ = 's';

export class WordPage {

	#context;
	#div;
	#url;

	constructor( context, container, url) {
		this.#context = context;
		this.#div = container.div( 'page');
		this.#url = url;
		this.#init( context, url);
	}

	unload() {
		this.#div.remove();
		this.#div = null;
	}

	async #init() {
		const id = this.#url.searchParams.get( SEARCH_PARAM_ID);
		if( !id)
			await this.#initRandomPage();
		else
			await this.#initWordPage();
	}

	async #initRandomPage() {
		const page = this.#div.div( 'page');
		page.p( undefined, 'Picking a random word...');
		const estimatedEntryCount = await this.#context.database.estimateEntryCount();
		if( !this.#div)
			return; // unloaded while we were waiting
		const entry = await this.#context.database.getEntryModulo( parseInt( Math.random() * estimatedEntryCount));
		if( !this.#div)
			return; // unloaded while we were waiting
		if( !entry) {
			page.p( undefined, 'The database is empty.');
			return;
		}
		const seq = parseInt( Math.random() * entry[ INDEX_ENTRY_WORDS].length);
		page.p( undefined, `Redirecting to ${ entry[ INDEX_ENTRY_WORDS][ seq][ INDEX_ENTRY_WORD_DISP]}`);
		await new Promise( res => setTimeout( res, REDIRECT_DELAY_MS));
		if( !this.#div)
			return; // unloaded while we were waiting
		const target = new URL( this.#url);
		target.search = '';
		target.searchParams.set( SEARCH_PARAM_ID, entry[ INDEX_ENTRY_ID]);
		if( entry[ INDEX_ENTRY_WORDS].length > 1)
			target.searchParams.set( SEARCH_PARAM_SEQ, `${ seq}`);
		this.#context.goto( target);
	}

	async #initWordPage() {
		const id = this.#url.searchParams.get( SEARCH_PARAM_ID);
		const seq = +( this.#url.searchParams.get( SEARCH_PARAM_SEQ) || 0);
		const loadingPrompt = this.#div.p( undefined, `Loading word #${ id}/${ seq}...`);
		const entry = await this.#context.database.fetchEntry( id);
		const { prev: prevEntry, next: nextEntry} = await this.#context.database.getPrevNext( id);
		if( !this.#div)
			return; // unloaded while we were waiting

		if( seq > 0) {
			const prevWord = entry[ ENTRY_WORDS][ seq - 1];
			this.#wordLink( this.#div, 'prev',
					id,
					seq - 1,
					prevWord[ ENTRY_WORD_LANG],
					prevWord[ ENTRY_WORD_CLAS],
					prevWord[ ENTRY_WORD_DISP]);
		} else if( prevEntry) {
			const prevWordIndex = prevEntry[ INDEX_ENTRY_WORDS][ prevEntry[ INDEX_ENTRY_WORDS].length - 1];
			this.#wordLink( this.#div, 'prev',
				prevEntry[ INDEX_ENTRY_ID],
				prevEntry[ INDEX_ENTRY_WORDS].length > 1? prevEntry[ INDEX_ENTRY_WORDS].length - 1: undefined,
				prevWordIndex[ INDEX_ENTRY_WORD_LANG],
				prevWordIndex[ INDEX_ENTRY_WORD_CLAS],
				prevWordIndex[ INDEX_ENTRY_WORD_DISP]);
		}
		if( seq < entry[ ENTRY_WORDS].length - 1) {
			const nextWord = entry[ ENTRY_WORDS][ seq + 1];
			this.#wordLink( this.#div, 'next',
				id,
				seq + 1,
				nextWord[ ENTRY_WORD_LANG],
				nextWord[ ENTRY_WORD_CLAS],
				nextWord[ ENTRY_WORD_DISP]);
		} else if( nextEntry) {
			const nextWordIndex = nextEntry[ INDEX_ENTRY_WORDS][ 0];
			this.#wordLink( this.#div, 'next',
				nextEntry[ INDEX_ENTRY_ID],
				nextEntry[ INDEX_ENTRY_WORDS].length > 1? 0: undefined,
				nextWordIndex[ INDEX_ENTRY_WORD_LANG],
				nextWordIndex[ INDEX_ENTRY_WORD_CLAS],
				nextWordIndex[ INDEX_ENTRY_WORD_DISP]);
		}

		const word = entry[ ENTRY_WORDS][ seq];
		if( !word)
			this.#div.p( undefined, `Word not found`);
		else
			switch( word[ ENTRY_WORD_LANG]) {
				case 'fr':
					switch( word[ ENTRY_WORD_CLAS]) {
						case 'v':
							loadingPrompt.remove();
							this.#renderFrenchVerb( id, entry, seq);
							break;
						default:
							this.#div.p( undefined, `Unrecognized word class: ${ word[ ENTRY_WORD_CLAS]}`);
					}
					break;
				default:
					this.#div.p( undefined, `Unrecognized language: ${ word[ ENTRY_WORD_LANG]}`);
			}
	}

	#renderFrenchVerb( id, entry, seq) {
		const word = entry[ ENTRY_WORDS][ seq];
		const p = this.#div.p( 'word', `${ word.d}`);
		if( entry[ ENTRY_WORDS].length > 1)
			p.span( 'sub', `${ seq + 1}`);
		p.span( `word-clas word-lang-${ word[ ENTRY_WORD_LANG]}`, `${ word[ ENTRY_WORD_CLAS]}.`);

		this.#frenchConjTable( word.infPr, false, 'Infinitif Présent');
		this.#frenchConjTable( word.infPa, false, 'Infinitif Passé');
		this.#frenchConjTable( word.indPr, true , 'Indicatif Présent');
		this.#frenchConjTable( word.indPC, true , 'Indicatif Passé Composé');
	}

	#frenchConjTable( records, includesHeading, title) {
		let cols;
		for( const row of records)
			if( cols === undefined)
				cols = row.length;
			else if( cols !== row.length)
				throw new Error( `row length mismatch`);

		const conj = this.#div.div( 'conjugation');
		conj.h5( undefined, title);
		const table = conj.table();
		for( const row of records) {
			const tr = table.tr();
			if( includesHeading)
				tr.td( 'head', row[ 0].endsWith( '’')? row[ 0]: row[ 0] + ' ');
			for( let col = includesHeading? 1: 0; col < row.length - 1; col++)
				tr.td( 'aux', row[ col].endsWith( '’')? row[ col]: row[ col] + ' ');
			const td = tr.td( 'conjugated');
			td.span( 'stem'  , row[ row.length - 1][ 0]);
			td.span( 'morph' , row[ row.length - 1][ 1]);
			td.span( 'suffix', row[ row.length - 1][ 2]);
		}
	}

	#wordLink( container, cssClass, id, seq, language, wordClass, displayName) {
		const a = container.a( `${ cssClass} word`, displayName);
		a.dom.addEventListener( 'click', () => {
			const target = new URL( this.#url);
			target.search = '';
			target.searchParams.set( SEARCH_PARAM_ID, id);
			if( seq !== undefined)
				target.searchParams.set( SEARCH_PARAM_SEQ, `${ seq}`);
			this.#context.goto( target);
		});
		if( seq !== undefined)
			a.sub( undefined, `${ seq + 1}`);
		a.span( `word-clas word-lang-${ language}`, `${ wordClass}.`);
	}
}
