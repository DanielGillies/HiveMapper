import React from 'react';
import * as THREE from 'three';
// See https://github.com/mrdoob/three.js/issues/10311 for why the wildcard import is needed.

import PLYLoader from './plyloader.js';
import { ECEFToLonLatAlt } from './geo-utils.js';

const buttonStyle = {
    height: '25px',
    width: '45%',
    verticalAlign: 'top',
    margin: '0 2.5%',
};

// Variable to store the three-holder dom element
var holder;

// Storing body in variable
var element;

// Initialize necessary variables
var MODEL, BASE_GEOMETRY;
var center;
var scene, camera, renderer, controls, points;

// Controller variables
var controlsEnabled = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var moveUp = false;
var moveDown = false;

setupPointerLock()

// Capture previous time for update delta
var prevTime = performance.now();
var velocity = new THREE.Vector3();

// Resize event listener
window.addEventListener('resize', onWindowResize, false);

export default class App extends React.Component {

    componentDidMount() {
        this.loadModel();
    }

    // Called when "Color with RGB" button is clicked
    rgbColor(e) {
        console.log("Change to RGB Color");
        // Array of all the colors in our model
        var colorArray = MODEL.geometry.getAttribute("color").array;

        // Go through array, set colors to their original RGB colors
        for (var i = 0; i < colorArray.length; i += 3) {
            var vI = i / 3;
            colorArray[i] = BASE_GEOMETRY.colors[vI].r;
            colorArray[i + 1] = BASE_GEOMETRY.colors[vI].g;
            colorArray[i + 2] = BASE_GEOMETRY.colors[vI].b;
        }
    }

    // Called when "Color by Altitude" is clicked
    altitudeColor(e) {
        console.log("Change to altitude Color");
        // Array of all colors in our model
        var colorArray = MODEL.geometry.getAttribute("color").array;

        // Go through array, set colors based on their altitude
        for (var i = 0; i < colorArray.length; i += 3) {
            var vI = i / 3;
            // Variable to store ECEF point data
            var ECEF = { x: BASE_GEOMETRY.vertices[vI].x, y: BASE_GEOMETRY.vertices[vI].y, z: BASE_GEOMETRY.vertices[vI].z };
            // LLA contains longitude, latitude, altitude data
            var LLA = ECEFToLonLatAlt(ECEF);
            // Determine color based on altitude
            var color = determineColor(LLA.alt);
            // Set color of current vertex
            colorArray[i] = color[0];
            colorArray[i + 1] = color[1];
            colorArray[i + 2] = color[2];
        }
    }

    render() {
        return (
            <span>
        <div id="three-holder" style={
          {
            position: 'absolute',
            top: '40px',
            right: '0',
            bottom: '0',
            left: '0',
            background: 'black',
          }
        }></div>
        <div style={ {height: '40px'} }>
          <button onClick={this.rgbColor} style={buttonStyle}>Color With RGB</button>
          <button onClick={this.altitudeColor} style={buttonStyle}>Color By Altitude</button>
        </div>
      </span>
        );
    }

    loadModel() {
        const loader = new PLYLoader();
        loader.load(
            'https://s3.amazonaws.com/web-ui-engineering-challenge/point-cloud.ply',
            (geometry) => {
                // geometry here is an instance of THREE.Geometry
                console.log('loaded geometry');

                // Save geometry in global scope
                BASE_GEOMETRY = geometry;
                this.setupScene();
                render();
            });
    }

    setupScene() {
        // Set center offset to move object to middle of scene
        center = BASE_GEOMETRY.boundingSphere.center;

        // Store canvas in variable for easy access
        holder = document.getElementById("three-holder");

        // Add event listener to request pointerLock in browser
        holder.addEventListener('click', function(event) {
            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();
        }, false);

        // Dimensions of our three.js canvas
        var height = holder.offsetHeight,
            width = holder.offsetWidth;

        // Create a scene
        scene = new THREE.Scene();

        // Setup Camera
        camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000);
        scene.add(camera);

        controls = new THREE.PointerLockControls(camera);
        scene.add(controls.getObject());

        // Moving/rotating the camera to get a good starting view
        controls.getObject().translateZ(150);
        controls.getObject().translateY(100);
        controls.getObject().translateX(75);
        controls.getObject().children[0].rotation.x = -.5;
        controls.getObject().rotation.y = .3;

        // Setup the renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        holder.appendChild(renderer.domElement);

        // Builds the geometry for the pointcloud a BufferGeometry
        var geometry = this.buildGeometry();

        // Creates a material to add to the Pointcloud, setting each point to a size of 1
        var material = new THREE.PointsMaterial({ size: 1, vertexColors: THREE.VertexColors });
        points = new THREE.Points(geometry, material);

        // Rotate model to get rid of tilt caused by using ECEF coordinates
        this.rotateModel(points);
        scene.add(points);

