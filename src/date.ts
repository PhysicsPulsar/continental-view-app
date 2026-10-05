import * as THREE from "three";
import { degToRad, radToDeg } from 'three/src/math/MathUtils.js';

export class DateController {
    private selectedDate: Date;
    private sunLight: THREE.DirectionalLight;
    private sun: THREE.Mesh;
    private camera: THREE.Camera;
    sunAngle: number = 0;

    

    constructor(selectedDate: Date, sunLight: THREE.DirectionalLight, sun: THREE.Mesh, camera: THREE.Camera) {
        this.selectedDate = selectedDate; 
        this.sunLight = sunLight;
        this.sun = sun;
        this.camera = camera;
        this.updateLabel();
        this.subsolarLongitude();
        this.updateSun();
    }

    changeHour(delta: number): void {
        this.selectedDate.setUTCHours(this.selectedDate.getUTCHours() + delta);
        this.updateLabel();
        this.subsolarLongitude();
        this.updateSun();
    }

    setHour(newHour: number, newMinute: number): void {
        this.selectedDate.setHours(newHour);
        this.selectedDate.setMinutes(newMinute);
        this.updateLabel();
        this.subsolarLongitude();
        this.updateSun();
    }

    private updateLabel(): void {
        console.log(this.selectedDate.toISOString());
        const dateElement = document.getElementById("date");
        if (dateElement) {
            dateElement.textContent = `${this.selectedDate.getHours()}h ${this.selectedDate.getMinutes()}'`;
        }
    }

    private subsolarLongitude(): void {
        this.sunAngle = degToRad(-15 * (this.selectedDate.getUTCHours() + this.selectedDate.getUTCMinutes()/60 - 6));
        console.log(radToDeg(this.sunAngle));
    }

    updateSun(): void {
        const dir = new THREE.Vector3(Math.sin(this.sunAngle), 0 , Math.cos(this.sunAngle));
        const cameraPosition = new THREE.Vector3();
        this.camera.getWorldPosition(cameraPosition);

        this.sunLight.position.copy(dir);
        this.sun.position.copy(cameraPosition).add(dir.multiplyScalar(-3));
        console.log(this.sun.position);
    }
}