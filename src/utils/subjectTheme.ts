import type { SubjectAccent } from '../types/syllabus';

export interface SubjectPalette {
  cardSurface: string;
  iconBg: string;
  iconText: string;
  trackBg: string;
  progressFill: string;
  ringStroke: string;
  ringTrack: string;
  accentText: string;
  tabActiveBg: string;
  tabActiveText: string;
  checkFill: string;
  checkBorder: string;
}

export const SUBJECT_PALETTES: Record<SubjectAccent, SubjectPalette> = {
  mint: {
    cardSurface:
      'bg-[#EDF7F2] hover:bg-[#E3F3EB] border-[#D4EBDF] dark:bg-[#17231E] dark:hover:bg-[#1C2C25] dark:border-[#243930]',
    iconBg: 'bg-[#D6EDE1] dark:bg-[#23392F]',
    iconText: 'text-[#1E5C41] dark:text-[#8BE3BA]',
    trackBg: 'bg-[#CCE5D8] dark:bg-[#253B31]',
    progressFill: 'bg-[#2B7A58] dark:bg-[#7AD9AE]',
    ringStroke: 'text-[#2B7A58] dark:text-[#7AD9AE]',
    ringTrack: 'text-[#CCE5D8] dark:text-[#253B31]',
    accentText: 'text-[#1E5C41] dark:text-[#8BE3BA]',
    tabActiveBg: 'bg-[#D6EDE1] dark:bg-[#243D32]',
    tabActiveText: 'text-[#154832] dark:text-[#A4F0CC]',
    checkFill: 'bg-[#2B7A58] border-[#2B7A58] text-white dark:bg-[#7AD9AE] dark:border-[#7AD9AE] dark:text-[#0E291D]',
    checkBorder: 'border-[#8FC2AA] dark:border-[#3D5E4F]',
  },
  apricot: {
    cardSurface:
      'bg-[#FDF3EA] hover:bg-[#FBEAD9] border-[#F4DFCB] dark:bg-[#251D17] dark:hover:bg-[#2E241C] dark:border-[#3B2D22]',
    iconBg: 'bg-[#F8E2CE] dark:bg-[#3A2B1F]',
    iconText: 'text-[#964B14] dark:text-[#F6B786]',
    trackBg: 'bg-[#F1D5BC] dark:bg-[#3D2E22]',
    progressFill: 'bg-[#C46622] dark:bg-[#F4AC76]',
    ringStroke: 'text-[#C46622] dark:text-[#F4AC76]',
    ringTrack: 'text-[#F1D5BC] dark:text-[#3D2E22]',
    accentText: 'text-[#964B14] dark:text-[#F6B786]',
    tabActiveBg: 'bg-[#F8E2CE] dark:bg-[#3C2C20]',
    tabActiveText: 'text-[#73370B] dark:text-[#FAD0AD]',
    checkFill: 'bg-[#C46622] border-[#C46622] text-white dark:bg-[#F4AC76] dark:border-[#F4AC76] dark:text-[#2D1605]',
    checkBorder: 'border-[#E0B18B] dark:border-[#5D4432]',
  },
  sky: {
    cardSurface:
      'bg-[#EEF4FD] hover:bg-[#E3EDFB] border-[#D6E4F8] dark:bg-[#171F2A] dark:hover:bg-[#1D2736] dark:border-[#273549]',
    iconBg: 'bg-[#D9E7FA] dark:bg-[#233146]',
    iconText: 'text-[#244B8F] dark:text-[#96C0FF]',
    trackBg: 'bg-[#CBDDF7] dark:bg-[#26354B]',
    progressFill: 'bg-[#3665B7] dark:bg-[#8AB8FF]',
    ringStroke: 'text-[#3665B7] dark:text-[#8AB8FF]',
    ringTrack: 'text-[#CBDDF7] dark:text-[#26354B]',
    accentText: 'text-[#244B8F] dark:text-[#96C0FF]',
    tabActiveBg: 'bg-[#D9E7FA] dark:bg-[#25344B]',
    tabActiveText: 'text-[#183870] dark:text-[#B8D4FF]',
    checkFill: 'bg-[#3665B7] border-[#3665B7] text-white dark:bg-[#8AB8FF] dark:border-[#8AB8FF] dark:text-[#0F2242]',
    checkBorder: 'border-[#9AB9E8] dark:border-[#3D5273]',
  },
  rose: {
    cardSurface:
      'bg-[#FDF0F3] hover:bg-[#FAE4E9] border-[#F3D5DC] dark:bg-[#26191D] dark:hover:bg-[#301F24] dark:border-[#3E282F]',
    iconBg: 'bg-[#F7DBE1] dark:bg-[#3B242B]',
    iconText: 'text-[#8F2F46] dark:text-[#F5A3B6]',
    trackBg: 'bg-[#EFCBD4] dark:bg-[#3F282F]',
    progressFill: 'bg-[#BA4360] dark:bg-[#F296AB]',
    ringStroke: 'text-[#BA4360] dark:text-[#F296AB]',
    ringTrack: 'text-[#EFCBD4] dark:text-[#3F282F]',
    accentText: 'text-[#8F2F46] dark:text-[#F5A3B6]',
    tabActiveBg: 'bg-[#F7DBE1] dark:bg-[#3E262E]',
    tabActiveText: 'text-[#701F33] dark:text-[#FBC0CE]',
    checkFill: 'bg-[#BA4360] border-[#BA4360] text-white dark:bg-[#F296AB] dark:border-[#F296AB] dark:text-[#331019]',
    checkBorder: 'border-[#DF9EAE] dark:border-[#613E48]',
  },
  lavender: {
    cardSurface:
      'bg-[#F4F0FD] hover:bg-[#EBE3FA] border-[#E1D5F7] dark:bg-[#1E1A2A] dark:hover:bg-[#262136] dark:border-[#332B47]',
    iconBg: 'bg-[#E5DBFA] dark:bg-[#2E2642]',
    iconText: 'text-[#4F3592] dark:text-[#C5B0FF]',
    trackBg: 'bg-[#D8CAF5] dark:bg-[#322A48]',
    progressFill: 'bg-[#6B4BB8] dark:bg-[#B89EFF]',
    ringStroke: 'text-[#6B4BB8] dark:text-[#B89EFF]',
    ringTrack: 'text-[#D8CAF5] dark:text-[#322A48]',
    accentText: 'text-[#4F3592] dark:text-[#C5B0FF]',
    tabActiveBg: 'bg-[#E5DBFA] dark:bg-[#312948]',
    tabActiveText: 'text-[#3B2473] dark:text-[#DACBFF]',
    checkFill: 'bg-[#6B4BB8] border-[#6B4BB8] text-white dark:bg-[#B89EFF] dark:border-[#B89EFF] dark:text-[#1D123B]',
    checkBorder: 'border-[#B6A1E6] dark:border-[#4D416E]',
  },
};
