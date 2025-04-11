import { ClassSerializerInterceptor, Global, Module } from '@nestjs/common';
import { GenerateCode } from './classes/generate-code';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor';

@Global()
@Module({
  providers: [
    GenerateCode,
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
  exports: [GenerateCode],
})
export class CommonModule {}
