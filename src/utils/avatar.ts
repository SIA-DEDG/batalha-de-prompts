const AVATARS = ['👩‍💻', '👨‍🚀', '👩‍🏫', '👨‍🎓', '👩‍🎨', '🧑‍💻', '👨‍🏫', '👩‍🚀'];

export function avatarForName(name: string): string {
  return AVATARS[name.charCodeAt(0) % AVATARS.length];
}
