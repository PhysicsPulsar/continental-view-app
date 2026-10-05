import * as THREE from "three";

export class DeviceTracker {
    private camera: THREE.Camera;

    private enabled = false;

    // The compass heading when the controller starts.
    // This makes the current direction become "north" in our 3D world.
    private initialHeading: number | null = null;

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

        /*
        * alpha is the device's rotation around the Z axis.
        *
        * On browsers that provide webkitCompassHeading,
        * it is a much better value for determining actual north.
        */
        const compassHeading = this.getCompassHeading(event);

        if (compassHeading !== null) {
            if (this.initialHeading === null) {
                this.initialHeading = compassHeading;
            }
        }

        /*
        * Convert the device orientation into a Three.js camera
        * quaternion.
        */
        const euler = new THREE.Euler();

        // Phone screen rotation.
        const screenAngle =
        (screen.orientation?.angle ?? 0) * THREE.MathUtils.DEG2RAD;

        /*
        * Three.js uses:
        *
        *   X = left/right
        *   Y = up/down
        *   Z = forward/back
        *
        * DeviceOrientation uses a different coordinate system,
        * so we convert it using the same general approach as
        * Three.js's DeviceOrientationControls.
        */

        const alphaRad = THREE.MathUtils.degToRad(alpha);
        const betaRad = THREE.MathUtils.degToRad(beta);
        const gammaRad = THREE.MathUtils.degToRad(gamma);

        euler.set(betaRad - Math.PI/2, alphaRad, -gammaRad, "YXZ");

        const deviceQuaternion = new THREE.Quaternion();
        deviceQuaternion.setFromEuler(euler);

        /*
        * Correct for the phone's screen orientation.
        */
        const screenQuaternion = new THREE.Quaternion();
        screenQuaternion.setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            -screenAngle
        );

        deviceQuaternion.multiply(screenQuaternion);

        /*
        * Correct the compass direction.
        *
        * Without this, the camera follows the phone's rotation,
        * but "north" has no fixed relationship with the 3D world.
        */
        if (this.initialHeading !== null) {
        const heading = this.getCompassHeading(event);

        if (heading !== null) {
            const relativeHeading = this.normalizeAngle(
            heading - this.initialHeading
            );

            const northCorrection = new THREE.Quaternion();

            northCorrection.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            THREE.MathUtils.degToRad(relativeHeading)
            );

            deviceQuaternion.premultiply(northCorrection);
        }
        }

        this.camera.quaternion.copy(deviceQuaternion);
    };

    /**
     * Get the real compass heading when the browser provides it.
     */
    private getCompassHeading(
        event: DeviceOrientationEvent
    ): number | null {
        const compassEvent = event as DeviceOrientationEvent & {
        webkitCompassHeading?: number;
        };

        if (
        typeof compassEvent.webkitCompassHeading === "number"
        ) {
        return compassEvent.webkitCompassHeading;
        }

        /*
        * Android browsers often don't provide
        * webkitCompassHeading.
        *
        * In that case alpha is our best approximation.
        */
        if (event.alpha !== null) {
        return event.alpha;
        }

        return null;
    }

    /**
     * Keep an angle between -180 and +180 degrees.
     */
    private normalizeAngle(angle: number): number {
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;

        return angle;
    }
}