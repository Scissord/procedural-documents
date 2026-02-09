import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtTokenGuard } from './jwt-token.guard';
import { DatabaseModule } from 'src/db/database.module';
import { UserModule } from 'src/user/user.module';
import { ProfileModule } from 'src/profile/profile.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<StringValue>('JWT_EXPIRES_IN') ?? '1d',
        },
      }),
    }),
    UserModule,
    ProfileModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtTokenGuard],
})
export class AuthModule {}
