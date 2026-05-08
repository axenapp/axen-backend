import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async create(userId: string, createReviewDto: CreateReviewDto) {
    const { bookingId, rating, comment } = createReviewDto;

    // Buscar el booking con sus relaciones
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['service', 'service.partner'],
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Ownership check — solo el usuario que hizo la reserva puede calificar
    if (booking.userId !== userId) {
      throw new ForbiddenException(
        'No tenés permisos para calificar esta reserva',
      );
    }

    // Verificar que el turno esté completado — RN-02
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new UnprocessableEntityException(
        'Solo podés calificar un turno que ya fue completado',
      );
    }

    // Verificar que no exista ya una reseña — RN-02
    const existing = await this.reviewRepository.findOne({
      where: { bookingId },
    });

    if (existing) {
      throw new ConflictException('Ya calificaste esta reserva');
    }

    // Crear la reseña
    const review = this.reviewRepository.create({
      bookingId,
      userId,
      partnerId: booking.service.partner.id,
      rating,
      comment: comment ?? null,
    });

    return this.reviewRepository.save(review);
  }

  async findAllByPartner(partnerId: string) {
    return this.reviewRepository.find({
      where: { partnerId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAverageRating(partnerId: string) {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(review.id)', 'total')
      .where('review.partnerId = :partnerId', { partnerId })
      .getRawOne();

    return {
      average: parseFloat(result.average) || 0,
      total: parseInt(result.total) || 0,
    };
  }

  async findAllByUser(userId: string) {
    return this.reviewRepository.find({
      where: { userId },
      relations: ['partner'],
      order: { createdAt: 'DESC' },
    });
  }
}