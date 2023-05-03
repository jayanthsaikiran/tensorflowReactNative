// import React, { useState, useEffect } from 'react';
// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';
// import { Camera, CameraType } from 'expo-camera';
// import * as handpose from '@tensorflow-models/handpose';

// export default function App() {
//   const [hasPermission, setHasPermission] = useState(null);
//   const [model, setModel] = useState(null);
//   const [handPosition, setHandPosition] = useState([]);
//   const cameraRef = useRef(null);
//   const { width, height } = Dimensions.get('window');

//   useEffect(() => {
//     const loadModel = async () => {
//       const handposeModel = await handpose.load();
//       setModel(handposeModel);
//     };

//     loadModel();
//   }, []);

//   useEffect(() => {
//     const initData = async () => {
//       const { status } = await Camera.requestPermissionsAsync();
//       setHasPermission(status === 'granted');
//     }
//       initData()
//       .catch(console.error);
//   }, [])

//   useEffect(() => {
//     const runHandpose = async () => {
//       if (cameraRef.current) {
//         const video = await cameraRef.current.getVideoTexture();
//         const predictions = await model.estimateHands(video);
//         setHandPosition(predictions);
//         video.dispose();
//       }
//       requestAnimationFrame(runHandpose);
//     };

//     requestAnimationFrame(runHandpose);

//     return () => {
//       cancelAnimationFrame(runHandpose);
//     };
//   }, [model]);

//   const handleBuffer = async (buffer) => {
//     if (!buffer) return;
//     const { uri } = buffer;
//     console.log('reachjig handleBuffer')
//     processVideoFrame(uri);
//   };

//   const processVideoFrame = async (uri) => {
//     alert('reaching');
//     console.log('reaching');
//   };


//   return (
//     <View style={styles.container}>
//       <Camera
//       style={styles.cameraPreview}
//       type={Camera.Constants.Type.front}
//       ref={cameraRef}
//       ratio="16:9"
//       onCameraReady={() => console.log('Camera ready')}
//       onMountError={(error) => console.log('Camera mount error', error)}
//     />

//     <View style={styles.handPositionContainer}>
//       {handPosition.map((prediction, index) => {
//         const key = index.toString();
//         return (
//           <View style={styles.handPosition} key={key}>
//             <Text style={styles.handPositionText}>{`x: ${prediction[0]}, y: ${prediction[1]}`}</Text>
//           </View>
//         );
//       })}
//     </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cameraPreview: {
//     width,
//     height,
//     justifyContent: 'flex-end',
//     alignItems: 'center',
//   },
//   handPositionContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   handPosition: {
//     width: 100,
//     height: 50,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     borderRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//     margin: 10,
//   },
//   handPositionText: {
//     color: '#fff',
//     fontSize: 12,
//   },
// });
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { decode, encode } from 'base-64';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { fetch } from 'react-native-fetch-polyfill';

global.fetch = fetch;
if (!global.btoa) {
  global.btoa = encode;
}

if (!global.atob) {
  global.atob = decode;
}

async function loadModel() {
  await tf.ready();
  const model = await handpose.load();
  return model;
}

function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      const model = await loadModel();
      setModel(model);
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const captureImageAndEstimateHands = async () => {
    if (cameraRef && model) {
      const image = await cameraRef.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true,
      });

      const imgB64 = image.base64;
      const imgBuffer = tf.util.encodeString(imgB64, 'base64');
      const raw = new Uint8Array(imgBuffer);
      const imageTensor = tf.node.decodeImage(raw, 3);

      const predictions = await model.estimateHands(imageTensor);
      imageTensor.dispose();

      console.log(predictions);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={Camera.Constants.Type.front}
        ref={(ref) => setCameraRef(ref)}
        onCameraReady={captureImageAndEstimateHands}
      ></Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  glView: {
    flex: 1,
  }
});

export default App;