import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { UUIDValidationVersion } from '@common/constants';

export class UpdateDepartmentRequestDto {
  @ApiProperty({ description: 'Department Name', example: 'Design' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Department ID', example: '3278f24c-6b96-43cd-a1c4-69c66c875827' })
  @IsUUID(UUIDValidationVersion)
  departmentId: string;
}
