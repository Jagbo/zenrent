import localFont from 'next/font/local';

export const cabinetGrotesk = localFont({
  src: [
    {
      path: '../../public/fonts/CabinetGrotesk-Thin.otf',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../../public/fonts/CabinetGrotesk-Extralight.otf',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../../public/fonts/CabinetGrotesk-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/CabinetGrotesk-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/CabinetGrotesk-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/CabinetGrotesk-Bold.otf',
      weight: '700', 
      style: 'normal',
    },
    {
      path: '../../public/fonts/CabinetGrotesk-Extrabold.otf', 
      weight: '800',
      style: 'normal',
    },
    {
      path: '../../public/fonts/CabinetGrotesk-Black.otf',
      weight: '900',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-cabinet',
}); 