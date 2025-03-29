import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface DesignShape {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  color: string;
  image: string;
  cropSettings?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Capture a thumbnail of the design using Puppeteer
 * This endpoint accepts design data and renders it in a headless browser to take a screenshot
 */
export const captureDesignThumbnail = async (req: Request, res: Response) => {
  try {
    const { designData, fabricImage } = req.body;
    
    if (!designData) {
      return res.status(400).json({
        success: false,
        message: 'Design data is required'
      });
    }

    // Parse design data if it's a string
    const parsedDesignData = typeof designData === 'string' ? JSON.parse(designData) : designData;
    const shapes = parsedDesignData.body || [];

    // Create a temporary HTML file to render
    const tempId = uuidv4();
    const tempDir = path.join(__dirname, '../../temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const htmlPath = path.join(tempDir, `${tempId}.html`);
    const imagePath = path.join(tempDir, `${tempId}.png`);
    
    // Create HTML content that will render the design
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Design Thumbnail</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          .design-container {
            width: 600px;
            height: 400px;
            position: relative;
            background-image: ${fabricImage ? `url(${fabricImage})` : 'none'};
            background-size: cover;
            background-position: center;
          }
          .design-shape {
            position: absolute;
            overflow: hidden;
          }
          .shape-content {
            width: 100%;
            height: 100%;
            position: relative;
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
          }
        </style>
      </head>
      <body>
        <div class="design-container">
          ${shapes.map((shape: DesignShape) => `
            <div class="design-shape" style="
              left: ${shape.x}px;
              top: ${shape.y}px;
              width: ${shape.width}px;
              height: ${shape.height}px;
              transform: rotate(${shape.rotation || 0}deg);
              ${shape.cropSettings ? `clip-path: inset(${shape.cropSettings.top}% ${shape.cropSettings.right}% ${shape.cropSettings.bottom}% ${shape.cropSettings.left}%);` : ''}
            ">
              <div class="shape-content" style="
                background-color: ${shape.color};
                -webkit-mask-image: url('${shape.image}');
                -webkit-mask-size: contain;
                -webkit-mask-position: center;
                -webkit-mask-repeat: no-repeat;
                mask-image: url('${shape.image}');
                mask-size: contain;
                mask-position: center;
                mask-repeat: no-repeat;
              "></div>
            </div>
          `).join('')}
        </div>
        <script>
          // Wait for all images to load
          Promise.all(
            Array.from(document.querySelectorAll('.shape-content'))
              .map(el => {
                const maskUrl = getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage;
                if (maskUrl && maskUrl !== 'none') {
                  return new Promise(resolve => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = resolve;
                    img.src = maskUrl.replace(/url\\(['"]?(.+?)['"]?\\)/i, '$1');
                  });
                }
                return Promise.resolve();
              })
          ).then(() => {
            console.log('All images loaded');
            // Signal to Puppeteer that we're ready
            document.body.setAttribute('data-images-loaded', 'true');
          });
        </script>
      </body>
      </html>
    `;
    
    // Write the HTML file
    fs.writeFileSync(htmlPath, htmlContent);
    
    // Launch browser and capture screenshot
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-features=site-per-process',
        '--js-flags=--max-old-space-size=512'
      ]
    });
    
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 600, height: 400 });
    
    // Wait for images to load
    await page.waitForFunction(() => {
      return document.body.getAttribute('data-images-loaded') === 'true' 
        || document.readyState === 'complete';
    }, { timeout: 10000 });

    // Additional wait to ensure everything rendered
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Capture the screenshot
    await page.screenshot({
      path: imagePath,
      type: 'png',
      omitBackground: false
    });
    
    // Close the browser
    await browser.close();
    
    // Read the captured image and send as response
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Clean up temporary files
    try {
      fs.unlinkSync(htmlPath);
      fs.unlinkSync(imagePath);
    } catch (err) {
      console.error('Error cleaning up temp files:', err);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Thumbnail captured successfully',
      data: {
        thumbnail: `data:image/png;base64,${base64Image}`
      }
    });
    
  } catch (error) {
    console.error('Error capturing thumbnail:', error);
    return res.status(500).json({
      success: false,
      message: 'Error capturing thumbnail',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}; 