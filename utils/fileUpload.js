const path = require("path");
const fs = require("fs").promises;
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { BadRequestError } = require("./errorHandler");

// Base upload directory
const uploadDir = process.env.UPLOAD_PATH || "./uploads";

/**
 * Process and upload an image with resizing
 * @param {Object} file - Multer file object
 * @param {String} subDir - Subdirectory to store image
 * @param {Number} width - Width to resize image to (optional)
 * @returns {String} - Path to the saved image
 */
const uploadImage = async (file, subDir = "profiles", width = null) => {
  try {
    // Create directory if it doesn't exist
    const directory = path.join(uploadDir, subDir);
    await fs.mkdir(directory, { recursive: true });

    // Generate unique filename
    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const outputPath = path.join(directory, fileName);

    // Process and resize image
    let sharpImage = sharp(file.buffer || file.path);

    // Get metadata
    const metadata = await sharpImage.metadata();

    // Resize if width specified and image is larger
    if (width && metadata.width > width) {
      sharpImage = sharpImage.resize(width);
    }

    // Save processed image
    await sharpImage.toFile(outputPath);

    // If file was saved to temp location by multer, delete it
    if (file.path) {
      await fs
        .unlink(file.path)
        .catch((err) => console.error("Error deleting temp file:", err));
    }

    // Return relative path for storage in DB
    return `/${subDir}/${fileName}`;
  } catch (error) {
    console.error("Image upload error:", error);
    throw new BadRequestError("Error processing image");
  }
};

/**
 * Upload media file (image or video)
 * @param {Object} file - Multer file object
 * @param {String} subDir - Subdirectory to store media
 * @returns {String} - Path to the saved media
 */
const uploadMedia = async (file, subDir = "portfolio") => {
  try {
    // Determine media type
    const isImage = file.mimetype.startsWith("image");
    const mediaType = isImage ? "images" : "videos";

    // Create directory if it doesn't exist
    const directory = path.join(uploadDir, subDir, mediaType);
    await fs.mkdir(directory, { recursive: true });

    // Generate unique filename
    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const outputPath = path.join(directory, fileName);

    if (isImage) {
      // Process image with sharp
      await sharp(file.buffer || file.path).toFile(outputPath);
    } else {
      // For videos, just move/copy the file
      if (file.buffer) {
        await fs.writeFile(outputPath, file.buffer);
      } else {
        // Copy file from temp location
        const data = await fs.readFile(file.path);
        await fs.writeFile(outputPath, data);
        await fs
          .unlink(file.path)
          .catch((err) => console.error("Error deleting temp file:", err));
      }
    }

    // Return relative path for storage in DB
    return `/${subDir}/${mediaType}/${fileName}`;
  } catch (error) {
    console.error("Media upload error:", error);
    throw new BadRequestError("Error processing media file");
  }
};

/**
 * Generate thumbnail from video
 * @param {String} videoPath - Path to video file
 * @returns {String} - Path to generated thumbnail
 */
const generateThumbnail = async (videoPath) => {
  try {
    // This is a placeholder for video thumbnail generation
    // In a real implementation, you would use a library like fluent-ffmpeg
    // to extract a frame from the video

    // For now, we'll create a placeholder thumbnail
    const directory = path.join(uploadDir, "portfolio", "thumbnails");
    await fs.mkdir(directory, { recursive: true });

    // Generate thumbnail name based on video name
    const videoFileName = path.basename(videoPath);
    const thumbnailName = `${path.parse(videoFileName).name}-thumbnail.jpg`;
    const thumbnailPath = path.join(directory, thumbnailName);

    // Create a blank thumbnail (in reality, you'd extract from video)
    await sharp({
      create: {
        width: 640,
        height: 360,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0.5 },
      },
    })
      .jpeg()
      .toFile(thumbnailPath);

    return `/portfolio/thumbnails/${thumbnailName}`;
  } catch (error) {
    console.error("Thumbnail generation error:", error);
    // Return a default thumbnail if generation fails
    return "/default-thumbnail.jpg";
  }
};

/**
 * Upload any file type
 * @param {Object} file - Multer file object
 * @param {String} subDir - Subdirectory to store file
 * @returns {String} - Path to the saved file
 */
const uploadFile = async (file, subDir = "attachments") => {
  try {
    // Create directory if it doesn't exist
    const directory = path.join(uploadDir, subDir);
    await fs.mkdir(directory, { recursive: true });

    // Generate unique filename
    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const outputPath = path.join(directory, fileName);

    // Write file
    if (file.buffer) {
      await fs.writeFile(outputPath, file.buffer);
    } else {
      // Copy file from temp location
      const data = await fs.readFile(file.path);
      await fs.writeFile(outputPath, data);
      await fs
        .unlink(file.path)
        .catch((err) => console.error("Error deleting temp file:", err));
    }

    // Return relative path for storage in DB
    return `/${subDir}/${fileName}`;
  } catch (error) {
    console.error("File upload error:", error);
    throw new BadRequestError("Error uploading file");
  }
};

/**
 * Delete file from storage
 * @param {String} filePath - Path to file
 */
const deleteFile = async (filePath) => {
  try {
    // Ensure path is safe (no directory traversal)
    const normalizedPath = path
      .normalize(filePath)
      .replace(/^(\.\.(\/|\\|$))+/, "");
    const fullPath = path.join(uploadDir, normalizedPath.replace(/^\//, ""));

    // Check if file exists
    await fs.access(fullPath);

    // Delete file
    await fs.unlink(fullPath);

    return true;
  } catch (error) {
    console.error("File deletion error:", error);
    // Don't throw error for file deletion failures
    return false;
  }
};

module.exports = {
  uploadImage,
  uploadMedia,
  generateThumbnail,
  uploadFile,
  deleteFile,
};
