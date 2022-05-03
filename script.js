const imageUpload = document.getElementById('imageUpload')

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {
  const container = document.createElement('div')
  container.style.position = 'relative'
  document.body.append(container)
  const labeledFaceDescriptors = await loadLabeledImages()
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  let image
  let canvas
  document.body.append('Loaded')
  imageUpload.addEventListener('change', async () => {
    if (image) image.remove()
    if (canvas) canvas.remove()
    image = await faceapi.bufferToImage(imageUpload.files[0])
    container.append(image)
    canvas = faceapi.createCanvasFromMedia(image)
    container.append(canvas)
    const displaySize = { width: image.width, height: image.height }
    faceapi.matchDimensions(canvas, displaySize)
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)
    })
  })
}

function loadLabeledImages() {
  const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark', 'Naitik']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/naitik2314/Face-Recognition-JavaScript/master/labeled_images/${label}/${i}.jpg`)
        //Drive folder on this
        //const img = await faceapi.fetchImage(`https://drive.google.com/drive/folders/1j4-VTfaUbz-2unrV8acQJH_7YgiLEPVD?usp=sharing/${label}/${1}.jpg`)
        //const img = await faceapi.fetchImage(`https://1drv.ms/u/s!AgBaY8leRXCCwnu8ahH1bfrOgSnv?e=OQfkKV`)
        //This works const img = await faceapi.fetchImage(`labeled_images/${label}/${i}.jpg`)
        //Doesn't Work const img = await faceapi.fetchImage(`https://mega.nz/file/1uZFWYhY#K90FhipnTDPP7srJYLb7okkv0UgI7gg1Wl2lWKByeFY`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
        //header("Access-Control-Allow-Origin: *");
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
