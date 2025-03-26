import mongoose from 'mongoose';
import Product from '../models/Product';
import HomeSection from '../models/HomeSection';
import Art from '../models/Art';
import DesignElement from '../models/DesignElement';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shatika';

async function updateDatabaseRecords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update products
    const products = await Product.find({
      'images': { $regex: 'http://localhost:5001/uploads/' }
    });
    console.log(`Found ${products.length} products with local images`);

    for (const product of products) {
      const oldImages = product.images;
      const newImages = oldImages.map(url => {
        if (url.includes('localhost:5001/uploads/')) {
          const filename = url.split('/').pop();
          const publicId = filename?.split('.')[0];
          return `https://res.cloudinary.com/dfashwxf0/image/upload/v1/shatika/${publicId}`;
        }
        return url;
      });

      product.images = newImages;
      await product.save();
      console.log('Updated product images:');
      console.log('Old:', oldImages);
      console.log('New:', newImages);
    }

    // Update home sections
    const sections = await HomeSection.find({
      'image': { $regex: 'http://localhost:5001/uploads/' }
    });
    console.log(`Found ${sections.length} home sections with local images`);

    for (const section of sections) {
      const oldImage = section.image;
      if (oldImage.includes('localhost:5001/uploads/')) {
        const filename = oldImage.split('/').pop();
        const publicId = filename?.split('.')[0];
        section.image = `https://res.cloudinary.com/dfashwxf0/image/upload/v1/shatika/${publicId}`;
        await section.save();
        console.log('Updated home section image:');
        console.log('Old:', oldImage);
        console.log('New:', section.image);
      }
    }

    // Update arts
    const arts = await Art.find({
      'imageUrl': { $regex: '/uploads/' }
    });
    console.log(`Found ${arts.length} arts with local images`);

    for (const art of arts) {
      const oldImage = art.imageUrl;
      if (oldImage.startsWith('/uploads/')) {
        const filename = oldImage.split('/').pop();
        const publicId = filename?.split('.')[0];
        art.imageUrl = `https://res.cloudinary.com/dfashwxf0/image/upload/v1/shatika/${publicId}`;
        await art.save();
        console.log('Updated art image:');
        console.log('Old:', oldImage);
        console.log('New:', art.imageUrl);
      }
    }

    // Update design elements
    const designElements = await DesignElement.find({
      'image': { $regex: '^/uploads/' }
    });
    console.log(`Found ${designElements.length} design elements with local images`);

    for (const element of designElements) {
      const oldImage = element.image;
      if (oldImage.startsWith('/uploads/')) {
        const filename = oldImage.split('/').pop();
        const publicId = filename?.split('.')[0];
        element.image = `https://res.cloudinary.com/dfashwxf0/image/upload/v1/shatika/${publicId}`;
        await element.save();
        console.log('Updated design element image:');
        console.log('Old:', oldImage);
        console.log('New:', element.image);
      }
    }

    console.log('Database update completed');
    console.log('Full migration completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateDatabaseRecords(); 