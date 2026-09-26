import * as THREE from 'three';
import earthTexture from "/earth.jpg";
import { degToRad } from 'three/src/math/MathUtils.js';
import { DeviceCameraController } from "./camera.ts";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.005, 3);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controller = new DeviceCameraController(camera);
controller.enable();

// Earth

const player = new THREE.Object3D();
scene.add(player);
camera.rotation.order = "YXZ";
player.rotation.order = "YXZ";

player.add(camera);
camera.position.set(0, 1, 0);


const texture = new THREE.TextureLoader().load(earthTexture);
const geometry = new THREE.SphereGeometry(1, 64, 64);
const material = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.BackSide
});

const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// light

function subsolarLongitude(date = new Date()): number {

    console.log(date.toISOString());
    return degToRad(-15 * (date.getHours() + date.getMinutes()*60 - 6));

}

const sun = new THREE.DirectionalLight(0xffffff, 3);

sun.position.set(Math.sin(subsolarLongitude()), 0 , Math.cos(subsolarLongitude()));
sun.target.position.set(0,0,0);
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

// Keys

const keys: Record<string, boolean> = {};

window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

const rotationSpeed = 0.02;

function animate() {

    if (keys["a"]) camera.rotation.y += rotationSpeed;
    if (keys["d"]) camera.rotation.y -= rotationSpeed;

    if (keys["w"]) camera.rotation.x += rotationSpeed;
    if (keys["s"]) camera.rotation.x -= rotationSpeed;

    if (keys["x"]) player.rotation.x += rotationSpeed;
    if (keys["y"]) player.rotation.y += rotationSpeed;
    if (keys["z"]) player.rotation.z += rotationSpeed;

    
    renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );


let latitude: number | null = null;
let longitude: number | null = null;

navigator.geolocation.getCurrentPosition(
    (position) => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;

        player.rotation.set(
            Math.PI/2 - degToRad(latitude),
            Math.PI/2 + degToRad(longitude),
            0
        );

        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);

        const gpsElement = document.getElementById("gps");

        if (gpsElement) {
        gpsElement.textContent =
            `Latitude: ${latitude}\nLongitude: ${longitude}`;
        }
    },
    (error) => {
        console.error("Could not get location:", error);
    }
);


subsolarLongitude();
