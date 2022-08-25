const mediaDevicesManager = APP.mediaDevicesManager;
// const streamVideo = mediaDevicesManager.mediaStream.getVideoTracks()[0];
const videoStream = mediaDevicesManager.mediaStream;

function gotMedia(mediaStream) {
//Extract video track.  
var videoDevice = mediaStream.getVideoTracks()[0];
// Check if this device supports a picture mode...
var captureDevice = new ImageCapture(videoDevice);
var frameVar;
if (captureDevice) {
    console.log("Starting grab a frame");
    frameVar = setInterval(function () {captureDevice.grabFrame().then((imageBitmap) => {
        processFrame(imageBitmap);})}, 1000);
    }
}

gotMedia(videoStream);

function processFrame(e) {
    console.log(e);
    imgData = e;
    // canvas.width = imgData.width;
    // canvas.height = imgData.height;
    // console.log(imgData.data);
    console.log(imgData);
    console.log(imgData.width);
    console.log(imgData.height);
    canvas.height = imgData.height;
    // canvas.getContext('2d').drawImage(imgData, 0, 0,imgData.width,imgData.height);
}
gotMedia(videoStream);
// const MOBILE_NET_INPUT_WIDTH = 224;
// const MOBILE_NET_INPUT_HEIGHT = 224;
// const STOP_DATA_GATHER = -1;
// const CLASS_NAMES = [];

// let mobilenet = undefined;
// let gatherDataState = STOP_DATA_GATHER;
// let videoPlaying = false;
// let trainingDataInputs = [];
// let trainingDataOutputs = [];
// let examplesCount = [];
// let predict = false;

// export async function loadMobileNetFeatureModel() {
//     const URL = 
//     'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1';

//     mobilenet = await tf.loadGraphModel(URL, {fromTFHub: true});
//     console.log('MobileNet v3 loaded successfully!');
//     // Warm up the model by passing zeros through it once.
//     tf.tidy(function () {
//         let answer = mobilenet.predict(tf.zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3]));
//         console.log(answer.shape);
//     });

//     return mobilenet;
// }

// //code for the webcam attached to the avatar
// var yCamOffset = 1.6
// var attachCamInterval
// var camHash = "vide"

// var camEl = getFirstElementFromHash(camHash)

// if (camEl){
//   attachCamInterval = setInterval(attachCam, 100)
// } else {
//   console.warn("You need to active your webcam first")
// }

// camEl.object3D.scale.setScalar(0.4)
// var selfEl = AFRAME.scenes[0].querySelector("#avatar-rig")

// var povCam = selfEl.querySelector("#avatar-pov-node")

// function attachCam(){ attachObjToAvatar(camEl, selfEl) }

// function attachObjToAvatar(obj, avatar){
//   NAF.utils.getNetworkedEntity(obj).then(networkedEl => {
//     const mine = NAF.utils.isMine(networkedEl)
//     if (!mine) var owned = NAF.utils.takeOwnership(networkedEl)
//     networkedEl.object3D.position.copy( avatar.object3D.position )
//     networkedEl.object3D.rotation.y = povCam.object3D.rotation.y + yCamOffset
//     networkedEl.object3D.rotation.x = 0
//     networkedEl.object3D.rotation.z = 0
//     networkedEl.object3D.position.z += 0.05
//     networkedEl.object3D.position.y += 1.6
//   })
// }

// function getFirstElementFromHash(hash){
//     var g = AFRAME.scenes[0].querySelectorAll("[media-loader]")
//     var matches = []
//     for (let e of g){
//         var m = e.components["media-loader"].attrValue.src.match(hash)
//         if (m && m.length) matches.push(e)
//     }
//     return matches[0]
// }
