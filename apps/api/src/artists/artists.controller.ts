import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { DbUserGuard } from '../auth/db-user.guard';
import { ArtistsService } from './artists.service';
import { BrowseArtistsDto } from './dto/browse-artists.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';

@Controller('artists')
export class ArtistsController {
  constructor(private artistsService: ArtistsService) {}

  @Get()
  browse(@Query() query: BrowseArtistsDto) {
    return this.artistsService.browse(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.artistsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ClerkAuthGuard, DbUserGuard, RolesGuard)
  @Roles('artist')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArtistDto,
    @Req() req: { dbUser: { id: string } },
  ) {
    return this.artistsService.update(id, req.dbUser.id, dto);
  }
}
