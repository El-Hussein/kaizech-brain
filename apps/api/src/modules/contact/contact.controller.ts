import { Controller, Post, Get, Body } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async submitContact(@Body() createContactDto: CreateContactDto) {
    return this.contactService.create(createContactDto);
  }

  // Ideally protected by admin guards, but keeping it open for MVP ease
  @Get()
  async getContacts() {
    return this.contactService.findAll();
  }
}
