import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Owner } from './entities/owner.entity';
import { BootstrapOwnerDto } from './dto/bootstrap-owner.dto';
import { RecoverOwnerDto } from './dto/recover-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { EncryptionService } from '../common/services/encryption.service';

const SALT_ROUNDS = 12;
const RECOVERY_KEY_LENGTH = 24;

@Injectable()
export class OwnersService {
  constructor(
    @InjectRepository(Owner)
    private readonly ownerRepository: Repository<Owner>,
    private readonly encryptionService: EncryptionService,
  ) {}

  private generateToken(): string {
    return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
  }

  /** Generate a human-readable recovery key, e.g. ABCDEF-GHIJKL-MNOPQR-STUVWX */
  private generateRecoveryKey(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = '';
    for (let i = 0; i < RECOVERY_KEY_LENGTH; i++) {
      if (i > 0 && i % 6 === 0) key += '-';
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
  }

  async bootstrap(dto: BootstrapOwnerDto): Promise<{
    owner: Partial<Owner>;
    raw_token: string;
    recovery_key: string;
  }> {
    const rawToken = this.generateToken();
    const recoveryKey = this.generateRecoveryKey();

    const tokenHash = await bcrypt.hash(rawToken, SALT_ROUNDS);
    const recoveryKeyHash = await bcrypt.hash(recoveryKey, SALT_ROUNDS);

    const owner = this.ownerRepository.create({
      display_name: dto.display_name ?? null,
      token_hash: tokenHash,
      recovery_key_hash: recoveryKeyHash,
    });

    const saved = await this.ownerRepository.save(owner);

    return {
      owner: {
        id: saved.id,
        display_name: saved.display_name,
        created_at: saved.created_at,
      },
      raw_token: rawToken,
      recovery_key: recoveryKey,
    };
  }

  async recover(
    dto: RecoverOwnerDto,
  ): Promise<{ owner: Partial<Owner>; raw_token: string }> {
    const owners = await this.ownerRepository
      .createQueryBuilder('o')
      .addSelect('o.recovery_key_hash')
      .select(['o.id', 'o.recovery_key_hash', 'o.display_name', 'o.created_at'])
      .getMany();

    let matched: Owner | null = null;
    for (const o of owners) {
      const match = await bcrypt.compare(dto.recovery_key, o.recovery_key_hash);
      if (match) {
        matched = o;
        break;
      }
    }

    if (!matched) {
      // Generic message to prevent user enumeration
      throw new UnauthorizedException('Invalid recovery key');
    }

    const rawToken = this.generateToken();
    const tokenHash = await bcrypt.hash(rawToken, SALT_ROUNDS);
    await this.ownerRepository.update(matched.id, { token_hash: tokenHash });

    return {
      owner: { id: matched.id, display_name: matched.display_name },
      raw_token: rawToken,
    };
  }

  async findById(id: string): Promise<Owner> {
    const owner = await this.ownerRepository.findOneBy({ id });
    if (!owner) throw new NotFoundException('Owner not found');
    return owner;
  }

  async update(id: string, dto: UpdateOwnerDto): Promise<Partial<Owner>> {
    const owner = await this.findById(id);

    if (dto.display_name !== undefined) owner.display_name = dto.display_name;
    if (dto.promptpay_type !== undefined)
      owner.promptpay_type = dto.promptpay_type;
    if (dto.promptpay_value !== undefined) {
      // Encrypt PromptPay number at rest — never store plaintext
      owner.promptpay_value = this.encryptionService.encrypt(
        dto.promptpay_value,
      );
    }

    const saved = await this.ownerRepository.save(owner);
    // Never return sensitive fields to the client
    const {
      token_hash: _t,
      recovery_key_hash: _r,
      promptpay_value: _pv,
      ...safe
    } = saved;
    return safe;
  }
}
