import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Probabilities, ProbabilitiesSchema } from './probabilities.schema';

@Schema()
export class EegModel {
  @Prop()
  channels: string[];

  @Prop({ type: [[Number]] })
  eeg_data: number[][];

  @Prop()
  prediction: string;

  @Prop({ type: ProbabilitiesSchema })
  probabilities: Probabilities;

  @Prop()
  status: string;
}

export type EegModelDocument = HydratedDocument<EegModel>;
export const EegModelSchema = SchemaFactory.createForClass(EegModel);
