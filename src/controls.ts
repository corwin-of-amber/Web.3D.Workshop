import * as THREE from 'three';

let registerEvent = (object, eventNames, handler, scope) => {
  if(!(eventNames instanceof Array)) eventNames = [eventNames];
  eventNames.forEach(eventName => {
    object.addEventListener(eventName, e => scope[handler](e), false);
  })
}

class OtherControls{

	camera: THREE.PerspectiveCamera
	element: HTMLElement
	lon: number
	lat: number
	startPosition: THREE.Vector3
	lookAt: THREE.Vector3

	gesture: {x: number, y: number, lon: number, lat: number}
	spin: {lon: number}

	constructor(camera: THREE.PerspectiveCamera, element: HTMLElement) {
		this.lon = 0;
		this.lat = 0;
		this.camera = camera;
		this.element = element;
		this.startPosition = this.camera.position.clone();
		this.lookAt = new THREE.Vector3(0, 0, 0);
		this.gesture = null;
		this.bindEvents();
	}

	bindEvents(){
		registerEvent(this.element, ['mousedown', 'touchstart'], 'onPointerStart', this );
		registerEvent(document, ['mousemove', 'touchmove'], 'onPointerMove', this );
		registerEvent(document, ['mouseup', 'touchend'], 'onPointerUp', this );
	}

	onPointerStart(event: MouseEvent | TouchEvent) {
		let {x,y} = this._getXY(event);
		this.gesture = {x, y, lon: this.lon, lat: this.lat};
	}

	onPointerMove(event: MouseEvent | TouchEvent) {
		if (this.gesture) {
			let {x,y} = this._getXY(event);
			this.lon = (this.gesture.x - x) * 0.5 + this.gesture.lon;
			this.lat = (this.gesture.y - y) * 0.5 + this.gesture.lat;
		}
	}

	onPointerUp() {
		this.gesture = null;
	}

	_getXY(event: MouseEvent | TouchEvent) {
		var c = (event instanceof MouseEvent) ? event : event.touches[0];
		return {x: c.clientX, y: c.clientY};
	}

	update() {
		/*this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
		let phi = THREE.Math.degToRad( 90 - this.lat );
		let theta = THREE.Math.degToRad( this.lon );

		this.camera.target.x = 500 * Math.sin( phi ) * Math.cos( theta );
		this.camera.target.y = 500 * Math.cos( phi );
		this.camera.target.z = 500 * Math.sin( phi ) * Math.sin( theta );*/


		if (this.spin) {
		 	this.lon += this.spin.lon;
			if (this.gesture) this.gesture.lon += this.spin.lon;
		}

    	var vector = this.startPosition.clone();
		//vector.subVectors( this.camera.startPosition, this.camera.target );
		vector.applyAxisAngle( new THREE.Vector3( 1, 0, 0 ), THREE.Math.degToRad(this.lat) );
		vector.applyAxisAngle( new THREE.Vector3( 0, 1, 0 ), THREE.Math.degToRad(this.lon) );
		this.camera.position.copy(vector);

		this.camera.lookAt( this.lookAt );
	}
}

export { OtherControls }
