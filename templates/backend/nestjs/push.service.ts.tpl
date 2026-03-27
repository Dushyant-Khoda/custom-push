import { Injectable, OnModuleInit } from '@nestjs/common'
import * as admin from 'firebase-admin'
import * as path from 'path'
import ourPkg from '../our_pkg.json'

@Injectable()
export class PushService implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          path.resolve(ourPkg.backend.credentialsPath ?? './credentials.json')
        ),
      })
    }
  }

  async registerToken(userId: string, token: string): Promise<void> {
    // TODO: persist to your database
    // await this.db.pushTokens.upsert({ userId, token })
  }

  async unregisterToken(token: string): Promise<void> {
    // TODO: await this.db.pushTokens.delete({ token })
  }

  async sendNotification(params: {
    token: string
    title: string
    body: string
    data?: Record<string, string>
    route?: string
  }): Promise<string> {
    const message: admin.messaging.Message = {
      token: params.token,
      notification: { title: params.title, body: params.body },
      data: { ...(params.data || {}), route: params.route || '/' },
      webpush: {
        notification: { title: params.title, body: params.body, icon: '/icon.png' },
      },
    }
    return admin.messaging().send(message)
  }
}
