import { Schema, model, Types } from 'mongoose';
import {
  ACTIVITIES,
  CUISINES,
  DIETS,
  GENDERS,
  GOALS,
  type Profile,
} from '../types.js';

export interface UserDoc {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  profile: Partial<Profile>;
  profileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<Partial<Profile>>(
  {
    age: { type: Number, min: 18, max: 80 },
    gender: { type: String, enum: GENDERS },
    weightKg: { type: Number, min: 30, max: 250 },
    heightCm: { type: Number, min: 120, max: 220 },
    activity: { type: String, enum: ACTIVITIES },
    goal: { type: String, enum: GOALS },
    diet: { type: String, enum: DIETS },
    cuisine: { type: String, enum: CUISINES },
  },
  { _id: false },
);

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Never selected by default so a stray `User.findById()` cannot leak it.
    passwordHash: { type: String, required: true, select: false },
    profile: { type: profileSchema, default: () => ({}) },
    profileComplete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    const plain = ret as unknown as Record<string, unknown>;
    delete plain.passwordHash;
    delete plain.__v;
    return plain;
  },
});

export const User = model<UserDoc>('User', userSchema);
