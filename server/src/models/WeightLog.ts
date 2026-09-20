import { Schema, model, Types } from 'mongoose';

export interface WeightLogDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  date: string;
  weightKg: number;
  createdAt: Date;
  updatedAt: Date;
}

const weightLogSchema = new Schema<WeightLogDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    weightKg: { type: Number, required: true, min: 30, max: 250 },
  },
  { timestamps: true },
);

weightLogSchema.index({ user: 1, date: 1 }, { unique: true });

export const WeightLog = model<WeightLogDoc>('WeightLog', weightLogSchema);
