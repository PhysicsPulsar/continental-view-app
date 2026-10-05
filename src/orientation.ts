import * as THREE from "three";

export class DeviceTracker {
    private camera: THREE.Camera;

    private enabled = false;

    constructor(camera: THREE.Camera) {
        this.camera = camera;
    }

    /**
     * Start listening to the device orientation.
     *
     * Call this from a button click/tap because iOS requires
     * permission to be requested from a user interaction.
     */
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
        "deviceorientationabsolute",
        this.handleOrientation,
        true
        );

        // Some browsers only provide deviceorientation.
        window.addEventListener(
        "deviceorientation",
        this.handleOrientation,
        true
        );
    }

    /**
     * Stop controlling the camera.
     */
    stop(): void {
        this.enabled = false;

        window.removeEventListener(
        "deviceorientationabsolute",
        this.handleOrientation,
        true
        );

        window.removeEventListener(
        "deviceorientation",
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

        const euler = new THREE.Euler();


        const alphaRad = THREE.MathUtils.degToRad(alpha);
        const betaRad = THREE.MathUtils.degToRad(beta);
        const gammaRad = THREE.MathUtils.degToRad(gamma);

        euler.set(betaRad - Math.PI/2, alphaRad, +gammaRad, "YXZ");

        const deviceQuaternion = new THREE.Quaternion();
        deviceQuaternion.setFromEuler(euler);

        this.camera.quaternion.copy(deviceQuaternion);
    }
}