import masterLogo from '../../assets/nasser el batal.jpg';
import platformLogo from '../../assets/education platform.jpg';

type LogoProps = { className?: string };

export function MasterLogo({ className = '' }: LogoProps) {
  return <img className={`brand-mark brand-mark-master ${className}`} src={masterLogo} alt="Dr Nasser El-Batal" draggable={false} />;
}

export function PlatformLogo({ className = '' }: LogoProps) {
  return <img className={`brand-mark brand-mark-platform ${className}`} src={platformLogo} alt="EDNUVA education platform" draggable={false} />;
}
