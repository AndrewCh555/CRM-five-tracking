import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

//#minMemorySize
const minMemorySize = 768 * 1024 * 1024;

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService, private readonly memory: MemoryHealthIndicator) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => this.memory.checkRSS('mem_rss', minMemorySize /* 768 MB */),
    ]);
  }
}
