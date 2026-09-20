import { Schema, model, Types } from 'mongoose';

export interface WaterLogDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  date: string;
  glasses: number;
  createdAt: Date;
  updatedAt: Date;
}

const waterLogSchema = new Schema<WaterLogDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // The client's own calendar day ('YYYY-MM-DD') so "today" matches the user's timezone.
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    glasses: { type: Number, required: true, min: 0, max: 30 },
  },
  { timestamps: true },
);

waterLogSchema.index({ user: 1, date: 1 }, { unique: true });

export const WaterLog = model<WaterLogDoc>('WaterLog', waterLogSchema);
