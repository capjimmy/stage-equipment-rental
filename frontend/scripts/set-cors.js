const { Storage } = require('@google-cloud/storage');

async function setCors() {
  const storage = new Storage({
    projectId: 'stagebox-49312'
  });

  const bucket = storage.bucket('stagebox-49312.firebasestorage.app');

  const corsConfiguration = [
    {
      origin: ['*'],
      method: ['GET', 'HEAD', 'OPTIONS'],
      maxAgeSeconds: 3600,
      responseHeader: ['Content-Type', 'Content-Length', 'Content-Disposition']
    }
  ];

  try {
    await bucket.setCorsConfiguration(corsConfiguration);
    console.log('CORS configuration set successfully!');
  } catch (error) {
    console.error('Error setting CORS:', error.message);
    console.log('\nPlease set CORS manually in Google Cloud Console:');
    console.log('https://console.cloud.google.com/storage/browser/stagebox-49312.firebasestorage.app');
  }
}

setCors();