        // Save points model in global scope
        MODEL = points;
    }

    // Builds the model with the correct colors/locations
    buildGeometry() {
        var particles = BASE_GEOMETRY.vertices.length;
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array(particles * 3);
        var colors = new Float32Array(particles * 3);

        for (var i = 0; i < positions.length; i += 3) {
            var vI = i / 3;

            // positions
            positions[i] = BASE_GEOMETRY.vertices[vI].x - center.x;
            positions[i + 1] = BASE_GEOMETRY.vertices[vI].y - center.y;
            positions[i + 2] = BASE_GEOMETRY.vertices[vI].z - center.z;

            // colors
            colors[i] = BASE_GEOMETRY.colors[vI].r;
            colors[i + 1] = BASE_GEOMETRY.colors[vI].g;
            colors[i + 2] = BASE_GEOMETRY.colors[vI].b;

        }

        // Set attributes for positions/colors of each vertex
        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeBoundingSphere();

        return geometry;
    }

    // Rotating the model to adjust for the ECEF coords
    rotateModel(points) {
        points.rotation.z = 3.7821929249262;
        points.rotation.x = -.66066;
        points.rotation.y = .15665;
    }

}

/**
 * @author mrdoob / http://mrdoob.com/
 * Controls for camera movement
 */

THREE.PointerLockControls = function(camera) {

    var scope = this;

    camera.rotation.set(0, 0, 0);

    var pitchObject = new THREE.Object3D();
    pitchObject.add(camera);

    var yawObject = new THREE.Object3D();
    yawObject.position.y = 10;
    yawObject.add(pitchObject);

    var PI_2 = Math.PI / 2;

    var onMouseMove = function(event) {

        if (scope.enabled === false) return;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        yawObject.rotation.y -= movementX * 0.002;
        pitchObject.rotation.x -= movementY * 0.002;

        pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));

    };

    this.dispose = function() {

        document.removeEventListener('mousemove', onMouseMove, false);

    };

    document.addEventListener('mousemove', onMouseMove, false);

    this.enabled = false;

    this.getObject = function() {

        return yawObject;

    };

    this.getDirection = function() {

        // assumes the camera itself is not rotated

        var direction = new THREE.Vector3(0, 0, -1);
        var rotation = new THREE.Euler(0, 0, 0, "YXZ");

        return function(v) {

            rotation.set(pitchObject.rotation.x, yawObject.rotation.y, 0);

            v.copy(direction).applyEuler(rotation);

            return v;

        };

    }();

};

/*******************
****** SCRIPTS *****
********************/

// Render loop
function render() {
    // Pauses when changes tabs
    requestAnimationFrame(render);

    // Allows the colors on the model to be redrawn
    MODEL.geometry.getAttribute("color").needsUpdate = true;

    if (controlsEnabled) {
        // Get time since last update
        var time = performance.now();
        var delta = (time - prevTime) / 1000;

        // Constant decreasing of velocity
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= velocity.y * 10.0 * delta;

        // Add velocity to directions we are moving
        if (moveForward) velocity.z -= 400.0 * delta;
        if (moveBackward) velocity.z += 400.0 * delta;
        if (moveLeft) velocity.x -= 400.0 * delta;
        if (moveRight) velocity.x += 400.0 * delta;
        if (moveUp) velocity.y += 400.0 * delta;
        if (moveDown) velocity.y -= 400.0 * delta;

        // Move in the direction we are going
        controls.getObject().translateX(velocity.x * delta);
        controls.getObject().translateY(velocity.y * delta);
        controls.getObject().translateZ(velocity.z * delta);

        prevTime = time;
    }

    renderer.render(scene, camera);
};

// Used to determine color based on altitude
function determineColor(height) {
    if (height >= 6.65 && height <= 32) {
        // interp between (1,0,0) and (0,1,0)
        var green = height / 32.0;
        var red = 1 - green;
        var blue = 0;
    } else if (height > 32 && height <= 58.57) {
        // interp between (0,1,0) and (0,0,1)
        var red = 0;
        var blue = (height - 31) / 32;
        var green = 1 - blue;
    }

    // Array of colors
    return [red, green, blue];
}

// Reset aspect ratio, size, etc when window resizes
function onWindowResize() {
    camera.aspect = holder.offsetWidth / holder.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(holder.offsetWidth, holder.offsetHeight);
}

// Sets up the controls
function setupPointerLock() {
    // Set up pointerlock access for controls
    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
    if (havePointerLock) {
        element = document.body;
        var pointerlockchange = function(event) {
            if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
                controlsEnabled = true;
                controls.enabled = true;
            } else {
                controls.enabled = false;
            }
        };
        var pointerlockerror = function(event) {
            console.log("Pointer lock error");
        };
        // Hook pointer lock state change events
        document.addEventListener('pointerlockchange', pointerlockchange, false);
        document.addEventListener('mozpointerlockchange', pointerlockchange, false);
        document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
        document.addEventListener('pointerlockerror', pointerlockerror, false);
        document.addEventListener('mozpointerlockerror', pointerlockerror, false);
        document.addEventListener('webkitpointerlockerror', pointerlockerror, false);
    }

    function onKeyDown(event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = true;
                break;
            case 37: // left
            case 65: // a
                moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
            case 32: // space
                moveUp = true;
                break;
            case 16: // shift
                moveDown = true;
        }
    };

    function onKeyUp(event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;
            case 37: // left
            case 65: // a
                moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
            case 32: // space
                moveUp = false;
                break;
            case 16: // shift
                moveDown = false;
        }
    };
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

}
