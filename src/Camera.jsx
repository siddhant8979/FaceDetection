import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

const App = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [faceData, setFaceData] = useState([]);
  const [noFaceData, setNoFaceData] = useState([]);
  const [uniqueId, setUniqueId] = useState(1);
  const [name, setName] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.loadSsdMobilenetv1Model('/models');
      await faceapi.loadFaceLandmarkModel('/models');
      await faceapi.loadFaceRecognitionModel('/models');
      await faceapi.loadAgeGenderModel('/models');
    };

    loadModels();
  }, []);

  const startCapture = () => {
    setIsCapturing(true);

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.error('Error accessing webcam:', error);
      });
  };

  const stopCapture = () => {
    setIsCapturing(false);

    const video = videoRef.current;
    video.srcObject.getTracks().forEach((track) => track.stop());
  };

  const handleCaptureImage = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withAgeAndGender();

    if (detections.length > 0) {
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      const capturedImage = canvas.toDataURL('image/png');

      const faceDescriptor = detections[0].descriptor;
      const age = Math.round(detections[0].age);
      const newFaceData = {
        id: uniqueId,
        name,
        image: capturedImage,
        descriptor: Array.from(faceDescriptor),
        age,
      };

      const isSamePerson = faceData.some(
        (data) => faceapi.euclideanDistance(data.descriptor, newFaceData.descriptor) < 0.6
      );

      if (isSamePerson) {
        alert('Same person detected!');
      } else {
        setFaceData([...faceData, newFaceData]);
        setUniqueId(uniqueId + 1);
      }
    } else {
      alert('No face detected!');
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      const capturedImage = canvas.toDataURL('image/png');
      const newFaceData = {
        id: uniqueId,
        name: '',
        image: capturedImage,
        descriptor: [],
        age: '',
      };
      setNoFaceData([...noFaceData, newFaceData]);
      setUniqueId(uniqueId + 1);
    }
  };

  const deleteFaceData = (id) => {
    const updatedFaceData = faceData.filter((data) => data.id !== id);
    setFaceData(updatedFaceData);
  };

  return (
    <div className="app">
      <div className="capture-container">
        {isCapturing ? (
          <>
            <video className="video" ref={videoRef} autoPlay muted></video>
            <canvas className="canvas" ref={canvasRef}></canvas>
            <button className="capture-button" onClick={handleCaptureImage}>
              Capture
            </button>
            <button className="stop-capture-button" onClick={stopCapture}>
              Stop Capture
            </button>
          </>
        ) : (
          <button className="start-capture-button" onClick={startCapture}>
            Start Capture
          </button>
        )}
      </div>
      <div className="face-data-container">
        <h2>Face Data</h2>
        <div className="face-list">
          {faceData.map((data) => (
            <div key={data.id} className="face-item">
              <img src={data.image} alt="Face" className="face-image" />
              <div className="face-details">
                <p>Name: {data.name}</p>
                <p>Age: {data.age}</p>
              </div>
              <button className="delete-button" onClick={() => deleteFaceData(data.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="no-face-data-container">
        <h2>No Face Data</h2>
        <div className="no-face-list">
          {noFaceData.map((data) => (
            <div key={data.id} className="no-face-item">
              <img src={data.image} alt="No Face" className="no-face-image" />
              <p>No face detected</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
