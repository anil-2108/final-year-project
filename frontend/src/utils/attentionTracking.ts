import * as faceapi from "face-api.js";

export interface AttentionMetrics {
  isAttentive: boolean;
  attentionScore: number;
  headPose: {
    yaw: number;  // Left/Right rotation
    pitch: number; // Up/Down rotation
    roll: number;  // Tilt
  };
  eyeStatus: {
    leftEAR: number;
    rightEAR: number;
    isBlinking: boolean;
  };
  faceInFrame: boolean;
}

/**
 * Calculate Eye Aspect Ratio (EAR) to detect blinking
 * EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
 */
function calculateEAR(eye: faceapi.Point[]): number {
  if (!eye || eye.length < 6) return 0.28;
  
  // Vertical distances
  const v1 = Math.sqrt(
    Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2)
  );
  const v2 = Math.sqrt(
    Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2)
  );
  
  // Horizontal distance
  const h = Math.sqrt(
    Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2)
  );
  
  if (h === 0) return 0.28;
  
  // Calculate EAR
  const ear = (v1 + v2) / (2 * h);
  return ear;
}

/**
 * Simplified and more accurate head pose calculation
 */
function calculateHeadPose(landmarks: faceapi.FaceLandmarks68): { yaw: number; pitch: number; roll: number } {
  const nose = landmarks.getNose();
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const jaw = landmarks.getJawOutline();
  
  if (!nose || nose.length < 5 || !leftEye || !rightEye || !jaw) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }
  
  // Eye centers
  const leftEyeCenter = {
    x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
    y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
  };
  const rightEyeCenter = {
    x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
    y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
  };
  
  // Calculate roll (tilt)
  const roll = Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x) * (180 / Math.PI);
  
  // Face dimensions
  const faceWidth = jaw[jaw.length - 1].x - jaw[0].x;
  const faceCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
  
  // Nose tip
  const noseTip = nose[3];
  
  // Calculate yaw (left/right) - nose position relative to eye center
  const noseOffsetX = (noseTip.x - faceCenterX) / (faceWidth / 2);
  const yaw = noseOffsetX * 50; // Scale factor
  
  // Calculate pitch (up/down) - nose position relative to eye level
  const eyeLevelY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
  const noseToEyeY = noseTip.y - eyeLevelY;
  const faceHeight = jaw[jaw.length - 1].y - noseTip.y;
  const pitch = (noseToEyeY / faceHeight) * 40;
  
  return { 
    yaw: Math.max(-90, Math.min(90, yaw)), 
    pitch: Math.max(-90, Math.min(90, pitch)), 
    roll: Math.max(-30, Math.min(30, roll)) 
  };
}

/**
 * Main attention calculation function
 * Simplified and more accurate for looking straight at camera
 */
export function calculateAttention(
  landmarks: faceapi.FaceLandmarks68
): AttentionMetrics {
  // Calculate head pose
  const headPose = calculateHeadPose(landmarks);
  
  // Calculate Eye Aspect Ratio
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const leftEAR = calculateEAR(leftEye);
  const rightEAR = calculateEAR(rightEye);
  const avgEAR = (leftEAR + rightEAR) / 2;
  
  // Blink detection
  const isBlinking = avgEAR < 0.2;
  const isDrowsy = avgEAR < 0.25;
  
  // === ATTENTION SCORE CALCULATION ===
  // Start with base score of 100 (looking straight)
  let attentionScore = 100;
  
  // YAW (left/right) penalty - more lenient
  // Only penalize if looking significantly away (>15 degrees)
  const absYaw = Math.abs(headPose.yaw);
  if (absYaw > 15) {
    attentionScore -= (absYaw - 15) * 1.5;
  }
  
  // PITCH (up/down) penalty - more lenient
  const absPitch = Math.abs(headPose.pitch);
  if (absPitch > 15) {
    attentionScore -= (absPitch - 15) * 1.5;
  }
  
  // ROLL (tilt) penalty
  const absRoll = Math.abs(headPose.roll);
  if (absRoll > 10) {
    attentionScore -= (absRoll - 10) * 1;
  }
  
  // Eye status penalty
  if (isBlinking) {
    attentionScore -= 30;
  } else if (isDrowsy) {
    attentionScore -= 15;
  }
  
  // Ensure score is between 0-100
  attentionScore = Math.max(0, Math.min(100, Math.round(attentionScore)));
  
  // Consider attentive if score >= 60 (lowered threshold)
  const isAttentive = attentionScore >= 75;
  
  // Face in frame check
  const faceInFrame = absYaw < 75 && absPitch < 75;
  
  return {
    isAttentive,
    attentionScore,
    headPose,
    eyeStatus: {
      leftEAR: Math.round(leftEAR * 100) / 100,
      rightEAR: Math.round(rightEAR * 100) / 100,
      isBlinking
    },
    faceInFrame
  };
}
