import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { Favorites } from '../entity/favorites.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Favorites]),
    JwtModule.register({
      secret: '' + process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '24h'
      }
    })
  ],
  providers: [FavoritesService],
  controllers: [FavoritesController],
  exports: [FavoritesService]
})
export class FavoritesModule {}
