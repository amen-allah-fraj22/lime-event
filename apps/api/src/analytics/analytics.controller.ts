import { Body, Controller, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackPageviewDto } from './dto/track-pageview.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('pageview')
  track(@Body() dto: TrackPageviewDto) {
    return this.analyticsService.track(dto.path, dto.session_id);
  }
}
