import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Crear una reseña (usuario autenticado)
  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, createReviewDto);
  }

  // Ver reseñas de un partner
  @Get('partner/:partnerId')
  async findByPartner(@Param('partnerId') partnerId: string) {
    return this.reviewsService.findAllByPartner(partnerId);
  }

  // Ver promedio de calificación de un partner
  @Get('partner/:partnerId/average')
  async getAverage(@Param('partnerId') partnerId: string) {
    return this.reviewsService.getAverageRating(partnerId);
  }

  // Ver mis reseñas
  @Get('my')
  async findMy(@CurrentUser() user: User) {
    return this.reviewsService.findAllByUser(user.id);
  }
}