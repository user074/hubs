import qsTruthy from '../../utils/qs_truthy'
import { MediaDevices, MediaDevicesEvents } from '../../utils/media-devices-utils'
import { emojis, spawnEmojiInFrontOfUser } from '../../components/emoji'

// import axios from "axios";
// import { v4 as uuidv4 } from "uuid";
// import { detectOS } from 'detect-browser';
export function inject_emotionLogger () {
  const mediaDevicesManager = APP.mediaDevicesManager
  const width = 640
  const height = 480
  // var model = undefined
  // var model_emotion = undefined
  var control = false
  const shareSuccess = (isDisplayMedia, isVideoTrackAdded, target) => {}
  const shareError = error => {
    console.error(error)
    isHandlingVideoShare = false
    document.querySelector('a-scene').emit('share_video_failed')
  }
  const url = {
    model: 'https://cunyvrresearch.s3.amazonaws.com/model.json'
  }
  var model = undefined
  var model_emotion = undefined
  blazeface.load().then(function (loadedModel) {
    model = loadedModel
    console.log(loadedModel)
  })

  async function loadModel (url) {
    try {
      // For layered model
      const loadedModel = await tf.loadGraphModel(url.model)
      model_emotion = loadedModel
      console.log('Load model success')
      return loadedModel
    } catch (err) {
      console.log(err)
    }
  }

  if (model_emotion === undefined) {
    loadModel(url).then(function (emoModel) {
      model_emotion = emoModel
      console.log('emotion model loaded')
    })
  }

  const EMOJI_RATE_LIMIT = 1000
  var tickCount = 0
  console.log('model_emotion and model loaded')

  AFRAME.registerSystem('emotion-logger', {
    init: function () {
      console.log('emotion-logger system initialized')
      // this.tickCount = 0
      this.lastFPS = 0
      this.lastFpsUpdate = performance.now()
      this.frameCount = 0
      this.tickPayloadSize = 1000
      this.cameraEnabled = false
    },

    tick () {
      //initialize the model only after entering the scene
      if (!document.querySelector('a-scene').is('entered')) {
        return
      }
      // FPS
      const now = performance.now()
      this.frameCount++
      if (now >= this.lastFpsUpdate + 1000) {
        this.lastFPS = parseFloat((this.frameCount / ((now - this.lastFpsUpdate) / 1000)).toFixed(2))
        this.lastFpsUpdate = now
        this.frameCount = 0
      }
      ++tickCount

      if (getUserMediaSupported()) {
        if (!mediaDevicesManager.isVideoShared) {
          // enableCam()

          if (!this.cameraEnabled) {
            enableCam()
            this.cameraEnabled = true
          }

          // predictWebcam(video)
        }
      }
    }
  })

  function getUserMediaSupported () {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  }

  function enableCam (event) {
    // getUsermedia parameters to force video but not audio.
    // control = true
    const constraints = {
      audio: false,
      video: { width: 640, height: 480 }
    }

    mediaDevicesManager
      .startVideoShare({
        isDisplayMedia: false,
        target: null,
        success: shareSuccess,
        error: shareError
      })
      .then(function (share) {
        if (mediaDevicesManager.isVideoShared) {
          var video = mediaDevicesManager.mediaStream.getVideoTracks()[0]
          predictWebcam(video)
        } else {
          console.log('video share is undefined')
        }
      })

    // console.log('get user media started')
    // console.log(navigator.mediaDevices.getUserMedia(constraints))

    // Activate the webcam stream.
    // navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    //   predictWebcam(stream.getVideoTracks()[0])
    //   // cameraaccess = true
    // })
  }

  function predictWebcam (stream) {
    console.log('predictWebcam started')
    var frameVar
    var captureDevice = new ImageCapture(stream)
    //tensorflowTest.js:102 Uncaught TypeError: Failed to construct 'ImageCapture': parameter 1 is not of type 'MediaStreamTrack'.
    //at predictWebcam (tensorflowTest.js:102:25)
    frameVar = setInterval(function () {
      captureDevice.grabFrame().then(imageBitmap => {
        //Uncaught (in promise) DOMException: The associated Track is in an invalid state
        processFrame(imageBitmap)
      })
    }, 3000)

    // Now let's start classifying a frame in the stream.
  }

  async function processFrame (imageBitmap) {
    model.estimateFaces(imageBitmap).then(async function (predictions) {
      if (predictions.length === 1) {
        var landmark = predictions[0]['landmarks']
        var nosex = landmark[2][0]
        var nosey = landmark[2][1]
        var right = landmark[4][0]
        var left = landmark[5][0]
        var length = (left - right) / 2 + 5
        //Cropping the image.
        var frame2 = await createImageBitmap(imageBitmap, nosex - length, nosey - length, 2 * length, 2 * length)
        tf.tidy(function () {
          //Image is converted to tensor, resized, toBlackandWhite, then additional dimesion are added to match with [1, 48, 48, 1].
          var image_tensor = tf.browser
            .fromPixels(frame2)
            .resizeBilinear([96, 96])
            .mean(2)
            .toFloat()
            .expandDims(0)
            .expandDims(-1)
          //format the image tensor to three channels
          image_tensor = tf.concat([image_tensor, image_tensor, image_tensor], -1)
          //Predicting from image.
          var result = model_emotion.predict(image_tensor)
          var predictedValue = result.arraySync()
          spawnEmoji(predictedValue)
        })
        // console.log('angry', 100 * predictedValue['0'][0] + '%')
        // console.log('disgust', 100 * predictedValue['0'][1] + '%')
        // console.log('fear', 100 * predictedValue['0'][2] + '%')
        // console.log('happy', 100 * predictedValue['0a'][3] + '%')
        // console.log('sad', 100 * predictedValue['0'][4] + '%')
        // console.log('surprise', 100 * predictedValue['0'][5] + '%')
        // console.log('neutral', 100 * predictedValue['0'][6] + '%')
      }
      // Call this function again to keep predicting when the browser is ready.
      // if (control) window.requestAnimationFrame(predictWebcam)
    })
  }

  function spawnEmoji (predictions) {
    var emotions = predictions['0']
    console.log(emotions[0])
    var max = Math.max(...emotions)
    var index = emotions.indexOf(max)

    if (window.APP.hubChannel.can('spawn_emoji')) {
      console.log('spawn_emoji')
      tickCount = 0
      if (emotions[1] < 0.95) {
        if (index === 0) {
          console.log('happy')
          spawnEmojiInFrontOfUser(emojis[0])
        } else if (index === 2) {
          console.log('sad')
          spawnEmojiInFrontOfUser(emojis[6])
        } else if (index === 3) {
          console.log('surprise')
          spawnEmojiInFrontOfUser(emojis[7])
        }
      }
      // if (emotions[0] > 0.1) {
      //   console.log('happy')
      //   spawnEmojiInFrontOfUser(emojis[0])
      // } else if (emotions[5] > 0.8) {
      //   console.log('surprise')
      //   spawnEmojiInFrontOfUser(emojis[4])
      // } else if (emotions[4] > 0.8) {
      //   console.log('sad')
      //   spawnEmojiInFrontOfUser(emojis[6])
      // }
    }
  }
}
