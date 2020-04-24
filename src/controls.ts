import * as THREE from 'three';

let registerEvent = (object, eventNames, handler, scope) => {
  if(!(eventNames instanceof Array)) eventNames = [eventNames];
  eventNames.forEach(eventName => {
    object.addEventListener(eventName, e => scope[handler](e), false);
  })
}

class OtherControls{
  camera: THREE.PerspectiveCamera
  element: HTMLDivElement
  isUserInteracting: Boolean
  lon:Number,
  lat:Number
  constructor(camera, element) {
    this.lon = 0;
    this.lat = 0;
    this.camera = camera;
    this.element = element;
    this.bindEvents();
  }
  bindEvents(){
		registerEvent(this.element, ['mousedown', 'touchstart'], 'onPointerStart', this );
		registerEvent(document, ['mousemove', 'touchmove'], 'onPointerMove', this );
		registerEvent(document, ['mouseup', 'touchend'], 'onPointerUp', this );
	}
	onPointerStart( event ) {
		this.isUserInteracting = true;
		var clientX = event.clientX || event.touches[ 0 ].clientX;
		var clientY = event.clientY || event.touches[ 0 ].clientY;
		this.onMouseDownMouseX = clientX;
		this.onMouseDownMouseY = clientY;
		this.onMouseDownLon = this.lon;
		this.onMouseDownLat = this.lat;
	}

	onPointerMove( event ) {
		if ( this.isUserInteracting === true ) {
			let clientX = event.clientX || event.touches[ 0 ].clientX;
			let clientY = event.clientY || event.touches[ 0 ].clientY;

			this.lon = ( this.onMouseDownMouseX - clientX ) * 0.1 + this.onMouseDownLon;
			this.lat = ( clientY - this.onMouseDownMouseY ) * 0.1 + this.onMouseDownLat;
		}
	}
	onPointerUp() {
		this.isUserInteracting = false;
	}

	update() {
		/*this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
		let phi = THREE.Math.degToRad( 90 - this.lat );
		let theta = THREE.Math.degToRad( this.lon );

		this.camera.target.x = 500 * Math.sin( phi ) * Math.cos( theta );
		this.camera.target.y = 500 * Math.cos( phi );
		this.camera.target.z = 500 * Math.sin( phi ) * Math.sin( theta );*/

    /*
    TODO: something here!
    */

    this.camera.position.set(8+this.lat, 4, 8);
    
		this.camera.lookAt( this.camera.target );
	}
}

export { OtherControls }
