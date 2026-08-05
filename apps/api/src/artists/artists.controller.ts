import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { DbUserGuard } from '../auth/db-user.guard';
import { artistPhotoMulterOptions } from './artist-photo.multer';
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

  @Get(':id/availability')
  getAvailability(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.artistsService.getAvailability(id, date);
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

  @Post(':id/photos')
  @UseGuards(ClerkAuthGuard, DbUserGuard, RolesGuard)
  @Roles('artist')
  @UseInterceptors(FileInterceptor('file', artistPhotoMulterOptions()))
  uploadPhoto(
    @Param('id') id: string,
    @Query('kind') kind: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /^image\/(jpe?g|png|webp|gif)$/i,
            skipMagicNumbersValidation: true,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: { dbUser: { id: string } },
  ) {
    const photoKind = kind === 'cover' ? 'cover' : 'profile';
    return this.artistsService.uploadPhoto(id, req.dbUser.id, photoKind, file);
  }
}
