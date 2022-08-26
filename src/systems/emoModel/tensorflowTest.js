import { MediaDevices, MediaDevicesEvents } from '../../utils/media-devices-utils'

export function tfTest () {
  console.log('tfTest started')
  var mediaDevicesManager = APP.mediaDevicesManager
  var videoStream = mediaDevicesManager.mediaStream
  var video = videoStream.getVideoTracks()[0]
  const width = 640
  const height = 480
  var model = undefined
  var model_emotion = undefined
  var control = false

  //   const enableWebcamButton = document.getElementsByClassName(
  //     'ToolbarButton__toolbar-button__3-iHs ToolbarButton__accent5__m3aEv'
  //   )

  function resetEverything () {
    control = false
    console.log('Stopping Everything.')
    const stream = video.srcObject
    const tracks = stream.getTracks()

    tracks.forEach(function (track) {
      track.stop()
    })

    video.srcObject = null
  }

  function enableCam (event) {
    // getUsermedia parameters to force video but not audio.
    control = true
    const constraints = {
      audio: false,
      video: { width: 640, height: 480 }
    }
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      predictWebcam(stream.getVideoTracks()[0])
      // cameraaccess = true
    })
  }

  //The main functioning starts from here. Check if webcam is supported/acceesible or not.
  // Then loads the models and then wait for webcam permission.
  // Check if webcam access is supported.

  function getUserMediaSupported () {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  }

  //load the model from the server.
  const url = {
    model: 'https://cunyvrresearch.s3.amazonaws.com/model.json'
  }

  async function loadModel (url) {
    try {
      // For layered model
      const loadedModel = await tf.loadLayersModel(url.model)
      model_emotion = loadedModel
      // For graph model
      // const model = await tf.loadGraphModel(url.model);
      // setModel(loadedModel)
      console.log('Load model success')
    } catch (err) {
      console.log(err)
    }
  }

  if (getUserMediaSupported()) {
    if (model && model_emotion) {
      console.warn('Please provide Webcam Access.')
    } else {
      blazeface.load().then(function (loadedModel) {
        model = loadedModel
        if (model_emotion) {
          console.warn('Please provide Webcam Access.')
        }
      })
      console.log('loading models')

      // tf.loadLayersModel('model.json', false).then(function (loadedModel) {
      //   model_emotion = loadedModel
      //   if (model) {
      //     console.warn('Please provide Webcam Access.')
      //   }
      // })

      loadModel(url)
    }
    // enableWebcamButton.addEventListener('click', enableCam)
    enableCam()
  } else {
    console.warn('getUserMedia() is not supported by your browser')
  }

  function predictWebcam (stream) {
    console.log('predictWebcam started')
    var frameVar
    var captureDevice = new ImageCapture(stream)
    //tensorflowTest.js:102 Uncaught TypeError: Failed to construct 'ImageCapture': parameter 1 is not of type 'MediaStreamTrack'.
    //at predictWebcam (tensorflowTest.js:102:25)
    frameVar = setInterval(function () {
      captureDevice.grabFrame().then(imageBitmap => {
        processFrame(imageBitmap)
      })
    }, 1000)

    // Now let's start classifying a frame in the stream.
  }

  function processFrame (imageBitmap) {
    model.estimateFaces(imageBitmap).then(async function (predictions) {
      if (predictions.length === 1) {
        var landmark = predictions[0]['landmarks']
        var nosex = landmark[2][0]
        var nosey = landmark[2][1]
        var right = landmark[4][0]
        var left = landmark[5][0]
        var length = (left - right) / 2 + 5
        //Cropping the image.
        const frame2 = await createImageBitmap(imageBitmap, nosex - length, nosey - length, 2 * length, 2 * length)
        //Image is converted to tensor, resized, toBlackandWhite, then additional dimesion are added to match with [1, 48, 48, 1].
        var image_tensor = tf.browser
          .fromPixels(frame2)
          .resizeBilinear([48, 48])
          .mean(2)
          .toFloat()
          .expandDims(0)
          .expandDims(-1)
        //Predicting from image.
        const result = model_emotion.predict(image_tensor)
        const predictedValue = result.arraySync()
        console.log('angry', 100 * predictedValue['0'][0] + '%')
        console.log('disgust', 100 * predictedValue['0'][1] + '%')
        console.log('fear', 100 * predictedValue['0'][2] + '%')
        console.log('happy', 100 * predictedValue['0'][3] + '%')
        console.log('sad', 100 * predictedValue['0'][4] + '%')
        console.log('surprise', 100 * predictedValue['0'][5] + '%')
        console.log('neutral', 100 * predictedValue['0'][6] + '%')
      }
      // Call this function again to keep predicting when the browser is ready.
      if (control) window.requestAnimationFrame(predictWebcam)
    })
  }
}
