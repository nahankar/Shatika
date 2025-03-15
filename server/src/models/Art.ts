import mongoose, { Document, Schema } from 'mongoose';

export interface IArt extends Document {
  name: string;
  description: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const artSchema = new Schema<IArt>(
  {
    name: {
      type: String,
      required: [true, 'Art name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Art description is required'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Art image URL is required'],
    },
  },
  {
    timestamps: true,
  }
);

const Art = mongoose.model<IArt>('Art', artSchema);

export default Art; 