import mongoose from 'mongoose';

const designElementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  artType: {
    type: String,
    required: true,
    trim: true
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

const DesignElement = mongoose.model('DesignElement', designElementSchema);

export default DesignElement; 