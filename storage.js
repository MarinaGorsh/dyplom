const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

const storage = new Storage({
  keyFilename: path.join(__dirname, 'osnova-460715-447788a7e06c.json')
});

const bucketName = 'osnowa';
const bucket = storage.bucket(bucketName);


async function uploadCourseImage(buffer, filename, courseCode) {
  const imagePath = `${courseCode}/img/${filename}`;
  const file = bucket.file(imagePath);
  await file.save(buffer, {
    metadata: {
      contentType: 'image/jpeg',
    },
  });
  return `https://storage.googleapis.com/${bucketName}/${imagePath}`;
}

const streamCourseImage = async (courseCode, filename, res) => {
  try {
    const file = bucket.file(`${courseCode}/img/${filename}`);
    const [exists] = await file.exists();

    if (!exists) {
      res.status(404).send('Image not found');
      return;
    }
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || 'application/octet-stream';
   
    res.setHeader('Content-Type', contentType);

    file.createReadStream().pipe(res);
  } catch (err) {
    console.error('Error reading image from GCS:', err.message);
    res.status(500).send('Error reading image');
  }
};

async function deleteCourseFolder(courseCode) {
  try {
    const [files] = await bucket.getFiles({ prefix: `${courseCode}/` });

    if (files.length === 0) {
      console.log(`No files found in folder ${courseCode}/`);
      return;
    }

    await Promise.all(files.map(file => file.delete()));
    console.log(`All files in folder ${courseCode}/ deleted.`);
  } catch (error) {
    console.error('Failed to delete course folder:', error.message);
  }
}


async function uploadHomeworkFile(buffer, fileName, courseCode) {
  try {
    const destination = `${courseCode}/homeworks/${Date.now()}_${fileName}`;
    const file = bucket.file(destination);

    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/octet-stream',
      },
    });

    await new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(buffer);
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
    console.log(`File uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading homework file:', error);
    throw error;
  }
}

async function streamHomeworkFile(courseCode, filename, res) {
  try {
    const filePath = `${courseCode}/homeworks/${filename}`;
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).send('File not found');
      return;
    }

    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    file.createReadStream().pipe(res);
  } catch (error) {
    console.error('Error streaming homework file:', error);
    res.status(500).send('Error reading file');
  }
}

async function deleteHomeworkFile(url) {
  try {
    const decodedUrl = decodeURIComponent(url);
    const filePath = decodedUrl.split(`https://storage.googleapis.com/${bucketName}/`)[1];
    console.log(filePath);
    if (!filePath) throw new Error('Invalid file URL');

    cleanedPath = filePath?.replace(/,+$/, '');
    await bucket.file(cleanedPath).delete();
    console.log(`File deleted: ${cleanedPath}`);
  } catch (error) {
    console.error('Error deleting homework file:', error);
  }
}



async function uploadPassedHomeworkFile(buffer, fileName, courseCode, homeworkId, studentEmail) {
  try {
    const destination = `${courseCode}/passedHomeworks/${homeworkId}/${studentEmail}/${Date.now()}_${fileName}`;
    const file = bucket.file(destination);

    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/octet-stream',
      },
    });

    await new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(buffer);
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
    console.log(`File uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading student homework file:', error);
    throw error;
  }
}

async function streamPassedHomeworkFile(courseCode, filename, homeworkId, studentEmail, res) {
  try {
    const filePath = `${courseCode}/passedHomeworks/${homeworkId}/${studentEmail}/${filename}`;
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).send('File not found');
      return;
    }

    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    file.createReadStream().pipe(res);
  } catch (error) {
    console.error('Error streaming homework file:', error);
    res.status(500).send('Error reading file');
  }
}

module.exports = {uploadCourseImage, deleteCourseFolder, streamCourseImage, uploadHomeworkFile, streamHomeworkFile, deleteHomeworkFile, uploadPassedHomeworkFile, streamPassedHomeworkFile};