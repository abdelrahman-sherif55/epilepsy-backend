import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../common/interfaces/environment.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<Environment>,
  ) {}

  public async sendNotification(
    deviceIds: string[],
    title: string,
    message: string,
  ): Promise<{ success: boolean; data: any }> {
    try {
      const res$ = this.httpService.post(
        this.configService.get('NOTIFICATIONS_URL', { infer: true }),
        {
          app_id: this.configService.get('ONESIGNAL_APP_ID', { infer: true }),
          include_player_ids: deviceIds,
          headings: { en: title },
          contents: { en: message },
        },
        {
          headers: {
            Authorization: `Basic ${this.configService.get('ONESIGNAL_API_KEY', { infer: true })}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const response = await firstValueFrom(res$);
      return { success: true, data: response };
    } catch (error) {
      console.log('Error sending notification:', error);
    }
  }
}
