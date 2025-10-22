import React from 'react';
import { Github, HelpCircle } from 'lucide-react';

const TextSeparator = () => {
  return (
    <span className="mx-1" style={{ color: 'var(--footer-text-color, #121212)' }}>
      {' '}
      /{' '}
    </span>
  );
};

export const Footer: React.FC = () => {
  return (
    <div
      className="px-3 sm:px-6 py-3 border-t border-gray-200 bg-white flex flex-col items-center gap-2 rounded-b-2xl"
      style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}
    >
      <div
        className="flex items-center gap-2 text-xs"
        style={{ color: 'var(--footer-text-color, #121212)' }}
      >
        <a
          href="https://litprotocol.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 no-underline transition-colors"
          style={{ textDecoration: 'none', fontStyle: 'normal', color: '#FF4205' }}
        >
          <svg
            className="w-4 h-auto"
            width="40"
            viewBox="0 0 311 228"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Lit Protocol logo"
          >
            <path
              d="M311 104.987V51.9125H256.038V29.2084L256.245 0.621826H202.816V174.264C202.816 181.242 204.193 188.153 206.866 194.599C209.54 201.045 213.459 206.9 218.398 211.83C223.337 216.76 229.2 220.667 235.652 223.328C242.103 225.989 249.016 227.352 255.994 227.338L311 227.25V175.045H269.794C267.969 175.047 266.162 174.689 264.477 173.992C262.791 173.295 261.259 172.272 259.969 170.982C258.679 169.692 257.656 168.16 256.959 166.474C256.262 164.789 255.904 162.982 255.906 161.157V140.517H256.053C256.053 128.723 256.053 116.929 256.053 104.943L311 104.987Z"
              fill="currentColor"
            />
            <path
              d="M142.841 51.9125H184.564V0.621826H131.489V227.442H184.564V93.9711C184.564 88.7506 182.208 83.8089 178.151 80.5223L142.841 51.9125Z"
              fill="currentColor"
            />
            <path
              d="M53.2347 161.157V0.621826H0.160156V174.264C0.160143 181.242 1.53637 188.153 4.21006 194.599C6.88376 201.045 10.8024 206.9 15.7418 211.83C20.6811 216.76 26.5442 220.667 32.9954 223.328C39.4466 225.989 46.3593 227.352 53.3379 227.338L113.12 227.25V175.045H67.1225C63.4392 175.045 59.9068 173.582 57.3023 170.978C54.6978 168.373 53.2347 164.841 53.2347 161.157Z"
              fill="currentColor"
            />
          </svg>
          <span>Securing Autonomy</span>
        </a>
      </div>
      <div
        className="flex items-center gap-1 text-xs"
        style={{ color: 'var(--footer-text-color, #121212)' }}
      >
        <a
          href="https://github.com/LIT-Protocol/vincent-starter-app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 no-underline hover:opacity-80 transition-colors"
          style={{
            textDecoration: 'none',
            fontStyle: 'normal',
            color: 'var(--footer-text-color, #121212)',
          }}
        >
          <Github className="w-3 h-3" style={{ marginTop: '-2px' }} />
          <span>Github</span>
        </a>
        <TextSeparator />
        <a
          href="https://t.me/+aa73FAF9Vp82ZjJh"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 no-underline hover:opacity-80 transition-colors"
          style={{
            textDecoration: 'none',
            fontStyle: 'normal',
            color: 'var(--footer-text-color, #121212)',
          }}
        >
          <HelpCircle className="w-3 h-3" style={{ marginTop: '-2px' }} />
          <span>Support</span>
        </a>
      </div>
    </div>
  );
};
