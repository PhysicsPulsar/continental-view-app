import * as THREE from "three";

export class DeviceCameraController {
    private camera: THREE.Camera;

    private alpha = 0;
    private beta = 0;
    private gamma = 0;

    private enabled = false;

    private readonly euler = new THREE.Euler();
    private readonly quaternion = new THREE.Quaternion();

    // Device → camera coordinate correction
    private readonly deviceQuaternion = new THREE.Quaternion(
        -Math.sqrt(0.5),
        0,
        0,
        Math.sqrt(0.5)
    );

    private readonly zee = new THREE.Vector3(0, 0, 1);
    private readonly screenQuaternion = new THREE.Quaternion();

    constructor(camera: THREE.Camera) {
        this.camera = camera;
    }

    async enable(): Promise<void> {
        const OrientationEvent =
        DeviceOrientationEvent as typeof DeviceOrientationEvent & {
            requestPermission?: () => Promise<PermissionState>;
        };

        // iOS
        if (typeof OrientationEvent.requestPermission === "function") {
        const permission =
            await OrientationEvent.requestPermission();

        if (permission !== "granted") {
            throw new Error(
            "Device orientation permission was denied"
            );
        }
        }

        window.addEventListener(
        "deviceorientation",
        this.onOrientation,
        true
        );

        window.addEventListener(
        "resize",
        this.update,
        true
        );

        this.enabled = true;
    }

    disable(): void {
        window.removeEventListener(
        "deviceorientation",
        this.onOrientation,
        true
        );

        window.removeEventListener(
        "resize",
        this.update,
        true
        );

        this.enabled = false;
    }

    private onOrientation = (
        event: DeviceOrientationEvent
    ): void => {
        this.alpha = THREE.MathUtils.degToRad(
        event.alpha ?? 0
        );

        this.beta = THREE.MathUtils.degToRad(
        event.beta ?? 0
        );

        this.gamma = THREE.MathUtils.degToRad(
        event.gamma ?? 0
        );

        this.update();
    };

    private update = (): void => {
        if (!this.enabled) return;

        /*
        * Device orientation:
        *
        * alpha = rotation around Z
        * beta  = rotation around X
        * gamma = rotation around Y
        */

        this.euler.set(
        this.beta,
        this.alpha,
        -this.gamma,
        "YXZ"
        );

        this.quaternion.setFromEuler(this.euler);

        // Convert device coordinates → Three.js camera coordinates
        this.quaternion.multiply(
        this.deviceQuaternion
        );

        // Account for portrait / landscape orientation
        const orientation =
        (screen.orientation?.angle ?? 0) *
        THREE.MathUtils.DEG2RAD;

        this.screenQuaternion.setFromAxisAngle(
        this.zee,
        -orientation
        );

        this.quaternion.multiply(
        this.screenQuaternion
        );

        this.camera.quaternion.copy(
        this.quaternion
        );
    };
}