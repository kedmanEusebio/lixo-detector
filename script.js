const URL = "./my_model/"; // pasta onde salvaste teu modelo
let model, webcamStream, maxPredictions;
let intervalId;
let detecting = false;
let video = document.getElementById("webcam");
let cameraSelect = document.getElementById("cameraSelect");

// ===== Inicializar Modelo =====
async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  await loadCameraOptions();
}

// ===== Carregar lista de câmeras =====
async function loadCameraOptions() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(device => device.kind === "videoinput");

  cameraSelect.innerHTML = "";
  videoDevices.forEach((device, index) => {
    let option = document.createElement("option");
    option.value = device.deviceId;
    option.text = device.label || `Camera ${index + 1}`;
    cameraSelect.appendChild(option);
  });

  // iniciar com a primeira câmera
  startCamera(videoDevices[0].deviceId);
}

// ===== Iniciar câmera =====
async function startCamera(deviceId) {
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
  }

  webcamStream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: deviceId } },
    audio: false
  });

  video.srcObject = webcamStream;
}

// ===== Predição =====
async function predict() {
  if (!detecting) return;

  const prediction = await model.predict(video);
  let highest = prediction.reduce((prev, current) =>
    (prev.probability > current.probability) ? prev : current
  );

  let label = highest.className;
  let confidence = (highest.probability * 100).toFixed(1);

  document.getElementById("label-container").innerHTML =
    `<b>${label}</b> (${confidence}%)`;

  if (label !== "nada") {
    sendToESP(label);
  }
}

// ===== Enviar via Bluetooth =====
async function sendToESP(message) {
  console.log("Enviar para ESP:", message);
  // aqui fica a lógica do Bluetooth Web API
}

// ===== Botões =====
document.getElementById("startBtn").addEventListener("click", () => {
  detecting = true;
  intervalId = setInterval(predict, 4000); // a cada 4 segundos
  document.getElementById("startBtn").disabled = true;
  document.getElementById("stopBtn").disabled = false;
});

document.getElementById("stopBtn").addEventListener("click", () => {
  detecting = false;
  clearInterval(intervalId);
  document.getElementById("startBtn").disabled = false;
  document.getElementById("stopBtn").disabled = true;
  document.getElementById("label-container").innerHTML = "Detecção parada";
});

// ===== Trocar câmera quando selecionada =====
cameraSelect.addEventListener("change", (event) => {
  startCamera(event.target.value);
});

// Inicializar
init();
