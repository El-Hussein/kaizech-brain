import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { GenerateApiKeyDto } from './dto/generate-api-key.dto';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tenants' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tenant' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete tenant' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.remove(id);
  }

  @Post(':id/api-keys')
  @ApiOperation({ summary: 'Generate new API key for tenant' })
  generateApiKey(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateApiKeyDto,
  ) {
    return this.tenantsService.generateApiKey(id, dto.name);
  }

  @Get(':id/api-keys')
  @ApiOperation({ summary: 'List API keys for tenant' })
  listApiKeys(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.listApiKeys(id);
  }

  @Delete(':id/api-keys/:keyId')
  @ApiOperation({ summary: 'Revoke API key' })
  revokeApiKey(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('keyId', ParseUUIDPipe) keyId: string,
  ) {
    return this.tenantsService.revokeApiKey(id, keyId);
  }
}
