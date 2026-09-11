import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("health")
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Публичный, вне /api/v1 — используется оркестратором (Docker/K8s) для liveness/readiness. */
  @Get("health")
  async check(): Promise<{ status: "ok"; database: "up" | "down" }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", database: "up" };
    } catch {
      throw new ServiceUnavailableException({ status: "error", database: "down" });
    }
  }
}
