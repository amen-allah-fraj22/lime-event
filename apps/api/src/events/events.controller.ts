import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DbUserGuard } from '../auth/db-user.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { eventPhotoMulterOptions } from './event-photo.multer';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  @UseGuards(ClerkAuthGuard, DbUserGuard, RolesGuard)
  @Roles('organizer', 'agency')
  create(@Body() dto: CreateEventDto, @Req() req: { dbUser: { id: string } }) {
    return this.eventsService.create(req.dbUser.id, dto);
  }

  @Post(':id/photo')
  @UseGuards(ClerkAuthGuard, DbUserGuard, RolesGuard)
  @Roles('organizer', 'agency')
  @UseInterceptors(FileInterceptor('file', eventPhotoMulterOptions()))
  uploadPhoto(
    @Param('id') id: string,
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
    return this.eventsService.uploadPhoto(id, req.dbUser.id, file);
  }

  @Get()
  listPublic() {
    return this.eventsService.listPublicEvents();
  }

  @Get('mine')
  @UseGuards(ClerkAuthGuard, DbUserGuard, RolesGuard)
  @Roles('organizer', 'agency', 'admin')
  listMine(@Req() req: { dbUser: { id: string } }) {
    return this.eventsService.listForOrganizer(req.dbUser.id);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard, DbUserGuard)
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Get(':id/matches')
  @UseGuards(ClerkAuthGuard, DbUserGuard, RolesGuard)
  @Roles('organizer', 'agency')
  getMatches(@Param('id') id: string, @Req() req: { dbUser: { id: string } }) {
    return this.eventsService.getMatches(id, req.dbUser.id);
  }

  @Get(':id/quotes')
  @UseGuards(ClerkAuthGuard, DbUserGuard, RolesGuard)
  @Roles('organizer', 'agency', 'admin')
  getQuotes(@Param('id') id: string, @Req() req: { dbUser: { id: string } }) {
    return this.eventsService.getQuotes(id, req.dbUser.id);
  }
}
