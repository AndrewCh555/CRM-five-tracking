import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { StatisticService } from './statistic.service';
import { StatisticDiagramResponseDto, StatisticHeaderResponseDto } from '@modules/statistic/dto/response';
import { StatisticRequestDto } from '@modules/statistic/dto';
import { AuthGuard } from '@nestjs/passport';
import { StrategiesEnum } from '@common/enums/strategies';

@Controller('statistic')
@ApiTags('Statistics')
@UseGuards(AuthGuard(StrategiesEnum.JWT))
@ApiBearerAuth()
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'Get statistic' })
  @ApiOkResponse({ type: [StatisticDiagramResponseDto] })
  public async getByGrouped(@Query() requestDto: StatisticRequestDto): Promise<StatisticDiagramResponseDto[]> {
    const statistics = await this.statisticService.getByGrouped(requestDto);
    return StatisticDiagramResponseDto.mapFromMulti(statistics);
  }

  @Get('/count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'Get count statistic' })
  @ApiOkResponse({ type: StatisticHeaderResponseDto })
  public async getCount(@Query() requestDto: StatisticRequestDto): Promise<StatisticHeaderResponseDto> {
    const counts = await this.statisticService.getCount(requestDto);
    return StatisticHeaderResponseDto.mapFrom(counts);
  }
}
