export const INDEX_ENTRIES         = 'w'; // { "w": [
export const INDEX_ENTRY_ID        = 'i'; //   { "i": "0123abcd",
export const INDEX_ENTRY_DICT_ENT  = 'd'; //     "d": "lever",
export const INDEX_ENTRY_WORDS     = 'w'; //     "w": [
export const INDEX_ENTRY_WORD_LANG = 'l'; //       { "l": "fr",
export const INDEX_ENTRY_WORD_CLAS = 'c'; //         "c": "v",
export const INDEX_ENTRY_WORD_DISP = 'd'; //         "d": "se lever"
export const ENTRY_DICT_ENTRY      = 'd'; // { "d": "lever",
export const ENTRY_WORDS           = 'w'; //   "w": [
export const ENTRY_WORD_LANG       = 'l'; //     { "l": "fr",
export const ENTRY_WORD_CLAS       = 'c'; //       "c": "v",
export const ENTRY_WORD_DISP       = 'd'; //       "d": "se lever"

export class Database {

	#index; // Promise | Array

	constructor() {
		if( typeof fetch !== 'function')
			throw new Error( `fetch() not available, use a modern browser`);
		this.#index = new Promise( async( resolve, reject) => {
			try {
				const response = await fetch( 'data/index.json');
				if( response.status !== 200)
					throw new Error( `failed to load index`);
				resolve( this.#index = response.json());
			} catch( error) {
				reject( error);
			}
		});
	}

	async estimateEntryCount() {
		const index = this.#index instanceof Promise? await this.#index: this.#index;
		return index[ INDEX_ENTRIES].length;
	}

	async getEntryModulo( n) {
		const index = this.#index instanceof Promise? await this.#index: this.#index;
		return index[ INDEX_ENTRIES][ n % index[ INDEX_ENTRIES].length];
	}

	async searchEntries( term, wordLimit) {
		const index = this.#index instanceof Promise? await this.#index: this.#index;
		const result = [];
		let count = 0;
		for( const entry of index[ INDEX_ENTRIES])
			if( entry[ INDEX_ENTRY_DICT_ENT].includes( term)) {
				result.push( entry);
				count += entry[ INDEX_ENTRY_WORDS].length;
				if( count >= wordLimit)
					break;
			}
		return result;
	}

	async getPrevNext( id) {
		const index = this.#index instanceof Promise? await this.#index: this.#index;
		for( let n = 0; n < index[ INDEX_ENTRIES].length; n++)
			if( index[ INDEX_ENTRIES][ n][ INDEX_ENTRY_ID] === id)
				return {
					prev: index[ INDEX_ENTRIES][ n - 1], // can be undefined
					next: index[ INDEX_ENTRIES][ n + 1], // can be undefined
				};
		return { prev: undefined, next: undefined};
	}

	async fetchEntry( id) {
		const response = await fetch( `data/words/${ id}.json`);
		if( response.status !== 200)
			throw new Error( `failed to load word #${ id}`);
		return response.json();
	}
}
