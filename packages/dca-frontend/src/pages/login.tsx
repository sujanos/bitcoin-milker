import React from 'react';

import { Presentation } from '@/components/presentation';
import { Footer } from '@/components/ui/footer';

export const Login: React.FC = () => {
  return (
    <>
      <main className="relative px-4 sm:px-6 md:px-8 flex justify-center pt-8 sm:pt-16 md:pt-24 pb-8">
        <Presentation />
      </main>
      <Footer />
    </>
  );
};
