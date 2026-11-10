const signCameraDialog = document.getElementById('sign-camera-dialog');
const signCameraVideo = document.getElementById('sign-camera-video');
const signCameraStatus = document.getElementById('sign-camera-status');
const signCameraToggle = document.getElementById('sign-camera-toggle');
const signCameraLetter = document.getElementById('sign-camera-letter');
const signCameraExample = document.getElementById('sign-camera-example');
const signExamplesUrl = new URL('bisindo-poses.js', document.currentScript.src);
let signExamplesRequest;
let signCameraSession = null;

function loadSignExamples() {
  if (!signExamplesRequest) {
    // A classic script also loads when index.html is opened from file://.
    signExamplesRequest = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = signExamplesUrl.href;
      script.onload = () => {
        script.remove();
        if (typeof bisindoReferencePoses === 'undefined') {
          reject(new Error('Data pose tidak valid'));
          return;
        }
        resolve(new Map(Object.entries(bisindoReferencePoses)));
      };
      script.onerror = () => {
        script.remove();
        reject(new Error('Data pose tidak tersedia'));
      };
      document.head.append(script);
    }).catch(error => {
      signExamplesRequest = null;
      throw error;
    });
  }
  return signExamplesRequest;
}

for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
  signCameraLetter.add(new Option(letter, letter));
}

function showSignCameraExample() {
  const letter = signCameraLetter.value;
  signCameraExample.src = 'images/bisindo/' + letter + '.jpg';
  signCameraExample.alt = 'Contoh pose BISINDO untuk huruf ' + letter;
}

function openSignCamera() {
  showSignCameraExample();
  signCameraDialog.showModal();
}

function stopSignCamera(message = 'Kamera belum aktif.') {
  const session = signCameraSession;
  signCameraSession = null;
  if (session) {
    cancelAnimationFrame(session.frame);
    session.stream?.getTracks().forEach(track => track.stop());
    session.detector?.close();
  }
  signCameraVideo.srcObject = null;
  signCameraVideo.hidden = true;
  signCameraToggle.textContent = 'Nyalakan kamera';
  signCameraStatus.textContent = message;
}

function closeSignCamera() {
  if (signCameraSession) stopSignCamera();
  if (signCameraDialog.open) signCameraDialog.close();
}

async function startSignCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    signCameraStatus.textContent = 'Kamera memerlukan browser yang mendukung akses kamera melalui HTTPS atau localhost.';
    return;
  }

  const session = { lastFrame: -Infinity, lastVideoTime: -1 };
  signCameraSession = session;
  signCameraToggle.textContent = 'Batalkan';
  signCameraStatus.textContent = 'Menunggu izin kamera…';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    if (signCameraSession !== session) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    session.stream = stream;
    for (const track of stream.getVideoTracks()) {
      track.addEventListener('ended', () => {
        if (signCameraSession === session) stopSignCamera('Akses kamera terhenti. Nyalakan lagi untuk melanjutkan.');
      });
    }
    signCameraVideo.srcObject = stream;
    signCameraVideo.hidden = false;
    signCameraStatus.textContent = 'Memuat pendeteksi tangan…';

    session.loadingExamples = true;
    session.examples = await loadSignExamples();
    session.loadingExamples = false;
    if (signCameraSession !== session) return;
    const base = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21';
    const { FilesetResolver, HandLandmarker } = await import(base + '/vision_bundle.mjs');
    const vision = await FilesetResolver.forVisionTasks(base + '/wasm');
    if (signCameraSession !== session) return;

    const detector = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.4,
      minHandPresenceConfidence: 0.4,
    });
    if (signCameraSession !== session) {
      detector.close();
      return;
    }
    session.detector = detector;
    signCameraToggle.textContent = 'Matikan kamera';
    signCameraStatus.textContent = 'Posisikan tangan di dalam bingkai.';
    session.frame = requestAnimationFrame(time => scanSignCamera(session, time));
  } catch (error) {
    if (signCameraSession !== session) return;
    const message = error.name === 'NotAllowedError' ? 'Izin kamera ditolak. Izinkan kamera di pengaturan situs lalu coba lagi.'
      : error.name === 'NotFoundError' ? 'Kamera tidak ditemukan.'
      : session.loadingExamples ? 'Data huruf BISINDO gagal dimuat. Pastikan file js/bisindo-poses.js tersedia.'
      : session.stream ? 'Pendeteksi tangan gagal dimuat. Periksa koneksi internet lalu coba lagi.'
      : 'Kamera tidak bisa dibuka. Periksa apakah kamera sedang dipakai aplikasi lain.';
    stopSignCamera(message);
  }
}

