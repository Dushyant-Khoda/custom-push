import { Controller, Post, Body, HttpCode } from '@nestjs/common'
import { PushService } from './push.service'

class RegisterTokenDto   { token: string }
class UnregisterTokenDto { token: string }

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('register')
  @HttpCode(200)
  async register(@Body() body: RegisterTokenDto) {
    // TODO: extract userId from your auth guard
    await this.pushService.registerToken('userId', body.token)
    return { success: true }
  }

  @Post('unregister')
  @HttpCode(200)
  async unregister(@Body() body: UnregisterTokenDto) {
    await this.pushService.unregisterToken(body.token)
    return { success: true }
  }
}
