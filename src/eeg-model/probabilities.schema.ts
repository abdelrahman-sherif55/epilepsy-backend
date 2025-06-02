import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class Probabilities {
  @Prop()
  Ictal: number;

  @Prop()
  NonIctal: number;

  @Prop()
  PreIctal: number;
}

export type ProbabilityDocument = HydratedDocument<Probabilities>;
export const ProbabilitiesSchema = SchemaFactory.createForClass(Probabilities);
