import Image from 'next/image';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

export function AuthBrandPanel() {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-primary-container p-12 lg:flex lg:w-1/2">
      <div className="z-10">
        <h1 className="mb-4 flex items-center gap-2 font-headline text-headline-xl text-custom-dark">
          <MaterialIcon name="sunny" filled size={40} className="text-custom-dark" />
          LIME
        </h1>
        <p className="font-headline text-headline-md text-custom-dark">
          Fresh bookings, Fresh talent.
        </p>
      </div>

      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30">
        <div className="h-full w-full bg-gradient-to-br from-primary-container via-lime-light to-primary/20" />
        <Image
          src="/logo.jpeg"
          alt=""
          width={400}
          height={400}
          className="absolute max-h-[70%] max-w-[70%] object-contain opacity-40 mix-blend-multiply"
          priority
        />
      </div>

      <p className="relative z-10 max-w-md font-body text-body-md text-on-primary-container">
        Join the vibrant Tunisian music and talent scene. Connect, book, and perform with the
        best.
      </p>
    </div>
  );
}
