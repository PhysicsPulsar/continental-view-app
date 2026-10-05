import * as THREE from "three";

export class DeviceTracker {
    private camera: THREE.Camera;

    private enabled = false;

    constructor(camera: THREE.Camera) {
        this.camera = camera;
    }

    async start(): Promise<void> {
        // iOS requires explicit permission.
        const DeviceOrientationEventClass =
        DeviceOrientationEvent as typeof DeviceOrientationEvent & {
            requestPermission?: () => Promise<"granted" | "denied">;
        };

        if (DeviceOrientationEventClass.requestPermission) {
        const permission = await DeviceOrientationEventClass.requestPermission();

        if (permission !== "granted") {
            throw new Error("Device orientation permission was denied.");
        }
        }

        this.enabled = true;

        window.addEventListener(
        "deviceorientationabsolute", // maybe doesnt work in some devices?
        this.handleOrientation,
        true
        );
    }

    stop(): void {
        this.enabled = false;

        window.removeEventListener(
        "deviceorientationabsolute",
        this.handleOrientation,
        true
        );
    }

    private handleOrientation = (event: DeviceOrientationEvent): void => {
        if (!this.enabled) return;

        const alpha = event.alpha;
        const beta = event.beta;
        const gamma = event.gamma;

        if (alpha === null || beta === null || gamma === null) {
        return;
        }

        const alphaRad = THREE.MathUtils.degToRad(alpha);
        const betaRad = THREE.MathUtils.degToRad(beta);
        const gammaRad = THREE.MathUtils.degToRad(gamma);

        //euler.set(betaRad - Math.PI/2, alphaRad, -gammaRad, "YXZ");

        const euler = new THREE.Euler();
        euler.set( betaRad, alphaRad, -gammaRad, "YXZ" );
        const deviceQuaternion = new THREE.Quaternion();
        deviceQuaternion.setFromEuler(euler);

        const screenQuaternion = new THREE.Quaternion();

        screenQuaternion.setFromAxisAngle( new THREE.Vector3(1, 0, 0), -Math.PI/2 ); 
        deviceQuaternion.multiply(screenQuaternion);

        this.camera.quaternion.copy(deviceQuaternion);
    }
}