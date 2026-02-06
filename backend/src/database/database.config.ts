import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const databaseConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  const uri = configService.get<string>('MONGO_URI');

  console.log('Mongo URI:', uri); // để debug

  return {
    uri,
  };
};
