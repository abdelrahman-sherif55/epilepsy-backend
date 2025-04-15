import { ClassSerializerInterceptor, Global, Module } from '@nestjs/common';
import { GenerateCode } from './classes/generate-code';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor';
import { BadRequestExceptionFilter } from './filters/bad-request-exception.filter';

@Global()
@Module({
  providers: [
    GenerateCode,
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    { provide: APP_FILTER, useClass: BadRequestExceptionFilter },
  ],
  exports: [GenerateCode],
})
export class CommonModule {}
