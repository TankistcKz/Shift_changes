import Avatar from '@mui/material/Avatar';
import { getInitials } from '../../../shared/lib/format';

interface PersonAvatarProps {
  name: string;
  size?: number;
}

export default function PersonAvatar({ name, size = 40 }: PersonAvatarProps) {
  return (
    <Avatar sx={{ width: size, height: size, fontSize: size * 0.4 }}>
      {getInitials(name)}
    </Avatar>
  );
}