function signPose(landmarks, aspectRatio) {
  if (!landmarks.length) return null;
  const hands = [...landmarks].sort((left, right) => left[0].x - right[0].x);
  const origin = hands[0][0];
  // Normalize by palm size and retain the distance between both hands.
  const scale = hands.reduce((sum, hand) => sum + Math.hypot(
    (hand[9].x - hand[0].x) * aspectRatio, hand[9].y - hand[0].y
  ), 0) / hands.length;
  if (scale < 0.01) return null;
  return hands.flatMap(hand => hand.flatMap(point => [
    (point.x - origin.x) * aspectRatio / scale,
    (point.y - origin.y) / scale,
    (point.z - hand[0].z) * aspectRatio / scale,
  ]));
}

function recognizeSignPose(pose, examples) {
  const matches = [];
  for (const [letter, samples] of examples) {
    const distances = samples.filter(sample => sample.length === pose.length).map(sample =>
      Math.sqrt(sample.reduce((sum, value, i) => sum + (value - pose[i]) ** 2, 0) / pose.length)
    );
    if (distances.length) matches.push({ letter, distance: Math.min(...distances) });
  }
  matches.sort((a, b) => a.distance - b.distance);
  const [best, next] = matches;
  return best && best.distance < 0.24 && (!next || best.distance < next.distance * 0.85) ? best.letter : null;
}

function scanSignCamera(session, time) {
  if (signCameraSession !== session || !signCameraDialog.open) return;
  const videoTime = signCameraVideo.currentTime;
  if (signCameraVideo.readyState >= 2 && time - session.lastFrame >= 90 && videoTime !== session.lastVideoTime) {
    session.lastFrame = time;
    session.lastVideoTime = videoTime;
    try {
      const result = session.detector.detectForVideo(signCameraVideo, time);
      session.pose = signPose(result.landmarks, signCameraVideo.videoWidth / signCameraVideo.videoHeight);
    } catch {
      stopSignCamera('Pendeteksian tangan terhenti. Nyalakan kamera lagi untuk mencoba.');
      return;
    }
    const candidate = session.pose && recognizeSignPose(session.pose, session.examples);
    session.stableFrames = candidate && candidate === session.candidate ? session.stableFrames + 1 : 1;
    session.candidate = candidate;
    const letter = candidate && session.stableFrames >= 3 ? candidate : null;
    const message = !session.pose ? 'Posisikan tangan di dalam bingkai.'
      : letter ? 'Perkiraan huruf · ' + letter
      : 'Belum yakin. Tahan pose dan pastikan semua jari terlihat.';
    if (signCameraStatus.textContent !== message) signCameraStatus.textContent = message;
  }
  session.frame = requestAnimationFrame(next => scanSignCamera(session, next));
}

signCameraToggle.addEventListener('click', () => {
  if (signCameraSession) stopSignCamera();
  else startSignCamera();
});
signCameraLetter.addEventListener('change', showSignCameraExample);
signCameraDialog.addEventListener('close', () => {
  if (!signCameraDialog.open && signCameraSession) stopSignCamera();
});
window.addEventListener('pagehide', closeSignCamera);
