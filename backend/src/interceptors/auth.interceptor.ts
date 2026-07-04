import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DatabaseService } from '../services/database.service';

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  constructor(private databaseService: DatabaseService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (token) {
      try {
        // In a real implementation, you would verify the JWT token here
        // For now, we'll simulate user identification based on token
        // In a real app, you'd decode the JWT and verify against stored tokens
        
        // Placeholder: assuming the token contains the user ID somehow
        // In reality, you'd have a proper JWT verification mechanism
        console.log('Verifying token:', token);
        
        // For demonstration purposes, we'll skip actual verification
        // and instead attach user info based on a hypothetical decoded token
      } catch (err) {
        // If token verification fails, continue without user info
        // (for public routes)
      }
    }

    return next.handle();
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}