import * as fs from 'node:fs/promises';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { UploadFileInterface } from '@common/interfaces/file';
import { File } from '@shared/models';
import { FileRepository } from '@shared/repositories';

@Injectable()
export class FileService {
  constructor(
    private readonly fileRepository: FileRepository,
    @InjectPinoLogger(FileService.name)
    private readonly logger: PinoLogger,
  ) {}

  async save(fileData: UploadFileInterface): Promise<File> {
    try {
      return await this.fileRepository.create(fileData);
    } catch (error) {
      this.logger.error({ error, fileData }, 'FileService:save');
      throw new BadRequestException(`There isn't any file`);
    }
  }

  async delete(file: File): Promise<void> {
    try {
      await this.fileRepository.delete(file.id);
      await fs.unlink(file.path);
    } catch (error) {
      this.logger.error({ error }, 'File:delete');
    }
  }
}
