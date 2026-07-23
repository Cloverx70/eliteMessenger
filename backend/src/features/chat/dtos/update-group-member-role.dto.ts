import { GroupMemberRole } from '../../../database/entities/groupMember.entity';
import { IsEnum } from 'class-validator';

export class UpdateGroupMemberRoleDto {
  @IsEnum(GroupMemberRole)
  role: GroupMemberRole;
}
