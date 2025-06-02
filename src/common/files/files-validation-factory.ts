import * as bytes from 'bytes';
import {
  FileTypeValidator,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { extname } from 'path';
import * as fs from 'fs';
import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import { FileSizeType, FileType } from './types/file.types';
import { createFileTypeRegex } from './utils/file.util';
import { NonEmptyArray } from '../utils/array.util';

const createFileValidators = (
  maxSize: FileSizeType,
  fileTypes: NonEmptyArray<FileType>,
): FileValidator[] => {
  const fileTypeRegex = createFileTypeRegex(fileTypes);
  return [
    new MaxFileSizeValidator({
      maxSize: bytes(maxSize),
      message: (maxSize) => `File is too big. Max file size is ${maxSize}`,
    }),
    new FileTypeValidator({
      fileType: fileTypeRegex,
    }),
    // new FileSignatureValidator(),
  ];
};

export const createParseFilePipe = (
  maxSize: FileSizeType,
  fileTypes: NonEmptyArray<FileType>,
): ParseFilePipe =>
  new ParseFilePipe({
    validators: createFileValidators(maxSize, fileTypes),
    errorHttpStatusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    exceptionFactory: (error: string) => {
      throw new UnsupportedMediaTypeException(error);
    },
    fileIsRequired: false,
  });

export const generateFileName = (
  file: Express.Multer.File,
  path: string,
): string => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = extname(file.originalname);
  ensureFolderExists(path);
  fs.writeFileSync(
    `${path}/${file.fieldname}-${uniqueSuffix}${ext}`,
    file.buffer,
  );
  return `${file.fieldname}-${uniqueSuffix}${ext}`;
};
const ensureFolderExists = (folderPath: string) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

export const deleteFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Error deleting file: ${err}`);
      else console.log(`File deleted successfully: ${filePath}`);
    });
  } else {
    console.log(`File not found: ${filePath}`);
  }
};
