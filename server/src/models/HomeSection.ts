import mongoose from 'mongoose';

const homeSectionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['category', 'art']
  },
  name: {
    type: String,
    required: true
  },
  displayOrder: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const HomeSection = mongoose.model('HomeSection', homeSectionSchema);

export default HomeSection; 