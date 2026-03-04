import * as THREE from "three";

const _euler = new THREE.Euler();
// Rotation to remap device coordinate system: screen Y-up to world Z-up
const _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const _q2 = new THREE.Quaternion();

/**
 * Convert device orientation (alpha, beta, gamma in radians) to a quaternion
 * for the Three.js camera, accounting for screen orientation.
 *
 * Based on W3C Device Orientation spec, using intrinsic Tait-Bryan Z-X'-Y'' angles.
 */
export function setQuaternionFromOrientation(
  quaternion: THREE.Quaternion,
  alpha: number,
  beta: number,
  gamma: number,
  screenOrientation: number
): void {
  // Device orientation -> Euler (YXZ order for device space)
  _euler.set(beta, alpha, -gamma, "YXZ");
  quaternion.setFromEuler(_euler);

  // Camera correction: device has Z pointing out of screen, Three.js expects Y-up
  quaternion.multiply(_q1);

  // Screen orientation correction (portrait/landscape rotation around Z)
  _q2.set(0, 0, -Math.sin(screenOrientation / 2), Math.cos(screenOrientation / 2));
  quaternion.multiply(_q2);
}
