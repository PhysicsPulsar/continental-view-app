import * as THREE from 'three';
import earthTexture from "/earth.jpg"; // from https://www.solarsystemscope.com
import { DeviceCameraController } from "./camera.ts";
import { DateController } from "./date.ts";
import { DeviceTracker } from "./orientation.ts";
import { degToRad } from 'three/src/math/MathUtils.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.005, 5);

const canvas = document.querySelector<HTMLCanvasElement>("#three")!;
const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
});
renderer.setClearColor(0x000000, 0);
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


//skybox

const skyboxGeometry = new THREE.SphereGeometry(4, 8, 8);
const skyboxMaterial = new THREE.MeshBasicMaterial({color: 0x6296c4, side: THREE.BackSide});
const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);

camera.add(skybox);

// Video

let stream: MediaStream | null = null;

const button = document.querySelector<HTMLButtonElement>("#cameraButton")!;

const controller = new DeviceCameraController(camera, skybox);

button.addEventListener("click", async () => {
    if (!stream) { // Start camera

        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false,
        });

        video.srcObject = stream;
        await video.play();
        controller.enable();

        button.textContent = "Parar camara";

    } else { // Stop camera

        stream.getTracks().forEach(track => track.stop());
        stream = null;
        video.srcObject = null;
        controller.disable();

        button.textContent = "Encender camara";
    }
});

const video = document.querySelector<HTMLVideoElement>("#camera")!;

video.srcObject = stream;

// Earth

const player = new THREE.Object3D();
scene.add(player);
camera.rotation.order = "YXZ";
player.rotation.order = "YXZ";
player.rotation.set(Math.PI/2, 0, 0);

player.add(camera);
camera.position.set(0, 1, 0);


const texture = new THREE.TextureLoader().load(earthTexture);
//texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
const geometry = new THREE.SphereGeometry(1, 128, 128);
const material = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.BackSide
});

const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// light

function handleKeyPress(event: KeyboardEvent) {
    if (event.key === "t") {
        dateController.changeHour(+1);
    }
}

document.addEventListener("keydown", handleKeyPress);



const sunGeometry = new THREE.SphereGeometry(0.1, 8, 8);
const sunMaterial = new THREE.MeshBasicMaterial({color: 0xffff00});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);

scene.add(sun);

const sunLight = new THREE.DirectionalLight(0xffffff, 3);


sunLight.target.position.set(0,0,0);
scene.add(sunLight);

const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

// clases


//await controller.enable();
const dateController = new DateController(new Date(), sunLight, sun, camera);

// Keys

const keys: Record<string, boolean> = {};

window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

const rotationSpeed = 0.02;

const tracker = new DeviceTracker(camera);

await tracker.start();

function animate() {

    if (keys["a"]) camera.rotation.y += rotationSpeed;
    if (keys["d"]) camera.rotation.y -= rotationSpeed;

    if (keys["w"]) camera.rotation.x += rotationSpeed;
    if (keys["s"]) camera.rotation.x -= rotationSpeed;

    if (keys["x"]) player.rotation.x += rotationSpeed;
    if (keys["y"]) player.rotation.y += rotationSpeed;
    if (keys["z"]) player.rotation.z += rotationSpeed;

    //camera.rotation.y += rotationSpeed;
    //tracker.update();
    
    renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

// Text

function createTextSprite(
    text: string,
    options: {
        fontSize?: number;
        color?: string;
        background?: string;
        padding?: number;
    } = {}
    ): THREE.Sprite {
    const {
        fontSize = 16,
        color = "#ffffff",
        background = "transparent",
        padding = 16,
    } = options;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    ctx.font = `bold ${fontSize}px Arial`;

    const textWidth = ctx.measureText(text).width;

    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize + padding * 2;

    // Canvas dimensions changed, so set font again.
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (background !== "transparent") {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = color;
    ctx.fillText(
        text,
        canvas.width / 2,
        canvas.height / 2
    );

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
    });

    const sprite = new THREE.Sprite(material);

    // Adjust this to control the physical size in your scene.
    const aspect = canvas.width / canvas.height * 0.1;
    sprite.scale.set(aspect, 0.1, 1);

    return sprite;
}

const nLabel = createTextSprite("N", {
    fontSize: 42,
    color: "#ffffff",
    background: "rgba(0, 0, 0, 0)",
});
const sLabel = createTextSprite("S", {
    fontSize: 42,
    color: "#ffffff",
    background: "rgba(0, 0, 0, 0)",
});
const eLabel = createTextSprite("E", {
    fontSize: 42,
    color: "#ffffff",
    background: "rgba(0, 0, 0, 0)",
});
const oLabel = createTextSprite("O", {
    fontSize: 42,
    color: "#ffffff",
    background: "rgba(0, 0, 0, 0)",
});

nLabel.position.set(0, 1, -1);
sLabel.position.set(0, 1, 1);
eLabel.position.set(1, 1, 0);
oLabel.position.set(-1, 1, 0);
player.add(nLabel);
player.add(sLabel);
player.add(eLabel);
player.add(oLabel);


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

        dateController.updateSun();

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