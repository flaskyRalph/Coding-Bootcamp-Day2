const ENV = {
  dev: {
    apiUrl: 'http://localhost:3000',
    firebaseConfig: {
      apiKey: "AIzaSyDMI8vr4HgZ7aMI4uKvIQxmQpNO3tSoSb4",
      authDomain: "barangay-buddy-b6c14.firebaseapp.com",
      projectId: "barangay-buddy-b6c14",
      storageBucket: "barangay-buddy-b6c14.firebasestorage.app",
      messagingSenderId: "610292274266",
      appId: "1:610292274266:web:1f94c797abdf30d61f3463",
      measurementId: "G-NM70MP1JMS"
    },
    enableDebugMode: true,
  },
  staging: {
    apiUrl: 'https://staging-api.barangaybuddy.com',
    firebaseConfig: {
      // Staging Firebase config
    },
    enableDebugMode: true,
  },
  prod: {
    apiUrl: 'https://api.barangaybuddy.com',
    firebaseConfig: {
      // Production Firebase config
    },
    enableDebugMode: false,
  },
};

const getEnvVars = (env = 'dev') => {
  if (env === 'production' || env === 'prod') {
    return ENV.prod;
  }
  if (env === 'staging') {
    return ENV.staging;
  }
  return ENV.dev;
};

export default getEnvVars(process.env.NODE_ENV);


