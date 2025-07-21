export class DomHelper {

	#dom;

	constructor( dom) {
		this.#dom = dom;
	}

	get dom() {
		return this.#dom;
	}

	remove() {
		this.#dom.parentNode.removeChild( this.#dom);
	}

	clear() {
		while( this.#dom.lastChild)
			this.#dom.removeChild( this.#dom.lastChild);
	}

	setClass( className) {
			this.#dom.className = className;
	}

	div( className) {
		return new DomHelper( this.#newElement( 'div', className));
	}

	h1( className, text) {
		return new DomHelper( this.#newElement( 'h1', className, text));
	}

	h5( className, text) {
		return new DomHelper( this.#newElement( 'h5', className, text));
	}

	p( className, text) {
		return new DomHelper( this.#newElement( 'p', className, text));
	}

	ul( className) {
		return new DomHelper( this.#newElement( 'ul', className));
	}

	li( text) {
		return new DomHelper( this.#newElement( 'li', undefined, text));
	}

	a( className, text, href) {
		const a = this.#newElement( 'a', className, text);
		if( href !== undefined)
			a.href = href;
		return new DomHelper( a);
	}

	span( className, text) {
		return new DomHelper( this.#newElement( 'span', className, text));
	}

	sup( className, text) {
		return new DomHelper( this.#newElement( 'sup', className, text));
	}

	sub( className, text) {
		return new DomHelper( this.#newElement( 'sub', className, text));
	}

	input( className) {
		return new DomHelper( this.#newElement( 'input', className));
	}

	table( className) {
		return new DomHelper( this.#newElement( 'table', className));
	}

	tr( className) {
		return new DomHelper( this.#newElement( 'tr', className));
	}

	th( className, text) {
		return new DomHelper( this.#newElement( 'th', className, text));
	}

	td( className, text) {
		return new DomHelper( this.#newElement( 'td', className, text));
	}

	text( text) {
		this.#dom.appendChild( this.#dom.ownerDocument.createTextNode( text));
		return this;
	}

	#newElement( name, className, text) {
		const dom = this.#dom.appendChild( this.#dom.ownerDocument.createElement( name));
		if( className !== undefined)
			dom.className = className;
		if( text !== undefined)
			dom.textContent = text;
		return dom;
	}
}
