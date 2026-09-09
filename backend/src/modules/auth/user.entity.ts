import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 254, unique: true }) email!: string;
  @Column({ name: 'password_hash', type: 'text', select: false }) passwordHash!: string;
  @Column({ name: 'is_platform_admin', default: false }) isPlatformAdmin!: boolean;
  @Column({ name: 'is_active', default: true }) isActive!: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}
