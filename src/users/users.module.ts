import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Users, UsersSchema } from './users.schema';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Users.name,
        useFactory: () => {
          const schema = UsersSchema;
          schema.pre('save', async function () {
            if (!this.isModified('password')) return;
            this.password = await bcrypt.hash(this.password, 15);
          });
          return schema;
        },
      },
    ]),
  ],
  exports: [MongooseModule],
})
export class UsersModule {}
