import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 254, unique: true }) email!: string;
  @Column({ type: 'varchar', length: 120, default: '' }) name!: string;
  @Column({ type: 'varchar', length: 32, nullable: true }) phone?: string | null;
  @Column({ name: 'password_hash', type: 'text', select: false }) passwordHash!: string;
  @Column({ name: 'is_platform_admin', default: false }) isPlatformAdmin!: boolean;
  @Column({ name: 'is_active', default: true }) isActive!: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}
