import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export const arrayInMultipartRequestHelper = <T, U>(array: T): U[] | U => {
  if (!array) {
    return [];
  }

  if (Array.isArray(array)) {
    return array;
  }

  if (typeof array === 'object') {
    return array as unknown as U[];
  }

  if (typeof array === 'string' && array.includes('[')) {
    return JSON.parse(array);
  }

  if (typeof array === 'string' && array.includes('{')) {
    return JSON.parse(`[${array}]`);
  }

  if (typeof array === 'string') {
    return array.split(',') as unknown as U[];
  }
};

@ValidatorConstraint()
export class ArrayStringInDtoValidation implements ValidatorConstraintInterface {
  async validate(value: string): Promise<boolean> {
    if (typeof value !== 'string') {
      throw new BadRequestException('values in array must be a string');
    }
    return true;
  }
}
