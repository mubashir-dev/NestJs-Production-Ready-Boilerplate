import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { IPageResponse } from '@src/interfaces/IPageResponse';

@Controller('health')
@ApiTags('Health')
export class HealthCheckerController {
  constructor(
    private healthCheckService: HealthCheckService,
    private ormIndicator: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<IPageResponse> {
    const healthStatus = await this.healthCheckService.check([
      () => this.ormIndicator.pingCheck('database', { timeout: 1500 }),
    ]);

    return {
      data: {
        status: healthStatus.status,
        detail: healthStatus.details,
      },
    };
  }
}
